import { defineConfig, UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";
import eslint from "vite-plugin-eslint";
import { Options as EsLintOptions } from "vite-plugin-eslint";

const eslintBaseConfig: EsLintOptions["baseConfig"] = {
  ignorePatterns: ["src/api/autogen/"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
  },
  extends: ["react-app", "react-app/jest"],
};

export default ({ mode }) => {
  const isDebug = mode === "debug";

  return {
    publicDir: "public",
    build: isDebug ? { sourcemap: true, minify: false } : {}, // FIXME: remove this when finished debugging
    plugins: [
      react(),
      checker({
        typescript: true,
      }),
      eslint({ baseConfig: eslintBaseConfig }),
    ],
    // Ensure Vite resolves a single copy of React to avoid duplicate-React issues
    // that break Context between libraries (common cause of "render2 is not a function").
    resolve: {
      dedupe: ["react", "react-dom"],
    },
  };
};
