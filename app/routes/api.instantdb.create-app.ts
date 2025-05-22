import { json, type ActionFunction } from '@remix-run/cloudflare';
import { apiOrigin } from '~/lib/stores/instantdb';
import type { InstantDBApp } from '~/types/instantdb';

interface CreateAppResponse {
  app: InstantDBApp;
  expires_ms?: number;
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { token: requestAuthToken, schema, rules, title } = (await request.json()) as any;

    const authToken = requestAuthToken || process.env.INSTANTDB_PERSONAL_ACCESS_TOKEN;

    console.log('AUTH TOKEN', authToken);

    const endpoint = authToken ? `${apiOrigin}/superadmin/apps` : `${apiOrigin}/dash/apps/ephemeral`;

    const appResponse = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : null),
      },
      method: 'POST',
      body: JSON.stringify({
        title,
        schema,
        rules,
      }),
    });

    if (!appResponse.ok) {
      const errorText = await appResponse.text();
      console.error('Create app failed:', errorText);

      return json({ error: 'Failed to create app.' }, { status: 401 });
    }

    const data = (await appResponse.json()) as CreateAppResponse;

    return json({
      app: data.app,
      expiresAt: data.expires_ms ? new Date(data.expires_ms) : null,
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
