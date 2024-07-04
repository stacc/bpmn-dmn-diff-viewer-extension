import type { Manifest, ManifestParserInterface } from "./type";

const ADDON_ID = "{eedf018b-4d9b-4e51-872d-b98e00a07047}";

export const ManifestParserImpl: ManifestParserInterface = {
	convertManifestToString: (manifest, env) => {
		let manifestCopy = manifest;
		if (env === "firefox") {
			manifestCopy = convertToFirefoxCompatibleManifest(manifest);
		}
		return JSON.stringify(manifest, null, 2);
	},
};

function convertToFirefoxCompatibleManifest(manifest: Manifest) {
	const manifestCopy = {
		...manifest,
	} as { [key: string]: unknown };

	manifestCopy.background = {
		scripts: [manifest.background?.service_worker],
		type: "module",
	};
	manifestCopy.options_ui = {
		...manifest.options_ui,
		browser_style: false,
	};
	manifestCopy.content_security_policy = {
		extension_pages: "script-src 'self'; object-src 'self'",
	};
	manifestCopy.browser_specific_settings = {
		gecko: {
			id: ADDON_ID,
		},
	};
	return manifestCopy as Manifest;
}
