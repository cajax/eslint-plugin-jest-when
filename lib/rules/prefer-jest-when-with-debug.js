module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Prefer using jest-when library for mocking methods and add debug code when fixing. Disable prefer-jest-when rule to use this',
            category: 'Best Practices',
            recommended: true,
        },
        fixable: 'code',
        schema: [{
            type: 'object',
            properties: {
                fix: {
                    type: 'boolean'
                }
            },
            additionalProperties: false
        }],
        messages: {
            preferJestWhen: "Use jest-when library instead of direct mocking. Replace '{{ methodName }}' with 'when({{ object }}).calledWith(debug code).{{ methodName }}'",
            addImport: "Add missing import for 'when' from jest-when"
        },
    },
    create(context) {
        // Get options, default to fixing enabled
        const options = context.options[0] || {};
        const shouldFix = options.fix !== false;

        const mockMethods = [
            'mockReturnValue',
            'mockReturnValueOnce',
            'mockResolvedValue',
            'mockResolvedValueOnce',
            'mockRejectedValue',
            'mockRejectedValueOnce',
            'mockImplementation',
            'mockImplementationOnce'
        ];

        let whenImportNeeded = false;

        // Check if "when" is already imported
        function hasWhenImport() {
            const sourceCode = context.getSourceCode();
            const ast = sourceCode.ast;

            for (const node of ast.body) {
                if (node.type === 'ImportDeclaration' && node.source.value === 'jest-when') {
                    for (const specifier of node.specifiers) {
                        if ((specifier.type === 'ImportSpecifier' &&
                                specifier.imported.name === 'when') ||
                            specifier.type === 'ImportNamespaceSpecifier') {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        // Add import at the top of the file
        function addWhenImport(fixer) {
            const sourceCode = context.getSourceCode();
            const ast = sourceCode.ast;

            // Check if jest-when is already imported
            for (const node of ast.body) {
                if (node.type === 'ImportDeclaration' && node.source.value === 'jest-when') {
                    // Add "when" to existing import
                    return fixer.insertTextAfter(
                        node.specifiers[node.specifiers.length - 1],
                        ', when'
                    );
                }
            }

            // Add new import at the top
            return fixer.insertTextBefore(
                ast.body[0],
                "import { when } from 'jest-when';\n"
            );
        }

        return {
            Program() {
                whenImportNeeded = !hasWhenImport();
            },

            'MemberExpression[property.name=/mock.*/]'(node) {
                if (mockMethods.includes(node.property.name) &&
                    node.object.type === 'MemberExpression') {

                    const mockedObjName = context.getSourceCode().getText(node.object);

                    if (whenImportNeeded) {
                        context.report({
                            node: node,
                            messageId: 'addImport',
                            fix: shouldFix ? addWhenImport : null
                        });
                    }

                    context.report({
                        node,
                        messageId: 'preferJestWhen',
                        data: {
                            methodName: node.property.name,
                            object: mockedObjName,
                        },
                        fix: shouldFix ? function(fixer) {
                            const methodCall = context.getSourceCode().getText(node.parent);
                            const args = methodCall.substring(methodCall.indexOf('('));
                        
                            return fixer.replaceText(
                                node.parent,
                                `when(${mockedObjName}).calledWith(when.allArgs((args: any) => {
                                  console.log(args); // <-- set breakpoint here to debug sent arguments
                                  return true;
                                })).${node.property.name}${args}`
                            );
                        } : null
                    });
                }
            }
        };
    },
};