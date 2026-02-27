/**
 * @flowdesk/config — Shared ESLint configuration
 *
 * Usage in apps:
 *   // .eslintrc.js
 *   module.exports = require('@flowdesk/config/eslint');
 */

/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: ['next/core-web-vitals'],
    rules: {
        // Allow unescaped entities (common in copy text)
        'react/no-unescaped-entities': 'off',
        // Allow custom fonts (we control head via layout.tsx)
        '@next/next/no-page-custom-font': 'off',
        // Warn on any, but don't fail — useful for gradual typing
        '@typescript-eslint/no-explicit-any': 'warn',
        // Allow empty catch blocks with comment
        'no-empty': ['error', { allowEmptyCatch: true }],
        // Enforce consistent imports
        'import/no-duplicates': 'error',
    },
    ignorePatterns: [
        'node_modules/',
        '.next/',
        'dist/',
        '.turbo/',
        '*.config.js',
        '*.config.mjs',
        '*.config.ts',
    ],
};
