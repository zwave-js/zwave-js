import { formatWithDprint } from "@zwave-js/maintenance";
import { getErrorMessage } from "@zwave-js/shared";
import esMain from "es-main";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	type ArrowFunction,
	type CallExpression,
	type ElementAccessExpression,
	type FunctionDeclaration,
	type ImportSpecifier,
	type Node,
	type ObjectLiteralExpression,
	Project,
	type PropertyAccessExpression,
	type Statement,
	type StringLiteral,
	SyntaxKind,
	type ts,
} from "ts-morph";

// Define where the CC value definition file is located
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ccDir = path.join(__dirname, "..", "src/cc");
const valuesFile = path.join(ccDir, "_CCValues.generated.ts");

type CCEnum =
	| PropertyAccessExpression<ts.PropertyAccessExpression>
	| ElementAccessExpression<ts.ElementAccessExpression>;

const defaultCCValueOptions = {
	internal: false,
	minVersion: 1,
	secret: false,
	stateful: true,
	supportsEndpoints: true,
	autoCreate: true,
} as const;

const ignoredImports = ["V", "ValueMetadata"];

export async function generateCCValueDefinitions(): Promise<void> {
	const project = new Project({
		tsConfigFilePath: path.join(__dirname, "../tsconfig.json"),
	});

	const sourceFiles = project.getSourceFiles().filter((file) =>
		file.getBaseNameWithoutExtension().endsWith("CC")
	);

	let result = "";

	let exported = "";

	// Collect imports
	const importsByModule = new Map<
		string,
		Map<string, boolean>
	>();
	// Add some default imports we always need
	importsByModule.set(
		"@zwave-js/core",
		new Map([
			["CommandClasses", false],
			["ValueID", true],
			["ValueMetadata", false],
			["GetValueDB", true],
			["EndpointId", true],
		]),
	);
	importsByModule.set(
		"@zwave-js/config",
		new Map([
			["GetDeviceConfig", true],
		]),
	);
	importsByModule.set(
		"@zwave-js/shared",
		new Map([
			["getEnumMemberName", false],
		]),
	);
	importsByModule.set(
		"../lib/Values.js",
		new Map([
			["CCValueOptions", true],
		]),
	);
	const allImports = new Map<string, boolean>(
		[...importsByModule.values()].flatMap((map) => [...map.entries()]),
	);

	for (const file of sourceFiles) {
		// const filePath = path.relative(process.cwd(), file.getFilePath());

		// function fail(reason: string) {
		// 	console.error(
		// 		`Failed to refactor ${file.getFilePath()}\n${reason}`,
		// 	);
		// 	process.exit(1);
		// }

		const ccValuesDeclaration = file.getDescendantsOfKind(
			SyntaxKind.VariableDeclaration,
		).find((decl) => decl.getName().endsWith("CCValues"));

		if (!ccValuesDeclaration) continue;

		// Find calls to `V.defineCCValues(CommandClasses.XYZ, { ... })`
		const defineCCValuesCall = ccValuesDeclaration.getInitializerIfKind(
			SyntaxKind.CallExpression,
		);
		if (
			!defineCCValuesCall
			|| defineCCValuesCall.getExpressionIfKind(
					SyntaxKind.PropertyAccessExpression,
				)
					?.getText() !== "V.defineCCValues"
			|| defineCCValuesCall.getArguments().length !== 2
		) {
			continue;
		}

		const firstArg = defineCCValuesCall.getArguments()[0];
		const ccEnum: CCEnum | undefined =
			// CommandClasses.XYZ
			firstArg?.asKind(SyntaxKind.PropertyAccessExpression)
			// CommandClasses["XYZ"]
			|| firstArg?.asKind(SyntaxKind.ElementAccessExpression);
		if (ccEnum?.getExpression().getText() !== "CommandClasses") {
			continue;
		}

		const secondArg = defineCCValuesCall.getArguments()[1];
		const definitions = secondArg?.asKind(
			SyntaxKind.ObjectLiteralExpression,
		);
		if (!definitions) continue;

		const spreads = definitions.getProperties().filter((prop) =>
			prop.isKind(SyntaxKind.SpreadAssignment)
		);
		if (spreads.length === 0) continue;

		const localDeclarationsToCopy = ccValuesDeclaration
			.getDescendantsOfKind(SyntaxKind.Identifier)
			.map((ident) => ident.getSymbol()?.getValueDeclaration())
			.filter((decl): decl is Node =>
				decl !== ccValuesDeclaration && decl != undefined
			)
			.map((decl): Statement | undefined => {
				// Copy function declarations and top-level variable declarations
				if (decl.isKind(SyntaxKind.FunctionDeclaration)) return decl;
				const varStatement = decl.asKind(SyntaxKind.VariableDeclaration)
					?.getVariableStatement();
				if (varStatement?.getParent().isKind(SyntaxKind.SourceFile)) {
					return varStatement;
				}
				return undefined;
			})
			.filter((decl) => decl != undefined);

		// Functions are hoisted and might need access to the CCValues definition
		const localFunctionsToCopy = localDeclarationsToCopy.filter(
			(decl) => decl.isKind(SyntaxKind.FunctionDeclaration),
		);
		// consts/vars have to be defined first, so the CCValues definition can access them
		const localVarsToCopy = localDeclarationsToCopy.filter(
			(decl) => !decl.isKind(SyntaxKind.FunctionDeclaration),
		);

		for (const decl of localVarsToCopy) {
			decl.asKindOrThrow(SyntaxKind.VariableStatement).setIsExported(
				false,
			);
			result += `\n\n` + decl.getText();
		}

		result += `

		export const ${ccValuesDeclaration.getName()} = Object.freeze({
		`;

		try {
			for (const spread of spreads) {
				const def = spread.getExpressionIfKind(
					SyntaxKind.CallExpression,
				);
				if (!def) continue;

				const propertyKind = def.getExpressionIfKind(
					SyntaxKind.PropertyAccessExpression,
				)?.getName();

				switch (propertyKind) {
					case "staticProperty": {
						result += parseStaticProperty(ccEnum, def);
						break;
					}
					case "staticPropertyWithName": {
						result += parseStaticPropertyWithName(ccEnum, def);
						break;
					}
					case "staticPropertyAndKeyWithName": {
						result += parseStaticPropertyAndKeyWithName(
							ccEnum,
							def,
						);
						break;
					}
					case "dynamicPropertyWithName": {
						result += parseDynamicPropertyWithName(ccEnum, def);
						break;
					}
					case "dynamicPropertyAndKeyWithName": {
						result += parseDynamicPropertyAndKeyWithName(
							ccEnum,
							def,
						);
						break;
					}
				}
			}
		} catch (e) {
			console.error(`Failed to process file ${file.getFilePath()}:
${getErrorMessage(e, true)}`);
			process.exit(1);
		}
		result += `
		});`;

		for (const decl of localFunctionsToCopy) {
			decl.asKindOrThrow(SyntaxKind.FunctionDeclaration).setIsExported(
				false,
			);
			result += `\n\n` + decl.getText();
		}

		// const ccName =
		// 	ccEnum.asKind(SyntaxKind.PropertyAccessExpression)?.getNameNode()
		// 		.getText()
		// 		?? ccEnum.asKindOrThrow(SyntaxKind.ElementAccessExpression)
		// 			.getArgumentExpressionOrThrow().getText();
		// if (ccName.includes(`"`)) {
		// 	exported += `\n[${ccName}]: `;
		// } else {
		// 	exported += `\n${ccName}: `;
		// }
		exported +=
			`\n[${ccEnum.getText()}]: ${ccValuesDeclaration.getName()},`;

		const importsInDeclaration = ccValuesDeclaration.getDescendantsOfKind(
			SyntaxKind.Identifier,
		)
			.map((id) => id.getSymbol())
			.filter((s) => s != undefined)
			.map((s) => {
				const decls = s.getDeclarations();
				for (const d of decls) {
					const imp = d.asKind(SyntaxKind.ImportSpecifier);
					if (imp) return imp;
				}
			})
			.filter((imp) => imp != undefined);

		for (const imp of importsInDeclaration) {
			const mod = imp.getImportDeclaration().getModuleSpecifierValue();
			const importedName = imp.getName();
			const isTypeOnly = imp.isTypeOnly()
				|| imp.getImportDeclaration().isTypeOnly();
			if (ignoredImports.includes(importedName)) continue;
			// Ignore imports we already have and which aren't type-only
			if (allImports.get(importedName) === false) continue;

			const moduleImports = importsByModule.get(mod) ?? new Map();
			// Add a new import or replace type-only imports with value imports
			if (!moduleImports.has(importedName) || !isTypeOnly) {
				moduleImports.set(importedName, isTypeOnly);
				allImports.set(importedName, isTypeOnly);
			}

			importsByModule.set(mod, moduleImports);
		}
	}

	result += `

export const CCValues = {
	${exported}
};
`;

	result = `/// This file is auto-generated. All manual changes will be lost!

` + [...importsByModule].map(([mod, names]) => {
		const importSpecifiers = [...names].map(([name, typeOnly]) => {
			return `${typeOnly ? "type " : ""}${name}`;
		}).join(", ");
		return `import {${importSpecifiers}} from "${mod}";`;
	}).join("\n") + `\n\n` + result;

	try {
		result = formatWithDprint("index.ts", result);
	} catch (e) {
		console.error(`Error formatting: ${getErrorMessage(e)}`);
		process.exit(1);
	}

	await fs.writeFile(valuesFile, result);
}

