export const extensionToSrcFormat: {
	[extension: string]: string;
} = {
	bpmn: "bpmn",
	dmn: "dmn",
};

export function isFilenameSupported(filename: string): boolean {
	const extension = filename.split(".").pop();
	return !!(extension && extensionToSrcFormat[extension]);
}
