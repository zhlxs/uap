import {
  ApiOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  DashboardOutlined,
  KeyOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Avatar, Button, Card, ConfigProvider, Layout, Menu, Result, Space, Spin, Tag, Typography, theme } from 'antd';
import type { MenuProps } from 'antd';
import { useEffect, useState } from 'react';
import { getStoredTokens, handleLoginCallback, redirectToLogin, redirectToLogout } from './auth/session';
import { getCurrentUserProfile } from './api/profile';
import type { CurrentUserProfile } from './api/profile';
import { ApplicationList } from './features/applications/ApplicationList';
import { AuditLogList } from './features/audit/AuditLogList';
import { UserList } from './features/identity/UserList';

const { Header, Sider, Content } = Layout;

type NavKey = 'dashboard' | 'identity' | 'applications' | 'permission' | 'policy' | 'keys' | 'source' | 'audit';

const navItems: MenuProps['items'] = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: '总览' },
  { key: 'identity', icon: <TeamOutlined />, label: '用户与组织' },
  { key: 'applications', icon: <AppstoreOutlined />, label: '应用接入' },
  { key: 'permission', icon: <SafetyCertificateOutlined />, label: '权限中心' },
  { key: 'policy', icon: <LockOutlined />, label: '认证策略' },
  { key: 'keys', icon: <KeyOutlined />, label: '密钥与安全' },
  { key: 'source', icon: <ApiOutlined />, label: '身份源' },
  { key: 'audit', icon: <AuditOutlined />, label: '审计日志' }
];

function renderContent(activeKey: NavKey) {
  if (activeKey === 'applications') {
    return <ApplicationList />;
  }
  if (activeKey === 'identity') {
    return <UserList />;
  }
  if (activeKey === 'audit') {
    return <AuditLogList />;
  }
  const item = navItems?.find((navItem) => navItem && 'key' in navItem && navItem.key === activeKey);
  return (
    <Card>
      <Space direction="vertical" size={8}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {String(item && 'label' in item ? item.label : '模块')}
        </Typography.Title>
        <Typography.Text type="secondary">该模块正在产品化建设中，当前优先完善应用接入、权限配置和成员授权闭环。</Typography.Text>
      </Space>
    </Card>
  );
}

export function App() {
  const [activeKey, setActiveKey] = useState<NavKey>('applications');
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'error'>('checking');
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserProfile | null>(null);

  useEffect(() => {
    async function bootstrapAuth() {
      try {
        if (window.location.pathname === '/auth/callback') {
          await handleLoginCallback();
        }
        if (getStoredTokens()) {
          setCurrentUser(await getCurrentUserProfile());
          setAuthStatus('authenticated');
          return;
        }
        await redirectToLogin();
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : '登录失败');
        setAuthStatus('error');
      }
    }

    void bootstrapAuth();
  }, []);

  function logout() {
    void redirectToLogout();
  }

  if (authStatus === 'checking') {
    return (
      <div className="auth-loading">
        <Spin size="large" />
        <Typography.Text type="secondary">正在连接统一认证服务</Typography.Text>
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <Result
        status="warning"
        title="登录未完成"
        subTitle={authError ?? '请重新登录'}
        extra={<Button type="primary" onClick={() => void redirectToLogin()}>重新登录</Button>}
      />
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1f6f64',
          borderRadius: 6,
          colorBgLayout: '#f4f6f9',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif'
        },
        components: {
          Layout: {
            siderBg: '#141922',
            triggerBg: '#141922'
          },
          Menu: {
            darkItemBg: '#141922',
            darkSubMenuItemBg: '#141922',
            darkItemSelectedBg: '#1f6f64'
          }
        }
      }}
    >
      <Layout className="admin-shell">
        <Sider className="admin-sider" width={248}>
          <div className="admin-brand">
            <div className="admin-brand-mark">
              <BankOutlined />
            </div>
            <div>
              <Typography.Text className="admin-brand-title">AegisID</Typography.Text>
              <span>统一认证与访问平台</span>
            </div>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[activeKey]}
            items={navItems}
            onClick={({ key }) => setActiveKey(key as NavKey)}
          />
        </Sider>

        <Layout>
          <Header className="admin-header">
            <div>
              <Typography.Text strong>管理控制台</Typography.Text>
              <Tag color="processing">开发环境</Tag>
            </div>
            <Space size={14}>
              <Typography.Text type="secondary">租户：{currentUser?.tenantName ?? '默认组织'}</Typography.Text>
              <Typography.Text>{currentUser?.username ?? 'admin'}</Typography.Text>
              <Avatar style={{ backgroundColor: '#1f6f64' }}>
                {(currentUser?.username ?? 'AD').slice(0, 2).toUpperCase()}
              </Avatar>
              <Button size="small" onClick={logout}>退出</Button>
            </Space>
          </Header>
          <Content className="admin-content">{renderContent(activeKey)}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
