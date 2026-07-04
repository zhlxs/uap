import {
  Alert,
  Button,
  Checkbox,
  Collapse,
  Empty,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  createPermissionCode,
  createResource,
  createRole,
  createScope,
  getPermissionConfig,
  updateRoleGrants
} from '../../api/applications';
import type {
  Application,
  ApplicationResource,
  ApplicationRole,
  PermissionCode,
  PermissionCodeCreateInput,
  PermissionConfig,
  ResourceCreateInput,
  RoleCreateInput,
  ScopeCreateInput
} from './types';

type Props = {
  application: Application;
};

type CreateKind = 'role' | 'permission' | 'scope' | 'resource';

const emptyConfig: PermissionConfig = {
  roles: [],
  permissionCodes: [],
  scopes: [],
  resources: [],
  roleGrants: []
};

function includesKeyword(values: Array<string | null | undefined>, keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return values.some((value) => (value ?? '').toLowerCase().includes(normalized));
}

function mergeIds(currentIds: string[], nextIds: string[]) {
  return Array.from(new Set([...currentIds, ...nextIds]));
}

function resourceTypeText(resourceType: string) {
  const typeMap: Record<string, string> = {
    menu: '菜单',
    button: '按钮',
    api: '接口'
  };
  return typeMap[resourceType] ?? resourceType;
}

