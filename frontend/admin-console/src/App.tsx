import {
  Activity,
  AppWindow,
  BookOpen,
  Fingerprint,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Network,
  ShieldCheck,
  UsersRound
} from 'lucide-react';
import type { ComponentType } from 'react';

type NavItem = {
  label: string;
  description: string;
  icon: ComponentType<{ size?: number }>;
};

const navItems: NavItem[] = [
  { label: '总览', description: '登录趋势、风险事件、接入状态', icon: LayoutDashboard },
  { label: '用户与组织', description: '用户、部门、岗位、用户组', icon: UsersRound },
  { label: '应用接入', description: 'OIDC、SAML、CAS、API Client', icon: AppWindow },
  { label: '权限中心', description: '角色、资源、数据范围、授权关系', icon: ShieldCheck },
  { label: '认证策略', description: 'MFA、密码、会话、Token、IP 策略', icon: LockKeyhole },
  { label: '密钥与安全', description: 'JWKS、密钥轮换、Token 撤销', icon: KeyRound },
  { label: '身份源', description: 'LDAP、AD、HR、企业微信、钉钉、飞书', icon: Network },
  { label: '审计日志', description: '登录、授权、管理、安全事件', icon: Activity },
  { label: '开发者门户', description: '接入文档、示例、调试工具', icon: BookOpen }
];

const stats = [
  { label: '接入应用', value: '0', hint: '等待创建首个 OIDC 应用' },
  { label: '用户主体', value: '0', hint: '等待接入身份源' },
  { label: '在线会话', value: '0', hint: '认证服务就绪后产生' },
  { label: '风险事件', value: '0', hint: '策略引擎接入后统计' }
];

export function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Fingerprint size={24} />
          </div>
          <div>
            <strong>AegisID</strong>
            <span>统一身份认证与访问治理</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="主导航">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button className={`nav-item ${index === 0 ? 'active' : ''}`} key={item.label}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Admin Console</p>
            <h1>AegisID 控制台</h1>
          </div>
          <button className="primary-action">
            <AppWindow size={18} />
            创建应用
          </button>
        </header>

        <section className="stats-grid" aria-label="核心指标">
          {stats.map((stat) => (
            <article className="metric-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <p>{stat.hint}</p>
            </article>
          ))}
        </section>

        <section className="module-grid" aria-label="功能模块">
          {navItems.slice(1).map((item) => {
            const Icon = item.icon;
            return (
              <article className="module-card" key={item.label}>
                <div className="module-icon">
                  <Icon size={20} />
                </div>
                <div>
                  <h2>{item.label}</h2>
                  <p>{item.description}</p>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
