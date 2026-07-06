import {
	type CommentRange,
	type ExportedDeclarations,
	type InterfaceDeclaration,
	type InterfaceDeclarationStructure,
	Node,
	type OptionalKind,
	Project,
	type PropertySignatureStructure,
	type SourceFile,
	SyntaxKind,
	type TypeLiteralNode,
} from "ts-morph";
import { formatWithDprint } from "../dprint.js";

export interface ImportOptions {
	comments?: boolean;
	jsdoc?: boolean;
	flattenExtends?: boolean;
}

// These caches and the reused transform project intentionally live for the
// entire process. The docs generation runs as a short-lived script (and within
// short-lived worker threads), so there is no need to reset them between runs.
const exportDeclarationCache = new Map<
	string,
	ReadonlyMap<string, ExportedDeclarations[]>
>();

// Reuse a single project/source file across calls instead of recreating one
// per snippet, which is expensive in ts-morph.
let transformProject: Project | undefined;
let transformSourceFile: SourceFile | undefined;

function getTransformSourceFile(sourceText: string): SourceFile {
	if (!transformProject) {
		transformProject = new Project();
	}
	if (!transformSourceFile) {
		transformSourceFile = transformProject.createSourceFile(
			"index.ts",
			sourceText,
		);
	} else {
		transformSourceFile.replaceWithText(sourceText);
	}
	return transformSourceFile;
}

export function findSourceNode(
	program: Project,
	exportingFile: string,
	identifier: string,
): ExportedDeclarations | undefined {
	if (!exportDeclarationCache.has(exportingFile)) {
		const decls = program.getSourceFile(exportingFile)
			?.getExportedDeclarations();
		if (decls) exportDeclarationCache.set(exportingFile, decls);
	}
	return exportDeclarationCache.get(exportingFile)
		?.get(identifier)?.[0];
}

function stripComments(
	node: ExportedDeclarations,
	options: ImportOptions,
): ExportedDeclarations {
	if (Node.isTextInsertable(node)) {
		const ranges: { pos: number; end: number }[] = [];
		const removePredicate = (c: CommentRange) =>
			(!options.comments
				&& c.getKind() === SyntaxKind.SingleLineCommentTrivia)
			|| (!options.jsdoc
				&& c.getKind() === SyntaxKind.MultiLineCommentTrivia);

		const getCommentRangesForNode = (
			node: Node,
		): { pos: number; end: number }[] => {
			const comments = node.getLeadingCommentRanges();
			const ret = comments.map((c, i) => ({
				pos: c.getPos(),
				end: i < comments.length - 1
					? comments[i + 1].getPos()
					: Math.max(node.getStart(), c.getEnd()),
				remove: removePredicate(c),
			}));
			return ret.filter((r) => r.remove);
		};

		if (Node.isEnumDeclaration(node)) {
			for (const member of node.getMembers()) {
				ranges.push(...getCommentRangesForNode(member));
			}
		} else if (Node.isInterfaceDeclaration(node)) {
			const walkInterfaceDeclaration = (node: InterfaceDeclaration) => {
				for (const member of node.getMembers()) {
					ranges.push(...getCommentRangesForNode(member));
					if (Node.isInterfaceDeclaration(member)) {
						walkInterfaceDeclaration(member);
					}
				}
			};
			walkInterfaceDeclaration(node);
		}

		ranges.sort((a, b) => b.pos - a.pos);
		for (const { pos, end } of ranges) {
			node.removeText(pos, end);
		}
	}
	return node;
}

export function getJsDocTagNames(node: Node): string[] {
	if (!Node.isJSDocable(node)) return [];
	return node
		.getJsDocs()
		.flatMap((doc) => doc.getTags())
		.map((tag) => tag.getTagName());
}

/** Underscore-prefixed or `@internal`/`@deprecated` members are hidden from the docs */
export function isInternalMember(
	name: string,
	jsdocTagNames: readonly string[],
): boolean {
	return (
		name.startsWith("_")
		|| jsdocTagNames.some((t) => t === "deprecated" || t === "internal")
	);
}

function shouldStripPropertySignature(
	p: OptionalKind<PropertySignatureStructure>,
): boolean {
	const tagNames =
		p.docs?.flatMap((d) =>
			typeof d === "string" ? [] : d.tags?.map((t) => t.tagName) ?? []
		) ?? [];
	return isInternalMember(p.name, tagNames);
}

function printInterfaceDeclarationStructure(
	struct: InterfaceDeclarationStructure,
): string {
	return `
interface ${struct.name}${
		struct.typeParameters?.length
			// oxlint-disable-next-line typescript/no-base-to-string
			? `<${struct.typeParameters.map((t) => t.toString()).join(", ")}>`
			: ""
	} {
	${
		struct.properties
			?.filter((p) => !shouldStripPropertySignature(p))
			.map((p) => {
				let type = p.type as string;
				// ts-morph 28 (TS 6.0) appends "| undefined" to the structure
				// type of optional properties. Strip it so the output keeps
				// matching the original source.
				if (p.hasQuestionToken) {
					type = type.replace(/\s*\|\s*undefined\s*$/, "");
				}
				return `${p.isReadonly ? "readonly " : ""}${p.name}${
					p.hasQuestionToken ? "?:" : ":"
				} ${type};`;
			})
			.join("\n")
	}
}`;
}

