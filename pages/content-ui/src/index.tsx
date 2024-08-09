import {
	type Commit,
	type DiffEntry,
	type FilePreview,
	MESSAGE_ID,
	type Pull,
} from "@bpmn-dmn-diff-viewer-extension/shared";
import bpmnCSS from "@src/components/bpmn/diff.css?inline";
import dmnCSS from "@src/components/dmn/dmn.css?inline";
import gitHubInjection from "github-injection";
import { createElement } from "react";
import { NotLoggedInPage } from "./components/NotLoggedIn";
import { BPMNFilePreviewPage } from "./components/bpmn/bpmn-file-preview";
import { Diff } from "./components/diff";
import { DMNFilePreviewPage } from "./components/dmn/dmn-file-preview";
import { ErrorPage } from "./components/error-page";
import {
	createReactRoot,
	getGithubColorMode,
	getGithubCommitUrlParams,
	getGithubCommitWithinPullUrlParams,
	getGithubEditPreviewUrlParams,
	getGithubFilePreviewUrlParams,
	getGithubPullUrlParams,
	getSupportedWebDiffElements,
	mapInjectableDiffElements,
} from "./web";
import { BPMNEditFilePage } from "./components/bpmn/bpmn-edit-file";

const root = createReactRoot(document);

async function injectDiff({
	owner,
	repo,
	sha,
	parentSha,
	files,
	document,
}: {
	owner: string;
	repo: string;
	sha: string;
	parentSha: string;
	files: DiffEntry[];
	document: Document;
}) {
	const map = mapInjectableDiffElements(document, files);
	const colorMode = getGithubColorMode(document);
	const bpmnDiffPage = createElement(Diff, {
		owner,
		repo,
		sha,
		parentSha,
		map,
		colorMode,
	});

	const body = document.body;
	const style = document.createElement("style");
	style.type = "text/css";
	style.innerHTML = `${bpmnCSS} ${dmnCSS}`;
	body.insertBefore(style, body.firstChild);

	root.render(bpmnDiffPage);
}

async function injectNotLoggedInPage(document: Document) {
	const elements = getSupportedWebDiffElements(document);
	const colorMode = getGithubColorMode(document);
	const notLoggedInPage = createElement(NotLoggedInPage, {
		colorMode,
		elements,
	});
	root.render(notLoggedInPage);
}

async function injectErrorPage({
	document,
	message,
	docs,
}: {
	document: Document;
	message: string;
	docs?: string;
}) {
	const elements = getSupportedWebDiffElements(document);
	const colorMode = getGithubColorMode(document);
	const errorPage = createElement(ErrorPage, {
		colorMode,
		elements,
		message,
		docs,
	});
	root.render(errorPage);
}

async function injectFilePreview({
	document,
	content,
	path,
}: {
	document: Document;
	content: string;
	path: string;
}) {
	const colorMode = getGithubColorMode(document);
	const isBpmn = path.endsWith(".bpmn");
	const component = isBpmn ? BPMNFilePreviewPage : DMNFilePreviewPage;
	const filePreviewPage = createElement(component, {
		colorMode,
		content,
		document,
	});

	// We only want to load the DMN CSS if it's a DMN file
	if (!isBpmn) {
		const body = document.body;
		const style = document.createElement("style");
		style.type = "text/css";
		style.innerHTML = dmnCSS;
		body.insertBefore(style, body.firstChild);
	}

	root.render(filePreviewPage);
}

async function injectEditFilePreview({
	document,
	content,
	path,
}: {
	document: Document;
	content: string;
	path: string;
}) {
	const colorMode = getGithubColorMode(document);
	const isBpmn = path.endsWith(".bpmn");
	const fileEditPage = createElement(BPMNEditFilePage, {
		colorMode,
		content,
		document,
	});

	// We only want to load the DMN CSS if it's a DMN file
	if (!isBpmn) {
		const body = document.body;
		const style = document.createElement("style");
		style.type = "text/css";
		style.innerHTML = dmnCSS;
		body.insertBefore(style, body.firstChild);
	}

	root.render(fileEditPage);
}

async function getPullDiff(
	owner: string,
	repo: string,
	pull: number,
	document: Document,
) {
	const filesResponse = await chrome.runtime.sendMessage({
		id: MESSAGE_ID.GET_GITHUB_PULL_FILES,
		data: { owner, repo, pull },
	});

	if ("error" in filesResponse) {
		console.error(filesResponse);
		await injectErrorPage({
			document: window.document,
			message: filesResponse?.error?.response?.data?.message,
			docs: filesResponse?.error?.response?.data?.documentation_url,
		});
		return;
	}
	const files = filesResponse as DiffEntry[];
	const pullDataResponse = await chrome.runtime.sendMessage({
		id: MESSAGE_ID.GET_GITHUB_PULL,
		data: { owner, repo, pull },
	});
	if ("error" in pullDataResponse) {
		await injectErrorPage({
			document: window.document,
			message: pullDataResponse?.error?.response?.data?.message,
			docs: pullDataResponse?.error?.response?.data?.documentation_url,
		});
		return;
	}
	const pullData = pullDataResponse as Pull;
	const sha = pullData.head.sha;
	const parentSha = pullData.base.sha;
	await injectDiff({ owner, repo, sha, parentSha, files, document });
}

