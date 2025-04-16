module.exports = {
    rules: {
        'prefer-jest-when': require('./lib/rules/prefer-jest-when'),
        'prefer-once-mock-methods': require('./lib/rules/prefer-once-mock-methods'),
        'verify-when-mocks-in-after-each': require('./lib/rules/verify-when-mocks-in-after-each'),
        'no-reset-when-mocks-in-after-each': require('./lib/rules/no-reset-when-mocks-in-after-each'),
        'no-reset-when-mocks-at-end': require('./lib/rules/no-reset-when-mocks-at-end')
    },
    configs: {
        recommended: {
            plugins: ['jest-when'],
            rules: {
                'jest-when/prefer-jest-when': 'error',
                'jest-when/prefer-once-mock-methods': 'error',
                'jest-when/verify-when-mocks-in-after-each': 'error',
                'jest-when/no-reset-when-mocks-in-after-each': 'error',
                'jest-when/no-reset-when-mocks-at-end': 'error'
            }
        }
    }
};