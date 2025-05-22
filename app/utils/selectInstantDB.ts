import type { InstantDBConnectionState } from '~/lib/stores/instantdb';
import { generatePermsTypescriptFile, generateSchemaTypescriptFile } from '@instantdb/platform';

export const instantDBStarterPrompt = (instantDBConnection: InstantDBConnectionState) => {
  const selectedApp = instantDBConnection.selectedApp;

  if (!selectedApp) {
    return null;
  }

  const permsFile = {
    path: 'instant.perms.ts',
    content: generatePermsTypescriptFile(selectedApp.perms, '@instantdb/core'),
  };

  const schemaFile = {
    path: 'instant.schema.ts',
    content: generateSchemaTypescriptFile(null, selectedApp.schema, '@instantdb/core'),
  };

  const files = [permsFile, schemaFile];

  const assistantMessage = `Bolt is initializing your project with schema and permission configuration files your InstantDB database.
<boltArtifact id="imported-instantdb-config" title="Import InstantDB config" type="bundled">
${files
  .map(
    (file) => `<boltAction type="file" filePath="${file.path}">
${file.content}
</boltAction>`,
  )
  .join('\n')}
</boltArtifact>`;

  const userMessage = `InstantDB configuration import is done. Use these files as the base schema and permissions for InstantDB.`;

  return { assistantMessage, userMessage };
};
