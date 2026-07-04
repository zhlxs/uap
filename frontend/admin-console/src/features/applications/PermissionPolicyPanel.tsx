import { Alert, Button, Descriptions, Flex, Select, Space, Switch, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { Application, ApplicationMode, PermissionCapabilities, PermissionPolicyUpdateInput } from './types';

type Props = {
  application: Application;
  modes: ApplicationMode[];
  busy: boolean;
  onSubmit: (input: PermissionPolicyUpdateInput) => Promise<void>;
};

function parseCapabilities(json: string | null | undefined): PermissionCapabilities | null {
  if (!json) {
    return null;
  }
  try {
    return JSON.parse(json) as PermissionCapabilities;
  } catch {
    return null;
  }
}

function withDefaultShape(capabilities: PermissionCapabilities | null): PermissionCapabilities {
  return {
    app_access_control: capabilities?.app_access_control ?? false,
    role_permission_enabled: capabilities?.role_permission_enabled ?? false,
    resource_managed_by_uap: {
      menu: capabilities?.resource_managed_by_uap?.menu ?? false,
      button: capabilities?.resource_managed_by_uap?.button ?? false,
      api: capabilities?.resource_managed_by_uap?.api ?? false
    },
    data_scope_managed_by_uap: capabilities?.data_scope_managed_by_uap ?? false,
    permission_delivery: {
      token_claims: capabilities?.permission_delivery?.token_claims ?? false,
      permission_api: capabilities?.permission_delivery?.permission_api ?? false
    }
  };
}

function modeDefaultCapabilities(mode: string, modes: ApplicationMode[]) {
  return withDefaultShape(parseCapabilities(modes.find((item) => item.mode === mode)?.defaultCapabilitiesJson));
}

function enabledText(enabled?: boolean) {
  return enabled ? '已开启' : '已关闭';
}

export function PermissionPolicyPanel({ application, modes, busy, onSubmit }: Props) {
  const originalCapabilities = useMemo(
    () => withDefaultShape(parseCapabilities(application.permissionCapabilitiesJson)),
    [application.permissionCapabilitiesJson]
  );
  const [permissionMode, setPermissionMode] = useState(application.permissionMode);
  const [capabilities, setCapabilities] = useState<PermissionCapabilities>(originalCapabilities);

  useEffect(() => {
    setPermissionMode(application.permissionMode);
    setCapabilities(originalCapabilities);
  }, [application.id, application.permissionMode, originalCapabilities]);

  function patchCapabilities(next: Partial<PermissionCapabilities>) {
    setCapabilities((current) => ({ ...current, ...next }));
  }

  function patchResource(key: 'menu' | 'button' | 'api', checked: boolean) {
    setCapabilities((current) => ({
      ...current,
      resource_managed_by_uap: {
        ...current.resource_managed_by_uap,
        [key]: checked
      }
    }));
  }

  function patchDelivery(key: 'token_claims' | 'permission_api', checked: boolean) {
    setCapabilities((current) => ({
      ...current,
      permission_delivery: {
        ...current.permission_delivery,
        [key]: checked
      }
    }));
  }

  function handleModeChange(nextMode: string) {
    setPermissionMode(nextMode);
    setCapabilities(modeDefaultCapabilities(nextMode, modes));
  }

  async function save(resetCapabilities: boolean) {
    await onSubmit({
      permissionMode,
      permissionCapabilitiesJson: resetCapabilities ? undefined : JSON.stringify(withDefaultShape(capabilities)),
      resetCapabilities
    });
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="权限策略"
        description="先选一种管理方式，再决定 UAP 负责哪些权限能力。一般新系统选“UAP 统一管理权限”，老系统先选“业务系统自管权限”。"
      />

      <Descriptions bordered column={1} size="middle">
        <Descriptions.Item label="权限管理方式">
          <Space direction="vertical" size={6}>
            <Select
              value={permissionMode}
              onChange={handleModeChange}
              options={modes.map((mode) => ({ value: mode.mode, label: `${mode.displayName}（${mode.mode}）` }))}
              style={{ minWidth: 300 }}
            />
            <Typography.Text type="secondary">
              这决定权限主要由谁管理：只做登录、业务系统自己管、UAP 统一管，或两边分工管理。
            </Typography.Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="应用访问名单">
          <Flex align="center" justify="space-between" gap={12}>
            <Typography.Text type="secondary">开启后，只有被授权的用户、部门或角色可以访问此应用。</Typography.Text>
            <Switch
              checked={capabilities.app_access_control}
              checkedChildren="开"
              unCheckedChildren="关"
              onChange={(checked) => patchCapabilities({ app_access_control: checked })}
            />
          </Flex>
        </Descriptions.Item>
        <Descriptions.Item label="应用角色和权限码">
          <Flex align="center" justify="space-between" gap={12}>
            <Typography.Text type="secondary">开启后，可维护应用角色、Scope 或权限码，并下发给业务系统使用。</Typography.Text>
            <Switch
              checked={capabilities.role_permission_enabled}
              checkedChildren="开"
              unCheckedChildren="关"
              onChange={(checked) => patchCapabilities({ role_permission_enabled: checked })}
            />
          </Flex>
        </Descriptions.Item>
        <Descriptions.Item label="UAP 管理哪些资源">
          <Space direction="vertical" size={8}>
            <Typography.Text type="secondary">选择哪些资源由 UAP 统一维护，未开启的部分仍由业务系统自己维护。</Typography.Text>
            <Space wrap>
              <Tag color={capabilities.resource_managed_by_uap?.menu ? 'success' : 'default'}>
                菜单 {enabledText(capabilities.resource_managed_by_uap?.menu)}
              </Tag>
              <Switch
                checked={capabilities.resource_managed_by_uap?.menu}
                checkedChildren="菜单"
                unCheckedChildren="菜单"
                onChange={(checked) => patchResource('menu', checked)}
              />
              <Tag color={capabilities.resource_managed_by_uap?.button ? 'success' : 'default'}>
                按钮 {enabledText(capabilities.resource_managed_by_uap?.button)}
              </Tag>
              <Switch
                checked={capabilities.resource_managed_by_uap?.button}
                checkedChildren="按钮"
                unCheckedChildren="按钮"
                onChange={(checked) => patchResource('button', checked)}
              />
              <Tag color={capabilities.resource_managed_by_uap?.api ? 'success' : 'default'}>
                接口 {enabledText(capabilities.resource_managed_by_uap?.api)}
              </Tag>
              <Switch
                checked={capabilities.resource_managed_by_uap?.api}
                checkedChildren="接口"
                unCheckedChildren="接口"
                onChange={(checked) => patchResource('api', checked)}
              />
            </Space>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="数据范围权限">
          <Flex align="center" justify="space-between" gap={12}>
            <Typography.Text type="secondary">开启后，由 UAP 管理用户能看哪些部门、区域或业务数据。</Typography.Text>
            <Switch
              checked={capabilities.data_scope_managed_by_uap}
              checkedChildren="开"
              unCheckedChildren="关"
              onChange={(checked) => patchCapabilities({ data_scope_managed_by_uap: checked })}
            />
          </Flex>
        </Descriptions.Item>
        <Descriptions.Item label="应用如何拿到权限">
          <Space direction="vertical" size={8}>
            <Typography.Text type="secondary">
              选择业务系统从哪里读取权限。小型系统通常用“登录令牌携带权限”，大型系统建议用“权限查询接口”。
            </Typography.Text>
            <Space wrap>
              <Switch
                checked={capabilities.permission_delivery?.token_claims}
                checkedChildren="登录令牌携带权限"
                unCheckedChildren="登录令牌携带权限"
                onChange={(checked) => patchDelivery('token_claims', checked)}
              />
              <Switch
                checked={capabilities.permission_delivery?.permission_api}
                checkedChildren="权限查询接口"
                unCheckedChildren="权限查询接口"
                onChange={(checked) => patchDelivery('permission_api', checked)}
              />
            </Space>
          </Space>
        </Descriptions.Item>
      </Descriptions>

      <Flex justify="end" gap={8} wrap="wrap">
        <Button onClick={() => setCapabilities(modeDefaultCapabilities(permissionMode, modes))}>
          恢复当前模式默认开关
        </Button>
        <Button onClick={() => void save(true)} loading={busy}>
          保存为模式默认策略
        </Button>
        <Button type="primary" onClick={() => void save(false)} loading={busy}>
          保存当前策略
        </Button>
      </Flex>
    </Space>
  );
}
