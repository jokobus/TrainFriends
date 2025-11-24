import eslintJs from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintReact from "@eslint-react/eslint-plugin";
import { defineConfig } from "eslint/config";

export default defineConfig({
    extends: [
        eslintJs.configs.recommended,
        tseslint.configs.recommended,
        eslintReact.configs["recommended-typescript"],
    ],
    ignores: ["src/api/autogen/"],
    files: ["**/*.{js,ts,jsx,tsx}"],
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        globals: {
            ...globals.browser,
            ...globals.node,
        },
    },
    rules: {
        "no-empty": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-expressions": "warn",
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
});
