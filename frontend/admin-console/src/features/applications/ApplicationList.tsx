import {
  AppstoreAddOutlined,
  CopyOutlined,
  KeyOutlined,
  PlusOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Input,
  List,
  Row,
  Segmented,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import {
  createApplication,
  createClientSecret,
  createOAuthClient,
  disableApplication,
  enableApplication,
  listApplications,
  listOAuthClients,
  listPermissionModes,
  updatePermissionPolicy
} from '../../api/applications';
import { ApplicationCreatePanel } from './ApplicationCreatePanel';
import { MemberAuthorizationPanel } from './MemberAuthorizationPanel';
import { OAuthClientCreatePanel } from './OAuthClientCreatePanel';
import { PermissionPolicyPanel } from './PermissionPolicyPanel';
import { RolePermissionPanel } from './RolePermissionPanel';
import { SecretRevealDialog } from './SecretRevealDialog';
import type {
  Application,
  ApplicationCreateInput,
  ApplicationMode,
  ClientSecret,
  OAuthClient,
  OAuthClientCreateInput,
  PermissionPolicyUpdateInput
} from './types';

const statusMap: Record<string, { color: string; text: string }> = {
  active: { color: 'success', text: '已启用' },
  disabled: { color: 'default', text: '已禁用' },
  draft: { color: 'warning', text: '草稿' }
};

const issuer = 'http://127.0.0.1:9100';

function modeDisplayName(mode: string, modes: ApplicationMode[]) {
  return modes.find((item) => item.mode === mode)?.displayName ?? mode;
}

export function ApplicationList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [modes, setModes] = useState<ApplicationMode[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [oauthClients, setOauthClients] = useState<OAuthClient[]>([]);
  const [secret, setSecret] = useState<ClientSecret | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showClientCreate, setShowClientCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clientLoading, setClientLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  async function refreshOAuthClients(applicationId: string) {
    setClientLoading(true);
    try {
      setOauthClients(await listOAuthClients(applicationId));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '加载登录接入配置失败');
    } finally {
      setClientLoading(false);
    }
  }

  function openDetail(application: Application) {
    setSelected(application);
    setShowDetail(true);
    void refreshOAuthClients(application.id);
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (showDetail && selected) {
      void refreshOAuthClients(selected.id);
    }
  }, [selected?.id, showDetail]);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const lowerKeyword = keyword.toLowerCase();
      const matchedKeyword =
        !keyword ||
        application.appName.toLowerCase().includes(lowerKeyword) ||
        application.appCode.toLowerCase().includes(lowerKeyword);
      const matchedStatus = statusFilter === 'all' || application.status === statusFilter;
      return matchedKeyword && matchedStatus;
    });
  }, [applications, keyword, statusFilter]);

  const activeCount = useMemo(() => applications.filter((item) => item.status === 'active').length, [applications]);

  async function copyText(value: string, successText: string) {
    await navigator.clipboard.writeText(value);
    void message.success(successText);
  }

  async function handleCreate(input: ApplicationCreateInput) {
    setBusy(true);
    setError(null);
    try {
      const created = await createApplication(input);
      setShowCreate(false);
      await refresh();
      openDetail(created);
      void message.success('应用创建成功');
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
      await refreshOAuthClients(selected.id);
      void message.success('登录接入配置创建成功');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '创建登录接入配置失败');
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
      void message.success(updated.status === 'active' ? '应用已启用' : '应用已禁用');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '更新应用状态失败');
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdatePermissionPolicy(input: PermissionPolicyUpdateInput) {
    if (!selected) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await updatePermissionPolicy(selected.id, input);
      setApplications((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelected(updated);
      void message.success('权限策略已保存');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '保存权限策略失败');
    } finally {
      setBusy(false);
    }
  }

  const columns: ColumnsType<Application> = [
    {
      title: '应用',
      dataIndex: 'appName',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{record.appName}</Typography.Text>
          <Typography.Text type="secondary">{record.appCode}</Typography.Text>
        </Space>
      )
    },
    {
      title: '协议',
      dataIndex: 'protocol',
      width: 110,
      render: (value: string) => <Tag color="blue">{value.toUpperCase()}</Tag>
    },
    {
      title: '应用类型',
      dataIndex: 'appType',
      width: 120
    },
    {
      title: '权限模式',
      dataIndex: 'permissionMode',
      width: 180,
      render: (value: string) => <Tag icon={<SafetyCertificateOutlined />}>{modeDisplayName(value, modes)}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: string) => {
        const status = statusMap[value] ?? { color: 'default', text: value };
        return <Tag color={status.color}>{status.text}</Tag>;
      }
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 190,
      render: (value: string) => new Date(value).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 210,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openDetail(record)}>
            配置
          </Button>
          <Button type="link" icon={<PoweroffOutlined />} loading={busy && selected?.id === record.id} onClick={() => void toggleStatus(record)}>
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Flex align="center" justify="space-between" gap={16} wrap="wrap">
        <div>
          <Typography.Text type="secondary">应用接入 / Application Onboarding</Typography.Text>
          <Typography.Title level={3} style={{ margin: '4px 0 0' }}>
            应用接入
          </Typography.Title>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void refresh()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>
            创建应用
          </Button>
        </Space>
      </Flex>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="接入应用" value={applications.length} prefix={<AppstoreAddOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="已启用" value={activeCount} suffix={`/ ${applications.length}`} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="权限模式" value={modes.length} prefix={<SafetyCertificateOutlined />} />
          </Card>
        </Col>
      </Row>

      {error && <Alert type="error" showIcon message={error} />}

      <Card
        title="应用清单"
        extra={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索应用名称或编码"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              style={{ width: 260 }}
            />
            <Segmented
              value={statusFilter}
              onChange={(value) => setStatusFilter(String(value))}
              options={[
                { label: '全部', value: 'all' },
                { label: '已启用', value: 'active' },
                { label: '已禁用', value: 'disabled' }
              ]}
            />
          </Space>
        }
      >
        <Table<Application>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredApplications}
          scroll={{ x: 1080 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          onRow={(record) => ({
            onDoubleClick: () => openDetail(record)
          })}
        />
      </Card>

      <Drawer title={selected?.appName ?? '应用配置'} width={860} open={showDetail} onClose={() => setShowDetail(false)}>
        {selected && (
          <Tabs
            items={[
              {
                key: 'overview',
                label: '概览',
                children: (
                  <Space direction="vertical" size={18} style={{ width: '100%' }}>
                    <Descriptions bordered column={1} size="middle">
                      <Descriptions.Item label="应用名称">{selected.appName}</Descriptions.Item>
                      <Descriptions.Item label="应用编码">{selected.appCode}</Descriptions.Item>
                      <Descriptions.Item label="协议">{selected.protocol.toUpperCase()}</Descriptions.Item>
                      <Descriptions.Item label="应用类型">{selected.appType}</Descriptions.Item>
                      <Descriptions.Item label="权限模式">
                        {modeDisplayName(selected.permissionMode, modes)}
                        <Typography.Text type="secondary">（{selected.permissionMode}）</Typography.Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="首页地址">{selected.homepageUrl || '-'}</Descriptions.Item>
                      <Descriptions.Item label="状态">
                        <Tag color={statusMap[selected.status]?.color}>{statusMap[selected.status]?.text ?? selected.status}</Tag>
                      </Descriptions.Item>
                    </Descriptions>
                    <Space>
                      <Button icon={<PoweroffOutlined />} loading={busy} onClick={() => void toggleStatus(selected)}>
                        {selected.status === 'active' ? '禁用应用' : '启用应用'}
                      </Button>
                      <Button type="primary" icon={<KeyOutlined />} onClick={() => setShowClientCreate(true)}>
                        新增登录接入
                      </Button>
                    </Space>
                  </Space>
                )
              },
              {
                key: 'clients',
                label: `登录接入配置 (${oauthClients.length})`,
                children: (
                  <List<OAuthClient>
                    loading={clientLoading}
                    dataSource={oauthClients}
                    locale={{ emptyText: <Empty description="暂无登录接入配置" /> }}
                    renderItem={(client) => (
                      <List.Item
                        actions={[
                          <Button
                            key="copy"
                            type="link"
                            icon={<CopyOutlined />}
                            onClick={() => void copyText(client.clientId, '已复制接入标识')}
                          >
                            复制接入标识
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <Typography.Text strong>{client.clientName}</Typography.Text>
                              <Tag color="blue">OIDC</Tag>
                              <Tag color={statusMap[client.status]?.color}>{statusMap[client.status]?.text ?? client.status}</Tag>
                            </Space>
                          }
                          description={
                            <Space direction="vertical" size={6}>
                              <Typography.Text copyable>接入标识：{client.clientId}</Typography.Text>
                              <Space wrap>
                                {client.scopes.map((scope) => (
                                  <Tag key={scope}>{scope}</Tag>
                                ))}
                              </Space>
                              <Typography.Text type="secondary">
                                授权方式：{client.grantTypes.join(', ')}；PKCE：{client.requirePkce ? '启用' : '关闭'}
                              </Typography.Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )
              },
              {
                key: 'permission',
                label: '权限模式',
                children: (
                  <PermissionPolicyPanel
                    application={selected}
                    modes={modes}
                    busy={busy}
                    onSubmit={handleUpdatePermissionPolicy}
                  />
                )
              },
              {
                key: 'role-permission',
                label: '角色与权限',
                children: <RolePermissionPanel application={selected} />
              },
              {
                key: 'member-authorization',
                label: '成员授权',
                children: <MemberAuthorizationPanel application={selected} />
              },
              {
                key: 'integration',
                label: '接入参数',
                children: (
                  <Descriptions bordered column={1} size="middle">
                    <Descriptions.Item label="Issuer">{issuer}</Descriptions.Item>
                    <Descriptions.Item label="授权端点">{`${issuer}/oauth2/authorize`}</Descriptions.Item>
                    <Descriptions.Item label="Token 端点">{`${issuer}/oauth2/token`}</Descriptions.Item>
                    <Descriptions.Item label="JWKS">{`${issuer}/oauth2/jwks`}</Descriptions.Item>
                    <Descriptions.Item label="默认授权范围">openid profile email</Descriptions.Item>
                  </Descriptions>
                )
              }
            ]}
          />
        )}
      </Drawer>

      <ApplicationCreatePanel modes={modes} open={showCreate} busy={busy} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      {selected && (
        <OAuthClientCreatePanel
          application={selected}
          open={showClientCreate}
          busy={busy}
          onClose={() => setShowClientCreate(false)}
          onSubmit={handleCreateClient}
        />
      )}
      <SecretRevealDialog secret={secret} onClose={() => setSecret(null)} />
    </Space>
  );
}
