import baseConfig from '../eslint.config.mjs';
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import eslintPluginPrettier from "eslint-plugin-prettier";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  ...baseConfig,
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      prettier: eslintPluginPrettier,
      "@typescript-eslint": ts
    },
    rules: {
      ...js.configs.recommended.rules,
      ...ts.configs.recommended.rules,
      ...prettier.rules,
      "prettier/prettier": "error",
      "@typescript-eslint/no-explicit-any": "off",
    },
  }
];