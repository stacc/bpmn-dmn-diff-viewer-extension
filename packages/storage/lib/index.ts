import { createStorage, StorageType, type BaseStorage, SessionAccessLevel } from './base';
import { getStorageGithubToken, setStorageGithubToken } from './github';
type TokenKey = 'gtk';

export {
  createStorage,
  getStorageGithubToken,
  setStorageGithubToken,
  StorageType,
  SessionAccessLevel,
  BaseStorage,
  type TokenKey,
};
