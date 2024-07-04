enum TokenKeys {
	Github = "gtk",
}

function setStorage(key: TokenKeys, value: string): Promise<void> {
	return chrome.storage.local.set({ [key]: value });
}

function getStorage(key: TokenKeys): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		chrome.storage.local.get([key], (result) => {
			if (result?.[key]) {
				resolve(result[key]);
			} else {
				reject("Empty token");
			}
		});
	});
}

export function setStorageGithubToken(token: string): Promise<void> {
	return setStorage(TokenKeys.Github, token);
}

export function getStorageGithubToken(): Promise<string> {
	return getStorage(TokenKeys.Github);
}
