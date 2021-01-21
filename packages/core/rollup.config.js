import pkg from './package.json';
import {terser} from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

const external = [...Object.keys (pkg.peerDependencies)];

export default [
  {
    external,
    input: 'src/index.ts',
    output: {
      dir: 'es',
      format: 'esm',
    },
    plugins: [typescript (), terser ()],
  },
  {
    external,
    input: 'src/index.ts',
    output: {
      format: 'iife',
      name: 'Faumally',
      file: 'dist/faumally.js',
    },
    plugins: [
      typescript ({
        tsconfigOverride: {
          declarations: false,
        },
      }),
      terser (),
    ],
  },
];
