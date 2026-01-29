/**
 * Generates the content for ._validateArgs.ts files using ts-morph for type analysis.
 * Extracted and adapted from validateArgs/transformProgram.ts
 */

import path from "node:path";
import { type SourceFile, type Type, ts as tsm } from "ts-morph";
import type { ValidateArgsOptions } from "../index.js";

interface ParameterInfo {
	name: string;
	isRest?: boolean;
	hasInitializer?: boolean;
	type: Type<tsm.Type>;
	typeName: string | undefined;
}

interface TransformContext {
	sourceFile: SourceFile;
	options: ValidateArgsOptions;
	additionalImports: Map<string, Set<string>>;
	typeStack?: WeakSet<Type<tsm.Type>>;
}

/**
 * Generates all ._validateArgs.ts files for source files that use @validateArgs decorators.
 * Returns a map of relative paths (from srcDir) to generated content.
 */
export async function generateValidateArgsFiles(
	sourceFiles: SourceFile[],
	srcDir: string,
): Promise<Map<string, string>> {
	const result = new Map<string, string>();

	for (const sf of sourceFiles) {
		const content = sf.getFullText();
		if (!content.includes("from \"@zwave-js/transformers\"")) continue;

		const validateArgsContent = generateValidateArgsFileContent(sf);
		if (validateArgsContent) {
			const filePath = sf.getFilePath();
			const ext = path.extname(filePath);
			const base = path.basename(filePath, ext);
			const dir = path.dirname(filePath);
			const relativePath = path.join(
				path.relative(srcDir, dir),
				`${base}._validateArgs${ext}`,
			);
			result.set(relativePath, validateArgsContent);
		}
	}

	return result;
}

/**
 * Generates the content for a ._validateArgs.ts file based on @validateArgs decorators
 * found in the source file. Returns null if no decorators are found.
 */
function generateValidateArgsFileContent(
	sourceFile: SourceFile,
): string | null {
	// Find validateArgs decorators
	const validateArgsDecorators = sourceFile
		.getDescendantsOfKind(tsm.SyntaxKind.Decorator)
		.filter(
			(d) =>
				d.getFirstDescendantByKind(tsm.SyntaxKind.Identifier)?.getText()
					=== "validateArgs",
		);

	if (validateArgsDecorators.length === 0) {
		return null;
	}

	const withMethodAndClassName = validateArgsDecorators
		.map((d) => {
			const method = d.getParentIfKind(tsm.SyntaxKind.MethodDeclaration);
			if (!method) return;

			const methodName = method?.getName();
			if (!methodName) return;

			const parameters: ParameterInfo[] = method
				.getParameters()
				.map((p) => {
					return {
						name: p.getName(),
						isRest: p.isRestParameter(),
						hasInitializer: p.hasInitializer(),
						type: p.getType(),
						typeName: p.getTypeNode()?.getText(),
					};
				})
				.filter((p) => p.name !== "this");

			const className = method
				?.getParentIfKind(tsm.SyntaxKind.ClassDeclaration)
				?.getName();
			if (!className) return;

			const optionsObject = d
				.getCallExpression()
				?.getArguments()[0]
				?.asKind(tsm.SyntaxKind.ObjectLiteralExpression);
			const options: ValidateArgsOptions = {};
			if (
				optionsObject
					?.getProperty("strictEnums")
					?.asKind(tsm.SyntaxKind.PropertyAssignment)
					?.getInitializer()
					?.getText() === "true"
			) {
				options.strictEnums = true;
			}
			return { decorator: d, options, parameters, methodName, className };
		})
		.filter((x) => x != undefined);

	if (withMethodAndClassName.length === 0) {
		return null;
	}

	let newSourceText = `import * as v from "@zwave-js/core/validation";`;

	// import specifier -> [exported name, renamed to?]
	const additionalImports = new Map<string, Set<string>>();

	for (
		const { methodName, className, parameters, options }
			of withMethodAndClassName
	) {
		const paramSpreadWithUnknown = parameters
			.map(
				(p) =>
					`${p.isRest ? "..." : ""}${p.name}: unknown${
						p.isRest ? "[]" : ""
					}`,
			)
			.join(", ");
		const paramSpread = parameters
			.map((p) => `${p.isRest ? "..." : ""}${p.name}`)
			.join(", ");

		const context: TransformContext = {
			sourceFile,
			options,
			additionalImports,
		};

		newSourceText += `

export function validateArgs_${className}_${methodName}() {
	return <T extends Function>(__decoratedMethod: T, { kind }: ClassMethodDecoratorContext): T | void => {
		if (kind === "method") {
			return function ${methodName}(this: any, ${paramSpreadWithUnknown}) {
				v.assert(${
			parameters
				.map((p) => `
					${getValidationFunction(context, p)}(${p.name}),`)
				.join("\n")
		}
				);
				return __decoratedMethod.call(this, ${paramSpread});
			} as unknown as T;
		}
	};
}`;
	}

	for (const [specifier, imports] of additionalImports) {
		newSourceText =
			`import { ${[...imports].join(", ")} } from "${specifier}";`
			+ "\n"
			+ newSourceText;
	}

	return newSourceText;
}

