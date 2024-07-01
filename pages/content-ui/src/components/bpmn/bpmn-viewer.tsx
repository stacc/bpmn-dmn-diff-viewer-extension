import { useEffect, useMemo, useState } from 'react';
import BpmnJS from 'bpmn-js/lib/NavigatedViewer';
import { Box } from '@primer/react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import Canvas, { type ElementRegistry } from 'diagram-js/lib/core/Canvas';
import EventBus from 'diagram-js/lib/core/EventBus';
import { ConnectionLike, ShapeLike } from 'diagram-js/lib/model/Types';
import { ModdleElement } from 'bpmn-js/lib/model/Types';
import { ChangedDialog } from './changed-dialog';
import { Rect } from 'diagram-js/lib/util/Types';
import { CheckboxValue, LayerToggle } from './layer-toggle';

type TypeMap = {
  canvas: Canvas;
  eventBus: EventBus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  overlays: any;
  elementRegistry: ElementRegistry;
};

export function BpmnViewer({ diagramXML }: { diagramXML: string }) {
  const containerId = 'bpmn-viewer';

  const viewer = useMemo(() => {
    return new BpmnJS<TypeMap>({
      keyboard: {
        bindTo: document,
      },
    });
  }, []);

  useEffect(() => {
    viewer.attachTo(document.querySelector(`#${containerId}`)!);
    if (diagramXML) {
      viewer.importXML(diagramXML);
    }
    viewer.on('import.done', () => {
      const canvas = viewer.get('canvas');
      canvas.zoom('fit-viewport');
    });

    return () => {
      viewer?.destroy();
    };
  }, [diagramXML, viewer]);

  return <Box className="js-skip-tagsearch" height="500px" id={containerId} />;
}

function highlight(viewer: BpmnJS<TypeMap>, element: ShapeLike | ConnectionLike, marker: string) {
  try {
    viewer.get('canvas').addMarker(element, marker);
  } catch (e) {
    // ignore error
  }
}
function unhighlight(viewer: BpmnJS<TypeMap>, element: ShapeLike | ConnectionLike, marker: string) {
  try {
    viewer.get('canvas').removeMarker(element, marker);
  } catch (e) {
    // ignore error
  }
}

function addMarker(viewer: BpmnJS<TypeMap>, element: ShapeLike | ConnectionLike, className: string, symbol: string) {
  const overlays = viewer.get('overlays');
  try {
    const type = element.$type;
    const position = type === 'bpmn:SequenceFlow' ? { top: -18, right: 18 } : { top: -24, right: 12 };
    overlays.add(element.id, className, {
      position: position,
      html: '<div class="marker ' + className + '">' + symbol + '</div>',
    });
  } catch (e) {
    // ignore error
  }
}

function removeMarker(viewer: BpmnJS<TypeMap>, element: ShapeLike | ConnectionLike, className: string) {
  const overlays = viewer.get('overlays');
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
  diff: Diff,
  layers: {
    added: CheckboxValue;
    removed: CheckboxValue;
    layoutChanged: CheckboxValue;
    attributesChanged: CheckboxValue;
  },
) {
  const removed = Object.values(diff._removed);
  const added = Object.values(diff._added);
  const changed = Object.values(diff._changed);
  const layoutChanged = Object.values(diff._layoutChanged);

  if (layers.removed === 'true') {
    removed.forEach(element => {
      highlight(beforeViewer, element, 'diff-removed');
      addMarker(beforeViewer, element, 'marker-removed', '&minus;');
    });
  } else {
    removed.forEach(element => {
      unhighlight(beforeViewer, element, 'diff-removed');
      removeMarker(beforeViewer, element, 'marker-removed');
    });
  }

  if (layers.added === 'true') {
    added.forEach(element => {
      highlight(afterViewer, element, 'diff-added');
      addMarker(afterViewer, element, 'marker-added', '&#43;');
    });
  } else {
    added.forEach(element => {
      unhighlight(afterViewer, element, 'diff-added');
      removeMarker(afterViewer, element, 'marker-added');
    });
  }

  if (layers.attributesChanged === 'true') {
    changed.forEach(element => {
      highlight(beforeViewer, element.model, 'diff-changed');
      addMarker(beforeViewer, element.model, 'marker-changed', '&#9998;');

      highlight(afterViewer, element.model, 'diff-changed');
      addMarker(afterViewer, element.model, 'marker-changed', '&#9998;');
    });
  } else {
    changed.forEach(element => {
      unhighlight(beforeViewer, element.model, 'diff-changed');
      removeMarker(beforeViewer, element.model, 'marker-changed');

      unhighlight(afterViewer, element.model, 'diff-changed');
      removeMarker(afterViewer, element.model, 'marker-changed');
    });
  }

  if (layers.layoutChanged === 'true') {
    layoutChanged.forEach(element => {
      highlight(beforeViewer, element, 'diff-layout-changed');
      addMarker(beforeViewer, element, 'marker-layout-changed', '&#8680;');

      highlight(afterViewer, element, 'diff-layout-changed');
      addMarker(afterViewer, element, 'marker-layout-changed', '&#8680;');
    });
  } else {
    layoutChanged.forEach(element => {
      unhighlight(beforeViewer, element, 'diff-layout-changed');
      removeMarker(beforeViewer, element, 'marker-layout-changed');

      unhighlight(afterViewer, element, 'diff-layout-changed');
      removeMarker(afterViewer, element, 'marker-layout-changed');
    });
  }
}

