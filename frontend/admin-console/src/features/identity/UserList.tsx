import {
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
  TeamOutlined
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
  Form,
  Input,
  List,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { createUser, disableUser, enableUser, getUser, listUsers, lockUser, updateUser } from '../../api/applications';
import type { User, UserCreateInput, UserDetail } from '../applications/types';

const userStatusMap: Record<string, { color: string; text: string }> = {
  active: { color: 'success', text: '已启用' },
  disabled: { color: 'default', text: '已禁用' },
  locked: { color: 'error', text: '已锁定' },
  pending: { color: 'warning', text: '待激活' }
};

function userDescription(user: User) {
  return [user.employeeNo, user.email, user.mobile].filter(Boolean).join(' · ') || '暂无联系方式';
}

function matchesKeyword(user: User, keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return [user.displayName, user.employeeNo, user.email, user.mobile].some((value) =>
    (value ?? '').toLowerCase().includes(normalized)
  );
}

function statusTag(statusValue: string) {
  const status = userStatusMap[statusValue] ?? { color: 'default', text: statusValue };
  return <Tag color={status.color}>{status.text}</Tag>;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<UserDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [createForm] = Form.useForm<UserCreateInput>();
  const [editForm] = Form.useForm<UserCreateInput>();

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await listUsers();
      setUsers(data);
      setSelectedDetail((current) => {
        if (!current) {
          return current;
        }
        const updatedUser = data.find((user) => user.id === current.user.id);
        return updatedUser ? { ...current, user: updatedUser } : null;
      });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '加载用户失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filteredUsers = useMemo(() => users.filter((user) => matchesKeyword(user, keyword)), [users, keyword]);
  const activeCount = useMemo(() => users.filter((user) => user.status === 'active').length, [users]);
  const disabledCount = useMemo(() => users.filter((user) => user.status === 'disabled').length, [users]);
  const lockedCount = useMemo(() => users.filter((user) => user.status === 'locked').length, [users]);

  function fillEditForm(detail: UserDetail) {
    editForm.setFieldsValue({
      displayName: detail.user.displayName,
      employeeNo: detail.user.employeeNo ?? undefined,
      email: detail.user.email ?? undefined,
      mobile: detail.user.mobile ?? undefined
    });
  }

  async function openDetail(userId: string, editAfterOpen = false) {
    setDetailLoading(true);
    setEditing(editAfterOpen);
    try {
      const detail = await getUser(userId);
      setSelectedDetail(detail);
      if (editAfterOpen) {
        fillEditForm(detail);
      }
    } catch (exception) {
      void message.error(exception instanceof Error ? exception.message : '加载用户详情失败');
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setSelectedDetail(null);
    setEditing(false);
  }

  function startEdit() {
    if (!selectedDetail) {
      return;
    }
    fillEditForm(selectedDetail);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function handleCreate(values: UserCreateInput) {
    setSaving(true);
    setError(null);
    try {
      const created = await createUser(values);
      setShowCreate(false);
      createForm.resetFields();
      await refresh();
      await openDetail(created.id);
      void message.success('用户已创建');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '创建用户失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(values: UserCreateInput) {
    if (!selectedDetail) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateUser(selectedDetail.user.id, values);
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
      setSelectedDetail((current) => (current ? { ...current, user: updated } : current));
      setEditing(false);
      void message.success('用户信息已保存');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '保存用户失败');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(user: User, action: 'enable' | 'disable' | 'lock') {
    setSaving(true);
    try {
      const updated =
        action === 'enable' ? await enableUser(user.id) : action === 'disable' ? await disableUser(user.id) : await lockUser(user.id);
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedDetail((current) => (current?.user.id === updated.id ? { ...current, user: updated } : current));
      void message.success('用户状态已更新');
    } catch (exception) {
      void message.error(exception instanceof Error ? exception.message : '更新用户状态失败');
    } finally {
      setSaving(false);
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: '用户',
      dataIndex: 'displayName',
      ellipsis: true,
      render: (_, record) => (
        <Typography.Text className="nowrap-cell">
          <Typography.Text strong>{record.displayName}</Typography.Text>
          <Typography.Text type="secondary"> · {userDescription(record)}</Typography.Text>
        </Typography.Text>
      )
    },
    {
      title: '工号',
      dataIndex: 'employeeNo',
      width: 120,
      ellipsis: true,
      render: (value: string | null) => value || '-'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      ellipsis: true,
      render: (value: string | null) => value || '-'
    },
    {
      title: '手机号',
      dataIndex: 'mobile',
      width: 140,
      ellipsis: true,
      render: (value: string | null) => value || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: statusTag
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      ellipsis: true,
      render: (value: string) => new Date(value).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 320,
      render: (_, record) => (
        <Space size={4} className="nowrap-actions">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => void openDetail(record.id)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => void openDetail(record.id, true)}>
            编辑
          </Button>
          {record.status === 'disabled' ? (
            <Button type="link" size="small" onClick={() => void updateStatus(record, 'enable')} loading={saving}>
              启用
            </Button>
          ) : record.status === 'locked' ? (
            <Button type="link" size="small" onClick={() => void updateStatus(record, 'enable')} loading={saving}>
              解除锁定
            </Button>
          ) : (
            <Popconfirm title="禁用适用于离职、停用等管理动作，确认禁用该用户？" onConfirm={() => void updateStatus(record, 'disable')}>
              <Button type="link" size="small" icon={<StopOutlined />} loading={saving}>
                禁用
              </Button>
            </Popconfirm>
          )}
          {record.status !== 'locked' && (
            <Popconfirm title="锁定适用于异常登录、风险处置等安全动作，确认锁定该用户？" onConfirm={() => void updateStatus(record, 'lock')}>
              <Button type="link" size="small" danger icon={<LockOutlined />} loading={saving}>
                锁定
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Flex align="center" justify="space-between" gap={16} wrap="wrap">
        <div>
          <Typography.Text type="secondary">身份中心 / Identity Center</Typography.Text>
          <Typography.Title level={3} style={{ margin: '4px 0 0' }}>
            用户与组织
          </Typography.Title>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void refresh()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>
            新增用户
          </Button>
        </Space>
      </Flex>

      {error && <Alert type="error" showIcon message={error} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="用户总数" value={users.length} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="已启用" value={activeCount} suffix={`/ ${users.length}`} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="已禁用" value={disabledCount} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="已锁定" value={lockedCount} />
          </Card>
        </Col>
      </Row>

      <Card
        title="用户清单"
        extra={
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索姓名、工号、邮箱或手机号"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            style={{ width: 280 }}
          />
        }
      >
        <Table<User>
          className="nowrap-table"
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredUsers}
          locale={{ emptyText: <Empty description="暂无用户，请先新增用户" /> }}
          scroll={{ x: 1280 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          onRow={(record) => ({
            onDoubleClick: () => void openDetail(record.id)
          })}
        />
      </Card>

      <UserFormModal
        open={showCreate}
        form={createForm}
        saving={saving}
        onCancel={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />

      <Drawer
        title={
          selectedDetail
            ? `${selectedDetail.user.displayName} · 用户详情`
            : '用户详情'
        }
        width={760}
        open={selectedDetail !== null}
        loading={detailLoading}
        onClose={closeDetail}
        extra={
          selectedDetail && !editing && (
            <Space>
              <Button icon={<EditOutlined />} onClick={startEdit}>
                编辑
              </Button>
              {selectedDetail.user.status === 'disabled' ? (
                <Button onClick={() => void updateStatus(selectedDetail.user, 'enable')}>启用</Button>
              ) : selectedDetail.user.status === 'locked' ? (
                <Button onClick={() => void updateStatus(selectedDetail.user, 'enable')}>解除锁定</Button>
              ) : (
                <Button icon={<StopOutlined />} onClick={() => void updateStatus(selectedDetail.user, 'disable')}>
                  禁用
                </Button>
              )}
              {selectedDetail.user.status !== 'locked' && (
                <Button danger icon={<LockOutlined />} onClick={() => void updateStatus(selectedDetail.user, 'lock')}>
                  锁定
                </Button>
              )}
            </Space>
          )
        }
      >
        {selectedDetail && (
          editing ? (
            <EditUserForm
              form={editForm}
              saving={saving}
              onCancel={cancelEdit}
              onSubmit={handleUpdate}
            />
          ) : (
            <UserDetailView detail={selectedDetail} />
          )
        )}
      </Drawer>
    </Space>
  );
}

type UserFormModalProps = {
  open: boolean;
  form: ReturnType<typeof Form.useForm<UserCreateInput>>[0];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: UserCreateInput) => Promise<void>;
};

function UserFormModal({ open, form, saving, onCancel, onSubmit }: UserFormModalProps) {
  return (
    <Drawer
      title="新增用户"
      width={520}
      open={open}
      onClose={onCancel}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            创建
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark={false} onFinish={(values) => void onSubmit(values)}>
        <Form.Item label="显示名称" name="displayName" rules={[{ required: true, message: '请输入显示名称' }]}>
          <Input placeholder="例如：张三" maxLength={128} />
        </Form.Item>
        <Form.Item label="工号" name="employeeNo">
          <Input placeholder="可选，例如：E10001" maxLength={64} />
        </Form.Item>
        <Form.Item label="邮箱" name="email">
          <Input placeholder="可选，例如：zhangsan@example.com" maxLength={255} />
        </Form.Item>
        <Form.Item label="手机号" name="mobile">
          <Input placeholder="可选" maxLength={32} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

type EditUserFormProps = {
  form: ReturnType<typeof Form.useForm<UserCreateInput>>[0];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: UserCreateInput) => Promise<void>;
};

function EditUserForm({ form, saving, onCancel, onSubmit }: EditUserFormProps) {
  return (
    <Card size="small" title="编辑用户">
      <Form form={form} layout="vertical" requiredMark={false} onFinish={(values) => void onSubmit(values)}>
        <Form.Item label="显示名称" name="displayName" rules={[{ required: true, message: '请输入显示名称' }]}>
          <Input placeholder="例如：张三" maxLength={128} />
        </Form.Item>
        <Form.Item label="工号" name="employeeNo">
          <Input placeholder="可选，例如：E10001" maxLength={64} />
        </Form.Item>
        <Form.Item label="邮箱" name="email">
          <Input placeholder="可选，例如：zhangsan@example.com" maxLength={255} />
        </Form.Item>
        <Form.Item label="手机号" name="mobile">
          <Input placeholder="可选" maxLength={32} />
        </Form.Item>
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            保存
          </Button>
        </Space>
      </Form>
    </Card>
  );
}

type UserDetailViewProps = {
  detail: UserDetail;
};

function UserDetailView({ detail }: UserDetailViewProps) {
  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Descriptions bordered column={1} size="middle">
        <Descriptions.Item label="显示名称">{detail.user.displayName}</Descriptions.Item>
        <Descriptions.Item label="工号">{detail.user.employeeNo || '-'}</Descriptions.Item>
        <Descriptions.Item label="邮箱">{detail.user.email || '-'}</Descriptions.Item>
        <Descriptions.Item label="手机号">{detail.user.mobile || '-'}</Descriptions.Item>
        <Descriptions.Item label="状态">{statusTag(detail.user.status)}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{new Date(detail.user.createdAt).toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label="更新时间">{new Date(detail.user.updatedAt).toLocaleString()}</Descriptions.Item>
      </Descriptions>

      <Card size="small" title={`应用授权关系 (${detail.authorizations.length})`}>
        <List
          dataSource={detail.authorizations}
          locale={{ emptyText: <Empty description="该用户暂未被授予任何应用角色" /> }}
          renderItem={(authorization) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space wrap>
                    <Typography.Text strong>{authorization.appName}</Typography.Text>
                    <Typography.Text type="secondary">{authorization.appCode}</Typography.Text>
                    <Tag>{authorization.permissionMode}</Tag>
                    {statusTag(authorization.status)}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={6}>
                    <Typography.Text type="secondary">
                      协议：{authorization.protocol.toUpperCase()}；应用类型：{authorization.appType}
                    </Typography.Text>
                    <Space wrap>
                      {authorization.roles.map((role) => (
                        <Tag key={role.id} color="blue">
                          {role.roleName} · {role.roleCode}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
