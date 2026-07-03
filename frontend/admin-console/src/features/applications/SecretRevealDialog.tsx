import { CopyOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Modal, Space, Typography, message } from 'antd';
import type { ClientSecret } from './types';

type Props = {
  secret: ClientSecret | null;
  onClose: () => void;
};

export function SecretRevealDialog({ secret, onClose }: Props) {
  return (
    <Modal
      title="保存接入密钥"
      open={Boolean(secret)}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          我已保存
        </Button>
      ]}
      width={640}
      destroyOnClose
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert type="warning" showIcon message="接入密钥明文只展示一次，关闭后无法再次查看。" />
        <div>
          <Typography.Text type="secondary">接入密钥（Client Secret）</Typography.Text>
          <Input
            readOnly
            value={secret?.secret}
            style={{ marginTop: 8 }}
            addonAfter={
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => {
                  if (secret?.secret) {
                    void navigator.clipboard.writeText(secret.secret);
                    void message.success('已复制接入密钥');
                  }
                }}
              />
            }
          />
        </div>
      </Space>
    </Modal>
  );
}
