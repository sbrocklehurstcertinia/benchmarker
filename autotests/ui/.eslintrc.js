/**
 * @copyright 2025 Certinia Inc. All rights reserved.
 */

module.exports = {
  //extends: ['@ffdev/pse'],
  overrides: [
    {
      files: ['**/*.js'],
      rules: {
        'one-var': ['error', { const: 'consecutive' }],
      },
    },
  ],
};
