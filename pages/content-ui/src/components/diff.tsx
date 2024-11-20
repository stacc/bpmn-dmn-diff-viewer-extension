import type { DiffEntry } from "@bpmn-dmn-diff-viewer-extension/shared/lib/types";
import { ThemeProvider } from "@primer/react";
import type { ColorModeWithAuto } from "@primer/react/lib/ThemeProvider";
import type React from "react";
import { BpmnDiffPortal } from "./bpmn/bpmn-diff";
import { DMNDiffPortal } from "./dmn/dmn-diff";
import type { ReviewComment } from "@bpmn-dmn-diff-viewer-extension/shared";

export type DiffPageProps = {
	map: { element: HTMLElement; file: DiffEntry }[];
	owner: string;
	repo: string;
	sha: string;
	parentSha: string;
	colorMode: ColorModeWithAuto;
	comments?: ReviewComment[];
};

export function Diff({
	map,
	owner,
	repo,
	sha,
	parentSha,
	colorMode,
	comments,
}: DiffPageProps): React.ReactElement {
	return (
		<ThemeProvider colorMode={colorMode}>
			{map.map((m) => {
				const { filename } = m.file;
				const isBpmn = filename.endsWith(".bpmn");
				const fileComments = comments?.filter((c) => c.path === filename);
				if (isBpmn) {
					return (
						<BpmnDiffPortal
							key={m.file.filename}
							element={m.element}
							file={m.file}
							owner={owner}
							repo={repo}
							sha={sha}
							parentSha={parentSha}
							comments={fileComments}
						/>
					);
				}
				return (
					<DMNDiffPortal
						key={m.file.filename}
						element={m.element}
						file={m.file}
						owner={owner}
						repo={repo}
						sha={sha}
						parentSha={parentSha}
					/>
				);
			})}
		</ThemeProvider>
	);
}
