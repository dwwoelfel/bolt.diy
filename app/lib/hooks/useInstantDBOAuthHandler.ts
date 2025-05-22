import { OAuthHandler } from '@instantdb/platform';
import { useEffect, useState } from 'react';
import { apiOrigin, instantDBOAuthClientId } from '~/lib/stores/instantdb';

export function useInstantDBOAuthHandler() {
  const [handler, setHandler] = useState<OAuthHandler | null>(null);

  useEffect(() => {
    if (instantDBOAuthClientId) {
      const origin = window.location.origin;
      setHandler(
        new OAuthHandler({
          apiOrigin,
          clientId: instantDBOAuthClientId,
          redirectUri: `${origin}/oauth/instantdb/redirect`,
        }),
      );
    }
  }, []);

  return handler;
}
