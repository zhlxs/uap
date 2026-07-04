import { clearTokens, getAccessToken, redirectToLogin } from '../auth/session';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:9100';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  errorCode: string | null;
  message: string | null;
  traceId: string | null;
};

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers ?? {})
    }
  });

  if (response.status === 401) {
    clearTokens();
    await redirectToLogin();
    throw new Error('登录状态已失效');
  }

  if (response.status === 403) {
    throw new Error('当前账号没有权限执行该操作');
  }

  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? payload.errorCode ?? `HTTP ${response.status}`);
  }

  return payload.data;
}