function inferEndpointClosure(
	supportsEndpoints: boolean,
	ccEnum: CCEnum,
	escapedProperty: string,
	escapedPropertyKey?: string,
) {
	// Generate the correct closure for the endpoint function
	// depending on whether the CC value supports endpoints,
	// and/or has a property key
	const propertyKeyLine = escapedPropertyKey
		? `\npropertyKey: ${escapedPropertyKey},`
		: "";
	return supportsEndpoints
		? `(endpoint: number = 0) => ({
			commandClass: ${ccEnum.getText()},
			endpoint,
			property: ${escapedProperty},${propertyKeyLine}
		} as const)`
		: `(_endpoint?: number) => ({
			commandClass: ${ccEnum.getText()},
			endpoint: 0, // no endpoint support!
			property: ${escapedProperty},${propertyKeyLine}
		} as const)`;
}

function inferOptions(optionsArgument: Node | undefined) {
	// Support passing the options as an object, with or without `as const`
	const optionsLiteral =
		optionsArgument?.asKind(SyntaxKind.ObjectLiteralExpression)
			?? optionsArgument
				?.asKind(SyntaxKind.AsExpression)
				?.getExpressionIfKind(SyntaxKind.ObjectLiteralExpression);
	// Use the provided options to overwrite the default ones, where defined
	const mergedOptions = Object.entries(defaultCCValueOptions).map(
		([key, value]) => {
			const overwrittenOption = optionsLiteral?.getProperty(key)?.asKind(
				SyntaxKind.PropertyAssignment,
			);
			return [
				key,
				overwrittenOption?.getInitializer()?.getText()
					?? JSON.stringify(value),
			] as [string, string];
		},
	);
	const mergedOptionsString = mergedOptions
		.map(([key, value]) => `${key}: ${value}`)
		.join(",\n");
	const supportsEndpoints =
		mergedOptions.find(([key]) => key === "supportsEndpoints")?.[1]
			=== "true";
	return { supportsEndpoints, mergedOptionsString };
}

