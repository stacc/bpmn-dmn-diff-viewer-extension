import {
  getGithubPullUrlParams,
  mapInjectableDiffElements,
  getGithubCommitUrlParams,
  createReactRoot,
  getGithubCommitWithinPullUrlParams,
  getGithubColorMode,
  getSupportedWebDiffElements,
  getGithubFilePreviewUrlParams,
} from './web';
import gitHubInjection from 'github-injection';
import { createElement } from 'react';
import { BpmnDiff } from './components/bpmn/bpmn-diff';
import { Commit, DiffEntry, FilePreview, MESSAGE_ID, Pull } from '@bpmn-dmn-diff-viewer-extension/shared';
import { NotLoggedInPage } from './components/NotLoggedIn';
import { BPMNFilePreviewPage } from './components/bpmn/bpmn-file-preview';

const root = createReactRoot(document);

async function injectDiff(
  owner: string,
  repo: string,
  sha: string,
  parentSha: string,
  files: DiffEntry[],
  document: Document,
) {
  const map = mapInjectableDiffElements(document, files);
  const colorMode = getGithubColorMode(document);
  const bpmnDiffPage = createElement(BpmnDiff, {
    owner,
    repo,
    sha,
    parentSha,
    map,
    colorMode,
  });

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

async function injectFilePreview({ document, content }: { document: Document; content: string }) {
  const colorMode = getGithubColorMode(document);
  const filePreviewPage = createElement(BPMNFilePreviewPage, {
    colorMode,
    content,
    document,
  });
  root.render(filePreviewPage);
}

async function getPullDiff(owner: string, repo: string, pull: number, document: Document) {
  const filesResponse = await chrome.runtime.sendMessage({
    id: MESSAGE_ID.GET_GITHUB_PULL_FILES,
    data: { owner, repo, pull },
  });
  if ('error' in filesResponse) throw filesResponse.error;
  const files = filesResponse as DiffEntry[];
  const pullDataResponse = await chrome.runtime.sendMessage({
    id: MESSAGE_ID.GET_GITHUB_PULL,
    data: { owner, repo, pull },
  });
  if ('error' in pullDataResponse) throw pullDataResponse.error;
  const pullData = pullDataResponse as Pull;
  const sha = pullData.head.sha;
  const parentSha = pullData.base.sha;
  await injectDiff(owner, repo, sha, parentSha, files, document);
}

async function getCommitDiff(owner: string, repo: string, sha: string, document: Document) {
  const response = await chrome.runtime.sendMessage({
    id: MESSAGE_ID.GET_GITHUB_COMMIT,
    data: { owner, repo, sha },
  });
  if ('error' in response) throw response.error;
  const commit = response as Commit;
  if (!commit.files) throw Error('Found no file changes in commit');
  if (!commit.parents.length) throw Error('Found no commit parent');
  const parentSha = commit.parents[0].sha;
  await injectDiff(owner, repo, sha, parentSha, commit.files, document);
}

async function getFilePreview(owner: string, repo: string, path: string, ref: string, document: Document) {
  const response = await chrome.runtime.sendMessage({
    id: MESSAGE_ID.GET_GITHUB_FILE_PREVIEW,
    data: { owner, repo, path, ref },
  });
  if ('error' in response) throw response.error;
  const { content } = response as FilePreview;
  if (!content) throw Error('Found no file content');
  await injectFilePreview({ content, document });
}

async function run() {
  const url = window.location.href;
  const pullParams = getGithubPullUrlParams(url);

  const response = await chrome.runtime.sendMessage({
    id: MESSAGE_ID.GET_GITHUB_USER,
  });

  if (response && 'error' in response) {
    await injectNotLoggedInPage(window.document);
    return;
  }

  if (pullParams) {
    const { owner, repo, pull } = pullParams;
    console.log('Found PR diff: ', owner, repo, pull);
    await getPullDiff(owner, repo, pull, window.document);
    return;
  }

  const previewParams = getGithubFilePreviewUrlParams(url);
  if (previewParams) {
    const { owner, repo, path, ref } = previewParams;
    if (!path.endsWith('.bpmn') && !path.endsWith('.dmn')) return;
    console.log('Found file preview diff: ', owner, repo, path);
    await getFilePreview(owner, repo, path, ref, window.document);
    return;
  }

  const commitParams = getGithubCommitUrlParams(url);
  if (commitParams) {
    const { owner, repo, sha } = commitParams;
    console.log('Found commit diff: ', owner, repo, sha);
    await getCommitDiff(owner, repo, sha, window.document);
    return;
  }

  const commitWithinPullParams = getGithubCommitWithinPullUrlParams(url);
  if (commitWithinPullParams) {
    const { owner, repo, pull, sha } = commitWithinPullParams;
    console.log('Found commit diff within pull: ', owner, repo, pull, sha);
    // TODO: understand if more things are needed here for this special case
    await getCommitDiff(owner, repo, sha, window.document);
    return;
  }
}

function waitForLateDiffNodes(callback: () => void) {
  // Containers holding diff nodes, in which new nodes might be added
  // Inspired from https://github.com/OctoLinker/OctoLinker/blob/55e1efdad91453846b83db1192a157694ee3438c/packages/core/app.js#L57-L109
  const elements = [
    ...Array.from(document.getElementsByClassName('js-diff-load-container')),
    ...Array.from(document.getElementsByClassName('js-diff-progressive-container')),
  ];
  const observer = new MutationObserver(records => {
    records.forEach(record => {
      if (record.addedNodes.length > 0) {
        console.log('Re-running, as new nodes were added');
        callback();
      }
    });
  });
  elements.forEach(element => {
    observer.observe(element, {
      childList: true,
    });
  });
}

gitHubInjection(() => {
  run();
  waitForLateDiffNodes(() => run());
});
