import {
  getGithubPullUrlParams,
  mapInjectableDiffElements,
  getGithubCommitUrlParams,
  createReactRoot,
  getGithubCommitWithinPullUrlParams,
  getGithubColorMode,
} from './web';
import gitHubInjection from 'github-injection';
import { createElement } from 'react';
import { BpmnDiff } from './components/bpmn/bpmn-diff';
import { Commit, DiffEntry, MESSAGE_ID, Pull } from '@bpmn-dmn-diff-viewer-extension/shared';

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
  const cadDiffPage = createElement(BpmnDiff, {
    owner,
    repo,
    sha,
    parentSha,
    map,
    colorMode,
  });

  root.render(cadDiffPage);
}

async function injectPullDiff(owner: string, repo: string, pull: number, document: Document) {
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

async function injectCommitDiff(owner: string, repo: string, sha: string, document: Document) {
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

async function run() {
  const url = window.location.href;
  const pullParams = getGithubPullUrlParams(url);
  if (pullParams) {
    const { owner, repo, pull } = pullParams;
    console.log('Found PR diff: ', owner, repo, pull);
    await injectPullDiff(owner, repo, pull, window.document);
    return;
  }

  const commitParams = getGithubCommitUrlParams(url);
  if (commitParams) {
    const { owner, repo, sha } = commitParams;
    console.log('Found commit diff: ', owner, repo, sha);
    await injectCommitDiff(owner, repo, sha, window.document);
    return;
  }

  const commitWithinPullParams = getGithubCommitWithinPullUrlParams(url);
  if (commitWithinPullParams) {
    const { owner, repo, pull, sha } = commitWithinPullParams;
    console.log('Found commit diff within pull: ', owner, repo, pull, sha);
    // TODO: understand if more things are needed here for this special case
    await injectCommitDiff(owner, repo, sha, window.document);
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

gitHubInjection();