function parseStaticProperty(ccEnum: CCEnum, expr: CallExpression): string {
	const propertyLiteral = expr.getArguments()[0].asKindOrThrow(
		SyntaxKind.StringLiteral,
		"parseStaticProperty expects the value property to be passed as a string literal as the first argument",
	);
	const escapedProperty = propertyLiteral.getText();

	const metaLiteralOrFunction = resolveObjectLiteralOrFunction(
		expr.getArguments()[1],
	);

	// Determine the inferred "meta" type
	const metaString: string = inferMetaBody(metaLiteralOrFunction);

	// Use the provided options to overwrite the default ones, where defined
	const { supportsEndpoints, mergedOptionsString } = inferOptions(
		expr.getArguments()[2],
	);

	const endpointClosure = inferEndpointClosure(
		supportsEndpoints,
		ccEnum,
		escapedProperty,
	);

	return `${escapedProperty}: {
		id: {
			commandClass: ${ccEnum.getText()},
			property: ${escapedProperty},
		} as const,
		endpoint: ${endpointClosure},
		is: (valueId: ValueID): boolean => {
			return valueId.commandClass === ${ccEnum.getText()}
			&& valueId.property === ${escapedProperty}
			&& valueId.propertyKey == undefined;
		},
		get meta() {
			${metaString}
		},
		options: {
			${mergedOptionsString}
		} as const satisfies CCValueOptions,
	},`;
}

