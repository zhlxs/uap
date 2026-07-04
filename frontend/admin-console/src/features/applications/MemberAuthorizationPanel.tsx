import { Alert, Button, Checkbox, Empty, Flex, Form, Input, List, Modal, Space, Tag, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { createUser, getMemberAuthorization, updateUserRoles } from '../../api/applications';
import type { Application, MemberAuthorization, User, UserCreateInput } from './types';

type Props = {
  application: Application;
};

const emptyAuthorization: MemberAuthorization = {
  users: [],
  roles: [],
  assignments: []
};

function includesKeyword(values: Array<string | null | undefined>, keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return values.some((value) => (value ?? '').toLowerCase().includes(normalized));
}

export function MemberAuthorizationPanel({ application }: Props) {
  const [authorization, setAuthorization] = useState<MemberAuthorization>(emptyAuthorization);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [form] = Form.useForm<UserCreateInput>();

  async function refresh(nextSelectedUserId?: string) {
    setLoading(true);
    try {
      const data = await getMemberAuthorization(application.id);
      setAuthorization(data);
      const userId = nextSelectedUserId ?? selectedUserId ?? data.users[0]?.id ?? null;
      setSelectedUserId(data.users.some((user) => user.id === userId) ? userId : data.users[0]?.id ?? null);
    } catch (exception) {
      void message.error(exception instanceof Error ? exception.message : '加载成员授权失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelectedUserId(null);
    setKeyword('');
    void refresh();
  }, [application.id]);

  const filteredUsers = useMemo(
    () =>
      authorization.users.filter((user) =>
        includesKeyword([user.displayName, user.employeeNo, user.email, user.mobile], keyword)
      ),
    [authorization.users, keyword]
  );

  const selectedUser = useMemo(
    () => authorization.users.find((user) => user.id === selectedUserId) ?? null,
    [authorization.users, selectedUserId]
  );

  useEffect(() => {
    const assignment = authorization.assignments.find((item) => item.userId === selectedUserId);
    setRoleIds(assignment?.roleIds ?? []);
  }, [authorization.assignments, selectedUserId]);

  async function handleCreateUser(values: UserCreateInput) {
    setSaving(true);
    try {
      const user = await createUser(values);
      setShowCreateUser(false);
      form.resetFields();
      await refresh(user.id);
      void message.success('用户已创建');
    } catch (exception) {
      void message.error(exception instanceof Error ? exception.message : '创建用户失败');
    } finally {
      setSaving(false);
    }
  }

  async function saveRoles() {
    if (!selectedUserId) {
      return;
    }
    setSaving(true);
    try {
      await updateUserRoles(application.id, selectedUserId, { roleIds });
      await refresh(selectedUserId);
      void message.success('成员授权已保存');
    } catch (exception) {
      void message.error(exception instanceof Error ? exception.message : '保存成员授权失败');
    } finally {
      setSaving(false);
    }
  }

  function userDescription(user: User) {
    return [user.employeeNo, user.email, user.mobile].filter(Boolean).join(' · ') || '暂无联系方式';
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="成员授权"
        description="选择用户后，为该用户勾选当前应用下的角色。用户获得角色后，就继承角色上的资源、Scope 和高级业务权限码。"
      />

      <Flex justify="space-between" align="center" gap={12} wrap="wrap">
        <Space>
          <Button type="primary" onClick={() => setShowCreateUser(true)}>
            快速新增用户
          </Button>
          <Button onClick={() => void refresh()} loading={loading}>
            刷新
          </Button>
        </Space>
        <Tag>{`用户 ${authorization.users.length} · 角色 ${authorization.roles.length}`}</Tag>
      </Flex>

      <Flex gap={16} align="stretch" wrap="wrap">
        <div style={{ flex: '0 0 320px', minWidth: 280 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            用户
          </Typography.Title>
          <Input
            allowClear
            placeholder="搜索姓名、工号、邮箱或手机号"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            style={{ margin: '12px 0' }}
          />
          <div style={{ maxHeight: 500, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 8 }}>
            <List<User>
              loading={loading}
              dataSource={filteredUsers}
              locale={{ emptyText: <Empty description="没有匹配的用户" /> }}
              renderItem={(user) => (
                <List.Item
                  onClick={() => setSelectedUserId(user.id)}
                  style={{
                    cursor: 'pointer',
                    padding: '12px 14px',
                    background: user.id === selectedUserId ? '#f0f7ff' : undefined
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Typography.Text strong>{user.displayName}</Typography.Text>
                        {user.id === selectedUserId && <Tag color="blue">当前</Tag>}
                      </Space>
                    }
                    description={userDescription(user)}
                  />
                </List.Item>
              )}
            />
          </div>
        </div>

        <div style={{ flex: '1 1 420px', minWidth: 320 }}>
          <Flex align="center" justify="space-between" gap={12} wrap="wrap">
            <div>
              <Typography.Title level={5} style={{ marginBottom: 4 }}>
                {selectedUser ? selectedUser.displayName : '选择一个用户'}
              </Typography.Title>
              <Typography.Text type="secondary">
                {selectedUser ? userDescription(selectedUser) : '选择左侧用户后，在这里勾选应用角色。'}
              </Typography.Text>
            </div>
            <Button type="primary" disabled={!selectedUser} loading={saving} onClick={() => void saveRoles()}>
              保存授权
            </Button>
          </Flex>

          {!selectedUser ? (
            <Empty style={{ marginTop: 48 }} description="请选择或新增一个用户" />
          ) : (
            <section style={{ marginTop: 18 }}>
              <Flex align="center" justify="space-between" gap={8} wrap="wrap">
                <div>
                  <Typography.Text strong>应用角色</Typography.Text>
                  <Typography.Text type="secondary">
                    {` 已选 ${roleIds.length} / 共 ${authorization.roles.length}`}
                  </Typography.Text>
                </div>
                <Space>
                  <Button size="small" onClick={() => setRoleIds(authorization.roles.map((role) => role.id))}>
                    全选
                  </Button>
                  <Button size="small" onClick={() => setRoleIds([])} disabled={roleIds.length === 0}>
                    清空
                  </Button>
                </Space>
              </Flex>
              <Typography.Paragraph type="secondary" style={{ margin: '6px 0 10px' }}>
                角色决定该用户能访问哪些菜单、按钮、接口以及授权范围。
              </Typography.Paragraph>
              <div style={{ maxHeight: 380, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
                {authorization.roles.length === 0 ? (
                  <Empty description="当前应用还没有角色，请先在角色与权限中新增角色" />
                ) : (
                  <Checkbox.Group value={roleIds} onChange={(values) => setRoleIds(values.map(String))}>
                    <Space direction="vertical" size={10}>
                      {authorization.roles.map((role) => (
                        <Checkbox key={role.id} value={role.id}>
                          <Space direction="vertical" size={0}>
                            <Typography.Text>{role.roleName}</Typography.Text>
                            <Typography.Text type="secondary">{role.roleCode}</Typography.Text>
                          </Space>
                        </Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                )}
              </div>
            </section>
          )}
        </div>
      </Flex>

      <Modal
        title="快速新增用户"
        open={showCreateUser}
        okText="创建"
        cancelText="取消"
        confirmLoading={saving}
        onOk={() => form.submit()}
        onCancel={() => setShowCreateUser(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false} onFinish={(values) => void handleCreateUser(values)}>
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
      </Modal>
    </Space>
  );
}
