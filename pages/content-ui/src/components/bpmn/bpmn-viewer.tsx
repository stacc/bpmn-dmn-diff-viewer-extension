import { Box } from "@primer/react";
import BpmnJS from "bpmn-js/lib/NavigatedViewer";
import type { ModdleElement } from "bpmn-js/lib/model/Types";
import type Canvas from "diagram-js/lib/core/Canvas";
import type { ElementRegistry } from "diagram-js/lib/core/Canvas";
import type EventBus from "diagram-js/lib/core/EventBus";
import type { ConnectionLike, ShapeLike } from "diagram-js/lib/model/Types";
import type { Rect } from "diagram-js/lib/util/Types";
import { useEffect, useMemo, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ChangedDialog } from "./changed-dialog";
import { type CheckboxValue, LayerToggle } from "./layer-toggle";

type TypeMap = {
	canvas: Canvas;
	eventBus: EventBus;
	// biome-ignore lint/suspicious/noExplicitAny: We do not have this type
	overlays: any;
	elementRegistry: ElementRegistry;
};

export function BpmnViewer({ diagramXML }: { diagramXML: string }) {
	const containerId = "bpmn-viewer";

	const viewer = useMemo(() => {
		return new BpmnJS<TypeMap>({
			keyboard: {
				bindTo: document,
			},
		});
	}, []);

	useEffect(() => {
		viewer.attachTo(document.querySelector(`#${containerId}`) as HTMLElement);
		if (diagramXML) {
			viewer.importXML(diagramXML);
		}
		viewer.on("import.done", () => {
			const canvas = viewer.get("canvas");
			canvas.zoom("fit-viewport");
		});

		return () => {
			viewer?.destroy();
		};
	}, [diagramXML, viewer]);

	return <Box className="js-skip-tagsearch" height="500px" id={containerId} />;
}

function highlight(
	viewer: BpmnJS<TypeMap>,
	element: ShapeLike | ConnectionLike,
	marker: string,
) {
	try {
		viewer.get("canvas").addMarker(element, marker);
	} catch (e) {
		// ignore error
	}
}
function unhighlight(
	viewer: BpmnJS<TypeMap>,
	element: ShapeLike | ConnectionLike,
	marker: string,
) {
	try {
		viewer.get("canvas").removeMarker(element, marker);
	} catch (e) {
		// ignore error
	}
}

function addMarker(
	viewer: BpmnJS<TypeMap>,
	element: ShapeLike | ConnectionLike,
	className: string,
	symbol: string,
) {
	const overlays = viewer.get("overlays");
	try {
		const type = element.$type;
		const position =
			type === "bpmn:SequenceFlow"
				? { top: -18, right: 18 }
				: { top: -24, right: 12 };
		overlays.add(element.id, className, {
			position: position,
			html: `<div class="marker ${className}">${symbol}</div>`,
		});
	} catch (e) {
		// ignore error
	}
}

function removeMarker(
	viewer: BpmnJS<TypeMap>,
	element: ShapeLike | ConnectionLike,
	className: string,
) {
	const overlays = viewer.get("overlays");
	try {
		overlays.remove({ type: className });
	} catch (e) {
		// ignore error
	}
}

export type Diff = {
	_removed: Record<string, ModdleElement>;
	_added: Record<string, ModdleElement>;
	_changed: Record<string, ModdleElement>;
	_layoutChanged: Record<string, ModdleElement>;
};

