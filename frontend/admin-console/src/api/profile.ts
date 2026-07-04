import { request } from './http';

export type CurrentUserProfile = {
  subject: string;
  username: string;
  tenantName: string;
  roles: string[];
  permissions: string[];
};

export function getCurrentUserProfile(): Promise<CurrentUserProfile> {
  return request<CurrentUserProfile>('/api/admin/me');
}
