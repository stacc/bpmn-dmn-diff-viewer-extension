import {
	type DiffEntry,
	type FileDiff,
	MESSAGE_ID,
} from "@bpmn-dmn-diff-viewer-extension/shared/lib/types";
import { Box } from "@primer/react";
import { diff } from "bpmn-js-differ";
import BpmnModdle from "bpmn-moddle";
import type React from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ErrorMessage } from "../ErrorMessage";
import { Loading } from "../Loading";
import { SourceRichToggle } from "../SourceRichToggle";
import { BpmnDiffViewer, BpmnViewer } from "./bpmn-viewer";
import type { ReviewComment } from "@bpmn-dmn-diff-viewer-extension/shared";

async function loadModel(diagramXML: string) {
	try {
		const loadedResult = await new BpmnModdle().fromXML(diagramXML);
		return loadedResult.rootElement;
	} catch (err) {
		console.log("something went wrong!");
	}
}

export function BpmnDiffPortal({
	element,
	file,
	owner,
	repo,
	sha,
	parentSha,
	comments,
}: {
	element: HTMLElement;
	file: DiffEntry;
	owner: string;
	repo: string;
	sha: string;
	parentSha: string;
	comments?: ReviewComment[];
}): React.ReactElement {
	const [loading, setLoading] = useState(true);
	const [richDiff, setRichDiff] = useState<FileDiff>();
	const [richSelected, setRichSelected] = useState(true);
	const [toolbarContainer, setToolbarContainer] = useState<HTMLElement>();
	const [diffContainer, setDiffContainer] = useState<HTMLElement>();
	const [sourceElements, setSourceElements] = useState<HTMLElement[]>([]);

	useEffect(() => {
		const toolbar = element.querySelector<HTMLElement>(".file-info");
		if (toolbar != null) {
			setToolbarContainer(toolbar);
		}

		const diff = element.querySelector<HTMLElement>(".js-file-content");

		if (diff != null) {
			setDiffContainer(diff);
			const sourceElements = Array.from(diff.children) as HTMLElement[];
			sourceElements.forEach((n) => {
				n.style.display = "none";
			});
			setSourceElements(sourceElements);
		}
	}, [element]);

	useEffect(() => {
		(async () => {
			setLoading(true);
			const response = await chrome.runtime.sendMessage({
				id: MESSAGE_ID.GET_FILE_DIFF,
				data: { owner, repo, sha, parentSha, file },
			});
			if ("error" in response) {
				setLoading(false);
			} else {
				const before = response.before;
				const after = response.after;
				if (before && after) {
					const asyncBefore = loadModel(before);
					const asyncAfter = loadModel(after);
					const [beforeModel, afterModel] = await Promise.all([
						asyncBefore,
						asyncAfter,
					]);
					const diffResult = diff(beforeModel, afterModel);
					setRichDiff({
						before,
						after,
						diff: diffResult,
					});
				}
				if (before && !after) {
					setRichDiff({
						before,
						after: null,
						diff: null,
					});
				}
				if (!before && after) {
					setRichDiff({
						before: null,
						after,
						diff: null,
					});
				}
				setLoading(false);
			}
		})();
	}, [file, owner, repo, sha, parentSha]);

	return (
		<>
			{toolbarContainer &&
				createPortal(
					<SourceRichToggle
						richSelected={richSelected}
						onSourceSelected={() => {
							sourceElements.forEach((n) => {
								n.style.display = "block";
							});
							setRichSelected(false);
						}}
						onRichSelected={() => {
							sourceElements.forEach((n) => {
								n.style.display = "none";
							});
							setRichSelected(true);
						}}
					/>,
					toolbarContainer,
				)}
			{diffContainer &&
				createPortal(
					<Box
						sx={{ display: richSelected ? "block" : "none", height: "100%" }}
					>
						{loading ? (
							<Loading />
						) : (
							<>
								{richDiff ? (
									<div>
										{richDiff.diff ? (
											<BpmnDiffViewer
												before={richDiff.before}
												after={richDiff.after}
												diff={richDiff.diff}
											/>
										) : richDiff.before ? (
											<BpmnViewer diagramXML={richDiff.before} />
										) : richDiff.after ? (
											<BpmnViewer diagramXML={richDiff.after} />
										) : (
											<ErrorMessage />
										)}
									</div>
								) : (
									<ErrorMessage />
								)}
							</>
						)}
					</Box>,
					diffContainer,
				)}
		</>
	);
}