async function getCommitDiff(
	owner: string,
	repo: string,
	sha: string,
	document: Document,
) {
	const response = await chrome.runtime.sendMessage({
		id: MESSAGE_ID.GET_GITHUB_COMMIT,
		data: { owner, repo, sha },
	});
	if ("error" in response) {
		await injectErrorPage({
			document: window.document,
			message: response?.error?.response?.data?.message,
			docs: response?.error?.response?.data?.documentation_url,
		});
		return;
	}
	const commit = response as Commit;
	if (!commit.files) throw Error("Found no file changes in commit");
	if (!commit.parents.length) throw Error("Found no commit parent");
	const parentSha = commit.parents[0].sha;
	await injectDiff({
		owner,
		repo,
		sha,
		parentSha,
		files: commit.files,
		document,
	});
}

async function getFilePreview({
	owner,
	repo,
	path,
	ref,
	document,
	isEdit = false,
}: {
	owner: string;
	repo: string;
	path: string;
	ref: string;
	document: Document;
	isEdit?: boolean;
}) {
	const response = await chrome.runtime.sendMessage({
		id: MESSAGE_ID.GET_GITHUB_FILE_PREVIEW,
		data: { owner, repo, path, ref },
	});
	if ("error" in response) {
		await injectErrorPage({
			document: window.document,
			message: response?.error?.response?.data?.message,
			docs: response?.error?.response?.data?.documentation_url,
		});
		return;
	}
	const { content } = response as FilePreview;
	if (!content) throw Error("Found no file content");
	if (isEdit) await injectEditFilePreview({ content, document, path });
	await injectFilePreview({ content, document, path });
}

async function run() {
	const url = window.location.href;
	const pullParams = getGithubPullUrlParams(url);

	const response = await chrome.runtime.sendMessage({
		id: MESSAGE_ID.GET_GITHUB_USER,
	});

	if (response && "error" in response) {
		await injectNotLoggedInPage(window.document);
		return;
	}

	if (pullParams) {
		const { owner, repo, pull } = pullParams;
		console.log("Found PR diff: ", owner, repo, pull);
		await getPullDiff(owner, repo, pull, window.document);
		return;
	}

	const previewParams = getGithubFilePreviewUrlParams(url);
	if (previewParams) {
		const { owner, repo, path, ref } = previewParams;
		if (!path.endsWith(".bpmn") && !path.endsWith(".dmn")) return;
		console.log("Found edit file: ", owner, repo, path);
		await getFilePreview({ owner, repo, path, ref, document: window.document });
		return;
	}

	const editPreviewParams = getGithubEditPreviewUrlParams(url);
	if (editPreviewParams) {
		const { owner, repo, path, ref } = editPreviewParams;
		if (!path.endsWith(".bpmn") && !path.endsWith(".dmn")) return;
		console.log("Found file edit preview diff: ", owner, repo, path);
		await getFilePreview({
			owner,
			repo,
			path,
			ref,
			document: window.document,
			isEdit: true,
		});
		return;
	}

	const commitParams = getGithubCommitUrlParams(url);
	if (commitParams) {
		const { owner, repo, sha } = commitParams;
		console.log("Found commit diff: ", owner, repo, sha);
		await getCommitDiff(owner, repo, sha, window.document);
		return;
	}

	const commitWithinPullParams = getGithubCommitWithinPullUrlParams(url);
	if (commitWithinPullParams) {
		const { owner, repo, pull, sha } = commitWithinPullParams;
		console.log("Found commit diff within pull: ", owner, repo, pull, sha);
		await getCommitDiff(owner, repo, sha, window.document);
		return;
	}
}

function waitForLateDiffNodes(callback: () => void) {
	// Containers holding diff nodes, in which new nodes might be added
	// Inspired from https://github.com/OctoLinker/OctoLinker/blob/55e1efdad91453846b83db1192a157694ee3438c/packages/core/app.js#L57-L109
	const elements = [
		...Array.from(document.getElementsByClassName("js-diff-load-container")),
		...Array.from(
			document.getElementsByClassName("js-diff-progressive-container"),
		),
	];
	const observer = new MutationObserver((records) => {
		records.forEach((record) => {
			if (record.addedNodes.length > 0) {
				console.log("Re-running, as new nodes were added");
				callback();
			}
		});
	});
	elements.forEach((element) => {
		observer.observe(element, {
			childList: true,
		});
	});
}

gitHubInjection(() => {
	run();
	waitForLateDiffNodes(() => run());
});
