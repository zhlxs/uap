import { request } from './http';
import type {
  Application,
  ApplicationCreateInput,
  ApplicationMode,
  ClientSecret,
  OAuthClient,
  OAuthClientCreateInput
} from '../features/applications/types';

export function listApplications(): Promise<Application[]> {
  return request<Application[]>('/api/admin/applications');
}

export function createApplication(input: ApplicationCreateInput): Promise<Application> {
  return request<Application>('/api/admin/applications', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function enableApplication(id: string): Promise<Application> {
  return request<Application>(`/api/admin/applications/${id}/enable`, {
    method: 'POST'
  });
}

export function disableApplication(id: string): Promise<Application> {
  return request<Application>(`/api/admin/applications/${id}/disable`, {
    method: 'POST'
  });
}

export function listPermissionModes(): Promise<ApplicationMode[]> {
  return request<ApplicationMode[]>('/api/admin/applications/permission-modes');
}

export function createOAuthClient(applicationId: string, input: OAuthClientCreateInput): Promise<OAuthClient> {
  return request<OAuthClient>(`/api/admin/applications/${applicationId}/oauth-clients`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function listOAuthClients(applicationId: string): Promise<OAuthClient[]> {
  return request<OAuthClient[]>(`/api/admin/applications/${applicationId}/oauth-clients`);
}

export function createClientSecret(clientId: string): Promise<ClientSecret> {
  return request<ClientSecret>(`/api/admin/applications/oauth-clients/${clientId}/secrets`, {
    method: 'POST'
  });
}