export function RolePermissionPanel({ application }: Props) {
  const [config, setConfig] = useState<PermissionConfig>(emptyConfig);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [resourceIds, setResourceIds] = useState<string[]>([]);
  const [scopeIds, setScopeIds] = useState<string[]>([]);
  const [permissionCodeIds, setPermissionCodeIds] = useState<string[]>([]);
  const [roleKeyword, setRoleKeyword] = useState('');
  const [resourceKeyword, setResourceKeyword] = useState('');
  const [scopeKeyword, setScopeKeyword] = useState('');
  const [permissionKeyword, setPermissionKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createKind, setCreateKind] = useState<CreateKind | null>(null);
  const [form] = Form.useForm<RoleCreateInput & PermissionCodeCreateInput & ScopeCreateInput & ResourceCreateInput>();

  async function refresh(nextSelectedRoleId?: string) {
    setLoading(true);
    try {
      const data = await getPermissionConfig(application.id);
      setConfig(data);
      const roleId = nextSelectedRoleId ?? selectedRoleId ?? data.roles[0]?.id ?? null;
      setSelectedRoleId(data.roles.some((role) => role.id === roleId) ? roleId : data.roles[0]?.id ?? null);
    } catch (exception) {
      void message.error(exception instanceof Error ? exception.message : '加载角色权限失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelectedRoleId(null);
    setRoleKeyword('');
    setResourceKeyword('');
    setScopeKeyword('');
    setPermissionKeyword('');
    void refresh();
  }, [application.id]);

  const filteredRoles = useMemo(
    () => config.roles.filter((role) => includesKeyword([role.roleName, role.roleCode], roleKeyword)),
    [config.roles, roleKeyword]
  );

  const filteredResources = useMemo(
    () =>
      config.resources.filter((resource) =>
        includesKeyword(
          [resource.resourceName, resource.resourceCode, resource.resourceType, resource.path, resource.urlPattern],
          resourceKeyword
        )
      ),
    [config.resources, resourceKeyword]
  );

  const filteredScopes = useMemo(
    () =>
      config.scopes.filter((scope) =>
        includesKeyword([scope.scopeName, scope.scopeCode, scope.description], scopeKeyword)
      ),
    [config.scopes, scopeKeyword]
  );

  const filteredPermissionCodes = useMemo(
    () =>
      config.permissionCodes.filter((permissionCode) =>
        includesKeyword(
          [permissionCode.permissionName, permissionCode.permissionCode, permissionCode.description],
          permissionKeyword
        )
      ),
    [config.permissionCodes, permissionKeyword]
  );

  const selectedRole = useMemo(
    () => config.roles.find((role) => role.id === selectedRoleId) ?? null,
    [config.roles, selectedRoleId]
  );

  useEffect(() => {
    const grant = config.roleGrants.find((item) => item.roleId === selectedRoleId);
    setResourceIds(grant?.resourceIds ?? []);
    setScopeIds(grant?.scopeIds ?? []);
    setPermissionCodeIds(grant?.permissionCodeIds ?? []);
  }, [config.roleGrants, selectedRoleId]);

  function openCreate(kind: CreateKind) {
    form.resetFields();
    setCreateKind(kind);
  }

  async function handleCreate(values: RoleCreateInput & PermissionCodeCreateInput & ScopeCreateInput & ResourceCreateInput) {
    if (!createKind) {
      return;
    }
    setSaving(true);
    try {
      if (createKind === 'role') {
        const role = await createRole(application.id, {
          roleCode: values.roleCode,
          roleName: values.roleName
        });
        await refresh(role.id);
      }
      if (createKind === 'resource') {
        await createResource(application.id, {
          parentId: values.parentId,
          resourceCode: values.resourceCode,
          resourceName: values.resourceName,
          resourceType: values.resourceType,
          path: values.path,
          httpMethod: values.httpMethod,
          urlPattern: values.urlPattern
        });
        await refresh();
      }
      if (createKind === 'scope') {
        await createScope(application.id, {
          scopeCode: values.scopeCode,
          scopeName: values.scopeName,
          description: values.description
        });
        await refresh();
      }
      if (createKind === 'permission') {
        await createPermissionCode(application.id, {
          permissionCode: values.permissionCode,
          permissionName: values.permissionName,
          description: values.description
        });
        await refresh();
      }
      setCreateKind(null);
      void message.success('已创建');
    } catch (exception) {
      void message.error(exception instanceof Error ? exception.message : '创建失败');
    } finally {
      setSaving(false);
    }
  }

  async function saveGrants() {
    if (!selectedRoleId) {
      return;
    }
    setSaving(true);
    try {
      await updateRoleGrants(selectedRoleId, { permissionCodeIds, scopeIds, resourceIds });
      await refresh(selectedRoleId);
      void message.success('角色授权已保存');
    } catch (exception) {
      void message.error(exception instanceof Error ? exception.message : '保存授权失败');
    } finally {
      setSaving(false);
    }
  }

  function modalTitle() {
    if (createKind === 'role') {
      return '新增应用角色';
    }
    if (createKind === 'resource') {
      return '新增菜单/按钮/接口资源';
    }
    if (createKind === 'scope') {
      return '新增授权范围';
    }
    return '新增业务权限码';
  }

  function renderResource(resource: ApplicationResource) {
    return (
      <Checkbox key={resource.id} value={resource.id} style={{ width: '100%' }}>
        <Space direction="vertical" size={0}>
          <Space>
            <Typography.Text>{resource.resourceName}</Typography.Text>
            <Tag>{resourceTypeText(resource.resourceType)}</Tag>
          </Space>
          <Typography.Text type="secondary">
            {resource.resourceCode}
            {resource.path ? ` · ${resource.path}` : ''}
            {resource.urlPattern ? ` · ${resource.httpMethod ?? 'ANY'} ${resource.urlPattern}` : ''}
          </Typography.Text>
        </Space>
      </Checkbox>
    );
  }

  function renderPermissionCode(permissionCode: PermissionCode) {
    return (
      <Checkbox key={permissionCode.id} value={permissionCode.id} style={{ width: '100%' }}>
        <Space direction="vertical" size={0}>
          <Typography.Text>{permissionCode.permissionName}</Typography.Text>
          <Typography.Text type="secondary">
            {permissionCode.permissionCode}
            {permissionCode.description ? ` · ${permissionCode.description}` : ''}
          </Typography.Text>
        </Space>
      </Checkbox>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="角色授权"
        description="推荐优先维护菜单、按钮和接口资源。权限码仅用于不对应具体资源的业务能力，放在高级配置中。"
      />

      <Flex justify="space-between" align="center" gap={12} wrap="wrap">
        <Space wrap>
          <Button type="primary" onClick={() => openCreate('role')}>
            新增角色
          </Button>
          <Button onClick={() => openCreate('resource')}>新增资源</Button>
          <Button onClick={() => openCreate('scope')}>新增授权范围</Button>
          <Button onClick={() => openCreate('permission')}>新增业务权限码</Button>
        </Space>
        <Button onClick={() => void refresh()} loading={loading}>
          刷新
        </Button>
      </Flex>

      <Flex gap={16} align="stretch" wrap="wrap">
        <div style={{ flex: '0 0 280px', minWidth: 260 }}>
          <Flex align="center" justify="space-between" gap={8}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              应用角色
            </Typography.Title>
            <Tag>{config.roles.length}</Tag>
          </Flex>
          <Input
            allowClear
            placeholder="搜索角色名称或编码"
            value={roleKeyword}
            onChange={(event) => setRoleKeyword(event.target.value)}
            style={{ margin: '12px 0' }}
          />
          <div style={{ maxHeight: 500, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 8 }}>
            <List<ApplicationRole>
              loading={loading}
              dataSource={filteredRoles}
              locale={{ emptyText: <Empty description="没有匹配的角色" /> }}
              renderItem={(role) => (
                <List.Item
                  onClick={() => setSelectedRoleId(role.id)}
                  style={{
                    cursor: 'pointer',
                    padding: '12px 14px',
                    background: role.id === selectedRoleId ? '#f0f7ff' : undefined
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Typography.Text strong>{role.roleName}</Typography.Text>
                        {role.id === selectedRoleId && <Tag color="blue">当前</Tag>}
                      </Space>
                    }
                    description={role.roleCode}
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
                {selectedRole ? selectedRole.roleName : '选择一个角色'}
              </Typography.Title>
              <Typography.Text type="secondary">
                {selectedRole ? `角色编码：${selectedRole.roleCode}` : '选择左侧角色后，在这里勾选授权内容。'}
              </Typography.Text>
            </div>
            <Button type="primary" disabled={!selectedRole} loading={saving} onClick={() => void saveGrants()}>
              保存授权
            </Button>
          </Flex>

          {!selectedRole ? (
            <Empty style={{ marginTop: 48 }} description="请选择或新增一个角色" />
          ) : (
            <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 18 }}>
              <section>
                <Flex align="center" justify="space-between" gap={8} wrap="wrap">
                  <div>
                    <Typography.Text strong>资源权限</Typography.Text>
                    <Typography.Text type="secondary">
                      {` 已选 ${resourceIds.length} / 共 ${config.resources.length}`}
                    </Typography.Text>
                  </div>
                  <Space>
                    <Button
                      size="small"
                      onClick={() => setResourceIds((current) => mergeIds(current, filteredResources.map((item) => item.id)))}
                      disabled={filteredResources.length === 0}
                    >
                      全选当前筛选
                    </Button>
                    <Button size="small" onClick={() => setResourceIds([])} disabled={resourceIds.length === 0}>
                      清空
                    </Button>
                  </Space>
                </Flex>
                <Typography.Paragraph type="secondary" style={{ margin: '6px 0 10px' }}>
                  控制角色能看到哪些菜单、能点击哪些按钮、能访问哪些接口。
                </Typography.Paragraph>
                <Input
                  allowClear
                  placeholder="搜索资源名称、编码、路径或接口地址"
                  value={resourceKeyword}
                  onChange={(event) => setResourceKeyword(event.target.value)}
                  style={{ marginBottom: 10 }}
                />
                <div style={{ maxHeight: 280, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
                  {config.resources.length === 0 ? (
                    <Empty description="还没有菜单、按钮或接口资源" />
                  ) : filteredResources.length === 0 ? (
                    <Empty description="没有匹配的资源" />
                  ) : (
                    <Checkbox.Group value={resourceIds} onChange={(values) => setResourceIds(values.map(String))}>
                      <Space direction="vertical" size={10} style={{ width: '100%' }}>
                        {filteredResources.map(renderResource)}
                      </Space>
                    </Checkbox.Group>
                  )}
                </div>
              </section>

              <section>
                <Flex align="center" justify="space-between" gap={8} wrap="wrap">
                  <div>
                    <Typography.Text strong>授权范围</Typography.Text>
                    <Typography.Text type="secondary">
                      {` 已选 ${scopeIds.length} / 共 ${config.scopes.length}`}
                    </Typography.Text>
                  </div>
                  <Space>
                    <Button
                      size="small"
                      onClick={() => setScopeIds((current) => mergeIds(current, filteredScopes.map((item) => item.id)))}
                      disabled={filteredScopes.length === 0}
                    >
                      全选当前筛选
                    </Button>
                    <Button size="small" onClick={() => setScopeIds([])} disabled={scopeIds.length === 0}>
                      清空
                    </Button>
                  </Space>
                </Flex>
                <Typography.Paragraph type="secondary" style={{ margin: '6px 0 10px' }}>
                  Scope 用于 OAuth/OIDC 授权范围，例如 profile、email、crm.read。
                </Typography.Paragraph>
                <Input
                  allowClear
                  placeholder="搜索范围名称、编码或说明"
                  value={scopeKeyword}
                  onChange={(event) => setScopeKeyword(event.target.value)}
                  style={{ marginBottom: 10 }}
                />
                <div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
                  {config.scopes.length === 0 ? (
                    <Empty description="还没有授权范围" />
                  ) : filteredScopes.length === 0 ? (
                    <Empty description="没有匹配的授权范围" />
                  ) : (
                    <Checkbox.Group value={scopeIds} onChange={(values) => setScopeIds(values.map(String))}>
                      <Space direction="vertical" size={10}>
                        {filteredScopes.map((scope) => (
                          <Checkbox key={scope.id} value={scope.id}>
                            <Space direction="vertical" size={0}>
                              <Typography.Text>{scope.scopeName}</Typography.Text>
                              <Typography.Text type="secondary">
                                {scope.scopeCode}
                                {scope.description ? ` · ${scope.description}` : ''}
                              </Typography.Text>
                            </Space>
                          </Checkbox>
                        ))}
                      </Space>
                    </Checkbox.Group>
                  )}
                </div>
              </section>

              <Collapse
                size="small"
                items={[
                  {
                    key: 'permission-code',
                    label: `高级：业务权限码（已选 ${permissionCodeIds.length} / 共 ${config.permissionCodes.length}）`,
                    children: (
                      <Space direction="vertical" size={10} style={{ width: '100%' }}>
                        <Typography.Text type="secondary">
                          只有当权限不对应菜单、按钮或接口时才维护这里，例如“导出敏感数据”“强制复核通过”。
                        </Typography.Text>
                        <Flex justify="space-between" gap={8} wrap="wrap">
                          <Input
                            allowClear
                            placeholder="搜索权限名称、权限码或说明"
                            value={permissionKeyword}
                            onChange={(event) => setPermissionKeyword(event.target.value)}
                            style={{ maxWidth: 340 }}
                          />
                          <Space>
                            <Button
                              size="small"
                              onClick={() =>
                                setPermissionCodeIds((current) =>
                                  mergeIds(current, filteredPermissionCodes.map((item) => item.id))
                                )
                              }
                              disabled={filteredPermissionCodes.length === 0}
                            >
                              全选当前筛选
                            </Button>
                            <Button
                              size="small"
                              onClick={() => setPermissionCodeIds([])}
                              disabled={permissionCodeIds.length === 0}
                            >
                              清空
                            </Button>
                          </Space>
                        </Flex>
                        <div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
                          {config.permissionCodes.length === 0 ? (
                            <Empty description="还没有业务权限码" />
                          ) : filteredPermissionCodes.length === 0 ? (
                            <Empty description="没有匹配的业务权限码" />
                          ) : (
                            <Checkbox.Group
                              value={permissionCodeIds}
                              onChange={(values) => setPermissionCodeIds(values.map(String))}
                              style={{ width: '100%' }}
                            >
                              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                {filteredPermissionCodes.map(renderPermissionCode)}
                              </Space>
                            </Checkbox.Group>
                          )}
                        </div>
                      </Space>
                    )
                  }
                ]}
              />
            </Space>
          )}
        </div>
      </Flex>

      <Modal
        title={modalTitle()}
        open={createKind !== null}
        okText="创建"
        cancelText="取消"
        confirmLoading={saving}
        onOk={() => form.submit()}
        onCancel={() => setCreateKind(null)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false} onFinish={(values) => void handleCreate(values)}>
          {createKind === 'role' && (
            <>
              <Form.Item label="角色编码" name="roleCode" rules={[{ required: true, message: '请输入角色编码' }]}>
                <Input placeholder="例如：admin" maxLength={64} />
              </Form.Item>
              <Form.Item label="角色名称" name="roleName" rules={[{ required: true, message: '请输入角色名称' }]}>
                <Input placeholder="例如：管理员" maxLength={128} />
              </Form.Item>
            </>
          )}
          {createKind === 'resource' && (
            <>
              <Form.Item label="资源类型" name="resourceType" initialValue="menu" rules={[{ required: true, message: '请选择资源类型' }]}>
                <Select
                  options={[
                    { value: 'menu', label: '菜单' },
                    { value: 'button', label: '按钮' },
                    { value: 'api', label: '接口' }
                  ]}
                />
              </Form.Item>
              <Form.Item label="父级资源" name="parentId">
                <Select
                  allowClear
                  placeholder="可选，按钮和接口通常挂在某个菜单下"
                  options={config.resources.map((resource) => ({
                    value: resource.id,
                    label: `${resource.resourceName}（${resourceTypeText(resource.resourceType)}）`
                  }))}
                />
              </Form.Item>
              <Form.Item label="资源编码" name="resourceCode" rules={[{ required: true, message: '请输入资源编码' }]}>
                <Input placeholder="例如：user:menu 或 user:create" maxLength={128} />
              </Form.Item>
              <Form.Item label="资源名称" name="resourceName" rules={[{ required: true, message: '请输入资源名称' }]}>
                <Input placeholder="例如：用户管理、创建用户" maxLength={128} />
              </Form.Item>
              <Form.Item label="前端路由" name="path">
                <Input placeholder="菜单资源可填，例如：/users" maxLength={512} />
              </Form.Item>
              <Form.Item label="接口方法" name="httpMethod">
                <Select
                  allowClear
                  placeholder="接口资源可选"
                  options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((method) => ({
                    value: method,
                    label: method
                  }))}
                />
              </Form.Item>
              <Form.Item label="接口地址" name="urlPattern">
                <Input placeholder="接口资源可填，例如：/api/users/**" maxLength={512} />
              </Form.Item>
            </>
          )}
          {createKind === 'scope' && (
            <>
              <Form.Item label="授权范围编码" name="scopeCode" rules={[{ required: true, message: '请输入授权范围编码' }]}>
                <Input placeholder="例如：crm.read" maxLength={128} />
              </Form.Item>
              <Form.Item label="授权范围名称" name="scopeName" rules={[{ required: true, message: '请输入授权范围名称' }]}>
                <Input placeholder="例如：读取 CRM 数据" maxLength={128} />
              </Form.Item>
              <Form.Item label="说明" name="description">
                <Input placeholder="可选，说明业务系统可以读取什么" maxLength={512} />
              </Form.Item>
            </>
          )}
          {createKind === 'permission' && (
            <>
              <Form.Item label="业务权限码" name="permissionCode" rules={[{ required: true, message: '请输入业务权限码' }]}>
                <Input placeholder="例如：risk:override_review" maxLength={128} />
              </Form.Item>
              <Form.Item label="权限名称" name="permissionName" rules={[{ required: true, message: '请输入权限名称' }]}>
                <Input placeholder="例如：强制复核通过" maxLength={128} />
              </Form.Item>
              <Form.Item label="说明" name="description">
                <Input placeholder="可选，说明这个权限允许做什么" maxLength={512} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Space>
  );
}
