import { Drawer, Form, Input, Select, Space, Button, Typography } from 'antd';
import type { ApplicationCreateInput, ApplicationMode } from './types';

type Props = {
  modes: ApplicationMode[];
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: ApplicationCreateInput) => Promise<void>;
};

export function ApplicationCreatePanel({ modes, open, busy, onClose, onSubmit }: Props) {
  const [form] = Form.useForm<ApplicationCreateInput>();

  return (
    <Drawer
      title="创建应用"
      width={560}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={busy} onClick={() => form.submit()}>
            创建
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">
        应用是业务系统接入 AegisID 的管理单元，创建后再配置登录接入、回调地址和授权范围。
      </Typography.Paragraph>

      <Form<ApplicationCreateInput>
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          appType: 'web',
          protocol: 'oidc',
          permissionMode: 'delegated',
          homepageUrl: ''
        }}
        onFinish={(values) => void onSubmit(values)}
      >
        <Form.Item label="应用编码" name="appCode" rules={[{ required: true, message: '请输入应用编码' }]}>
          <Input placeholder="例如：crm_portal" maxLength={64} />
        </Form.Item>
        <Form.Item label="应用名称" name="appName" rules={[{ required: true, message: '请输入应用名称' }]}>
          <Input placeholder="例如：CRM 管理系统" maxLength={128} />
        </Form.Item>
        <Form.Item label="应用类型" name="appType">
          <Select
            options={[
              { value: 'web', label: 'Web 应用' },
              { value: 'spa', label: '单页应用 SPA' },
              { value: 'backend', label: '后端服务' },
              { value: 'saml', label: 'SAML 应用' },
              { value: 'cas', label: 'CAS 应用' }
            ]}
          />
        </Form.Item>
        <Form.Item label="协议" name="protocol">
          <Select
            options={[
              { value: 'oidc', label: 'OIDC' },
              { value: 'oauth2', label: 'OAuth2' },
              { value: 'saml', label: 'SAML' },
              { value: 'cas', label: 'CAS' }
            ]}
          />
        </Form.Item>
        <Form.Item label="权限模式" name="permissionMode">
          <Select options={modes.map((mode) => ({ value: mode.mode, label: mode.displayName }))} />
        </Form.Item>
        <Form.Item label="首页地址" name="homepageUrl">
          <Input placeholder="https://example.company.com" maxLength={512} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
