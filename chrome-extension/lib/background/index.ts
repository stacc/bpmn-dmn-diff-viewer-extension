import { Octokit } from '@octokit/rest';
import {
  Message,
  MessageGetGithubCommitData,
  MessageGetGithubPullFilesData,
  MessageIds,
  MessageResponse,
  MessageSaveToken,
} from './interface';
import {} from '@bpmn-diff-viewer-extension/storage';

let github: Octokit | undefined;

async function initGithubApi() {
  try {
    github = new Octokit({ auth: await getStorageGithubToken() });
    const octokitResponse = await github.rest.users.getAuthenticated();
    console.log(`Logged in on github.com as ${octokitResponse.data.login}`);
  } catch (e) {
    console.log('Couldnt initiate the github api client');
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
  await new Promise(resolve => setTimeout(resolve, 1000));
  await initGithubApi();
})();

const noClientError = new Error('API client is undefined');

chrome.runtime.onMessage.addListener(
  (message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) => {
    console.log(`Received ${message.id} from ${sender.id}`);
    if (message.id === MessageIds.GetGithubPullFiles) {
      if (!github) {
        sendResponse({ error: noClientError });
        return false;
      }
      const { owner, repo, pull } = message.data as MessageGetGithubPullFilesData;
      github.rest.pulls
        .listFiles({ owner, repo, pull_number: pull })
        .then(r => sendResponse(r.data))
        .catch(error => sendResponse({ error }));
      return true;
    }

    if (message.id === MessageIds.GetGithubPull) {
      if (!github) {
        sendResponse({ error: noClientError });
        return false;
      }
      const { owner, repo, pull } = message.data as MessageGetGithubPullFilesData;
      github.rest.pulls
        .get({ owner, repo, pull_number: pull })
        .then(r => sendResponse(r.data))
        .catch(error => sendResponse({ error }));
      return true;
    }

    if (message.id === MessageIds.GetGithubCommit) {
      if (!github) {
        sendResponse({ error: noClientError });
        return false;
      }
      const { owner, repo, sha } = message.data as MessageGetGithubCommitData;
      github.rest.repos
        .getCommit({ owner, repo, ref: sha })
        .then(r => sendResponse(r.data))
        .catch(error => sendResponse({ error }));
      return true;
    }

    if (message.id === MessageIds.GetGithubUser) {
      if (!github) {
        sendResponse({ error: noClientError });
        return false;
      }
      github.rest.users
        .getAuthenticated()
        .then(r => sendResponse(r.data))
        .catch(error => sendResponse({ error }));
      return true;
    }

    if (message.id === MessageIds.SaveGithubToken) {
      const { token } = message.data as MessageSaveToken;
      saveGithubTokenAndReload(token)
        .then(() => sendResponse({ token }))
        .catch(error => sendResponse({ error }));
      return true;
    }
  },
);