function getInterfaceMemberKey(member: Node): string {
	if (
		Node.isPropertySignature(member)
		|| Node.isMethodSignature(member)
		|| Node.isGetAccessorDeclaration(member)
		|| Node.isSetAccessorDeclaration(member)
	) {
		return member.getName();
	}
	return member.getText();
}

function getInterfaceMemberText(member: Node): string {
	const lineComments = member
		.getLeadingCommentRanges()
		.filter((r) => r.getKind() === SyntaxKind.SingleLineCommentTrivia)
		.map((r) => r.getText());
	const text = Node.isJSDocable(member)
		? member.getText(true)
		: member.getText();
	return (lineComments.length ? lineComments.join("\n") + "\n" : "") + text;
}

/**
 * Collects the members of an interface and everything it extends into a map
 * keyed by member name, so a derived member overrides an inherited one.
 * Returns false when a base cannot be flattened, so the caller keeps `extends`.
 */
function collectInheritedMembers(
	node: InterfaceDeclaration,
	into: Map<string, string>,
	seen: Set<InterfaceDeclaration>,
): boolean {
	if (seen.has(node)) return true;
	seen.add(node);

	for (const base of node.getBaseDeclarations()) {
		if (Node.isInterfaceDeclaration(base)) {
			if (!collectInheritedMembers(base, into, seen)) return false;
		} else if (Node.isTypeAliasDeclaration(base)) {
			const typeNode = base.getTypeNode();
			if (!typeNode) return false;
			const literals = Node.isTypeLiteral(typeNode)
				? [typeNode]
				: Node.isIntersectionTypeNode(typeNode)
				? typeNode.getTypeNodes().filter(Node.isTypeLiteral)
				: [];
			if (!literals.length) return false;
			for (const literal of literals) {
				for (const member of literal.getMembers()) {
					into.set(
						getInterfaceMemberKey(member),
						getInterfaceMemberText(member),
					);
				}
			}
		} else {
			return false;
		}
	}
	for (const member of node.getMembers()) {
		into.set(getInterfaceMemberKey(member), getInterfaceMemberText(member));
	}
	return true;
}

/** Inlines an interface's `extends` clause into a flat interface definition */
function flattenInterfaceExtends(
	node: InterfaceDeclaration,
): string | undefined {
	const members = new Map<string, string>();
	if (!collectInheritedMembers(node, members, new Set())) return undefined;
	const typeParams = node.getTypeParameters();
	// Keep the export modifier so getExportedDeclarations can find the flattened declaration
	const header = `export interface ${node.getName()}${
		typeParams.length
			? `<${typeParams.map((t) => t.getText()).join(", ")}>`
			: ""
	}`;
	return `${header} {\n${[...members.values()].join("\n")}\n}`;
}

export function getTransformedSource(
	node: ExportedDeclarations,
	options: ImportOptions,
): string {
	// Unless opted out, resolve the full shape of interfaces using `extends`
	let sourceText = node.getText();
	if (
		options.flattenExtends !== false
		&& Node.isInterfaceDeclaration(node)
		&& node.getExtends().length > 0
	) {
		sourceText = flattenInterfaceExtends(node) ?? sourceText;
	}
	const sourceFile = getTransformSourceFile(sourceText);
	const transformedNode = [
		...sourceFile.getExportedDeclarations().values(),
	][0]?.[0];
	if (!transformedNode) {
		throw new Error("Could not recreate exported declaration");
	}
	node = transformedNode;

	if (Node.isInterfaceDeclaration(node)) {
		const membersToRemove: { remove(): void }[] = [];
		const walkDeclaration = (
			node: InterfaceDeclaration | TypeLiteralNode,
		) => {
			for (const member of node.getMembers()) {
				const name = Node.isPropertySignature(member)
					? member.getName()
					: "";
				if (isInternalMember(name, getJsDocTagNames(member))) {
					membersToRemove.push(member);
				}
				if (Node.isInterfaceDeclaration(member)) {
					walkDeclaration(member);
				} else if (Node.isPropertySignature(member)) {
					const typeNode = member.getTypeNode();
					if (Node.isTypeLiteral(typeNode)) {
						walkDeclaration(typeNode);
					}
				}
			}
		};
		walkDeclaration(node);
		for (let i = membersToRemove.length - 1; i >= 0; i--) {
			membersToRemove[i].remove();
		}
	}

	if (Node.isModifierable(node)) {
		node = node.toggleModifier("declare", false);
		// @ts-expect-error
		node = node.toggleModifier("export", false);
	}

	let ret: string;
	if (Node.isClassDeclaration(node)) {
		ret = printInterfaceDeclarationStructure(node.extractInterface());
	} else {
		node = stripComments(node, options);
		ret = node.getText();
	}

	return formatWithDprint("index.ts", ret).trim();
}
