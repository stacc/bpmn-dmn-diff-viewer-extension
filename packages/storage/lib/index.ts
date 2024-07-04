import {
	type BaseStorage,
	SessionAccessLevel,
	StorageType,
	createStorage,
} from "./base";
import { getStorageGithubToken, setStorageGithubToken } from "./github";
type TokenKey = "gtk";

export {
	createStorage,
	getStorageGithubToken,
	setStorageGithubToken,
	StorageType,
	SessionAccessLevel,
	type BaseStorage,
	type TokenKey,
};
