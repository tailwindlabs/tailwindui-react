module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest/custom-matchers.ts'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsConfig: './tsconfig.tsdx.json',
    },
  },
}
