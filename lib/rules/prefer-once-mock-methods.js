module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Prefer using *Once variants of mock methods',
            category: 'Best Practices',
            recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
            preferOnceMethods: "Use '{{ onceMethod }}' instead of '{{ method }}' for better test isolation",
        },
    },
    create(context) {
        const methodsMap = {
            'mockReturnValue': 'mockReturnValueOnce',
            'mockResolvedValue': 'mockResolvedValueOnce',
            'mockRejectedValue': 'mockRejectedValueOnce',
            'mockImplementation': 'mockImplementationOnce'
        };

        return {
            CallExpression(node) {
                if (node.callee &&
                    node.callee.type === 'MemberExpression' &&
                    methodsMap[node.callee.property.name]) {

                    let isWhenPattern = false;
                    let currentNode = node.callee.object;

                    if (currentNode.type === 'CallExpression' &&
                        currentNode.callee.type === 'MemberExpression' &&
                        currentNode.callee.property.name === 'calledWith') {

                        isWhenPattern = true;
                    }

                    if (isWhenPattern) {
                        const method = node.callee.property.name;
                        const onceMethod = methodsMap[method];

                        context.report({
                            node: node.callee.property,
                            messageId: 'preferOnceMethods',
                            data: {
                                method,
                                onceMethod,
                            },
                            fix(fixer) {
                                return fixer.replaceText(node.callee.property, onceMethod);
                            }
                        });
                    }
                }
            }
        };
    },
};