import { useEffect, useRef } from 'react';
import BpmnJS from 'bpmn-js/lib/NavigatedViewer';
import { Box } from '@primer/react';

export function ReactBpmn({ diagramXML }: { diagramXML: string }) {
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
