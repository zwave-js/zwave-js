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
}

const exportDeclarationCache = new Map<
	string,
	ReadonlyMap<string, ExportedDeclarations[]>
>();

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

function shouldStripPropertySignature(
	p: OptionalKind<PropertySignatureStructure>,
): boolean {
	return !!p.docs?.some(
		(d) =>
			typeof d !== "string"
			&& d.tags?.some((t) => /(deprecated|internal)/.test(t.tagName)),
	);
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

export function getTransformedSource(
	node: ExportedDeclarations,
	options: ImportOptions,
): string {
	const sourceFile = getTransformSourceFile(node.getText());
	const transformedNode = [
		...sourceFile.getExportedDeclarations().values(),
	][0]?.[0];
	if (!transformedNode) {
		throw new Error("Could not recreate exported declaration");
	}
	node = transformedNode;

	if (Node.isInterfaceDeclaration(node)) {
		const commentsToRemove: { remove(): void }[] = [];
		const walkDeclaration = (
			node: InterfaceDeclaration | TypeLiteralNode,
		) => {
			for (const member of node.getMembers()) {
				if (
					member
						.getJsDocs()
						.some((doc) =>
							/@(deprecated|internal)/.test(doc.getInnerText())
						)
				) {
					commentsToRemove.push(member);
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
		for (let i = commentsToRemove.length - 1; i >= 0; i--) {
			commentsToRemove[i].remove();
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
