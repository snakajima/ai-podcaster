import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    files: ["{src,test,samles}/**/*.{js,ts,yaml,yml}"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.es2021,
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      indent: ["error", 2],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^__",
          varsIgnorePattern: "^__",
          caughtErrorsIgnorePattern: "^__",
        },
      ],
      "linebreak-style": ["error", "unix"],
      quotes: "off",
      semi: ["error", "always"],
    },
  },
  eslintConfigPrettier,
];
