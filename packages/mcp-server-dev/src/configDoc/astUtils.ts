import type {
	ASTNode,
	ArrayASTNode,
	ObjectASTNode,
	Position,
	PropertyASTNode,
	Range,
	StringASTNode,
	TextDocument,
} from "vscode-json-languageservice";

// Ported from the zwave-js config editor VS Code extension. The original uses
// vscode.Range/Position; here the framework-agnostic LSP Range/Position from
// vscode-json-languageservice are used instead so the logic runs headless.

export type PropertyNameASTNode = StringASTNode & { parent: PropertyASTNode };
export type PropertyValueASTNode = ASTNode & { parent: PropertyASTNode };
export type ObjectPropertyASTNode = PropertyASTNode & { parent: ObjectASTNode };

export function nodeIsPropertyName(
	node: ASTNode | undefined,
): node is PropertyNameASTNode {
	return node?.parent?.type === "property" && node === node.parent.keyNode;
}

export function nodeIsPropertyValue(
	node: ASTNode | undefined,
): node is PropertyValueASTNode {
	return node?.parent?.type === "property" && node === node.parent.valueNode;
}

export function nodeIsPropertyNameOrValue(
	node: ASTNode | undefined,
): node is PropertyValueASTNode | PropertyNameASTNode {
	return node?.parent?.type === "property";
}

export function getPropertyNameFromNode(
	node: PropertyValueASTNode | PropertyNameASTNode,
): string {
	return node.parent.keyNode.value;
}

export function getPropertyValueFromNode(
	node: PropertyValueASTNode | PropertyNameASTNode,
): string | number | boolean | null | undefined {
	return node.parent.valueNode?.value;
}

export function rangeFromNode(document: TextDocument, node: ASTNode): Range {
	return {
		start: document.positionAt(node.offset),
		end: document.positionAt(node.offset + node.length),
	};
}

export function tryExpandPropertyRange(
	document: TextDocument,
	node: ObjectPropertyASTNode,
): Range {
	const siblings = node.parent.properties;
	if (siblings.length === 1) return rangeFromNode(document, node);
	const index = siblings.indexOf(node);
	if (index > 0) {
		// Select everything from the end of the previous property to the end of this one
		return {
			start: document.positionAt(
				siblings[index - 1].offset + siblings[index - 1].length,
			),
			end: document.positionAt(node.offset + node.length),
		};
	} else {
		// Select everything from the start of this property to the start of the next one
		return {
			start: document.positionAt(node.offset),
			end: document.positionAt(siblings[index + 1].offset),
		};
	}
}

export function findSurroundingParamDefinition(
	node: ASTNode,
): ObjectASTNode | undefined {
	while (node.parent) {
		if (
			node.type === "object"
			&& node.parent.type === "array"
			&& nodeIsPropertyValue(node.parent)
			&& getPropertyNameFromNode(node.parent) === "paramInformation"
		) {
			return node;
		}
		node = node.parent;
	}
}

export function getPropertyDefinitionFromObject(
	node: ObjectASTNode,
	propertyName: string,
): PropertyASTNode | undefined {
	return node.properties.find((p) => p.keyNode.value === propertyName);
}

export function isJSONDifferentToAST(json: unknown, ast: ASTNode): boolean {
	const jsonType = typeof json === "object"
		? Array.isArray(json)
			? "array"
			: "object"
		: typeof json;

	// If the property is undefined in the JSON but present in the AST it will return here
	if (jsonType !== ast.type) {
		return true;
	}

	if (isArrayASTNode(ast) && Array.isArray(json)) {
		if (ast.items.length !== json.length) {
			return true;
		}

		for (let i = 0; i < ast.items.length; i++) {
			if (isJSONDifferentToAST(json[i], ast.items[i])) {
				return true;
			}
		}

		return false;
	}

	if (isObjectASTNode(ast) && typeof json === "object" && json !== null) {
		if (ast.properties.length !== Object.keys(json).length) {
			return true;
		}

		for (const property of ast.properties) {
			if (!property.valueNode) {
				return true;
			}

			if (
				isJSONDifferentToAST(
					(json as Record<string, unknown>)[property.keyNode.value],
					property.valueNode,
				)
			) {
				return true;
			}
		}

		return false;
	}

	return ast.value !== json;
}

export function isArrayASTNode(node: ASTNode): node is ArrayASTNode {
	return node.type === "array";
}

export function isObjectASTNode(node: ASTNode): node is ObjectASTNode {
	return node.type === "object";
}

/** Whether position `a` is before or equal to position `b` */
export function positionBeforeOrEqual(a: Position, b: Position): boolean {
	if (a.line !== b.line) return a.line < b.line;
	return a.character <= b.character;
}

/** Whether the `inner` range lies completely within the `outer` range */
export function rangeContains(outer: Range, inner: Range): boolean {
	return positionBeforeOrEqual(outer.start, inner.start)
		&& positionBeforeOrEqual(inner.end, outer.end);
}