function parseStaticPropertyWithName(
	ccEnum: CCEnum,
	expr: CallExpression,
): string {
	const nameLiteral = expr.getArguments()[0].asKindOrThrow(
		SyntaxKind.StringLiteral,
		"parseStaticPropertyWithName expects the custom property name to be passed as a string literal as the first argument",
	);
	const escapedName = nameLiteral.getText();

	const propertyLiteral = expr.getArguments()[1].asKindOrThrow(
		SyntaxKind.StringLiteral,
		"parseStaticPropertyWithName expects the value property to be passed as a string literal as the second argument",
	);
	const escapedProperty = propertyLiteral.getText();

	const metaLiteralOrFunction = resolveObjectLiteralOrFunction(
		expr.getArguments()[2],
	);

	// Determine the inferred "meta" type
	const metaString: string = inferMetaBody(metaLiteralOrFunction);

	const { supportsEndpoints, mergedOptionsString } = inferOptions(
		expr.getArguments()[3],
	);

	const endpointClosure = inferEndpointClosure(
		supportsEndpoints,
		ccEnum,
		escapedProperty,
	);

	return `${escapedName}: {
		id: {
			commandClass: ${ccEnum.getText()},
			property: ${escapedProperty},
		} as const,
		endpoint: ${endpointClosure},
		is: (valueId: ValueID): boolean => {
			return valueId.commandClass === ${ccEnum.getText()}
			&& valueId.property === ${escapedProperty}
			&& valueId.propertyKey == undefined;
		},
		get meta() {
			${metaString}
		},
		options: {
			${mergedOptionsString}
		} as const satisfies CCValueOptions,
	},`;
}

function parseStaticPropertyAndKeyWithName(
	ccEnum: CCEnum,
	expr: CallExpression,
): string {
	const nameLiteral = expr.getArguments()[0].asKindOrThrow(
		SyntaxKind.StringLiteral,
		"parseStaticPropertyAndKeyWithName expects the custom property name to be passed as a string literal as the first argument",
	);
	const escapedName = nameLiteral.getText();

	const propertyLiteral = expr.getArguments()[1].asKindOrThrow(
		SyntaxKind.StringLiteral,
		"parseStaticPropertyAndKeyWithName expects the value property to be passed as a string literal as the second argument",
	);
	const escapedProperty = propertyLiteral.getText();

	const propertyKeyLiteral = expr.getArguments()[2].asKindOrThrow(
		SyntaxKind.StringLiteral,
		"parseStaticPropertyAndKeyWithName expects the value propertyKey to be passed as a string literal as the third argument",
	);
	const escapedPropertyKey = propertyKeyLiteral.getText();

	const metaLiteralOrFunction = resolveObjectLiteralOrFunction(
		expr.getArguments()[3],
	);

	// Determine the inferred "meta" type
	const metaString: string = inferMetaBody(metaLiteralOrFunction);

	const { supportsEndpoints, mergedOptionsString } = inferOptions(
		expr.getArguments()[4],
	);

	const endpointClosure = inferEndpointClosure(
		supportsEndpoints,
		ccEnum,
		escapedProperty,
		escapedPropertyKey,
	);

	return `${escapedName}: {
		id: {
			commandClass: ${ccEnum.getText()},
			property: ${escapedProperty},
			propertyKey: ${escapedPropertyKey},
		} as const,
		endpoint: ${endpointClosure},
		is: (valueId: ValueID): boolean => {
			return valueId.commandClass === ${ccEnum.getText()}
			&& valueId.property === ${escapedProperty}
			&& valueId.propertyKey == ${escapedPropertyKey};
		},
		get meta() {
			${metaString}
		},
		options: {
			${mergedOptionsString}
		} as const satisfies CCValueOptions,
	},`;
}

