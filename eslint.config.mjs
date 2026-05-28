import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Node build script — generates contactsData.ts, not part of the app bundle.
    "scripts/**",
  ]),
  {
    // Quiet stale directives so the lint stays green as rules evolve.
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      // The experimental React-compiler-style rules flag valid, intentional
      // patterns we rely on: synchronous localStorage hydration inside effects,
      // and Date.now() for relative-time display. Disable just those two.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
