import { Box } from "@primer/react";
import DMNJS from "dmn-js/lib/NavigatedViewer";
import { useEffect, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import type { ViewsChangedEvent } from "./types";

export function DMNViewer({ diagramXML }: { diagramXML?: string }) {
	const containerId = "dmn-viewer";

	const viewer = useMemo(() => {
		return new DMNJS({
			keyboard: {
				bindTo: document,
			},
		});
	}, []);

	useEffect(() => {
		viewer.attachTo(document.querySelector(`#${containerId}`));
		if (diagramXML) {
			viewer.importXML(diagramXML);
		}

		return () => {
			viewer?.destroy();
		};
	}, [diagramXML, viewer]);

	return <Box className="js-skip-tagsearch" height="500px" id={containerId} />;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type DMN = any;

function syncViewers({
	beforeViewer,
	afterViewer,
}: {
	beforeViewer: DMN;
	afterViewer: DMN;
}) {
	function update(viewer: DMN) {
		return (e: ViewsChangedEvent) => {
			const currentViewerView = viewer.getActiveView();

			if (currentViewerView.id === e.activeView.id) {
				return;
			}

			const view = e.views.find((v) => v.id === e.activeView.id);

			if (view) {
				viewer.open(view);
			}
		};
	}

	beforeViewer.on("views.changed", update(afterViewer));
	afterViewer.on("views.changed", update(beforeViewer));
}

export function DMNDiffViewer({
	before,
	after,
}: { before?: string | null; after?: string | null }) {
	const beforeContainerId = "dmn-diff-viewer-before";
	const afterContainerId = "dmn-diff-viewer-after";
	const beforeViewer = useMemo(() => {
		return new DMNJS({
			width: "100%",
			height: "100%",
			keyboard: {
				bindTo: document,
			},
		});
	}, []);

	const afterViewer = useMemo(() => {
		return new DMNJS({
			width: "100%",
			height: "100%",
			keyboard: {
				bindTo: document,
			},
		});
	}, []);

	if (before) {
		beforeViewer.importXML(before);
	}
	if (after) {
		afterViewer.importXML(after);
	}

	useEffect(() => {
		beforeViewer.attachTo(document.querySelector(`#${beforeContainerId}`));
		afterViewer.attachTo(document.querySelector(`#${afterContainerId}`));

		syncViewers({ beforeViewer, afterViewer });

		return () => {
			beforeViewer?.destroy();
			afterViewer?.destroy();
		};
	}, [beforeViewer, afterViewer]);

	return (
		<div className="js-skip-tagsearch">
			<PanelGroup
				direction="horizontal"
				style={{
					display: "flex",
					gap: "10px",
				}}
			>
				<Panel defaultSize={50} minSize={20}>
					<Box height="500px" id={beforeContainerId} />
				</Panel>
				<PanelResizeHandle />
				<Panel defaultSize={50} minSize={20}>
					<Box height="500px" id={afterContainerId} />
				</Panel>
			</PanelGroup>
		</div>
	);
}