function resolveStringLiteralOrFunction(
	node: Node,
):
	| StringLiteral
	| ArrowFunction
	| FunctionDeclaration
	| ImportSpecifier
	| undefined
{
	return node.asKind(SyntaxKind.StringLiteral)
		?? node.asKind(SyntaxKind.ArrowFunction)
		?? node.getSymbol()?.getValueDeclaration()?.asKind(
			SyntaxKind.FunctionDeclaration,
		)
		?? node.getSymbol()?.getValueDeclaration()?.asKind(
			SyntaxKind.ArrowFunction,
		)
		?? node.getSymbol()?.getDeclarations()[0]?.asKind(
			SyntaxKind.ImportSpecifier,
		);
}

function resolveObjectLiteralOrFunction(
	node: Node,
):
	| ObjectLiteralExpression
	| ArrowFunction
	| FunctionDeclaration
	| undefined
{
	if (
		node.isKind(SyntaxKind.AsExpression)
		&& node.getTypeNode()?.getText() === "const"
	) {
		return node.getExpressionIfKind(SyntaxKind.ObjectLiteralExpression);
	}

	return node.asKind(SyntaxKind.ObjectLiteralExpression)
		?? node.asKind(SyntaxKind.ArrowFunction)
		?? node.getSymbol()?.getValueDeclaration()?.asKind(
			SyntaxKind.FunctionDeclaration,
		)
		?? node.getSymbol()?.getValueDeclaration()?.asKind(
			SyntaxKind.ArrowFunction,
		);
}

function getStringLiteralOrFunctionText(
	node:
		| StringLiteral
		| ArrowFunction
		| FunctionDeclaration
		| ImportSpecifier,
): string {
	if (node.isKind(SyntaxKind.StringLiteral)) {
		return node.getText();
	}
	if (node.isKind(SyntaxKind.ImportSpecifier)) {
		return `${node.getName()}(...args)`;
	}
	const body = node.getBody();
	if (!body) {
		throw new Error(
			"Cannot determine initializer value from function without body",
		);
	}
	// Blocks are special because we need to wrap them. Everything else can be returned as-is
	if (!body.isKind(SyntaxKind.Block)) {
		return body.getText();
	}
	// Blocks that only contain a return are simple
	if (
		body.getStatements().length === 1
		&& body.getStatements()[0].isKind(SyntaxKind.ReturnStatement)
	) {
		return body.getStatements()[0].asKindOrThrow(SyntaxKind.ReturnStatement)
			.getExpressionOrThrow().getText();
	}
	// Wrap the rest in an IIFE
	return `(() => {
	${body.getText()}
})()`;
}

function stripAsConstAndParentheses(node: Node): Node {
	if (node.isKind(SyntaxKind.ParenthesizedExpression)) {
		return stripAsConstAndParentheses(
			node.getExpression(),
		);
	}
	if (
		node.isKind(SyntaxKind.AsExpression)
		&& node.getTypeNode()?.getText() === "const"
	) {
		return stripAsConstAndParentheses(
			node.getExpression(),
		);
	}
	return node;
}

