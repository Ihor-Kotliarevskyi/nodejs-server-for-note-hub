import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/server.js', 'src/db/', 'src/constants/', 'src/validations/', 'src/routes/', 'src/models/', 'src/templates/'],
    },
    // We can clear mocks before each test
    clearMocks: true,
  },
});
