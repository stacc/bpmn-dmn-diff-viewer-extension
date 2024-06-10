const baseConfig = require('@bpmn-diff-viewer-extension/tailwindcss-config');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: ['./src/**/*.{ts,tsx}'],
};
