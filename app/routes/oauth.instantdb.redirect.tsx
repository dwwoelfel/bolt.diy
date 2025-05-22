import { type MetaFunction } from '@remix-run/cloudflare';
import { useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { useInstantDBOAuthHandler } from '~/lib/hooks/useInstantDBOAuthHandler';

export const meta: MetaFunction = () => {
  return [{ title: 'OAuth Callback' }, { name: 'description', content: 'OAuth callback' }];
};

export default function Index() {
  const oauthHandler = useInstantDBOAuthHandler();

  useEffect(() => {
    if (oauthHandler) {
      return oauthHandler.handleClientRedirect();
    }

    return () => null;
  }, [oauthHandler]);

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <ClientOnly>
        {() => (
          <div className="flex items-center justify-center h-full w-full">
            <p>The auth flow has completed, you can close this window.</p>
          </div>
        )}
      </ClientOnly>
    </div>
  );
}
