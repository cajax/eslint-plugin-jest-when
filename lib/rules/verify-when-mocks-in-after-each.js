module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Ensure afterEach includes verifyAllWhenMocksCalled when jest-when is used',
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
            addVerifyWhenMocks: "Add 'verifyAllWhenMocksCalled()' to afterEach when using jest-when",
            addImport: "Add missing import for 'verifyAllWhenMocksCalled' from jest-when"
        },
    },
    create(context) {
        const options = context.options[0] || {};
        const shouldFix = options.fix !== false;

        let usesJestWhen = false;
        let hasAfterEachWithVerify = false;
        let afterEachNode = null;
        let needsVerifyImport = false;

        // Check if verifyAllWhenMocksCalled is already imported
        function hasVerifyAllWhenMocksCalledImport() {
            const sourceCode = context.getSourceCode();
            const ast = sourceCode.ast;

            for (const node of ast.body) {
                if (node.type === 'ImportDeclaration' && node.source.value === 'jest-when') {
                    for (const specifier of node.specifiers) {
                        if ((specifier.type === 'ImportSpecifier' &&
                                specifier.imported.name === 'verifyAllWhenMocksCalled') ||
                            specifier.type === 'ImportNamespaceSpecifier') {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        // Add import for verifyAllWhenMocksCalled
        function addVerifyImport(fixer) {
            const sourceCode = context.getSourceCode();
            const ast = sourceCode.ast;

            // Check if jest-when is already imported
            for (const node of ast.body) {
                if (node.type === 'ImportDeclaration' && node.source.value === 'jest-when') {
                    // Add to existing import
                    return fixer.insertTextAfter(
                        node.specifiers[node.specifiers.length - 1],
                        ', verifyAllWhenMocksCalled'
                    );
                }
            }

            // Add new import
            return fixer.insertTextBefore(
                ast.body[0],
                "import { verifyAllWhenMocksCalled } from 'jest-when';\n"
            );
        }

        return {
            Program() {
                needsVerifyImport = !hasVerifyAllWhenMocksCalledImport();
            },

            ImportDeclaration(node) {
                if (node.source.value === 'jest-when') {
                    usesJestWhen = true;
                }
            },

            CallExpression(node) {
                if (node.callee.name === 'require' &&
                    node.arguments.length > 0 &&
                    node.arguments[0].value === 'jest-when') {
                    usesJestWhen = true;
                }

                if (node.callee.name === 'when') {
                    usesJestWhen = true;
                }

                if (node.callee.name === 'afterEach') {
                    afterEachNode = node;

                    if (node.arguments.length > 0 && node.arguments[0].type === 'ArrowFunctionExpression') {
                        const afterEachBody = node.arguments[0].body;

                        if (afterEachBody.type === 'BlockStatement') {
                            for (const statement of afterEachBody.body) {
                                if (statement.type === 'ExpressionStatement' &&
                                    statement.expression.type === 'CallExpression' &&
                                    statement.expression.callee.name === 'verifyAllWhenMocksCalled') {
                                    hasAfterEachWithVerify = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            },

            'Program:exit'() {
                if (usesJestWhen && !hasAfterEachWithVerify) {
                    if (needsVerifyImport) {
                        context.report({
                            node: context.getScope().block,
                            messageId: 'addImport',
                            fix: addVerifyImport
                        });
                    }

                    context.report({
                        node: afterEachNode || context.getScope().block,
                        messageId: 'addVerifyWhenMocks',
                        fix: shouldFix ? function(fixer) {
                            if (afterEachNode) {
                                const afterEachBody = afterEachNode.arguments[0].body;

                                if (afterEachBody.type === 'BlockStatement') {
                                    return fixer.insertTextAfter(
                                        afterEachBody.body[afterEachBody.body.length - 1] || afterEachBody,
                                        '\n  verifyAllWhenMocksCalled();'
                                    );
                                }
                            } else {
                                return fixer.insertTextAfter(
                                    context.getScope().block.body[context.getScope().block.body.length - 1],
                                    '\n\nafterEach(() => {\n  verifyAllWhenMocksCalled();\n});'
                                );
                            }
                        }:null,
                    });
                }
            }
        };
    },
};