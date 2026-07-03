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
import { Avatar, ConfigProvider, Layout, Menu, Space, Tag, Typography, theme } from 'antd';
import type { MenuProps } from 'antd';
import { ApplicationList } from './features/applications/ApplicationList';

const { Header, Sider, Content } = Layout;

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

export function App() {
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
          <Menu theme="dark" mode="inline" selectedKeys={['applications']} items={navItems} />
        </Sider>

        <Layout>
          <Header className="admin-header">
            <div>
              <Typography.Text strong>管理控制台</Typography.Text>
              <Tag color="processing">开发环境</Tag>
            </div>
            <Space size={14}>
              <Typography.Text type="secondary">租户：默认组织</Typography.Text>
              <Avatar style={{ backgroundColor: '#1f6f64' }}>AD</Avatar>
            </Space>
          </Header>
          <Content className="admin-content">
            <ApplicationList />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
