import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

import type { OxlintCompatibleRule } from "../utils.js";
import { findBinding, getScopeBindings } from "../utils/bindings.js";

// Parameter types that indicate a function parses untrusted data
const RAW_PARAM_TYPE = /(?:Raw|^Bytes|^BytesView|^Uint8Array)$/;
const PARSE_METHOD_NAMES = new Set(["from", "parse"]);
const PARSE_FUNCTION_NAME = /^(?:parse|decode)/;

type FunctionNode =
	| TSESTree.FunctionDeclaration
	| TSESTree.FunctionExpression
	| TSESTree.ArrowFunctionExpression;

function hasRawParameter(fn: FunctionNode): boolean {
	const param = fn.params[0];
	if (param?.type !== AST_NODE_TYPES.Identifier) return false;
	const type = param.typeAnnotation?.typeAnnotation;
	return (
		type?.type === AST_NODE_TYPES.TSTypeReference
		&& type.typeName.type === AST_NODE_TYPES.Identifier
		&& RAW_PARAM_TYPE.test(type.typeName.name)
	);
}

function isMethod(node: FunctionNode): boolean {
	return node.parent.type === AST_NODE_TYPES.MethodDefinition;
}

function getFunctionName(node: FunctionNode): string | undefined {
	if (node.type === AST_NODE_TYPES.FunctionDeclaration) {
		return node.id?.name;
	}
	if (
		node.parent.type === AST_NODE_TYPES.VariableDeclarator
		&& node.parent.id.type === AST_NODE_TYPES.Identifier
	) {
		return node.parent.id.name;
	}
}

/** Whether this function parses untrusted data, e.g. `static from(raw: CCRaw)` or `parseFoo(data: BytesView)` */
function isParseFunction(node: FunctionNode): boolean {
	if (!hasRawParameter(node)) return false;
	if (isMethod(node)) {
		const method = node.parent as TSESTree.MethodDefinition;
		return (
			method.static
			&& method.key.type === AST_NODE_TYPES.Identifier
			&& PARSE_METHOD_NAMES.has(method.key.name)
		);
	}
	const name = getFunctionName(node);
	return !!name && PARSE_FUNCTION_NAME.test(name);
}

// The receive path drops messages that fail to parse with one of these error codes and re-throws all others.
// This mirrors droppedDecodeErrors from @zwave-js/serial, which cannot be imported here because building
// @zwave-js/serial requires the CC codegen, which in turn runs this plugin. A unit test keeps both in sync.
export const EXPECTED_ERROR_CODES: ReadonlySet<string> = new Set([
	"PacketFormat_Invalid",
	"PacketFormat_Checksum",
	"PacketFormat_Truncated",
	"PacketFormat_InvalidPayload",
	"Deserialization_NotImplemented",
	"CC_NotImplemented",
	"Driver_NotReady",
	"Driver_NoSecurity",
	"Security2CC_NotInitialized",
	"Controller_NodeNotFound",
]);

/** ZWaveErrors with one of the expected codes are the correct way to reject invalid payloads */
function isExpectedError(node: TSESTree.Expression): boolean {
	if (
		node.type !== AST_NODE_TYPES.NewExpression
		|| node.callee.type !== AST_NODE_TYPES.Identifier
		|| node.callee.name !== "ZWaveError"
	) {
		return false;
	}
	const code = node.arguments[1];
	return (
		code?.type === AST_NODE_TYPES.MemberExpression
		&& code.object.type === AST_NODE_TYPES.Identifier
		&& code.object.name === "ZWaveErrorCodes"
		&& code.property.type === AST_NODE_TYPES.Identifier
		&& EXPECTED_ERROR_CODES.has(code.property.name)
	);
}

/** Whether a throw statement throws an unexpected error. Re-throwing caught errors is fine */
function isUnexpectedThrow(node: TSESTree.ThrowStatement): boolean {
	const arg = node.argument;
	if (arg.type === AST_NODE_TYPES.Identifier) {
		return findBinding(arg)?.kind !== "catch";
	}
	return !isExpectedError(arg);
}

/**
 * Finds throw statements in a function body, excluding nested classes.
 * Nested functions are included, because they are typically callbacks that run synchronously.
 */
function findUnexpectedThrows(node: TSESTree.Node): TSESTree.ThrowStatement[] {
	const ret: TSESTree.ThrowStatement[] = [];
	const visit = (n: TSESTree.Node): void => {
		if (n.type === AST_NODE_TYPES.ThrowStatement) {
			if (isUnexpectedThrow(n)) ret.push(n);
			return;
		}
		for (const [key, value] of Object.entries(n)) {
			if (key === "parent") continue;
			const children: unknown[] = Array.isArray(value) ? value : [value];
			for (const child of children) {
				if (
					child
					&& typeof child === "object"
					&& typeof (child as TSESTree.Node).type === "string"
					&& (child as TSESTree.Node).type
						!== AST_NODE_TYPES.ClassDeclaration
					&& (child as TSESTree.Node).type
						!== AST_NODE_TYPES.ClassExpression
				) {
					visit(child as TSESTree.Node);
				}
			}
		}
	};
	visit(node);
	return ret;
}

