import {
	AST_NODE_TYPES,
	ESLintUtils,
	type TSESTree,
} from "@typescript-eslint/utils";

export const consistentMockNodeBehaviors = ESLintUtils.RuleCreator.withoutDocs({
	create(context) {
		const services = ESLintUtils.getParserServices(context);
		const checker = services.program.getTypeChecker();

		/**
		 * Check if a type annotation references a specific type name
		 */
		function hasTypeName(
			typeAnnotation: TSESTree.TypeNode | undefined,
			typeName: string,
		): boolean {
			if (!typeAnnotation) return false;

			if (
				typeAnnotation.type === AST_NODE_TYPES.TSTypeReference
				&& typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier
				&& typeAnnotation.typeName.name === typeName
			) {
				return true;
			}

			return false;
		}

		/**
		 * Check if a type annotation references MockNodeBehavior
		 */
		function isMockNodeBehaviorType(
			typeAnnotation: TSESTree.TypeNode | undefined,
		): boolean {
			return hasTypeName(typeAnnotation, "MockNodeBehavior");
		}

		/**
		 * Check if a return type annotation references MockNodeResponse or Promise<MockNodeResponse>
		 */
		function isMockNodeResponseReturnType(
			returnType: TSESTree.TypeNode | undefined,
		): boolean {
			if (!returnType) return false;

			// Direct MockNodeResponse
			if (hasTypeName(returnType, "MockNodeResponse")) {
				return true;
			}

			// Promise<MockNodeResponse>
			if (
				returnType.type === AST_NODE_TYPES.TSTypeReference
				&& returnType.typeName.type === AST_NODE_TYPES.Identifier
				&& returnType.typeName.name === "Promise"
				&& returnType.typeArguments?.params.length === 1
			) {
				const typeArg = returnType.typeArguments.params[0];
				if (hasTypeName(typeArg, "MockNodeResponse")) {
					return true;
				}
			}

			// Union types that include MockNodeResponse (e.g., MockNodeResponse | undefined)
			if (returnType.type === AST_NODE_TYPES.TSUnionType) {
				return returnType.types.some((t) =>
					isMockNodeResponseReturnType(t)
				);
			}

			return false;
		}

		/**
		 * Get the parameter name for a given type in a function
		 */
		function getParamNameForType(
			func:
				| TSESTree.FunctionExpression
				| TSESTree.ArrowFunctionExpression,
			typeName: string,
		): string | undefined {
			for (const param of func.params) {
				if (param.type !== AST_NODE_TYPES.Identifier) continue;

				// Check explicit type annotation first
				if (
					param.typeAnnotation
					&& hasTypeName(
						param.typeAnnotation.typeAnnotation,
						typeName,
					)
				) {
					return param.name;
				}

				// Use TypeScript type checker to get inferred type
				const tsNode = services.esTreeNodeToTSNodeMap.get(param);
				const type = checker.getTypeAtLocation(tsNode);
				const typeStr = checker.typeToString(type);

				// Check if the type string matches the type name we're looking for
				if (typeStr === typeName || typeStr.includes(typeName)) {
					return param.name;
				}
			}
			return undefined;
		}

		/**
		 * Check if a function is inside a transformResponse method
		 */
		function isInTransformResponse(
			func:
				| TSESTree.FunctionExpression
				| TSESTree.ArrowFunctionExpression,
		): boolean {
			// Check if function is a property value
			const parent = func.parent;
			if (parent?.type === AST_NODE_TYPES.Property) {
				if (
					parent.key.type === AST_NODE_TYPES.Identifier
					&& parent.key.name === "transformResponse"
				) {
					return true;
				}
			}
			return false;
		}

		/**
		 * Check if a function is a MockNodeBehavior method or returns MockNodeResponse
		 */
		function shouldCheckFunction(
			node:
				| TSESTree.FunctionExpression
				| TSESTree.ArrowFunctionExpression,
			parent: TSESTree.Node | undefined,
		): boolean {
			// Check if function has a return type annotation for MockNodeResponse
			if (
				node.returnType
				&& isMockNodeResponseReturnType(node.returnType.typeAnnotation)
			) {
				return true;
			}

			// Check if function is a property of a MockNodeBehavior object
			if (
				parent?.type === AST_NODE_TYPES.Property
				&& parent.value === node
			) {
				const objectParent = parent.parent;
				if (objectParent?.type === AST_NODE_TYPES.ObjectExpression) {
					// Check if object has MockNodeBehavior type
					const objectGrandParent = objectParent.parent;
					if (
						objectGrandParent?.type
							=== AST_NODE_TYPES.VariableDeclarator
						&& objectGrandParent.id.type
							=== AST_NODE_TYPES.Identifier
						&& objectGrandParent.id.typeAnnotation
						&& isMockNodeBehaviorType(
							objectGrandParent.id.typeAnnotation.typeAnnotation,
						)
					) {
						return true;
					}
				}
			}

			return false;
		}

		/**
		 * Check if a NewExpression is for a CC class (contains "CC" in the name)
		 */
		function isCCConstructor(node: TSESTree.NewExpression): boolean {
			if (node.callee.type === AST_NODE_TYPES.Identifier) {
				return node.callee.name.includes("CC");
			}
			return false;
		}

		/**
		 * Find nodeId property in constructor arguments and check its value
		 */
		function checkConstructorNodeId(
			node: TSESTree.NewExpression,
			containingFunc:
				| TSESTree.FunctionExpression
				| TSESTree.ArrowFunctionExpression,
		): void {
			if (node.arguments.length === 0) return;

			const firstArg = node.arguments[0];
			if (firstArg.type !== AST_NODE_TYPES.ObjectExpression) return;

			const nodeIdProp = firstArg.properties.find(
				(prop): prop is TSESTree.Property =>
					prop.type === AST_NODE_TYPES.Property
					&& prop.key.type === AST_NODE_TYPES.Identifier
					&& prop.key.name === "nodeId",
			);

			if (!nodeIdProp) return;

			const { value } = nodeIdProp;

			// Get the actual parameter names from the function
			const controllerParamName = getParamNameForType(
				containingFunc,
				"MockController",
			);
			const responseParamName = getParamNameForType(
				containingFunc,
				"MockNodeResponse",
			);

			const inTransformResponse = isInTransformResponse(containingFunc);

			// In transformResponse, the correct pattern is <responseParam>.cc.nodeId
			if (inTransformResponse) {
				// Check if the value is <responseParam>.cc.nodeId
				if (
					responseParamName
					&& value.type === AST_NODE_TYPES.MemberExpression
					&& value.object.type === AST_NODE_TYPES.MemberExpression
					&& value.object.object.type === AST_NODE_TYPES.Identifier
					&& value.object.object.name === responseParamName
					&& value.object.property.type === AST_NODE_TYPES.Identifier
					&& value.object.property.name === "cc"
					&& value.property.type === AST_NODE_TYPES.Identifier
					&& value.property.name === "nodeId"
				) {
					// Correct usage in transformResponse
					return;
				}

				// Any other value in transformResponse is incorrect
				const fixValue = responseParamName
					? `${responseParamName}.cc.nodeId`
					: "response.cc.nodeId";

				context.report({
					node: value,
					messageId: "incorrect-node-id-transform",
					data: {
						correctValue: fixValue,
					},
					fix(fixer) {
						return fixer.replaceText(value, fixValue);
					},
				});
				return;
			}

			// In other functions (handleCC, etc.), the correct pattern is <controllerParam>.ownNodeId
			if (
				controllerParamName
				&& value.type === AST_NODE_TYPES.MemberExpression
				&& value.object.type === AST_NODE_TYPES.Identifier
				&& value.object.name === controllerParamName
				&& value.property.type === AST_NODE_TYPES.Identifier
				&& value.property.name === "ownNodeId"
			) {
				// Correct usage
				return;
			}

			// Any other value is incorrect
			const fixValue = controllerParamName
				? `${controllerParamName}.ownNodeId`
				: "controller.ownNodeId";

			context.report({
				node: value,
				messageId: "incorrect-node-id",
				data: {
					correctValue: fixValue,
				},
				fix(fixer) {
					return fixer.replaceText(value, fixValue);
				},
			});
		}

		// Track which functions we should check
		const functionsToCheck = new Set<
			TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression
		>();

		return {
			FunctionExpression(node) {
				if (shouldCheckFunction(node, node.parent)) {
					functionsToCheck.add(node);
				}
			},
			ArrowFunctionExpression(node) {
				if (shouldCheckFunction(node, node.parent)) {
					functionsToCheck.add(node);
				}
			},
			NewExpression(node) {
				// Check if we're inside a function we should check
				let parent: TSESTree.Node | undefined = node.parent;
				let containingFunction:
					| TSESTree.FunctionExpression
					| TSESTree.ArrowFunctionExpression
					| undefined;

				while (parent) {
					if (
						(parent.type === AST_NODE_TYPES.FunctionExpression
							|| parent.type
								=== AST_NODE_TYPES.ArrowFunctionExpression)
						&& functionsToCheck.has(parent)
					) {
						containingFunction = parent;
						break;
					}
					parent = parent.parent;
				}

				if (!containingFunction) return;

				// Check if this is a CC constructor
				if (isCCConstructor(node)) {
					checkConstructorNodeId(node, containingFunction);
				}
			},
		};
	},
	meta: {
		docs: {
			description:
				"Ensures that CC constructors in MockNodeBehavior functions use the correct nodeId value.",
		},
		type: "problem",
		schema: [],
		fixable: "code",
		messages: {
			"incorrect-node-id":
				"Use `{{correctValue}}` as the target node ID in MockNodeBehavior.handleCC methods.",
			"incorrect-node-id-transform":
				"Use `{{correctValue}}` as the target node ID in MockNodeBehavior.transformResponse methods.",
		},
	},
	defaultOptions: [],
});
