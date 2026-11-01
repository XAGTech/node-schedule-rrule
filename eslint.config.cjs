module.exports = [
  {
    files: ['lib/**/*.js', 'test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'script'
    },
    rules: {
      eqeqeq: ['error', 'smart'],
      indent: ['error', 2, {SwitchCase: 1}],
      'no-constant-condition': 'off',
      'no-redeclare': 'warn',
      'no-underscore-dangle': 'off',
      'no-use-before-define': ['warn', 'nofunc'],
      quotes: ['error', 'single'],
      'space-before-blocks': 'error',
      strict: ['error', 'global']
    }
  },
  {
    files: ['test/**/*.js'],
    rules: {
      quotes: 'off'
    }
  }
];
