import { ValueMetadata } from "@zwave-js/core";
import { formatWithDprint } from "@zwave-js/maintenance";
import { getErrorMessage } from "@zwave-js/shared";
import fs from "node:fs/promises";
import {
	type ArrowFunction,
	type CallExpression,
	type ElementAccessExpression,
	type FunctionDeclaration,
	type Node,
	Project,
	type PropertyAccessExpression,
	type StringLiteral,
	SyntaxKind,
	type ts,
} from "ts-morph";

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

const defaultMeta = ValueMetadata.Any;

const ignoredImports = ["V", "ValueMetadata"];

async function main() {
	const project = new Project({
		tsConfigFilePath: "packages/cc/tsconfig.json",
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
			["enumValuesToMetadataStates", false],
		]),
	);
	importsByModule.set(
		"@zwave-js/shared",
		new Map([
			["getEnumMemberName", false],
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

		result += `

		const ${ccValuesDeclaration.getName()} = Object.freeze({
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

		exported += `
		[${ccEnum.getText()}]: ${ccValuesDeclaration.getName()},`;

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

export const values = {
	${exported}
}`;

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
		debugger;
		throw e;
	}

	// console.log(result);
	await fs.writeFile(
		"/home/dominic/Repositories/node-zwave-js/packages/cc/src/cc/_CCValues.generated.ts",
		result,
	);
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

function inferMetaType(
	expr: CallExpression<ts.CallExpression>,
	metaArgument: Node | undefined,
	nameOrPropertyLiteral: string,
	escapedProperty: string,
) {
	// We use both the return type and the object literal (if any)
	// to infer the resulting metadata
	const returnType = expr.getReturnType();
	const innerReturnType = returnType
		.getProperty(nameOrPropertyLiteral)
		?.getTypeAtLocation(expr);
	// For static properties, we can simply use the meta property of the
	// "inner" return type. For dynamic properties, we need to "unwrap"
	// the call signature first.
	const returnMeta = innerReturnType
		?.getProperty("meta")
		?.getTypeAtLocation(expr)
		?? innerReturnType?.getCallSignatures()[0]
			.getReturnType()
			.getProperty("meta")
			?.getTypeAtLocation(expr);
	if (!returnMeta) {
		throw new Error(
			`Failed to determine value metadata for property ${escapedProperty}`,
		);
	}

	// Support passing the options as an object, with or without `as const`
	// or as an arrow function
	const metaLiteral = metaArgument?.asKind(SyntaxKind.ObjectLiteralExpression)
		?? metaArgument
			?.asKind(SyntaxKind.AsExpression)
			?.getExpressionIfKind(SyntaxKind.ObjectLiteralExpression)
		?? metaArgument
			?.asKind(SyntaxKind.ArrowFunction)
			?.getBody()
			?.getFirstDescendantByKind(SyntaxKind.ObjectLiteralExpression);

	// ...and if possible, use it to generate the meta object
	let metaString: string;
	if (
		returnMeta.getAliasSymbol()?.getDeclarations()[0]?.asKind(
			SyntaxKind.TypeAliasDeclaration,
		)?.getName() === "ValueMetadata"
	) {
		// No meta was defined, fall back to ValueMetadata.Any
		metaString = JSON.stringify(defaultMeta, null, "\t");
	} else {
		metaString = `{`;
		const returnMetaProperties = returnMeta.getProperties()
			.map((
				p,
			) => ([p.getName(), p.getTypeAtLocation(expr).getText()] as const));
		const metaLiteralPropertyNames = metaLiteral?.getProperties().map((p) =>
			p
		)
			.filter((p) => p.isKind(SyntaxKind.PropertyAssignment))
			.map((p) => p.getName()) ?? [];
		const metaLiteralProperties = metaLiteralPropertyNames.map((
			p,
		) => ([
			p,
			metaLiteral!
				.getPropertyOrThrow(p)
				.asKindOrThrow(SyntaxKind.PropertyAssignment)
				.getInitializerOrThrow(`expected an initializer for ${p}`)
				.getText(),
		] as const));
		const allProperties = Object.fromEntries(
			[...returnMetaProperties, ...metaLiteralProperties],
		);
		for (const [key, value] of Object.entries(allProperties)) {
			metaString += `\n\t${key}: ${value},`;
		}
		metaString += `\n}`;
	}
	return metaString;
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

	// Determine the inferred "meta" type
	const metaString: string = inferMetaType(
		expr,
		expr.getArguments()[1],
		propertyLiteral.getLiteralText(),
		escapedProperty,
	);

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
		meta: ${metaString} as const,
		options: {
			${mergedOptionsString}
		} as const,
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
		"parseStaticProperty expects the value property to be passed as a string literal as the second argument",
	);
	const escapedProperty = propertyLiteral.getText();

	// Determine the inferred "meta" type
	const metaString: string = inferMetaType(
		expr,
		expr.getArguments()[2],
		nameLiteral.getLiteralText(),
		escapedProperty,
	);

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
		meta: ${metaString} as const,
		options: {
			${mergedOptionsString}
		} as const,
	},`;
}

function resolveLiteralOrFunction(
	node: Node,
): StringLiteral | ArrowFunction | FunctionDeclaration | undefined {
	return node.asKind(SyntaxKind.StringLiteral)
		?? node.asKind(SyntaxKind.ArrowFunction)
		?? node.getSymbol()?.getValueDeclaration()?.asKind(
			SyntaxKind.FunctionDeclaration,
		)
		?? node.getSymbol()?.getValueDeclaration()?.asKind(
			SyntaxKind.ArrowFunction,
		);
}

function getLiteralOrFunctionText(
	node: StringLiteral | ArrowFunction | FunctionDeclaration,
): string {
	if (node.isKind(SyntaxKind.StringLiteral)) {
		return node.getText();
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

function parseDynamicPropertyWithName(
	ccEnum: CCEnum,
	expr: CallExpression,
): string {
	const nameLiteral = expr.getArguments()[0].asKindOrThrow(
		SyntaxKind.StringLiteral,
		"parseDynamicPropertyWithName expects the custom property name to be passed as a string literal as the first argument",
	);
	const escapedName = nameLiteral.getText();

	const propertyLiteralOrFunction = resolveLiteralOrFunction(
		expr.getArguments()[1],
	);
	if (!propertyLiteralOrFunction) {
		throw new Error(
			"parseDynamicPropertyWithName expects the second argument to be a string literal or an arrow function returning one",
		);
	}
	const propertyInitializer = getLiteralOrFunctionText(
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

	const metaLiteralOrFunction = expr.getArguments()[3].asKind(
		SyntaxKind.ObjectLiteralExpression,
	)
		?? expr.getArguments()[3].asKind(SyntaxKind.AsExpression)
		?? expr.getArguments()[3].asKind(SyntaxKind.ArrowFunction);

	// Determine the inferred "meta" type
	const metaString: string = inferMetaType(
		expr,
		metaLiteralOrFunction,
		nameLiteral.getLiteralText(),
		escapedName,
	);

	const valueParams = (
		propertyLiteralOrFunction.asKind(SyntaxKind.ArrowFunction)
			?? propertyLiteralOrFunction.asKind(SyntaxKind.FunctionDeclaration)
			?? metaLiteralOrFunction?.asKind(SyntaxKind.ArrowFunction)
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

	const endpointClosure = inferEndpointClosure(
		supportsEndpoints,
		ccEnum,
		"property",
	);

	const dynamicPart = `(${formattedArgs}) => {
	const property = ${propertyInitializer};

	return {
		get id() {
			return {
				commandClass: ${ccEnum.getText()},
				property,
			} as const;
		},
		endpoint: ${endpointClosure},
		get meta() {
			return ${metaString} as const;
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
		} as const,
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

	const propertyLiteralOrFunction = resolveLiteralOrFunction(
		expr.getArguments()[1],
	);
	if (!propertyLiteralOrFunction) {
		throw new Error(
			"parseDynamicPropertyAndKeyWithName expects the second argument to be a string literal or an arrow function returning one",
		);
	}
	const propertyInitializer = getLiteralOrFunctionText(
		propertyLiteralOrFunction,
	);

	const propertyKeyLiteralOrFunction = resolveLiteralOrFunction(
		expr.getArguments()[2],
	);
	if (!propertyKeyLiteralOrFunction) {
		debugger;
		throw new Error(
			"parseDynamicPropertyAndKeyWithName expects the third argument to be a string literal or an arrow function returning one",
		);
	}
	const propertyKeyInitializer = getLiteralOrFunctionText(
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

	const metaLiteralOrFunction = expr.getArguments()[4].asKind(
		SyntaxKind.ObjectLiteralExpression,
	)
		?? expr.getArguments()[4].asKind(SyntaxKind.AsExpression)
		?? expr.getArguments()[4].asKind(SyntaxKind.ArrowFunction);

	// Determine the inferred "meta" type
	const metaString: string = inferMetaType(
		expr,
		metaLiteralOrFunction,
		nameLiteral.getLiteralText(),
		escapedName,
	);

	const valueParams = (
		propertyLiteralOrFunction.asKind(SyntaxKind.ArrowFunction)
			?? propertyLiteralOrFunction.asKind(SyntaxKind.FunctionDeclaration)
			?? propertyKeyLiteralOrFunction.asKind(SyntaxKind.ArrowFunction)
			?? propertyKeyLiteralOrFunction.asKind(
				SyntaxKind.FunctionDeclaration,
			)
			?? metaLiteralOrFunction?.asKind(SyntaxKind.ArrowFunction)
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

	const endpointClosure = inferEndpointClosure(
		supportsEndpoints,
		ccEnum,
		"property",
		"propertyKey",
	);

	const dynamicPart = `(${formattedArgs}) => {
	const property = ${propertyInitializer};
	const propertyKey = ${propertyKeyInitializer};

	return {
		get id() {
			return {
				commandClass: ${ccEnum.getText()},
				property,
				propertyKey,
			} as const;
		},
		endpoint: ${endpointClosure},
		get meta() {
			return ${metaString} as const;
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
		} as const,
	}
),`;
}

void main();
