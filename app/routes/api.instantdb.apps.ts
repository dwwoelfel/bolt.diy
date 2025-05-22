import { json, type ActionFunction } from '@remix-run/cloudflare';
import { apiOrigin } from '~/lib/stores/instantdb';
import type { InstantDBApp, InstantDBToken } from '~/types/instantdb';

interface AppsResponse {
  apps: InstantDBApp[];
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { token } = (await request.json()) as { token: InstantDBToken };

    const endpoint = `${apiOrigin}/superadmin/apps?include=schema,perms`;

    console.log('ENDPOINT', endpoint);

    const appResponse = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.token}`,
      },
      method: 'GET',
    });

    if (!appResponse.ok) {
      const errorText = await appResponse.text();
      console.error('Fetch apps failed:', errorText);

      return json({ error: 'Failed to fetch InstantDB apps.' }, { status: 401 });
    }

    const data = (await appResponse.json()) as AppsResponse;

    return json({
      apps: data.apps,
    });
  } catch (error) {
    console.error('InstantDB API error:', error);
    return json(
      {
        error: error instanceof Error ? error.message : 'Authentication failed',
      },
      { status: 401 },
    );
  }
};
