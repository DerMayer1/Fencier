import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  // Bundle workspace packages and commander so the packed tarball
  // installs standalone without published @fencier/* dependencies.
  noExternal: [/^@fencier\//, "commander"],
  // Bundled CJS dependencies (yaml) call require(); provide it in ESM output.
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
});
