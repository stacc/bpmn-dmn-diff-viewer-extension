import { Box, ThemeProvider } from "@primer/react";
import type React from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ErrorMessage } from "../ErrorMessage";
import { SourceRichToggle } from "../SourceRichToggle";
import { BpmnViewer } from "./bpmn-viewer";
import type { ColorModeWithAuto } from "node_modules/@primer/react/lib-esm/ThemeProvider";

export type BPMNFilePreviewPageProps = {
	colorMode: ColorModeWithAuto;
	content: string;
	document: Document;
};

export function BPMNFilePreviewPage({
	colorMode,
	content,
	document,
}: BPMNFilePreviewPageProps): React.ReactElement {
	const [richSelected, setRichSelected] = useState(true);
	const [toolbarContainer, setToolbarContainer] = useState<Element>();
	const [diffContainer, setDiffContainer] = useState<HTMLElement>();
	const [sourceElements, setSourceElements] = useState<HTMLElement[]>([]);

	useEffect(() => {
		const toolbar = document.getElementById("repos-sticky-header")?.children[0]
			?.children[1];
		if (toolbar != null) {
			setToolbarContainer(toolbar);
		}

		const diff = document.getElementById(
			"read-only-cursor-text-area",
		)?.parentElement;
		if (diff != null) {
			setDiffContainer(diff);
			const sourceElements = Array.from(diff.children) as HTMLElement[];
			sourceElements.forEach((n) => {
				n.style.display = "none";
			});
			setSourceElements(sourceElements);
		}
	}, [document]);

	return (
		<ThemeProvider colorMode={colorMode}>
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
						{content ? <BpmnViewer diagramXML={content} /> : <ErrorMessage />}
					</Box>,
					diffContainer,
				)}
		</ThemeProvider>
	);
}
