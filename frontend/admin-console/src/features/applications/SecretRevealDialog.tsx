import { Copy, X } from 'lucide-react';
import type { ClientSecret } from './types';

type Props = {
  secret: ClientSecret;
  onClose: () => void;
};

export function SecretRevealDialog({ secret, onClose }: Props) {
  return (
    <div className="drawer-backdrop">
      <section className="modal" aria-label="Client Secret">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Secret 只展示一次</p>
            <h2>保存 Client Secret</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="secret-box">
          <code>{secret.secret}</code>
          <button
            className="icon-button"
            type="button"
            aria-label="复制 Secret"
            onClick={() => void navigator.clipboard.writeText(secret.secret)}
          >
            <Copy size={18} />
          </button>
        </div>

        <p className="warning-text">关闭后将无法再次查看明文 Secret，数据库只保存哈希值。</p>

        <div className="drawer-actions">
          <button className="primary-action" type="button" onClick={onClose}>
            我已保存
          </button>
        </div>
      </section>
    </div>
  );
}