function inferMetaBody(
	node:
		| ObjectLiteralExpression
		| ArrowFunction
		| FunctionDeclaration
		| undefined,
): string {
	if (!node) return "return ValueMetadata.Any";

	if (node.isKind(SyntaxKind.ObjectLiteralExpression)) {
		return `return ${node.getText()} as const`;
	}
	const body = node.getBody();
	if (!body) {
		throw new Error(
			"Cannot determine initializer value from function without body",
		);
	}

	// Blocks are special because we need to wrap them. Everything else can be returned as-is
	if (!body.isKind(SyntaxKind.Block)) {
		return `return ${stripAsConstAndParentheses(body).getText()} as const`;
	}
	// Blocks that only contain a return are simple
	if (
		body.getStatements().length === 1
		&& body.getStatements()[0].isKind(SyntaxKind.ReturnStatement)
	) {
		const ret = stripAsConstAndParentheses(
			body.getStatements()[0].asKindOrThrow(SyntaxKind.ReturnStatement)
				.getExpressionOrThrow(),
		).getText();
		return `return ${ret} as const`;
	}
	// The meta is constructed inside a getter, so no need to wrap anything
	// However, we need to trim off the surrounding braces
	return stripAsConstAndParentheses(body).getText().trim().slice(1, -1);
}

function parseDynamicPropertyWithName(
	ccEnum: CCEnum,
	expr: CallExpression,
): string {
	const nameLiteral = expr.getArguments()[0].asKindOrThrow(
		SyntaxKind.StringLiteral,
		"parseDynamicPropertyWithName expects the custom property name to be passed as a string literal as the first argument",
	);
	const escapedName = nameLiteral.getText();

	const propertyLiteralOrFunction = resolveStringLiteralOrFunction(
		expr.getArguments()[1],
	);
	if (!propertyLiteralOrFunction) {
		throw new Error(
			"parseDynamicPropertyWithName expects the second argument to be a string literal or an arrow function returning one",
		);
	}
	const propertyInitializer = getStringLiteralOrFunctionText(
		propertyLiteralOrFunction,
	);

	const isPredicate = expr.getArguments()[2].asKind(
		SyntaxKind.ArrowFunction,
	);
	if (!isPredicate || !isPredicate.getReturnType().isBoolean()) {
		throw new Error(
			"parseDynamicPropertyWithName expects the third argument to be an arrow function with return type boolean",
		);
	}

	const metaLiteralOrFunction = resolveObjectLiteralOrFunction(
		expr.getArguments()[3],
	);

	// Determine the inferred "meta" type
	const metaBody: string = inferMetaBody(metaLiteralOrFunction);

	const valueParams = (
		propertyLiteralOrFunction.asKind(SyntaxKind.ArrowFunction)
			?? propertyLiteralOrFunction.asKind(SyntaxKind.FunctionDeclaration)
			?? metaLiteralOrFunction?.asKind(SyntaxKind.ArrowFunction)
			?? metaLiteralOrFunction?.asKind(SyntaxKind.FunctionDeclaration)
	)?.getParameters();

	if (!valueParams) {
		throw new Error(
			"parseDynamicPropertyWithName expects the property or meta to be dynamic",
		);
	}

	const { supportsEndpoints, mergedOptionsString } = inferOptions(
		expr.getArguments()[4],
	);

	const formattedArgs = valueParams.map((p) => p.getText()).join(", ");
	const formattedArgNames = valueParams.map((p) => p.getName()).join(", ");

	const endpointClosure = inferEndpointClosure(
		supportsEndpoints,
		ccEnum,
		"property",
	);

	const dynamicPart = `(${formattedArgs}) => {
	const property = ${
		propertyInitializer.replace("...args", formattedArgNames)
	};

	return {
		id: {
			commandClass: ${ccEnum.getText()},
			property,
		} as const,
		endpoint: ${endpointClosure},
		get meta() {
			${metaBody}
		}
	};
}`;

	return `${escapedName}: Object.assign(
	${dynamicPart},
	{
		is: (valueId: ValueID): boolean => {
			return valueId.commandClass === ${ccEnum.getText()}
			&& (${isPredicate.getText()})(valueId);
		},
		options: {
			${mergedOptionsString}
		} as const satisfies CCValueOptions,
	}
),`;
}

