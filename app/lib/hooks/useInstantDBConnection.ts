import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  instantDBConnection,
  instantDBOAuthClientId,
  isConnecting,
  updateInstantDBConnection,
  fetchInstantDBApps,
  isFetchingApps,
} from '~/lib/stores/instantdb';
import type { InstantDBToken } from '~/types/instantdb';
import { workbenchStore } from '~/lib/stores/workbench';
import type { ActionCallbackData } from '~/lib/runtime/message-parser';

export function useInstantDBConnection() {
  const connection = useStore(instantDBConnection);
  const connecting = useStore(isConnecting);
  const fetchingApps = useStore(isFetchingApps);
  const [isAppsExpanded, setIsAppsExpanded] = useState(true);

  const handleCreateApp = async () => {
    // XXX: create app
  };

  const handleConnect = async () => {
    isConnecting.set(true);

    try {
      const token = instantDBConnection.get().token;

      if (!token) {
        throw new Error('Missing token.');
      }

      await fetchInstantDBApps(token);

      toast.success('Successfully connected to InstantDB');
    } catch (e) {
      console.error('Connection error:', e);
      // XXX: log
    } finally {
      isConnecting.set(false);
    }
  };

  const selectApp = (appId: string) => {
    const app = instantDBConnection.get().apps?.find((a) => a.id === appId);
    updateInstantDBConnection({
      selectedApp: app,
      selectedAppId: app?.id,
    });

    const token = instantDBConnection.get().token;

    // XXX: Need to somehow check if the app is running
    const isReplacingCurrentApp = false;

    if (app && token && isReplacingCurrentApp) {
      const changeAppId = `select-instantdb-app-${appId}`;
      workbenchStore.addArtifact({
        id: changeAppId,
        messageId: changeAppId,
        title: 'Select InstantDB App',
        type: 'standalone',
      });

      const artifact = workbenchStore.artifacts.get()[changeAppId];

      const action: ActionCallbackData = {
        artifactId: changeAppId,
        messageId: changeAppId,
        actionId: `${changeAppId}-pull`,
        action: {
          type: 'instantdb',
          operation: 'pull',
          token,
          appId,
          content: '',
        },
      };

      artifact.runner.addAction(action);

      // XXX: async?

      artifact.runner.runAction(action);
    }
  };

  const handleDisconnect = () => {
    updateInstantDBConnection({ token: null, apps: undefined });
  };

  return {
    connection,
    connecting,
    instantDBOAuthClientId,
    handleConnect,
    updateToken: (token: InstantDBToken) => updateInstantDBConnection({ ...connection, token }),
    fetchingApps,
    isAppsExpanded,
    setIsAppsExpanded,
    handleCreateApp,
    selectApp,
    handleDisconnect,
    fetchApps: fetchInstantDBApps,
  };
}
