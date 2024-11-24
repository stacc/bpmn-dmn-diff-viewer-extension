import { MESSAGE_ID } from "@bpmn-dmn-diff-viewer-extension/shared";
import type {
	DiffEntry,
	FileDiff,
} from "@bpmn-dmn-diff-viewer-extension/shared/lib/types";
import { Box } from "@primer/react";
import type React from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ErrorMessage } from "../ErrorMessage";
import { Loading } from "../Loading";
import { SourceRichToggle } from "../SourceRichToggle";
import { DMNDiffViewer, DMNViewer } from "./dmn-viewer";
import { diff, camundaScheme } from "@stacc/dmn-differ";
import DmnModdle from "dmn-moddle";

export function DMNDiffPortal({
	element,
	file,
	owner,
	repo,
	sha,
	parentSha,
}: {
	element: HTMLElement;
	file: DiffEntry;
	owner: string;
	repo: string;
	sha: string;
	parentSha: string;
}): React.ReactElement {
	const [loading, setLoading] = useState(false);
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
		const fetchDiffData = async () => {
			try {
				setLoading(true);
				const response = await chrome.runtime.sendMessage({
					id: MESSAGE_ID.GET_FILE_DIFF,
					data: { owner, repo, sha, parentSha, file },
				});

				if ("error" in response) {
					throw new Error(response.error);
				}

				const { before, after } = response;
				const beforeModdle = await new DmnModdle({
					camunda: camundaScheme,
				}).fromXML(before);
				const afterModdle = await new DmnModdle({
					camunda: camundaScheme,
				}).fromXML(after);
				const results = diff(beforeModdle, afterModdle);

				setRichDiff({
					before: before || null,
					after: after || null,
					diff: before && after ? results : null,
				});
			} catch (error) {
				console.error("Failed to fetch diff:", error);
				setRichDiff({
					before: null,
					after: null,
					diff: null,
				});
			} finally {
				setLoading(false);
			}
		};

		fetchDiffData();
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
											<DMNDiffViewer {...richDiff} />
										) : richDiff.before ? (
											<DMNViewer diagramXML={richDiff.before} />
										) : richDiff.after ? (
											<DMNViewer diagramXML={richDiff.after} />
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
