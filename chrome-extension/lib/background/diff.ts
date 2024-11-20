import type {
	ContentFile,
	DiffEntry,
	FileDiff,
} from "@bpmn-dmn-diff-viewer-extension/shared";
import type { Octokit } from "@octokit/rest";

export const extensionToSrcFormat: {
	[extension: string]: string;
} = {
	bpmn: "bpmn",
	dmn: "dmn",
};

/**
 * Safely decodes a base64 string containing UTF-8 characters.
 * @param base64String The base64 encoded string to decode
 * @returns The decoded string with proper UTF-8 character handling
 */
export function decodeBase64ToString(base64String: string): string {
	// Step 1: Convert base64 to binary string
	const binaryString = atob(base64String);

	// Step 2: Create a Uint8Array from the binary string
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	// Step 3: Decode the Uint8Array as UTF-8
	const decoder = new TextDecoder("utf-8");
	return decoder.decode(bytes);
}

export async function getContentString({
	github,
	owner,
	repo,
	ref,
	path,
}: {
	github: Octokit;
	owner: string;
	repo: string;
	ref: string;
	path: string;
}): Promise<string> {
	// First get some info on the blob with the Contents api
	const content = await github.rest.repos.getContent({
		owner,
		repo,
		path,
		ref,
		request: { cache: "reload" }, // download_url provides a token that seems very short-lived
	});
	const contentFile = content.data as ContentFile;

	if (!contentFile.content) {
		throw Error(`No Content associated with ${path} at ${ref}`);
	}
	return decodeBase64ToString(contentFile.content);
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
	const extension = filename.split(".").pop();
	if (!extension || !extensionToSrcFormat[extension]) {
		throw Error(
			`Unsupported extension. Given ${extension}, was expecting ${Object.keys(
				extensionToSrcFormat,
			)}`,
		);
	}
	if (status === "modified") {
		const before = await getContentString({
			github,
			owner,
			repo,
			ref: parentSha,
			path: filename,
		});
		const after = await getContentString({
			github,
			owner,
			repo,
			ref: sha,
			path: filename,
		});
		return { before, after };
	}

	if (status === "added") {
		const after = await getContentString({
			github,
			owner,
			repo,
			ref: sha,
			path: filename,
		});
		return { after };
	}

	if (status === "removed") {
		const before = await getContentString({
			github,
			owner,
			repo,
			ref: parentSha,
			path: filename,
		});
		return { before };
	}

	throw Error(`Unsupported status: ${status}`);
}
