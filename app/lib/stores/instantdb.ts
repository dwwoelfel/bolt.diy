import { atom } from 'nanostores';
import type { InstantDBApp, InstantDBToken } from '~/types/instantdb';

export const apiOrigin = 'https://api.instantdb.com';
//export const apiOrigin = 'http://localhost:8888';

export const instantDBOAuthClientId: string | null = import.meta.env.VITE_INSTANTDB_OAUTH_CLIENT_ID;

export interface InstantDBConnectionState {
  token?: InstantDBToken | null;
  selectedAppId?: string;
  isConnected?: boolean;
  selectedApp?: InstantDBApp;
  apps?: InstantDBApp[];
}

const LOCALSTORAGE_KEY = 'instantdbConnection';

const savedConnection = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALSTORAGE_KEY) : null;

const initialState: InstantDBConnectionState = savedConnection ? JSON.parse(savedConnection) : {};

export const instantDBConnection = atom<InstantDBConnectionState>(initialState);

export const isConnecting = atom(false);
export const isFetchingApps = atom(false);

if (initialState.token) {
  fetchInstantDBApps(initialState.token).catch(console.error);
}

export function updateInstantDBConnection(connection: Partial<InstantDBConnectionState>) {
  const currentState = instantDBConnection.get();

  const newToken = connection.token !== undefined ? connection.token : currentState.token;
  const newApps = connection.apps !== undefined ? connection.apps : currentState.apps;

  connection.isConnected = !!(newToken && newApps);

  if (connection.selectedAppId !== undefined) {
    if (connection.selectedAppId && currentState.apps?.length) {
      const selectedApp = currentState.apps.find((app) => app.id === connection.selectedAppId);

      if (selectedApp) {
        connection.selectedApp = selectedApp;
      }
    } else if (!connection.selectedApp) {
      connection.selectedApp = undefined;
    }
  }

  const newState = { ...currentState, ...connection };
  instantDBConnection.set(newState);

  /*
   * Always save the connection state to localStorage to persist across chats
   */
  if (newState.token) {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(newState));
  } else {
    localStorage.removeItem(LOCALSTORAGE_KEY);
  }
}

export async function fetchInstantDBApps(token: InstantDBToken) {
  isFetchingApps.set(true);

  try {
    const response = await fetch('/api/instantdb/apps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch apps');
    }

    const data = (await response.json()) as any;

    updateInstantDBConnection({
      apps: data.apps,
    });
  } catch (error) {
    console.error('Failed to fetch InstantDB apps:', error);
    throw error;
  } finally {
    isFetchingApps.set(false);
  }
}
