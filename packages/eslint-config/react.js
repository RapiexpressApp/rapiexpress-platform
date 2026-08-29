import baseConfig from "./base.js";

export default [
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx,jsx}"],
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
];
