import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const external = ["xstate"];

const createTsPlugin = ({ declaration = true } = {}) => {
  return typescript({
    tsconfigOverride: {
      compilerOptions: { declaration },
    },
  });
};

export default [
  {
    external,
    input: "src/index.ts",
    output: {
      dir: "es",
      format: "esm",
    },
    plugins: [nodeResolve(), createTsPlugin(), terser()],
  },
  {
    external,
    input: "src/index.ts",
    output: {
      format: "iife",
      name: "Faumally",
      file: "dist/faumally.js",
      globals: {
        xstate: "XState",
      },
    },
    plugins: [nodeResolve(), createTsPlugin({ declaration: false }), terser()],
  },
];
