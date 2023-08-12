import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'lib/index.js',
    format: 'esm',
  },
  treeshake: 'smallest',
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
    }),
    terser(),
  ],
})
