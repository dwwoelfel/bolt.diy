import { type InstantAPIPlatformSchema } from '@instantdb/platform';

export interface InstantDBApp {
  id: string;
  title: string;
  perms: Record<string, any>;
  schema: InstantAPIPlatformSchema;
}

export interface InstantDBPersonalAccessToken {
  type: 'personal-access-token';
  token: string;
}

export interface InstantDBOAuthAccessToken {
  type: 'oauth-access-token';
  token: string;
  expiresAt: Date;
}

export type InstantDBToken = InstantDBPersonalAccessToken | InstantDBOAuthAccessToken;
