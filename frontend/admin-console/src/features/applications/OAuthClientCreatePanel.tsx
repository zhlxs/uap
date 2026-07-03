import { X } from 'lucide-react';
import { useState } from 'react';
import type { Application, OAuthClientCreateInput } from './types';

type Props = {
  application: Application;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: OAuthClientCreateInput) => Promise<void>;
};

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function OAuthClientCreatePanel({ application, busy, onClose, onSubmit }: Props) {
  const [redirectUris, setRedirectUris] = useState('https://example.company.com/oauth/callback');
  const [logoutUris, setLogoutUris] = useState('https://example.company.com/logout/success');
  const [scopes, setScopes] = useState('openid\nprofile\nemail');
  const [clientName, setClientName] = useState(`${application.appName} Web`);

  return (
    <div className="drawer-backdrop">
      <aside className="drawer" aria-label="创建 OAuth Client">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">{application.appCode}</p>
            <h2>创建 OIDC Client</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit({
              clientName,
              clientType: 'confidential',
              tokenEndpointAuthMethod: 'client_secret_basic',
              grantTypes: ['authorization_code', 'refresh_token'],
              responseTypes: ['code'],
              redirectUris: splitLines(redirectUris),
              postLogoutRedirectUris: splitLines(logoutUris),
              scopes: splitLines(scopes),
              accessTokenTtlSeconds: 900,
              refreshTokenTtlSeconds: 604800,
              requirePkce: true
            });
          }}
        >
          <label className="full-span">
            Client 名称
            <input value={clientName} onChange={(event) => setClientName(event.target.value)} required maxLength={128} />
          </label>
          <label className="full-span">
            Redirect URI
            <textarea value={redirectUris} onChange={(event) => setRedirectUris(event.target.value)} rows={4} required />
          </label>
          <label className="full-span">
            登出回调地址
            <textarea value={logoutUris} onChange={(event) => setLogoutUris(event.target.value)} rows={3} />
          </label>
          <label className="full-span">
            Scopes
            <textarea value={scopes} onChange={(event) => setScopes(event.target.value)} rows={4} required />
          </label>

          <div className="hint-line">默认启用 Authorization Code + PKCE，Access Token 15 分钟，Refresh Token 7 天。</div>

          <div className="drawer-actions">
            <button className="secondary-action" type="button" onClick={onClose}>
              取消
            </button>
            <button className="primary-action" type="submit" disabled={busy}>
              创建 Client
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

