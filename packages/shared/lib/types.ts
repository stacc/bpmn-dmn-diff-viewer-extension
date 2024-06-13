import { components } from '@octokit/openapi-types';

// octokit

export type DiffEntry = components['schemas']['diff-entry'];
export type ContentFile = components['schemas']['content-file'];
export type User = components['schemas']['simple-user'];
export type Pull = components['schemas']['pull-request'];
export type Commit = components['schemas']['commit'];

export type FileDiff = {
  before?: string | null;
  after?: string | null;
  diff?: Record<string, string> | null;
};

export type FilePreview = {
  content: string;
};

export const MESSAGE_ID = {
  GET_GITHUB_PULL_FILES: 'GetPullFiles',
  GET_GITHUB_COMMIT: 'GetGithubCommit',
  GET_GITHUB_USER: 'GetGithubUser',
  SAVE_GITHUB_TOKEN: 'SaveGithubToken',
  GET_FILE_DIFF: 'GetFileDiff',
  GET_GITHUB_PULL: 'GetGithubPull',
  OPEN_OPTIONS_PAGE: 'OpenOptionsPage',
  GET_GITHUB_FILE_PREVIEW: 'GetGithubFilePreview',
} as const;

export type MessageIds = (typeof MESSAGE_ID)[keyof typeof MESSAGE_ID];

export type MessageGetGithubPullFilesData = {
  owner: string;
  repo: string;
  pull: number;
};

export type MessageGetGithubFilePreviewData = {
  owner: string;
  repo: string;
  path: string;
  ref: string;
};

export type MessageGetGithubCommitData = {
  owner: string;
  repo: string;
  sha: string;
};

export type MessageGetFileDiff = {
  owner: string;
  repo: string;
  sha: string;
  parentSha: string;
  file: DiffEntry;
};

export type MessageSaveToken = {
  token: string;
};

export type MessageError = {
  error: Error;
};

export type Message = {
  id: MessageIds;
  data?:
    | MessageGetGithubPullFilesData
    | MessageGetGithubCommitData
    | MessageSaveToken
    | MessageGetFileDiff
    | MessageGetGithubFilePreviewData;
};

export type MessageResponse =
  | DiffEntry[]
  | Pull
  | Commit
  | User
  | MessageSaveToken
  | FileDiff
  | FilePreview
  | MessageError
  | void;
