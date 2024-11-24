import type { DiffEntry } from "@bpmn-dmn-diff-viewer-extension/shared";
import type { ColorModeWithAuto } from "node_modules/@primer/react/lib-esm/ThemeProvider";
import { type Root, createRoot } from "react-dom/client";
import { extensionToSrcFormat, isFilenameSupported } from "./diff";

export type GithubFilePreviewParams = {
	owner: string;
	repo: string;
	path: string;
	ref: string;
};

export function getGithubFilePreviewUrlParams(
	url: string,
): GithubFilePreviewParams | undefined {
	const regex =
		/https:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/blob\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_/.-]+)/;
	const result = regex.exec(url);
	if (!result) {
		return undefined;
	}
	const [, owner, repo, ref, path] = result;
	console.log("Found a supported Github File Preview URL:", owner, repo, path);
	return { owner, repo, path: `/${path}`, ref };
}

export type GithubPullUrlParams = {
	owner: string;
	repo: string;
	pull: number;
};

export function getGithubPullUrlParams(
	url: string,
): GithubPullUrlParams | undefined {
	const pullRe =
		/https:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/pull\/(\d+)\/files/;
	const result = pullRe.exec(url);
	if (!result) {
		return undefined;
	}

	const [, owner, repo, pull] = result;
	console.log("Found a supported Github Pull Request URL:", owner, repo, pull);
	return { owner, repo, pull: Number.parseInt(pull) };
}

export type GithubCommitUrlParams = {
	owner: string;
	repo: string;
	sha: string;
};

export function getGithubCommitUrlParams(
	url: string,
): GithubCommitUrlParams | undefined {
	const pullRe =
		/https:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/commit\/(\w+)/;
	const result = pullRe.exec(url);
	if (!result) {
		return undefined;
	}

	const [, owner, repo, sha] = result;
	console.log("Found a supported Github Commit URL:", owner, repo, sha);
	return { owner, repo, sha };
}

export type GithubCommitWithinPullUrlParams = {
	owner: string;
	repo: string;
	pull: number;
	sha: string;
};

export function getGithubCommitWithinPullUrlParams(
	url: string,
): GithubCommitWithinPullUrlParams | undefined {
	const pullRe =
		/https:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/pull\/(\d+)\/commits\/(\w+)/;
	const result = pullRe.exec(url);
	if (!result) {
		return undefined;
	}

	const [, owner, repo, pull, sha] = result;
	console.log(
		"Found a supported Github Commit witin Pull URL:",
		owner,
		repo,
		pull,
		sha,
	);
	return { owner, repo, sha, pull: Number.parseInt(pull) };
}

export function getSupportedWebDiffElements(document: Document): HTMLElement[] {
	const fileTypeSelectors = Object.keys(extensionToSrcFormat).map(
		(t) => `.file[data-file-type=".${t}"]`,
	);
	const selector = fileTypeSelectors.join(", ");
	return Array.from(document.querySelectorAll(selector)).map(
		(n) => n as HTMLElement,
	);
}

export function getElementFilename(element: HTMLElement) {
	const titleElement = element.querySelector(
		".file-info a[title]",
	) as HTMLElement;
	return titleElement.getAttribute("title");
}

export function mapInjectableDiffElements(
	document: Document,
	files: DiffEntry[],
) {
	const supportedFiles = files.filter((f) => isFilenameSupported(f.filename));
	console.log(`Found ${supportedFiles.length} supported files with the API`);

	const supportedElements = getSupportedWebDiffElements(document);
	console.log(`Found ${supportedElements.length} elements in the web page`);

	if (supportedElements.length !== supportedFiles.length) {
		throw Error(
			`elements and files have different length. Got ${supportedElements.length} and ${supportedFiles.length}`,
		);
	}

	const injectableElements: { element: HTMLElement; file: DiffEntry }[] = [];
	for (const [index, element] of supportedElements.entries()) {
		const file = supportedFiles[index];
		const filename = getElementFilename(element);
		if (filename !== file.filename) {
			throw Error(
				"Couldn't match API file with a diff element on the page. Aborting.",
			);
		}
		injectableElements.push({ element, file });
	}

	return injectableElements;
}

export function createReactRoot(
	document: Document,
	id = "bpmn-diff-viewer-root",
): Root {
	const root = document.createElement("div");
	root.id = id;
	document.body.appendChild(root);

	return createRoot(root);
}

export function getGithubColorMode(document: Document): ColorModeWithAuto {
	const html = document.querySelector("html");
	const attr = "data-color-mode";
	if (!html || !html.getAttribute(attr)) {
		return "auto";
	}

	return html.getAttribute(attr) as ColorModeWithAuto;
}
