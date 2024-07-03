import React, { useEffect, useState } from 'react';
import { Box } from '@primer/react';
import { createPortal } from 'react-dom';
import { Loading } from '../Loading';
import { SourceRichToggle } from '../SourceRichToggle';
import { ErrorMessage } from '../ErrorMessage';
import { DMNDiffViewer, DMNViewer } from './dmn-viewer';
import { DiffEntry, FileDiff } from '@bpmn-dmn-diff-viewer-extension/shared/lib/types';
import { MESSAGE_ID } from '@bpmn-dmn-diff-viewer-extension/shared';

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
      console.log('response', response, file.filename);
      if ('error' in response) {
        setLoading(false);
      } else {
        const before = response.before;
        const after = response.after;
        if (before && after) {
          setRichDiff({
            before,
            after,
            diff: 'diff',
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
                      <DMNDiffViewer before={richDiff.before!} after={richDiff.after!} />
                    ) : richDiff.before ? (
                      <DMNViewer diagramXML={richDiff.before!} />
                    ) : richDiff.after ? (
                      <DMNViewer diagramXML={richDiff.after!} />
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
