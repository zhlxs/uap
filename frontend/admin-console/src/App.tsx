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
import { ApplicationList } from './features/applications/ApplicationList';

type NavItem = {
  label: string;
  icon: ComponentType<{ size?: number }>;
};

const navItems: NavItem[] = [
  { label: '总览', icon: LayoutDashboard },
  { label: '用户与组织', icon: UsersRound },
  { label: '应用接入', icon: AppWindow },
  { label: '权限中心', icon: ShieldCheck },
  { label: '认证策略', icon: LockKeyhole },
  { label: '密钥与安全', icon: KeyRound },
  { label: '身份源', icon: Network },
  { label: '审计日志', icon: Activity },
  { label: '开发者门户', icon: BookOpen }
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
              <button className={`nav-item ${index === 2 ? 'active' : ''}`} key={item.label} type="button">
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="workspace">
        <ApplicationList />
      </main>
    </div>
  );
}