function showDiff(
	beforeViewer: BpmnJS<TypeMap>,
	afterViewer: BpmnJS<TypeMap>,
	layers: {
		added: CheckboxValue;
		removed: CheckboxValue;
		layoutChanged: CheckboxValue;
		attributesChanged: CheckboxValue;
	},
	diff?: Diff | null,
) {
	if (!diff) return;
	const removed = Object.values(diff._removed);
	const added = Object.values(diff._added);
	const changed = Object.values(diff._changed);
	const layoutChanged = Object.values(diff._layoutChanged);

	if (layers.removed === "true") {
		removed.forEach((element) => {
			highlight(beforeViewer, element, "diff-removed");
			addMarker(beforeViewer, element, "marker-removed", "&minus;");
		});
	} else {
		removed.forEach((element) => {
			unhighlight(beforeViewer, element, "diff-removed");
			removeMarker(beforeViewer, element, "marker-removed");
		});
	}

	if (layers.added === "true") {
		added.forEach((element) => {
			highlight(afterViewer, element, "diff-added");
			addMarker(afterViewer, element, "marker-added", "&#43;");
		});
	} else {
		added.forEach((element) => {
			unhighlight(afterViewer, element, "diff-added");
			removeMarker(afterViewer, element, "marker-added");
		});
	}

	if (layers.attributesChanged === "true") {
		changed.forEach((element) => {
			highlight(beforeViewer, element.model, "diff-changed");
			addMarker(beforeViewer, element.model, "marker-changed", "&#9998;");

			highlight(afterViewer, element.model, "diff-changed");
			addMarker(afterViewer, element.model, "marker-changed", "&#9998;");
		});
	} else {
		changed.forEach((element) => {
			unhighlight(beforeViewer, element.model, "diff-changed");
			removeMarker(beforeViewer, element.model, "marker-changed");

			unhighlight(afterViewer, element.model, "diff-changed");
			removeMarker(afterViewer, element.model, "marker-changed");
		});
	}

	if (layers.layoutChanged === "true") {
		layoutChanged.forEach((element) => {
			highlight(beforeViewer, element, "diff-layout-changed");
			addMarker(beforeViewer, element, "marker-layout-changed", "&#8680;");

			highlight(afterViewer, element, "diff-layout-changed");
			addMarker(afterViewer, element, "marker-layout-changed", "&#8680;");
		});
	} else {
		layoutChanged.forEach((element) => {
			unhighlight(beforeViewer, element, "diff-layout-changed");
			removeMarker(beforeViewer, element, "marker-layout-changed");

			unhighlight(afterViewer, element, "diff-layout-changed");
			removeMarker(afterViewer, element, "marker-layout-changed");
		});
	}
}

function syncViewers({
	beforeViewer,
	afterViewer,
}: {
	beforeViewer: BpmnJS<TypeMap>;
	afterViewer: BpmnJS<TypeMap>;
}) {
	let changing = false;

	function update(viewer: BpmnJS<TypeMap>) {
		return (e: { viewbox: Rect | undefined }) => {
			if (changing) {
				return;
			}

			changing = true;
			viewer.get("canvas").viewbox(e.viewbox);
			changing = false;
		};
	}

	beforeViewer.on("canvas.viewbox.changed", update(afterViewer));
	afterViewer.on("canvas.viewbox.changed", update(beforeViewer));
}

export function BpmnDiffViewer({
	before,
	after,
	diff,
}: {
	before?: string | null;
	after?: string | null;
	diff?: Diff | null;
}) {
	const [layers, setLayers] = useState<{
		added: CheckboxValue;
		removed: CheckboxValue;
		layoutChanged: CheckboxValue;
		attributesChanged: CheckboxValue;
	}>({
		added: "true",
		removed: "true",
		layoutChanged: "false",
		attributesChanged: "true",
	});
	const beforeContainerId = "bpmn-diff-viewer-before";
	const afterContainerId = "bpmn-diff-viewer-after";
	const beforeViewer = useMemo(() => {
		return new BpmnJS<TypeMap>({
			width: "100%",
			height: "100%",
			keyboard: {
				bindTo: document,
			},
		});
	}, []);

	const afterViewer = useMemo(() => {
		return new BpmnJS<TypeMap>({
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
	beforeViewer.on("import.done", () => {
		const canvas = beforeViewer.get("canvas");
		canvas.zoom("fit-viewport");
		showDiff(beforeViewer, afterViewer, layers, diff);
	});

	useEffect(() => {
		beforeViewer.attachTo(
			document.querySelector(`#${beforeContainerId}`) as HTMLElement,
		);
		afterViewer.attachTo(
			document.querySelector(`#${afterContainerId}`) as HTMLElement,
		);

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
			<Box
				sx={{
					position: "absolute",
					bottom: "10px",
					left: "10px",
					display: "flex",
					gap: "10px",
					flexDirection: "column",
					backgroundColor: "canvas.overlay",
					padding: "10px",
					borderRadius: "6px",
				}}
			>
				<LayerToggle
					layers={layers}
					onChange={(l) => {
						setLayers(l);
					}}
				/>

				<ChangedDialog
					diff={diff}
					hightlight={(id: string) => {
						try {
							const beforeElement = beforeViewer.get("elementRegistry").get(id);
							beforeViewer.get("canvas").zoom(0.9);
							beforeViewer
								.get("canvas")
								.scrollToElement(beforeElement as ShapeLike);
						} catch (e) {
							// ignore error
						}
						try {
							const afterElement = afterViewer.get("elementRegistry").get(id);
							afterViewer.get("canvas").zoom(0.9);
							afterViewer
								.get("canvas")
								.scrollToElement(afterElement as ShapeLike);
						} catch (e) {
							// ignore error
						}
					}}
				/>
			</Box>
		</div>
	);
}
