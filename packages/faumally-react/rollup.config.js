import {terser} from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import {nodeResolve} from '@rollup/plugin-node-resolve';

const external = ['xstate', 'react'];

export default [
  {
    external,
    input: 'src/index.ts',
    output: {
      dir: 'es',
      format: 'esm',
    },
    plugins: [
      nodeResolve (),
      typescript (),
      terser ()
    ],
  },
  {
    external,
    input: 'src/index.ts',
    output: {
      format: 'iife',
      name: 'FaumallyReact',
      file: 'dist/faumally-react.js',
      globals: {
        xstate: 'XState',
        react: 'React',
      },
    },
    plugins: [
      nodeResolve (),
      typescript ({
        tsconfigOverride: {
          declarations: false,
        },
      }),
      terser (),
    ],
  },
];
