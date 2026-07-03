import { Button, Drawer, Form, Input, Space, Typography } from 'antd';
import type { Application, OAuthClientCreateInput } from './types';

type Props = {
  application: Application;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: OAuthClientCreateInput) => Promise<void>;
};

type ClientForm = {
  clientName: string;
  redirectUris: string;
  logoutUris: string;
  scopes: string;
};

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function OAuthClientCreatePanel({ application, open, busy, onClose, onSubmit }: Props) {
  const [form] = Form.useForm<ClientForm>();

  return (
    <Drawer
      title="新增登录接入配置"
      width={620}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={busy} onClick={() => form.submit()}>
            新增配置
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">
        当前应用：{application.appName}（{application.appCode}）。接入密钥创建成功后只展示一次，请及时保存。
      </Typography.Paragraph>

      <Form<ClientForm>
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          clientName: `${application.appName} Web`,
          redirectUris: 'https://example.company.com/oauth/callback',
          logoutUris: 'https://example.company.com/logout/success',
          scopes: 'openid\nprofile\nemail'
        }}
        onFinish={(values) =>
          void onSubmit({
            clientName: values.clientName,
            clientType: 'confidential',
            tokenEndpointAuthMethod: 'client_secret_basic',
            grantTypes: ['authorization_code', 'refresh_token'],
            responseTypes: ['code'],
            redirectUris: splitLines(values.redirectUris),
            postLogoutRedirectUris: splitLines(values.logoutUris),
            scopes: splitLines(values.scopes),
            accessTokenTtlSeconds: 900,
            refreshTokenTtlSeconds: 604800,
            requirePkce: true
          })
        }
      >
        <Form.Item label="配置名称" name="clientName" rules={[{ required: true, message: '请输入配置名称' }]}>
          <Input maxLength={128} />
        </Form.Item>
        <Form.Item label="登录成功回调地址" name="redirectUris" rules={[{ required: true, message: '请输入回调地址' }]}>
          <Input.TextArea rows={4} placeholder="每行一个回调地址" />
        </Form.Item>
        <Form.Item label="登出回调地址" name="logoutUris">
          <Input.TextArea rows={3} placeholder="每行一个登出回调地址" />
        </Form.Item>
        <Form.Item label="授权范围" name="scopes" rules={[{ required: true, message: '请输入授权范围' }]}>
          <Input.TextArea rows={4} placeholder="每行一个授权范围，例如 openid" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
