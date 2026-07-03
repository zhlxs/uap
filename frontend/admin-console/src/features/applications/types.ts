export type Application = {
  id: string;
  appCode: string;
  appName: string;
  appType: string;
  protocol: string;
  homepageUrl: string | null;
  permissionMode: string;
  permissionCapabilitiesJson: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationMode = {
  mode: string;
  displayName: string;
};

export type ApplicationCreateInput = {
  appCode: string;
  appName: string;
  appType: string;
  protocol: string;
  homepageUrl: string;
  permissionMode: string;
  permissionCapabilitiesJson: string;
};

export type OAuthClientCreateInput = {
  clientName: string;
  clientType: string;
  tokenEndpointAuthMethod: string;
  grantTypes: string[];
  responseTypes: string[];
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  scopes: string[];
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  requirePkce: boolean;
};

export type OAuthClient = {
  id: string;
  applicationId: string;
  clientId: string;
  clientName: string;
  clientType: string;
  tokenEndpointAuthMethod: string;
  grantTypes: string[];
  responseTypes: string[];
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  scopes: string[];
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  requirePkce: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientSecret = {
  id: string;
  clientId: string;
  secret: string;
  secretHint: string;
  createdAt: string;
};

