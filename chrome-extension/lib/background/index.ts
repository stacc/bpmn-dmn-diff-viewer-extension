import {
	MESSAGE_ID,
	type Message,
	type MessageGetFileDiff,
	type MessageGetGithubCommitData,
	type MessageGetGithubFilePreviewData,
	type MessageGetGithubPullFilesData,
	type MessageResponse,
	type MessageSaveToken,
} from "@bpmn-dmn-diff-viewer-extension/shared";
import {
	getStorageGithubToken,
	setStorageGithubToken,
} from "@bpmn-dmn-diff-viewer-extension/storage";
import { Octokit } from "@octokit/rest";
import { getContentString, getFileDiff } from "./diff";

let github: Octokit | undefined;

async function initGithubApi() {
	try {
		github = new Octokit({ auth: await getStorageGithubToken() });
		const octokitResponse = await github.rest.users.getAuthenticated();
		console.log(`Logged in on github.com as ${octokitResponse.data.login}`);
	} catch (e) {
		console.log("Couldnt initiate the github api client");
		github = undefined;
	}
}

async function saveGithubTokenAndReload(token: string): Promise<void> {
	github = undefined;
	await setStorageGithubToken(token);
	await initGithubApi();
}

(async () => {
	// Delay to allow for external storage sets before auth, like in e2e
	await new Promise((resolve) => setTimeout(resolve, 1000));
	await initGithubApi();
})();

const noClientError = new Error("API client is undefined");

chrome.runtime.onMessage.addListener(
	(
		message: Message,
		sender: chrome.runtime.MessageSender,
		sendResponse: (response: MessageResponse) => void,
	) => {
		console.log(`Received ${message.id} from ${sender.id}`);
		if (message.id === MESSAGE_ID.GET_GITHUB_PULL_FILES) {
			if (!github) {
				sendResponse({ error: noClientError });
				return false;
			}
			const { owner, repo, pull } =
				message.data as MessageGetGithubPullFilesData;
			github.rest.pulls
				.listFiles({ owner, repo, pull_number: pull, per_page: 300 })
				.then((r) => sendResponse(r.data))
				.catch((error) => sendResponse({ error }));
			return true;
		}
		if (message.id === MESSAGE_ID.GET_GITHUB_FILE_PREVIEW) {
			if (!github) {
				sendResponse({ error: noClientError });
				return false;
			}
			const { owner, repo, path, ref } =
				message.data as MessageGetGithubFilePreviewData;
			getContentString({ github, owner, repo, ref, path })
				.then((content) => sendResponse({ content }))
				.catch((error) => sendResponse({ error }));
			return true;
		}

		if (message.id === MESSAGE_ID.GET_GITHUB_PULL) {
			if (!github) {
				sendResponse({ error: noClientError });
				return false;
			}
			const { owner, repo, pull } =
				message.data as MessageGetGithubPullFilesData;
			github.rest.pulls
				.get({ owner, repo, pull_number: pull, per_page: 300 })
				.then((r) => sendResponse(r.data))
				.catch((error) => sendResponse({ error }));
			return true;
		}

		if (message.id === MESSAGE_ID.GET_GITHUB_PULL_COMMENTS) {
			console.info("get pull comments");
			if (!github) {
				sendResponse({ error: noClientError });
				return false;
			}
			const { owner, repo, pull } =
				message.data as MessageGetGithubPullFilesData;
			github.rest.pulls
				.listReviewComments({
					owner,
					repo,
					pull_number: pull,
					per_page: 300,
				})
				.then((r) => sendResponse(r.data))
				.catch((error) => sendResponse({ error }));
			return true;
		}

		if (message.id === MESSAGE_ID.GET_GITHUB_COMMIT) {
			if (!github) {
				sendResponse({ error: noClientError });
				return false;
			}
			const { owner, repo, sha } = message.data as MessageGetGithubCommitData;
			github.rest.repos
				.getCommit({ owner, repo, ref: sha, per_page: 300 })
				.then((r) => sendResponse(r.data))
				.catch((error) => sendResponse({ error }));
			return true;
		}

		if (message.id === MESSAGE_ID.GET_GITHUB_USER) {
			if (!github) {
				sendResponse({ error: noClientError });
				return false;
			}
			github.rest.users
				.getAuthenticated()
				.then((r) => sendResponse(r.data))
				.catch((error) => sendResponse({ error }));
			return true;
		}

		if (message.id === MESSAGE_ID.SAVE_GITHUB_TOKEN) {
			const { token } = message.data as MessageSaveToken;
			saveGithubTokenAndReload(token)
				.then(() => sendResponse({ token }))
				.catch((error) => sendResponse({ error }));
			return true;
		}

		if (message.id === MESSAGE_ID.GET_FILE_DIFF) {
			if (!github) {
				sendResponse({ error: noClientError });
				return false;
			}
			const { owner, repo, sha, parentSha, file } =
				message.data as MessageGetFileDiff;
			getFileDiff(github, owner, repo, sha, parentSha, file)
				.then((r) => sendResponse(r))
				.catch((error) => sendResponse({ error }));
			return true;
		}

		if (message.id === MESSAGE_ID.OPEN_OPTIONS_PAGE) {
			chrome.runtime.openOptionsPage();
			return true;
		}

		return;
	},
);

chrome.runtime.onInstalled.addListener((object) => {
	const internalUrl = chrome.runtime.getURL("onboarding.html");
	if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
		chrome.tabs.create({ url: internalUrl });
	}
});
