import {
  Alert,
  Button,
  Card,
  Checkbox,
  Empty,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Space,
  Statistic,
  Tag,
  Typography,
  message
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { createUser, getMemberAuthorization, updateUserRoles } from '../../api/applications';
import type { Application, ApplicationResource, MemberAuthorization, RoleGrant, User, UserCreateInput } from './types';

type Props = {
  application: Application;
};

type AuthorizationPreview = {
  permissionCodeIds: string[];
  scopeIds: string[];
  resourceIds: string[];
};

const emptyAuthorization: MemberAuthorization = {
  users: [],
  roles: [],
  permissionCodes: [],
  scopes: [],
  resources: [],
  roleGrants: [],
  assignments: []
};

function includesKeyword(values: Array<string | null | undefined>, keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return values.some((value) => (value ?? '').toLowerCase().includes(normalized));
}

function mergeUnique(values: string[]) {
  return Array.from(new Set(values));
}

function userDescription(user: User) {
  return [user.employeeNo, user.email, user.mobile].filter(Boolean).join(' · ') || '暂无联系方式';
}

function resourceTypeText(resourceType: string) {
  const typeMap: Record<string, string> = {
    menu: '菜单',
    button: '按钮',
    api: '接口'
  };
  return typeMap[resourceType] ?? resourceType;
}

function summarizeRoleGrant(roleGrants: RoleGrant[], roleId: string) {
  return roleGrants.find((grant) => grant.roleId === roleId) ?? {
    roleId,
    permissionCodeIds: [],
    scopeIds: [],
    resourceIds: []
  };
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

  const selectedRoles = useMemo(
    () => authorization.roles.filter((role) => roleIds.includes(role.id)),
    [authorization.roles, roleIds]
  );

  const preview = useMemo<AuthorizationPreview>(() => {
    const grants = roleIds.map((roleId) => summarizeRoleGrant(authorization.roleGrants, roleId));
    return {
      permissionCodeIds: mergeUnique(grants.flatMap((grant) => grant.permissionCodeIds)),
      scopeIds: mergeUnique(grants.flatMap((grant) => grant.scopeIds)),
      resourceIds: mergeUnique(grants.flatMap((grant) => grant.resourceIds))
    };
  }, [authorization.roleGrants, roleIds]);

  const previewResources = useMemo(
    () => authorization.resources.filter((resource) => preview.resourceIds.includes(resource.id)),
    [authorization.resources, preview.resourceIds]
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
    await saveRoleIds(roleIds, '成员授权已保存');
  }

  async function revokeRoles() {
    await saveRoleIds([], '成员授权已取消');
  }

  async function saveRoleIds(nextRoleIds: string[], successText: string) {
    if (!selectedUserId) {
      return;
    }
    setSaving(true);
    try {
      await updateUserRoles(application.id, selectedUserId, { roleIds: nextRoleIds });
      await refresh(selectedUserId);
      void message.success(successText);
    } catch (exception) {
      void message.error(exception instanceof Error ? exception.message : '保存成员授权失败');
    } finally {
      setSaving(false);
    }
  }

  function renderResource(resource: ApplicationResource) {
    return (
      <Tag key={resource.id}>
        {resource.resourceName} · {resourceTypeText(resource.resourceType)}
      </Tag>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="成员授权"
        description="选择用户后，为该用户勾选当前应用下的角色。右侧会实时预览该用户将获得的角色、资源、Scope 和高级业务权限码。"
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
        <Space wrap>
          <Tag>{`用户 ${authorization.users.length}`}</Tag>
          <Tag>{`角色 ${authorization.roles.length}`}</Tag>
          <Tag>{`资源 ${authorization.resources.length}`}</Tag>
          <Tag>{`Scope ${authorization.scopes.length}`}</Tag>
        </Space>
      </Flex>

      {authorization.roles.length === 0 && (
        <Alert
          type="warning"
          showIcon
          message="当前应用还没有角色"
          description="请先到“角色与权限”页签创建应用角色，并为角色绑定资源、Scope 或业务权限码，然后再进行成员授权。"
        />
      )}

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
          <div style={{ maxHeight: 560, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 8 }}>
            <List<User>
              loading={loading}
              dataSource={filteredUsers}
              locale={{ emptyText: <Empty description="暂无用户，请先新增用户" /> }}
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

        <div style={{ flex: '1 1 520px', minWidth: 320 }}>
          <Flex align="center" justify="space-between" gap={12} wrap="wrap">
            <div>
              <Typography.Title level={5} style={{ marginBottom: 4 }}>
                {selectedUser ? selectedUser.displayName : '选择一个用户'}
              </Typography.Title>
              <Typography.Text type="secondary">
                {selectedUser ? userDescription(selectedUser) : '选择左侧用户后，在这里勾选应用角色。'}
              </Typography.Text>
            </div>
            <Space>
              <Popconfirm
                title="取消授权"
                description="确认取消该用户在当前应用下的全部角色授权？"
                disabled={!selectedUser || roleIds.length === 0}
                onConfirm={() => void revokeRoles()}
              >
                <Button disabled={!selectedUser || roleIds.length === 0} loading={saving}>
                  取消授权
                </Button>
              </Popconfirm>
              <Button type="primary" disabled={!selectedUser} loading={saving} onClick={() => void saveRoles()}>
                保存授权
              </Button>
            </Space>
          </Flex>

          {!selectedUser ? (
            <Empty style={{ marginTop: 48 }} description="请选择或新增一个用户" />
          ) : (
            <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 18 }}>
              <section>
                <Flex align="center" justify="space-between" gap={8} wrap="wrap">
                  <div>
                    <Typography.Text strong>应用角色</Typography.Text>
                    <Typography.Text type="secondary">
                      {` 已选 ${roleIds.length} / 共 ${authorization.roles.length}`}
                    </Typography.Text>
                  </div>
                  <Space>
                    <Button
                      size="small"
                      onClick={() => setRoleIds(authorization.roles.map((role) => role.id))}
                      disabled={authorization.roles.length === 0}
                    >
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
                <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
                  {authorization.roles.length === 0 ? (
                    <Empty description="当前应用还没有角色，请先在角色与权限中新增角色" />
                  ) : (
                    <Checkbox.Group value={roleIds} onChange={(values) => setRoleIds(values.map(String))} style={{ width: '100%' }}>
                      <Space direction="vertical" size={10} style={{ width: '100%' }}>
                        {authorization.roles.map((role) => {
                          const grant = summarizeRoleGrant(authorization.roleGrants, role.id);
                          return (
                            <Checkbox key={role.id} value={role.id} style={{ width: '100%' }}>
                              <Space direction="vertical" size={0}>
                                <Typography.Text>{role.roleName}</Typography.Text>
                                <Typography.Text type="secondary">
                                  {role.roleCode} · 资源 {grant.resourceIds.length} · Scope {grant.scopeIds.length} · 权限码{' '}
                                  {grant.permissionCodeIds.length}
                                </Typography.Text>
                              </Space>
                            </Checkbox>
                          );
                        })}
                      </Space>
                    </Checkbox.Group>
                  )}
                </div>
              </section>

              <Card size="small" title="授权结果预览">
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <RowPreview title="角色" emptyText="未选择角色">
                    {selectedRoles.map((role) => (
                      <Tag key={role.id} color="blue">
                        {role.roleName} · {role.roleCode}
                      </Tag>
                    ))}
                  </RowPreview>
                  <RowPreview title="资源" emptyText="未获得资源权限">
                    {previewResources.map(renderResource)}
                  </RowPreview>
                  <RowPreview title="Scope" emptyText="未获得授权范围">
                    {authorization.scopes
                      .filter((scope) => preview.scopeIds.includes(scope.id))
                      .map((scope) => (
                        <Tag key={scope.id} color="green">
                          {scope.scopeCode}
                        </Tag>
                      ))}
                  </RowPreview>
                  <RowPreview title="业务权限码" emptyText="未获得业务权限码">
                    {authorization.permissionCodes
                      .filter((permissionCode) => preview.permissionCodeIds.includes(permissionCode.id))
                      .map((permissionCode) => (
                        <Tag key={permissionCode.id} color="purple">
                          {permissionCode.permissionCode}
                        </Tag>
                      ))}
                  </RowPreview>
                </Space>
              </Card>

              <Card size="small">
                <Flex gap={16} wrap="wrap">
                  <Statistic title="已选角色" value={roleIds.length} />
                  <Statistic title="资源权限" value={preview.resourceIds.length} />
                  <Statistic title="Scope" value={preview.scopeIds.length} />
                  <Statistic title="业务权限码" value={preview.permissionCodeIds.length} />
                </Flex>
              </Card>
            </Space>
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

type RowPreviewProps = {
  title: string;
  emptyText: string;
  children: React.ReactNode;
};

function RowPreview({ title, emptyText, children }: RowPreviewProps) {
  const hasContent = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div>
      <Typography.Text strong>{title}</Typography.Text>
      <div style={{ marginTop: 6 }}>
        {hasContent ? <Space wrap>{children}</Space> : <Typography.Text type="secondary">{emptyText}</Typography.Text>}
      </div>
    </div>
  );
}
