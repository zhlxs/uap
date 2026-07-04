const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL ?? 'http://localhost:9000';
const CLIENT_ID = import.meta.env.VITE_AUTH_CLIENT_ID ?? 'aegisid-admin-console';
const REDIRECT_URI = `${window.location.origin}/auth/callback`;
const TOKEN_STORAGE_KEY = 'aegisid.admin.tokens';
const STATE_STORAGE_KEY = 'aegisid.admin.oauth.state';
const VERIFIER_STORAGE_KEY = 'aegisid.admin.oauth.verifier';

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
  const tokens = JSON.parse(raw) as AuthTokens;
  if (tokens.expiresAt <= Date.now() + 30_000) {
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

export function redirectToLogout(): void {
  clearTokens();
  const params = new URLSearchParams({ redirect_uri: window.location.origin });
  window.location.assign(`${AUTH_BASE_URL}/sso/logout?${params.toString()}`);
}

export async function redirectToLogin(): Promise<void> {
  const state = randomString();
  const verifier = randomString();
  const challenge = base64UrlEncode(await sha256(verifier));
  sessionStorage.setItem(STATE_STORAGE_KEY, state);
  sessionStorage.setItem(VERIFIER_STORAGE_KEY, verifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'openid profile email',
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
  const tokens: AuthTokens = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    idToken: payload.id_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
    scope: payload.scope,
    tokenType: payload.token_type
  };

  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  sessionStorage.removeItem(STATE_STORAGE_KEY);
  sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
  window.history.replaceState({}, document.title, '/');
}
