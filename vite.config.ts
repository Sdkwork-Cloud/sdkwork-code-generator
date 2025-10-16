import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'sdkwork-code-generator',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['ajv', 'openapi-types', 'yaml'],
      output: {
        globals: {
          'ajv': 'Ajv',
          'openapi-types': 'OpenAPITypes',
          'yaml': 'YAML'
        }
      }
    }
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src/**/*']
    })
  ],
  test: {
    globals: true,
    environment: 'node'
  }
})