function parseDynamicPropertyAndKeyWithName(
	ccEnum: CCEnum,
	expr: CallExpression,
): string {
	const nameLiteral = expr.getArguments()[0].asKindOrThrow(
		SyntaxKind.StringLiteral,
		"parseDynamicPropertyAndKeyWithName expects the custom property name to be passed as a string literal as the first argument",
	);
	const escapedName = nameLiteral.getText();

	const propertyLiteralOrFunction = resolveStringLiteralOrFunction(
		expr.getArguments()[1],
	);
	if (!propertyLiteralOrFunction) {
		throw new Error(
			"parseDynamicPropertyAndKeyWithName expects the second argument to be a string literal or an arrow function returning one",
		);
	}
	const propertyInitializer = getStringLiteralOrFunctionText(
		propertyLiteralOrFunction,
	);

	const propertyKeyLiteralOrFunction = resolveStringLiteralOrFunction(
		expr.getArguments()[2],
	);
	if (!propertyKeyLiteralOrFunction) {
		debugger;
		throw new Error(
			"parseDynamicPropertyAndKeyWithName expects the third argument to be a string literal or an arrow function returning one",
		);
	}
	const propertyKeyInitializer = getStringLiteralOrFunctionText(
		propertyKeyLiteralOrFunction,
	);

	const isPredicate = expr.getArguments()[3].asKind(
		SyntaxKind.ArrowFunction,
	);
	if (!isPredicate || !isPredicate.getReturnType().isBoolean()) {
		throw new Error(
			"parseDynamicPropertyAndKeyWithName expects the fourth argument to be an arrow function with return type boolean",
		);
	}

	const metaLiteralOrFunction = resolveObjectLiteralOrFunction(
		expr.getArguments()[4],
	);

	const metaBody: string = inferMetaBody(metaLiteralOrFunction);

	const valueParams = (
		propertyLiteralOrFunction.asKind(SyntaxKind.ArrowFunction)
			?? propertyLiteralOrFunction.asKind(SyntaxKind.FunctionDeclaration)
			?? propertyKeyLiteralOrFunction.asKind(SyntaxKind.ArrowFunction)
			?? propertyKeyLiteralOrFunction.asKind(
				SyntaxKind.FunctionDeclaration,
			)
			?? metaLiteralOrFunction?.asKind(SyntaxKind.ArrowFunction)
			?? metaLiteralOrFunction?.asKind(SyntaxKind.FunctionDeclaration)
	)?.getParameters();

	if (!valueParams) {
		throw new Error(
			"parseDynamicPropertyAndKeyWithName expects the property, property key or meta to be dynamic",
		);
	}

	const { supportsEndpoints, mergedOptionsString } = inferOptions(
		expr.getArguments()[5],
	);

	const formattedArgs = valueParams.map((p) => p.getText()).join(", ");
	const formattedArgNames = valueParams.map((p) => p.getName()).join(", ");

	const endpointClosure = inferEndpointClosure(
		supportsEndpoints,
		ccEnum,
		"property",
		"propertyKey",
	);

	const dynamicPart = `(${formattedArgs}) => {
	const property = ${
		propertyInitializer.replace("...args", formattedArgNames)
	};
	const propertyKey = ${
		propertyKeyInitializer.replace("...args", formattedArgNames)
	};

	return {
		id: {
			commandClass: ${ccEnum.getText()},
			property,
			propertyKey,
		} as const,
		endpoint: ${endpointClosure},
		get meta() {
			${metaBody}
		}
	};
}`;

	return `${escapedName}: Object.assign(
	${dynamicPart},
	{
		is: (valueId: ValueID): boolean => {
			return valueId.commandClass === ${ccEnum.getText()}
			&& (${isPredicate.getText()})(valueId);
		},
		options: {
			${mergedOptionsString}
		} as const satisfies CCValueOptions,
	}
),`;
}

if (esMain(import.meta)) void generateCCValueDefinitions();
