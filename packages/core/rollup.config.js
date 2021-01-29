import pkg from "./package.json";
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const external = ["xstate"];

export default [
  {
    external,
    input: "src/index.ts",
    output: {
      dir: "es",
      format: "esm",
    },
    plugins: [nodeResolve(), typescript(), terser()],
  },
  {
    external,
    input: "src/index.ts",
    output: {
      format: "iife",
      name: "Faumally",
      file: "dist/faumally.js",
      globals: {
        xstate: "xstate",
      },
    },
    plugins: [
      nodeResolve(),
      typescript({
        tsconfigOverride: {
          declarations: false,
        },
      }),
      terser(),
    ],
  },
];
