import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'
import { dts } from 'rollup-plugin-dts'

export default defineConfig([
  {
    input: './src/index.ts',
    output: {
      file: './lib/index.js',
      format: 'esm',
      sourcemap: true,
    },
    treeshake: 'smallest',
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
      terser(),
    ],
  },
  {
    input: './src/index.ts',
    output: [{ file: './lib/index.d.ts' }],
    plugins: [
      dts({
        tsconfig: './tsconfig.json',
        compilerOptions: {
          declaration: true,
          declarationDir: './lib',
          emitDeclarationOnly: true,
        },
      }),
    ],
  },
])
