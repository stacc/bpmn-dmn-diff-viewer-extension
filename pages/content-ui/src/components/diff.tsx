import type { DiffEntry } from "@bpmn-dmn-diff-viewer-extension/shared/lib/types";
import { ThemeProvider } from "@primer/react";
import type { ColorModeWithAuto } from "node_modules/@primer/react/lib-esm/ThemeProvider";
import type React from "react";
import { BpmnDiffPortal } from "./bpmn/bpmn-diff";
import { DMNDiffPortal } from "./dmn/dmn-diff";

export type DiffPageProps = {
	map: { element: HTMLElement; file: DiffEntry }[];
	owner: string;
	repo: string;
	sha: string;
	parentSha: string;
	colorMode: ColorModeWithAuto;
};

export function Diff({
	map,
	owner,
	repo,
	sha,
	parentSha,
	colorMode,
}: DiffPageProps): React.ReactElement {
	return (
		<ThemeProvider colorMode={colorMode}>
			{map.map((m) => {
				const { filename } = m.file;
				const isBpmn = filename.endsWith(".bpmn");
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