function getTypeName(t: Type<tsm.Type>): string {
	const symbol = t.getSymbol();
	if (symbol) return symbol.getEscapedName();
	return t.getText();
}

function getValidationFunction(
	context: TransformContext,
	param: ParameterInfo,
	kind: "parameter" | "item" | "object" | "property" = "parameter",
): string {
	// Detect and avoid recursive references for now.
	// TODO: Solve this by generating a new validation function that calls itself
	const typeStack = context.typeStack ?? new WeakSet();
	const possiblyRecursive = param.type.isUnionOrIntersection()
		|| param.type.isClassOrInterface();
	if (possiblyRecursive && typeStack.has(param.type)) {
		throw new Error(
			`Error while transforming ${context.sourceFile.getFilePath()}
Type ${param.typeName} recursively references itself`,
		);
	}
	typeStack.add(param.type);

	if (param.type.isAny() || param.type.isUnknown()) {
		// Technically there's no need to type the parameter, but this
		// serves as documentation which type is being checked
		return `((_: ${param.typeName}) => ({ success: true }))`;
	}

	const ctx = `{ kind: "${kind}", name: "${param.name}" }`;

	// Parameters with a default value, but no `| undefined` in the type need to be treated as optional
	if (
		param.hasInitializer
		&& !(
			param.type.isUnion()
			&& param.type.getUnionTypes().some((t) => t.isUndefined())
		)
	) {
		return `v.optional(${ctx}, ${
			getValidationFunction(
				context,
				{ ...param, hasInitializer: false },
				kind,
			)
		})`;
	}

	if (
		param.type.isNumberLiteral()
		|| param.type.isStringLiteral()
		|| param.type.isBooleanLiteral()
	) {
		const literal = param.type.getLiteralValue() as string | number;
		if (typeof literal === "string") {
			return `v.literal(${ctx}, ${JSON.stringify(literal)})`;
		} else if (typeof literal === "number") {
			return `v.literal(${ctx}, ${literal})`;
		} else if (param.typeName === "true" || param.typeName === "false") {
			return `v.literal(${ctx}, ${param.typeName})`;
		}
	}
	if (param.type.isNumber()) {
		return `v.primitive(${ctx}, "number")`;
	}
	if (param.type.isString()) {
		return `v.primitive(${ctx}, "string")`;
	}
	if (param.type.isBoolean()) {
		return `v.primitive(${ctx}, "boolean")`;
	}
	if (param.type.isUndefined()) {
		return `v.undefined(${ctx})`;
	}
	if (param.type.isNull()) {
		return `v.null(${ctx})`;
	}
	if (param.type.isEnum()) {
		// Enums are unions of their members. If strictEnums is false, we just check if the argument is a number instead
		if (context.options.strictEnums) {
			const values = param.type
				.getUnionTypes()
				.map((t) => t.getLiteralValue() as number);
			return `v.enum(${ctx}, "${param.typeName}", [${
				values.join(", ")
			}])`;
		} else {
			return `v.enum(${ctx}, "${param.typeName}")`;
		}
	}
	if (param.type.isUnion()) {
		const types = param.type.getUnionTypes();
		// boolean is actually union of true and false, but we want to treat it as a primitive
		const typeIsBoolean = types.some(
			(t) => t.isBooleanLiteral() && t.getText() === "true",
		)
			&& types.some(
				(t) => t.isBooleanLiteral() && t.getText() === "false",
			);
		const typeIsOptional = types.some((t) => t.isUndefined());

		const actualUnionTypes = types.filter((t) => {
			if (typeIsOptional && t.isUndefined()) return false;
			if (typeIsBoolean && t.isBooleanLiteral()) return false;
			return true;
		});

		const recurse = actualUnionTypes.map((t) =>
			getValidationFunction(
				context,
				{
					name: param.name,
					type: t,
					typeName: getTypeName(t),
				},
				kind,
			)
		);
		if (typeIsBoolean) {
			recurse.push(`v.primitive(${ctx}, "boolean")`);
		}

		const typeAlias = param.type.getAliasSymbol()?.getEscapedName();

		let ret = recurse.length > 1
			? `v.oneOf(${ctx}, ${typeAlias ? `"${typeAlias}"` : `undefined`}, ${
				recurse.join(", ")
			})`
			: recurse[0];

		if (typeIsOptional) {
			ret = `v.optional(${ctx}, ${ret})`;
		}

		return ret;
	}

	if (param.type.isIntersection()) {
		const types = param.type.getIntersectionTypes();

		const recurse = types.map((t) =>
			getValidationFunction(
				context,
				{
					name: param.name,
					type: t,
					typeName: getTypeName(t),
				},
				kind,
			)
		);

		const typeAlias = param.type.getAliasSymbol()?.getEscapedName();

		return `v.allOf(${ctx}, ${
			typeAlias ? `"${typeAlias}"` : `undefined`
		}, ${recurse.join(", ")})`;
	}

	if (param.type.isArray()) {
		const elementType = param.type.getArrayElementType();
		if (elementType) {
			const elementTypeName = getTypeName(elementType);
			const itemValidation = getValidationFunction(
				context,
				{
					name: param.name,
					type: elementType,
					typeName: elementTypeName,
				},
				"item",
			);

			// TODO: elementTypeName may need to be escaped here
			return `v.array(${ctx}, '${elementTypeName}', ${itemValidation})`;
		}
	}

	if (param.type.isTuple()) {
		const elementTypes = param.type.getTupleElements();
		const itemValidations = elementTypes.map((t) =>
			getValidationFunction(
				context,
				{
					name: param.name,
					type: t,
					typeName: getTypeName(t),
				},
				"item",
			)
		);

		return `v.tuple(${ctx}, '${param.typeName}', ${
			itemValidations.join(", ")
		})`;
	}

	const symbol = param.type.getSymbol();
	if (
		symbol
		&& (param.type.isClassOrInterface() || param.type.isObject())
	) {
		const symbolName = symbol.getName();
		const valueDeclaration = symbol.getValueDeclaration();

		const isClass = param.type.isClass();
		const isInterface = param.type.isInterface();
		const isObject = param.type.isObject();

		if (isClass) {
			const sourceFilePath = context.sourceFile.getFilePath();
			const isLocalClass = valueDeclaration?.getSourceFile().getFilePath()
				=== sourceFilePath;

			if (isLocalClass) {
				throw new Error(
					`Error transforming ${sourceFilePath}:
Local class ${param.typeName} must not be used as a parameter type for @validateArgs.
Use interfaces instead or move the class to a separate file.`,
				);
			}

			if (!valueDeclaration) {
				throw new Error(
					`Error transforming ${sourceFilePath}:
Class ${param.typeName} which is used as a parameter type for @validateArgs has no value declaration.`,
				);
			}

			// When compiling the project with references, the value declaration
			// may refer to a declaration file, but the source file imports a
			// different source file.
			// Therefore we need to look at all import declarations.

			const namedImportAndSpecifier = context.sourceFile
				.getImportDeclarations()
				.map((d) => {
					const specifier = d.getModuleSpecifierValue();
					const namedImport = d
						.getNamedImports()
						.find(
							(imp) =>
								imp.getSymbol()?.getEscapedName()
									=== param.typeName,
						);
					if (!namedImport || !specifier) return;
					return { namedImport, specifier };
				})
				.find((x) => x != undefined);

			if (!namedImportAndSpecifier) {
				throw new Error(
					`Error transforming ${sourceFilePath}:
Unable to find import specifier for class ${param.typeName}.`,
				);
			}

			const { namedImport, specifier } = namedImportAndSpecifier;

			const declaredName = namedImport.getName();
			const importedName = namedImport.getSymbol()!.getEscapedName();

			const importsForFile = context.additionalImports.get(specifier)
				?? new Set();
			// TODO: We may need to namespace the import here
			// import { OriginalName as RenamedName } from "module";
			// TODO: Consider ignoring the rename, but make sure
			// not to introduce naming conflicts that way
			if (declaredName !== importedName) {
				importsForFile.add(`${declaredName} as ${importedName}`);
			} else {
				importsForFile.add(importedName);
			}
			context.additionalImports.set(specifier, importsForFile);

			// The validation function needs to know the original name of the class
			// so it can try and find the built-in typeguard function
			return `v.class(${ctx}, "${declaredName}", ${param.typeName})`;
		}

		const variableDeclaration = valueDeclaration?.asKind(
			tsm.SyntaxKind.VariableDeclaration,
		);
		const isAmbient = !!variableDeclaration
			&& !!(variableDeclaration?.getCombinedModifierFlags()
				& tsm.ModifierFlags.Ambient);

		if (isAmbient) {
			if (isInterface && symbolName === "Date") {
				return `v.date(${ctx})`;
			}

			const structure = variableDeclaration?.getStructure();

			if (
				structure?.name === "Uint8Array"
				&& structure.type === "Uint8ArrayConstructor"
			) {
				return `v.uint8array(${ctx})`;
			}

			if (
				structure?.name === "Map"
				&& structure.type === "MapConstructor"
			) {
				return `v.class(${ctx}, "Map", Map)`;
			}

			if (
				structure?.name === "Set"
				&& structure.type === "SetConstructor"
			) {
				return `v.class(${ctx}, "Set", Set)`;
			}
		}

		// Those are not detected as ambient interfaces for some reason
		if (
			symbolName === "ReadonlyMap"
			&& symbol
				.getDeclarations()
				.every((d) => d.isKind(tsm.SyntaxKind.InterfaceDeclaration))
		) {
			return `v.class(${ctx}, "Map", Map)`;
		}
		if (
			symbolName === "ReadonlySet"
			&& symbol
				.getDeclarations()
				.every((d) => d.isKind(tsm.SyntaxKind.InterfaceDeclaration))
		) {
			return `v.class(${ctx}, "Set", Set)`;
		}

		if (isInterface || isObject) {
			const expectedKind = isInterface
				? tsm.SyntaxKind.InterfaceDeclaration
				: tsm.SyntaxKind.TypeLiteral;
			// Collect all property definitions from all interface declarations
			const properties = symbol
				.getDeclarations()
				.map((d) => d.asKind(expectedKind))
				.filter((d) => d != undefined)
				.flatMap((d) => d.getProperties())
				.map((p) => {
					const propertyType = p.getType();
					return {
						name: p.getName(),
						type: propertyType,
						typeName: getTypeName(propertyType),
					};
				});

			const recurse = properties.map(
				(p) =>
					`"${p.name}": ${
						getValidationFunction(context, p, "property")
					}`,
			);

			// In type definitions, the symbols may be anonymous object types
			const objectTypeName = symbolName === "__type"
				? "<anonymous object>"
				: symbolName;

			return `v.object(${ctx}, '${objectTypeName}', { ${
				recurse.join(", ")
			} })`;
		}
	}

	throw new Error(
		`Encountered unsupported type ${param.typeName} while transforming ${context.sourceFile.getFilePath()}`,
	);
}
