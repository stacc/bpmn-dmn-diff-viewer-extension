/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import BpmnJS from 'bpmn-js/lib/NavigatedViewer';
import { Box } from '@primer/react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

export function BpmnViewer({ diagramXML }: { diagramXML: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const viewer = new BpmnJS({
      container: containerRef.current!,
      keyboard: {
        bindTo: document,
      },
    });

    if (diagramXML) {
      viewer.importXML(diagramXML);
    }
    viewer.on('import.done', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas: any = viewer!.get('canvas');
      canvas.zoom('fit-viewport');
    });

    return () => {
      viewer?.destroy();
    };
  }, [diagramXML]);

  return <Box height="300px" ref={containerRef}></Box>;
}

export function BpmnDiffViewer({ before, after }: { before: string; after: string }) {
  const beforeContainer = useRef<HTMLDivElement | null>(null);
  const afterContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const beforeViewer = new BpmnJS<{
      canvas: {
        viewbox(viewbox: string): void;
      };
    }>({
      container: beforeContainer.current!,
      keyboard: {
        bindTo: document,
      },
    });

    const afterViewer = new BpmnJS<{
      canvas: {
        viewbox(viewbox: string): void;
      };
    }>({
      container: afterContainer.current!,
      keyboard: {
        bindTo: document,
      },
    });

    if (before) {
      beforeViewer.importXML(before);
    }
    if (after) {
      afterViewer.importXML(after);
    }
    beforeViewer.on('import.done', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas: any = beforeViewer!.get('canvas');
      canvas.zoom('fit-viewport');
    });

    function syncViewers() {
      let changing: boolean = false;

      function update(
        viewer: BpmnJS<{
          canvas: {
            viewbox(viewbox: string): void;
          };
        }>,
      ) {
        return function (e: any) {
          if (changing) {
            return;
          }

          changing = true;
          viewer.get('canvas').viewbox(e.viewbox);
          changing = false;
        };
      }

      function syncViewbox(
        a: BpmnJS<{
          canvas: {
            viewbox(viewbox: string): void;
          };
        }>,
        b: BpmnJS<{
          canvas: {
            viewbox(viewbox: string): void;
          };
        }>,
      ) {
        a.on('canvas.viewbox.changed', update(b));
      }

      syncViewbox(beforeViewer, afterViewer);
      syncViewbox(afterViewer, beforeViewer);
    }

    syncViewers();

    return () => {
      beforeViewer?.destroy();
      afterViewer?.destroy();
    };
  }, [before, after]);

  return (
    <PanelGroup
      direction="horizontal"
      style={{
        display: 'flex',
        gap: '10px',
      }}>
      <Panel defaultSize={50} minSize={20}>
        <Box height="300px" ref={beforeContainer} />
      </Panel>
      <PanelResizeHandle />
      <Panel defaultSize={50} minSize={20}>
        <Box height="300px" ref={afterContainer} />
      </Panel>
    </PanelGroup>
  );
}
