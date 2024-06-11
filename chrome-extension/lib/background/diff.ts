import { Octokit } from '@octokit/rest';
import { ContentFile, DiffEntry, FileDiff } from '@bpmn-dmn-diff-viewer-extension/shared';

export const extensionToSrcFormat: {
  [extension: string]: string;
} = {
  bpmn: 'bpmn',
};

export function isFilenameSupported(filename: string): boolean {
  const extension = filename.split('.').pop();
  return !!(extension && extensionToSrcFormat[extension]);
}

export async function getContentString(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
  path: string,
): Promise<string> {
  // First get some info on the blob with the Contents api
  const content = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref,
    request: { cache: 'reload' }, // download_url provides a token that seems very short-lived
  });
  const contentFile = content.data as ContentFile;

  if (!contentFile.content) {
    throw Error(`No Content associated with ${path} at ${ref}`);
  }
  return atob(contentFile.content);
}

export async function getFileDiff(
  github: Octokit,
  owner: string,
  repo: string,
  sha: string,
  parentSha: string,
  file: DiffEntry,
): Promise<FileDiff> {
  const { filename, status } = file;
  const extension = filename.split('.').pop();
  if (!extension || !extensionToSrcFormat[extension]) {
    throw Error(`Unsupported extension. Given ${extension}, was expecting ${Object.keys(extensionToSrcFormat)}`);
  }

  if (status === 'modified') {
    const before = await getContentString(github, owner, repo, parentSha, filename);
    const after = await getContentString(github, owner, repo, sha, filename);
    return { before, after };
  }

  if (status === 'added') {
    const after = await getContentString(github, owner, repo, sha, filename);
    return { after };
  }

  if (status === 'removed') {
    const before = await getContentString(github, owner, repo, parentSha, filename);
    return { before };
  }

  throw Error(`Unsupported status: ${status}`);
}
