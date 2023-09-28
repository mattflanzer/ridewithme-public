module.exports = {
  moduleFileExtensions: [ 'js', 'json', 'vue' ],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.vue$': '@vue/vue3-jest',
    ".+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2|svg)$": "jest-transform-stub"
  },
  testMatch: [ '**/?(*.)+(spec|test).(js|ts)?(x)' ],
  transformIgnorePatterns: [ 'node_modules/(?!(lodash-es)/)' ],
  collectCoverageFrom: [ ],
  coveragePathIgnorePatterns: [ 'jest.config.js', 'coverage/*' ],
  coverageDirectory: './coverage',
  setupFiles: [ '<rootDir>/jest.setup.js' ],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: [ "node", "node-addons" ],
 },
 testPathIgnorePatterns: [ 'dist', 'dist_electron', 'node_modules', 'scripts' ],
 globals: {
  CSS: {
    supports: () => false
  }
 }
};
