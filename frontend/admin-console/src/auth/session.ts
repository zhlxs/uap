const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL ?? 'http://localhost:9000';
const CLIENT_ID = import.meta.env.VITE_AUTH_CLIENT_ID ?? 'aegisid-admin-console';
const REDIRECT_URI = `${window.location.origin}/auth/callback`;
const TOKEN_STORAGE_KEY = 'aegisid.admin.tokens';
const STATE_STORAGE_KEY = 'aegisid.admin.oauth.state';
const VERIFIER_STORAGE_KEY = 'aegisid.admin.oauth.verifier';
const RETURN_PATH_STORAGE_KEY = 'aegisid.admin.oauth.return_path';
const REFRESH_BEFORE_EXPIRES_MS = 60_000;

let refreshTokenPromise: Promise<AuthTokens> | null = null;

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
  scope?: string;
  tokenType: string;
};

export type CurrentUser = {
  username: string;
  subject: string;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  scope?: string;
  token_type: string;
};

function base64UrlEncode(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes.buffer);
}

async function sha256(value: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  if (!payload) {
    return {};
  }
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return JSON.parse(decodeURIComponent(escape(atob(padded)))) as Record<string, unknown>;
}

export function getStoredTokens(): AuthTokens | null {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  const tokens = parseStoredTokens(raw);
  if (!tokens) {
    clearTokens();
    return null;
  }
  return tokens;
}

export function getAccessToken(): string | null {
  return getStoredTokens()?.accessToken ?? null;
}

export function getCurrentUser(): CurrentUser | null {
  const tokens = getStoredTokens();
  if (!tokens?.idToken) {
    return null;
  }
  const payload = decodeJwtPayload(tokens.idToken);
  const subject = String(payload.sub ?? '');
  const username = String(payload.preferred_username ?? payload.name ?? payload.email ?? subject);
  return { username, subject };
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function redirectToLogout(): Promise<void> {
  const tokens = getStoredTokens();
  if (tokens) {
    await revokeTokens(tokens);
  }
  clearTokens();
  const params = new URLSearchParams({ redirect_uri: window.location.origin });
  window.location.assign(`${AUTH_BASE_URL}/sso/logout?${params.toString()}`);
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens();
  if (!tokens) {
    return null;
  }
  if (tokens.expiresAt > Date.now() + REFRESH_BEFORE_EXPIRES_MS) {
    return tokens.accessToken;
  }
  return (await refreshTokens()).accessToken;
}

export async function refreshTokens(): Promise<AuthTokens> {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = doRefreshTokens()
    .catch((error: unknown) => {
      clearTokens();
      throw error;
    })
    .finally(() => {
      refreshTokenPromise = null;
    });

  return refreshTokenPromise;
}

export async function redirectToLogin(): Promise<void> {
  const state = randomString();
  const verifier = randomString();
  const challenge = base64UrlEncode(await sha256(verifier));
  sessionStorage.setItem(STATE_STORAGE_KEY, state);
  sessionStorage.setItem(VERIFIER_STORAGE_KEY, verifier);
  if (window.location.pathname !== '/auth/callback') {
    sessionStorage.setItem(RETURN_PATH_STORAGE_KEY, `${window.location.pathname}${window.location.search}${window.location.hash}`);
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'openid profile email offline_access',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256'
  });

  window.location.assign(`${AUTH_BASE_URL}/oauth2/authorize?${params.toString()}`);
}

export async function handleLoginCallback(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const expectedState = sessionStorage.getItem(STATE_STORAGE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_STORAGE_KEY);

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    throw new Error('登录回调校验失败，请重新登录');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code,
    code_verifier: verifier
  });

  const response = await fetch(`${AUTH_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!response.ok) {
    throw new Error('登录凭证换取失败，请重新登录');
  }

  const payload = (await response.json()) as TokenResponse;
  storeTokens(toAuthTokens(payload));
  const returnPath = sessionStorage.getItem(RETURN_PATH_STORAGE_KEY) ?? '/';
  sessionStorage.removeItem(STATE_STORAGE_KEY);
  sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
  sessionStorage.removeItem(RETURN_PATH_STORAGE_KEY);
  window.history.replaceState({}, document.title, returnPath);
}

function parseStoredTokens(raw: string): AuthTokens | null {
  try {
    const tokens = JSON.parse(raw) as AuthTokens;
    if (!tokens.accessToken || !tokens.expiresAt || !tokens.tokenType) {
      return null;
    }
    return tokens;
  } catch {
    return null;
  }
}

function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

function toAuthTokens(payload: TokenResponse, previousTokens?: AuthTokens): AuthTokens {
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? previousTokens?.refreshToken,
    idToken: payload.id_token ?? previousTokens?.idToken,
    expiresAt: Date.now() + payload.expires_in * 1000,
    scope: payload.scope ?? previousTokens?.scope,
    tokenType: payload.token_type
  };
}

async function doRefreshTokens(): Promise<AuthTokens> {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) {
    throw new Error('登录状态已过期，请重新登录');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    refresh_token: tokens.refreshToken
  });

  const response = await fetch(`${AUTH_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!response.ok) {
    throw new Error('登录状态刷新失败，请重新登录');
  }

  const payload = (await response.json()) as TokenResponse;
  const nextTokens = toAuthTokens(payload, tokens);
  storeTokens(nextTokens);
  return nextTokens;
}

async function revokeTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    revokeToken(tokens.refreshToken, 'refresh_token'),
    revokeToken(tokens.accessToken, 'access_token')
  ]);
}

async function revokeToken(token: string | undefined, tokenTypeHint: string): Promise<void> {
  if (!token) {
    return;
  }
  try {
    await fetch(`${AUTH_BASE_URL}/oauth2/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        token,
        token_type_hint: tokenTypeHint
      })
    });
  } catch {
    // 退出时撤销令牌是尽力而为，失败后仍继续清理本地会话。
  }
}