function syncViewers({ beforeViewer, afterViewer }: { beforeViewer: BpmnJS<TypeMap>; afterViewer: BpmnJS<TypeMap> }) {
  let changing: boolean = false;

  function update(viewer: BpmnJS<TypeMap>) {
    return function (e: { viewbox: Rect | undefined }) {
      if (changing) {
        return;
      }

      changing = true;
      viewer.get('canvas').viewbox(e.viewbox);
      changing = false;
    };
  }

  function syncViewbox(a: BpmnJS<TypeMap>, b: BpmnJS<TypeMap>) {
    a.on('canvas.viewbox.changed', update(b));
  }

  syncViewbox(beforeViewer, afterViewer);
  syncViewbox(afterViewer, beforeViewer);
}

export function BpmnDiffViewer({ before, after, diff }: { before: string; after: string; diff: Diff }) {
  const [layers, setLayers] = useState<{
    added: CheckboxValue;
    removed: CheckboxValue;
    layoutChanged: CheckboxValue;
    attributesChanged: CheckboxValue;
  }>({
    added: 'true',
    removed: 'true',
    layoutChanged: 'false',
    attributesChanged: 'true',
  });
  const beforeContainerId = 'bpmn-diff-viewer-before';
  const afterContainerId = 'bpmn-diff-viewer-after';
  const beforeViewer = useMemo(() => {
    return new BpmnJS<TypeMap>({
      width: '100%',
      height: '100%',

      keyboard: {
        bindTo: document,
      },
    });
  }, []);

  const afterViewer = useMemo(() => {
    return new BpmnJS<TypeMap>({
      width: '100%',
      height: '100%',
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
  beforeViewer.on('import.done', () => {
    const canvas = beforeViewer.get('canvas');
    canvas.zoom('fit-viewport');
    showDiff(beforeViewer, afterViewer, diff, layers);
  });

  useEffect(() => {
    beforeViewer.attachTo(document.querySelector(`#${beforeContainerId}`)!);
    afterViewer.attachTo(document.querySelector(`#${afterContainerId}`)!);

    syncViewers({ beforeViewer, afterViewer });

    return () => {
      beforeViewer?.destroy();
      afterViewer?.destroy();
    };
  }, [before, after, diff, beforeViewer, afterViewer]);

  return (
    <div className="js-skip-tagsearch">
      <PanelGroup
        direction="horizontal"
        style={{
          display: 'flex',
          gap: '10px',
        }}>
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
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          display: 'flex',
          gap: '10px',
          flexDirection: 'column',
          backgroundColor: 'canvas.overlay',
          padding: '10px',
          borderRadius: '6px',
        }}>
        <LayerToggle
          layers={layers}
          onChange={l => {
            setLayers(l);
          }}
        />

        <ChangedDialog
          diff={diff}
          hightlight={(id: string) => {
            try {
              const beforeElement = beforeViewer.get('elementRegistry').get(id);
              beforeViewer.get('canvas').zoom(0.9);
              beforeViewer.get('canvas').scrollToElement(beforeElement as ShapeLike);
            } catch (e) {
              // ignore error
            }
            try {
              const afterElement = afterViewer.get('elementRegistry').get(id);
              afterViewer.get('canvas').zoom(0.9);
              afterViewer.get('canvas').scrollToElement(afterElement as ShapeLike);
            } catch (e) {
              // ignore error
            }
          }}
        />
      </Box>
    </div>
  );
}
