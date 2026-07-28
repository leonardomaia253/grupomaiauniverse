import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "prefer-const": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "output/**",
    "tmp/**",
    "trace/**",
    "docs/**",
    ".agents/**",
    ".github/**",
    ".playwright-cli/**",
    "scripts/**",
    "test_gh.js",
    "supabase-advisors-*.json",
    "supabase-advisors-*.txt",
    "build*.txt",
    "build*.log",
    "tsc*.txt",
    "tsc*_output*.txt",
    "diff*.txt",
    "file_list.txt",
    "tmp-*.sql",
  ]),
]);

export default eslintConfig;