function isTopLevelBinding(node: TSESTree.Identifier): boolean {
	let scope: TSESTree.Node | undefined = node.parent;
	while (scope) {
		if (getScopeBindings(scope).has(node.name)) {
			return scope.type === AST_NODE_TYPES.Program;
		}
		scope = scope.parent;
	}
	return false;
}

function getConstructor(
	node: TSESTree.ClassDeclaration | TSESTree.ClassExpression,
): TSESTree.MethodDefinition | undefined {
	return node.body.body.find(
		(m): m is TSESTree.MethodDefinition =>
			m.type === AST_NODE_TYPES.MethodDefinition
			&& m.kind === "constructor",
	);
}

export const noUnexpectedParseErrors: OxlintCompatibleRule = {
	createOnce(context) {
		// Classes in the current file whose constructor may throw unexpected errors
		let throwingClasses = new Map<string, TSESTree.ThrowStatement>();
		// Whether each enclosing function is part of a parse function.
		// Nested functions other than methods are considered part of their parent,
		// because they are typically callbacks that run while parsing
		let parseFunctionStack: boolean[] = [];
		const isInParseFunction = (): boolean =>
			parseFunctionStack.at(-1) ?? false;
		const enterFunction = (node: FunctionNode): void => {
			parseFunctionStack.push(
				isParseFunction(node)
					|| (!isMethod(node) && isInParseFunction()),
			);
		};
		const exitFunction = (): void => {
			parseFunctionStack.pop();
		};

		return {
			before() {
				throwingClasses = new Map();
				parseFunctionStack = [];
			},
			FunctionDeclaration: enterFunction,
			"FunctionDeclaration:exit": exitFunction,
			FunctionExpression: enterFunction,
			"FunctionExpression:exit": exitFunction,
			ArrowFunctionExpression: enterFunction,
			"ArrowFunctionExpression:exit": exitFunction,
			Program(node) {
				const visitClass = (cls: TSESTree.Node | null | undefined) => {
					if (
						cls?.type !== AST_NODE_TYPES.ClassDeclaration
						|| !cls.id
					) {
						return;
					}
					const ctor = getConstructor(cls);
					if (!ctor?.value.body) return;
					const [firstThrow] = findUnexpectedThrows(ctor.value.body);
					if (firstThrow)
						throwingClasses.set(cls.id.name, firstThrow);
				};
				for (const stmt of node.body) {
					if (
						stmt.type === AST_NODE_TYPES.ExportNamedDeclaration
						|| stmt.type === AST_NODE_TYPES.ExportDefaultDeclaration
					) {
						visitClass(stmt.declaration);
					} else {
						visitClass(stmt);
					}
				}
			},
			ThrowStatement(node) {
				if (!isInParseFunction()) return;
				if (!isUnexpectedThrow(node)) return;
				context.report({
					node,
					messageId: "unexpected-throw",
				});
			},
			NewExpression(node) {
				if (!isInParseFunction()) return;
				let className: string | undefined;
				if (node.callee.type === AST_NODE_TYPES.Identifier) {
					// Only top-level classes are analyzed, so shadowing bindings must not match them
					if (isTopLevelBinding(node.callee)) {
						className = node.callee.name;
					}
				} else if (node.callee.type === AST_NODE_TYPES.ThisExpression) {
					// `new this(...)` in a static method creates an instance of the containing class
					let cls: TSESTree.Node | undefined = node.parent;
					while (
						cls
						&& cls.type !== AST_NODE_TYPES.ClassDeclaration
					) {
						cls = cls.parent;
					}
					className = cls?.id?.name;
				}
				if (!className) return;
				const throwStmt = throwingClasses.get(className);
				if (!throwStmt) return;

				context.report({
					node,
					messageId: "throwing-constructor",
					data: {
						className,
						line: throwStmt.loc.start.line,
					},
				});
			},
		};
	},
	meta: {
		docs: {
			description:
				"Code that parses untrusted data should only throw ZWaveErrors that the receive path expects, e.g. using validatePayload().",
		},
		type: "problem",
		schema: [],
		messages: {
			"unexpected-throw":
				"Parse functions should only throw ZWaveErrors with a code that Driver.handleDecodeError handles, e.g. PacketFormat_InvalidPayload. Use validatePayload() to reject invalid payloads instead.",
			"throwing-constructor":
				"The constructor of {{className}} can throw an unexpected error (line {{line}}). Validate the payload before calling it, so it cannot throw while parsing.",
		},
	},
	defaultOptions: [],
};
