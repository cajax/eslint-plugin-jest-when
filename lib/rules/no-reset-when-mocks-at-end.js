module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Discourage using resetAllWhenMocks at the end of test cases',
            category: 'Best Practices',
            recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
            noResetAtEnd: "Don't use 'resetAllWhenMocks()' at the end of test cases. Use 'verifyAllWhenMocksCalled()' in afterEach instead.",
        },
    },
    create(context) {
        return {
            CallExpression(node) {
                if ((node.callee.name === 'it' || node.callee.name === 'test') &&
                    node.arguments.length > 1) {

                    const testFn = node.arguments[1];

                    if ((testFn.type === 'ArrowFunctionExpression' || testFn.type === 'FunctionExpression') &&
                        testFn.body.type === 'BlockStatement') {

                        const bodyStatements = testFn.body.body;

                        // Check if the last or second-to-last statement is resetAllWhenMocks()
                        const lastIndex = bodyStatements.length - 1;
                        const statementsToCheck = [
                            bodyStatements[lastIndex],
                            lastIndex > 0 ? bodyStatements[lastIndex - 1] : null
                        ].filter(Boolean);

                        for (const statement of statementsToCheck) {
                            if (statement.type === 'ExpressionStatement' &&
                                statement.expression.type === 'CallExpression' &&
                                statement.expression.callee.name === 'resetAllWhenMocks') {

                                context.report({
                                    node: statement,
                                    messageId: 'noResetAtEnd',
                                    fix(fixer) {
                                        return fixer.remove(statement);
                                    }
                                });
                            }
                        }
                    }
                }
            }
        };
    },
};