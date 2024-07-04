import { resolve } from "node:path";
import { watchRebuildPlugin } from "@bpmn-dmn-diff-viewer-extension/hmr";
import libAssetsPlugin from "@laynezh/vite-plugin-lib-assets";
import { defineConfig } from "vite";
import makeManifestPlugin from "./utils/plugins/make-manifest-plugin";

const rootDir = resolve(__dirname);
const libDir = resolve(rootDir, "lib");

const isDev = process.env.__DEV__ === "true";
const isProduction = !isDev;

const outDir = resolve(rootDir, "..", "dist");
export default defineConfig({
	resolve: {
		alias: {
			"@root": rootDir,
			"@lib": libDir,
			"@assets": resolve(libDir, "assets"),
		},
	},
	plugins: [
		libAssetsPlugin({
			outputPath: outDir,
		}),
		makeManifestPlugin({ outDir }),
		isDev && watchRebuildPlugin({ reload: true }),
	],
	publicDir: resolve(rootDir, "public"),
	build: {
		lib: {
			formats: ["iife"],
			entry: resolve(__dirname, "lib/background/index.ts"),
			name: "BackgroundScript",
			fileName: "background",
		},
		outDir,
		sourcemap: isDev,
		minify: isProduction,
		reportCompressedSize: isProduction,
		modulePreload: true,
		rollupOptions: {
			external: ["chrome"],
		},
	},
});
