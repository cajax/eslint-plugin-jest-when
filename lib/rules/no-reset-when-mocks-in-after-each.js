module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Discourage using resetAllWhenMocks in afterEach',
            category: 'Best Practices',
            recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
            noResetInAfterEach: "Don't use 'resetAllWhenMocks()' in afterEach. Use it only in specific test cases and only at the beginning.",
        },
    },
    create(context) {
        return {
            CallExpression(node) {
                if (node.callee.name === 'afterEach' && node.arguments.length > 0) {
                    const arg = node.arguments[0];

                    if ((arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') &&
                        arg.body.type === 'BlockStatement') {

                        for (const statement of arg.body.body) {
                            if (statement.type === 'ExpressionStatement' &&
                                statement.expression.type === 'CallExpression' &&
                                statement.expression.callee.name === 'resetAllWhenMocks') {

                                context.report({
                                    node: statement,
                                    messageId: 'noResetInAfterEach',
                                });
                            }
                        }
                    }
                }
            }
        };
    },
};