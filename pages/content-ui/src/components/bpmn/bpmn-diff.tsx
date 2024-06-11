import React, { useEffect, useState } from 'react';
import { Box, ThemeProvider } from '@primer/react';
import { createPortal } from 'react-dom';
import { Loading } from '../Loading';
import { SourceRichToggle } from '../SourceRichToggle';
import { ColorModeWithAuto } from '@primer/react/lib/ThemeProvider';
import { ErrorMessage } from '../ErrorMessage';
import { diff } from 'bpmn-js-differ';
import BpmnModdle from 'bpmn-moddle';
import { BpmnDiffViewer, BpmnViewer } from './bpmn-viewer';
import { DiffEntry, FileDiff, MESSAGE_ID } from '@bpmn-dmn-diff-viewer-extension/shared/lib/types';

async function loadModel(diagramXML: string) {
  try {
    const loadedResult = await new BpmnModdle().fromXML(diagramXML);
    return loadedResult.rootElement;
  } catch (err) {
    console.log('something went wrong!');
  }
}

function BpmnDiffPortal({
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
  const [loading, setLoading] = useState(true);
  const [richDiff, setRichDiff] = useState<FileDiff>();
  const [richSelected, setRichSelected] = useState(true);
  const [toolbarContainer, setToolbarContainer] = useState<HTMLElement>();
  const [diffContainer, setDiffContainer] = useState<HTMLElement>();
  const [sourceElements, setSourceElements] = useState<HTMLElement[]>([]);

  useEffect(() => {
    const toolbar = element.querySelector<HTMLElement>('.file-info');
    if (toolbar != null) {
      setToolbarContainer(toolbar);
    }

    const diff = element.querySelector<HTMLElement>('.js-file-content');

    if (diff != null) {
      setDiffContainer(diff);
      const sourceElements = Array.from(diff.children) as HTMLElement[];
      sourceElements.map(n => (n.style.display = 'none'));
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
      if ('error' in response) {
        setLoading(false);
      } else {
        const before = response.before;
        const after = response.after;
        if (before && after) {
          const asyncBefore = loadModel(before);
          const asyncAfter = loadModel(after);
          const [beforeModel, afterModel] = await Promise.all([asyncBefore, asyncAfter]);
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
              sourceElements.map(n => (n.style.display = 'block'));
              setRichSelected(false);
            }}
            onRichSelected={() => {
              sourceElements.map(n => (n.style.display = 'none'));
              setRichSelected(true);
            }}
          />,
          toolbarContainer,
        )}
      {diffContainer &&
        createPortal(
          <Box sx={{ display: richSelected ? 'block' : 'none', height: '100%' }}>
            {loading ? (
              <Loading />
            ) : (
              <>
                {richDiff ? (
                  <div>
                    {richDiff.diff ? (
                      <BpmnDiffViewer before={richDiff.before!} after={richDiff.after!} />
                    ) : richDiff.before ? (
                      <BpmnViewer diagramXML={richDiff.before!} />
                    ) : richDiff.after ? (
                      <BpmnViewer diagramXML={richDiff.after!} />
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

export type CadDiffPageProps = {
  map: { element: HTMLElement; file: DiffEntry }[];
  owner: string;
  repo: string;
  sha: string;
  parentSha: string;
  colorMode: ColorModeWithAuto;
};

export function BpmnDiff({ map, owner, repo, sha, parentSha, colorMode }: CadDiffPageProps): React.ReactElement {
  return (
    <ThemeProvider colorMode={colorMode}>
      {map.map(m => (
        <BpmnDiffPortal
          key={m.file.filename}
          element={m.element}
          file={m.file}
          owner={owner}
          repo={repo}
          sha={sha}
          parentSha={parentSha}
        />
      ))}
    </ThemeProvider>
  );
}
