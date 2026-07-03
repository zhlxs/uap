import { X } from 'lucide-react';
import { useState } from 'react';
import type { ApplicationCreateInput, ApplicationMode } from './types';

type Props = {
  modes: ApplicationMode[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: ApplicationCreateInput) => Promise<void>;
};

const defaultCapabilities = {
  app_access_control: true,
  role_permission_enabled: true,
  resource_managed_by_uap: {
    menu: false,
    button: false,
    api: false
  },
  data_scope_managed_by_uap: false,
  permission_delivery: {
    token_claims: true,
    permission_api: true
  }
};

export function ApplicationCreatePanel({ modes, busy, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<ApplicationCreateInput>({
    appCode: '',
    appName: '',
    appType: 'web',
    protocol: 'oidc',
    homepageUrl: '',
    permissionMode: 'delegated',
    permissionCapabilitiesJson: JSON.stringify(defaultCapabilities)
  });

  function update<K extends keyof ApplicationCreateInput>(key: K, value: ApplicationCreateInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="drawer-backdrop">
      <aside className="drawer" aria-label="创建应用">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Application</p>
            <h2>创建应用</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(form);
          }}
        >
          <label>
            应用编码
            <input value={form.appCode} onChange={(event) => update('appCode', event.target.value)} required maxLength={64} />
          </label>
          <label>
            应用名称
            <input value={form.appName} onChange={(event) => update('appName', event.target.value)} required maxLength={128} />
          </label>
          <label>
            应用类型
            <select value={form.appType} onChange={(event) => update('appType', event.target.value)}>
              <option value="web">Web</option>
              <option value="spa">SPA</option>
              <option value="backend">Backend</option>
              <option value="saml">SAML</option>
              <option value="cas">CAS</option>
            </select>
          </label>
          <label>
            协议
            <select value={form.protocol} onChange={(event) => update('protocol', event.target.value)}>
              <option value="oidc">OIDC</option>
              <option value="oauth2">OAuth2</option>
              <option value="saml">SAML</option>
              <option value="cas">CAS</option>
            </select>
          </label>
          <label className="full-span">
            首页地址
            <input value={form.homepageUrl} onChange={(event) => update('homepageUrl', event.target.value)} maxLength={512} />
          </label>
          <label className="full-span">
            权限模式
            <select value={form.permissionMode} onChange={(event) => update('permissionMode', event.target.value)}>
              {modes.map((mode) => (
                <option key={mode.mode} value={mode.mode}>
                  {mode.displayName}
                </option>
              ))}
            </select>
          </label>

          <div className="drawer-actions">
            <button className="secondary-action" type="button" onClick={onClose}>
              取消
            </button>
            <button className="primary-action" type="submit" disabled={busy}>
              创建
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

