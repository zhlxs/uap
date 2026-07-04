import { request } from './http';
import type {
  Application,
  ApplicationCreateInput,
  ApplicationMode,
  ApplicationResource,
  ApplicationRole,
  ApplicationScope,
  ClientSecret,
  OAuthClient,
  OAuthClientCreateInput,
  MemberAuthorization,
  PermissionCode,
  PermissionCodeCreateInput,
  PermissionConfig,
  PermissionPolicyUpdateInput,
  ResourceCreateInput,
  RoleCreateInput,
  RoleGrant,
  RoleGrantUpdateInput,
  ScopeCreateInput,
  User,
  UserCreateInput,
  UserDetail,
  UserRoleAssignment,
  UserRoleUpdateInput
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

export function updatePermissionPolicy(id: string, input: PermissionPolicyUpdateInput): Promise<Application> {
  return request<Application>(`/api/admin/applications/${id}/permission-policy`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
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

export function getPermissionConfig(applicationId: string): Promise<PermissionConfig> {
  return request<PermissionConfig>(`/api/admin/applications/${applicationId}/permission-config`);
}

export function createRole(applicationId: string, input: RoleCreateInput): Promise<ApplicationRole> {
  return request<ApplicationRole>(`/api/admin/applications/${applicationId}/roles`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function createPermissionCode(applicationId: string, input: PermissionCodeCreateInput): Promise<PermissionCode> {
  return request<PermissionCode>(`/api/admin/applications/${applicationId}/permission-codes`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function createScope(applicationId: string, input: ScopeCreateInput): Promise<ApplicationScope> {
  return request<ApplicationScope>(`/api/admin/applications/${applicationId}/scopes`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function createResource(applicationId: string, input: ResourceCreateInput): Promise<ApplicationResource> {
  return request<ApplicationResource>(`/api/admin/applications/${applicationId}/resources`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function updateRoleGrants(roleId: string, input: RoleGrantUpdateInput): Promise<RoleGrant> {
  return request<RoleGrant>(`/api/admin/applications/roles/${roleId}/grants`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export function getMemberAuthorization(applicationId: string): Promise<MemberAuthorization> {
  return request<MemberAuthorization>(`/api/admin/applications/${applicationId}/member-authorization`);
}

export function createUser(input: UserCreateInput): Promise<User> {
  return request<User>('/api/admin/applications/users', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function listUsers(): Promise<User[]> {
  return request<User[]>('/api/admin/applications/users');
}

export function getUser(userId: string): Promise<UserDetail> {
  return request<UserDetail>(`/api/admin/applications/users/${userId}`);
}

export function updateUser(userId: string, input: UserCreateInput): Promise<User> {
  return request<User>(`/api/admin/applications/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export function enableUser(userId: string): Promise<User> {
  return request<User>(`/api/admin/applications/users/${userId}/enable`, {
    method: 'POST'
  });
}

export function disableUser(userId: string): Promise<User> {
  return request<User>(`/api/admin/applications/users/${userId}/disable`, {
    method: 'POST'
  });
}

export function lockUser(userId: string): Promise<User> {
  return request<User>(`/api/admin/applications/users/${userId}/lock`, {
    method: 'POST'
  });
}

export function updateUserRoles(
  applicationId: string,
  userId: string,
  input: UserRoleUpdateInput
): Promise<UserRoleAssignment> {
  return request<UserRoleAssignment>(`/api/admin/applications/${applicationId}/users/${userId}/roles`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}
