import { Box } from '@primer/react';
import { useEffect, useState } from 'react';
import { Loading } from './loading';
import { TokenForm } from './token-form';
import { UserCard } from './user-card';
import { User, MESSAGE_ID, MessageIds } from '@bpmn-dmn-diff-viewer-extension/shared/lib/types';

export function Settings() {
  const [githubUser, setGithubUser] = useState<User>();
  const [githubLoading, setGithubLoading] = useState(false);
  const [firstInitDone, setFirstInitDone] = useState(false);

  async function fetchGithubUser() {
    try {
      setGithubLoading(true);
      const response = await chrome.runtime.sendMessage({
        id: MESSAGE_ID.GET_GITHUB_USER,
      });
      if (response && 'error' in response) throw response.error;
      setGithubUser(response as User);
      setGithubLoading(false);
    } catch (e) {
      console.error(e);
      setGithubUser(undefined);
      setGithubLoading(false);
    }
  }

  async function onToken(id: MessageIds, token: string) {
    await chrome.runtime.sendMessage({ id, data: { token } });
  }

  useEffect(() => {
    (async () => {
      await fetchGithubUser();
      setFirstInitDone(true);
    })();
  }, []);

  return (
    <Box backgroundColor="canvas.default" p={4}>
      {firstInitDone ? (
        <Box>
          {githubUser ? (
            <UserCard
              login={'@' + githubUser.login}
              avatar={githubUser.avatar_url}
              serviceAvatar="https://avatars.githubusercontent.com/github"
              onSignOut={async () => {
                await onToken(MESSAGE_ID.SAVE_GITHUB_TOKEN, '');
                setGithubUser(undefined);
              }}
            />
          ) : (
            <TokenForm
              loading={githubLoading}
              onToken={async (token: string) => {
                await onToken(MESSAGE_ID.SAVE_GITHUB_TOKEN, token);
                await fetchGithubUser();
              }}
            />
          )}
        </Box>
      ) : (
        <Loading />
      )}
    </Box>
  );
}
