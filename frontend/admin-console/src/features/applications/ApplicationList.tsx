import { KeyRound, Plus, Power, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  createApplication,
  createClientSecret,
  createOAuthClient,
  disableApplication,
  enableApplication,
  listApplications,
  listPermissionModes
} from '../../api/applications';
import { ApplicationCreatePanel } from './ApplicationCreatePanel';
import { OAuthClientCreatePanel } from './OAuthClientCreatePanel';
import { SecretRevealDialog } from './SecretRevealDialog';
import type { Application, ApplicationCreateInput, ApplicationMode, ClientSecret, OAuthClientCreateInput } from './types';

export function ApplicationList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [modes, setModes] = useState<ApplicationMode[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [secret, setSecret] = useState<ClientSecret | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showClientCreate, setShowClientCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [applicationData, modeData] = await Promise.all([listApplications(), listPermissionModes()]);
      setApplications(applicationData);
      setModes(modeData);
      setSelected((current) => {
        if (!current) {
          return applicationData[0] ?? null;
        }
        return applicationData.find((item) => item.id === current.id) ?? applicationData[0] ?? null;
      });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '加载应用失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const activeCount = useMemo(() => applications.filter((item) => item.status === 'active').length, [applications]);

  async function handleCreate(input: ApplicationCreateInput) {
    setBusy(true);
    setError(null);
    try {
      const created = await createApplication(input);
      setShowCreate(false);
      await refresh();
      setSelected(created);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '创建应用失败');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateClient(input: OAuthClientCreateInput) {
    if (!selected) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const client = await createOAuthClient(selected.id, input);
      const createdSecret = await createClientSecret(client.clientId);
      setShowClientCreate(false);
      setSecret(createdSecret);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '创建 OIDC Client 失败');
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(application: Application) {
    setBusy(true);
    setError(null);
    try {
      const updated = application.status === 'active' ? await disableApplication(application.id) : await enableApplication(application.id);
      setApplications((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelected(updated);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '更新应用状态失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="application-page">
      <section className="toolbar">
        <div>
          <p className="eyebrow">Application Onboarding</p>
          <h1>应用接入</h1>
        </div>
        <div className="toolbar-actions">
          <button className="secondary-action" type="button" onClick={() => void refresh()}>
            <RefreshCw size={17} />
            刷新
          </button>
          <button className="primary-action" type="button" onClick={() => setShowCreate(true)}>
            <Plus size={17} />
            创建应用
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <article className="metric-card">
          <span>接入应用</span>
          <strong>{applications.length}</strong>
          <p>已登记的业务系统数量</p>
        </article>
        <article className="metric-card">
          <span>已启用</span>
          <strong>{activeCount}</strong>
          <p>可用于接入和授权</p>
        </article>
        <article className="metric-card">
          <span>权限模式</span>
          <strong>{modes.length}</strong>
          <p>sso_only / delegated / centralized / hybrid</p>
        </article>
      </section>

      {error && <div className="error-banner">{error}</div>}

      <section className="split-view">
        <div className="data-panel">
          <div className="panel-header">
            <h2>应用列表</h2>
          </div>
          {loading ? (
            <div className="empty-state">加载中</div>
          ) : applications.length === 0 ? (
            <div className="empty-state">暂无应用</div>
          ) : (
            <div className="table-list">
              {applications.map((application) => (
                <button
                  className={`table-row ${selected?.id === application.id ? 'selected' : ''}`}
                  key={application.id}
                  type="button"
                  onClick={() => setSelected(application)}
                >
                  <span>
                    <strong>{application.appName}</strong>
                    <small>{application.appCode}</small>
                  </span>
                  <span>{application.protocol}</span>
                  <span>{application.permissionMode}</span>
                  <span className={`status-pill ${application.status}`}>{application.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="detail-panel">
          {selected ? (
            <>
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{selected.appCode}</p>
                  <h2>{selected.appName}</h2>
                </div>
                <ShieldCheck size={22} />
              </div>
              <dl className="detail-list">
                <div>
                  <dt>协议</dt>
                  <dd>{selected.protocol}</dd>
                </div>
                <div>
                  <dt>应用类型</dt>
                  <dd>{selected.appType}</dd>
                </div>
                <div>
                  <dt>权限模式</dt>
                  <dd>{selected.permissionMode}</dd>
                </div>
                <div>
                  <dt>首页</dt>
                  <dd>{selected.homepageUrl || '-'}</dd>
                </div>
                <div>
                  <dt>状态</dt>
                  <dd>{selected.status}</dd>
                </div>
              </dl>
              <div className="detail-actions">
                <button className="secondary-action" type="button" onClick={() => void toggleStatus(selected)} disabled={busy}>
                  <Power size={17} />
                  {selected.status === 'active' ? '禁用应用' : '启用应用'}
                </button>
                <button className="primary-action" type="button" onClick={() => setShowClientCreate(true)}>
                  <KeyRound size={17} />
                  创建 OIDC Client
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">选择一个应用查看详情</div>
          )}
        </aside>
      </section>

      {showCreate && <ApplicationCreatePanel modes={modes} busy={busy} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}
      {showClientCreate && selected && (
        <OAuthClientCreatePanel application={selected} busy={busy} onClose={() => setShowClientCreate(false)} onSubmit={handleCreateClient} />
      )}
      {secret && <SecretRevealDialog secret={secret} onClose={() => setSecret(null)} />}
    </div>
  );
}
