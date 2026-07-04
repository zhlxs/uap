export type Application = {
  id: string;
  appCode: string;
  appName: string;
  appType: string;
  protocol: string;
  homepageUrl: string | null;
  permissionMode: string;
  permissionCapabilitiesJson: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationMode = {
  mode: string;
  displayName: string;
  defaultCapabilitiesJson: string;
};

export type ApplicationCreateInput = {
  appCode: string;
  appName: string;
  appType: string;
  protocol: string;
  homepageUrl: string;
  permissionMode: string;
  permissionCapabilitiesJson?: string;
};

export type PermissionCapabilities = {
  app_access_control?: boolean;
  role_permission_enabled?: boolean;
  resource_managed_by_uap?: {
    menu?: boolean;
    button?: boolean;
    api?: boolean;
  };
  data_scope_managed_by_uap?: boolean;
  permission_delivery?: {
    token_claims?: boolean;
    permission_api?: boolean;
  };
};

export type PermissionPolicyUpdateInput = {
  permissionMode: string;
  permissionCapabilitiesJson?: string;
  resetCapabilities: boolean;
};

export type OAuthClientCreateInput = {
  clientName: string;
  clientType: string;
  tokenEndpointAuthMethod: string;
  grantTypes: string[];
  responseTypes: string[];
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  scopes: string[];
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  requirePkce: boolean;
};

export type OAuthClient = {
  id: string;
  applicationId: string;
  clientId: string;
  clientName: string;
  clientType: string;
  tokenEndpointAuthMethod: string;
  grantTypes: string[];
  responseTypes: string[];
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  scopes: string[];
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  requirePkce: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientSecret = {
  id: string;
  clientId: string;
  secret: string;
  secretHint: string;
  createdAt: string;
};

export type ApplicationRole = {
  id: string;
  applicationId: string;
  roleCode: string;
  roleName: string;
  roleType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PermissionCode = {
  id: string;
  applicationId: string;
  permissionCode: string;
  permissionName: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationScope = {
  id: string;
  applicationId: string;
  scopeCode: string;
  scopeName: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationResource = {
  id: string;
  applicationId: string;
  parentId: string | null;
  resourceCode: string;
  resourceName: string;
  resourceType: string;
  path: string | null;
  httpMethod: string | null;
  urlPattern: string | null;
  sortOrder: number;
  visible: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type RoleGrant = {
  roleId: string;
  permissionCodeIds: string[];
  scopeIds: string[];
  resourceIds: string[];
};

export type PermissionConfig = {
  roles: ApplicationRole[];
  permissionCodes: PermissionCode[];
  scopes: ApplicationScope[];
  resources: ApplicationResource[];
  roleGrants: RoleGrant[];
};

export type RoleCreateInput = {
  roleCode: string;
  roleName: string;
};

export type PermissionCodeCreateInput = {
  permissionCode: string;
  permissionName: string;
  description?: string;
};

export type ScopeCreateInput = {
  scopeCode: string;
  scopeName: string;
  description?: string;
};

export type ResourceCreateInput = {
  parentId?: string;
  resourceCode: string;
  resourceName: string;
  resourceType: string;
  path?: string;
  httpMethod?: string;
  urlPattern?: string;
};

export type RoleGrantUpdateInput = {
  permissionCodeIds: string[];
  scopeIds: string[];
  resourceIds: string[];
};

export type User = {
  id: string;
  displayName: string;
  employeeNo: string | null;
  email: string | null;
  mobile: string | null;
  departmentId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Department = {
  id: string;
  parentId: string | null;
  name: string;
  code: string;
  path: string;
  sortOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type DepartmentTree = Department & {
  children: DepartmentTree[];
};

export type UserApplicationAuthorization = {
  applicationId: string;
  appCode: string;
  appName: string;
  appType: string;
  protocol: string;
  permissionMode: string;
  status: string;
  roles: ApplicationRole[];
};

export type UserDetail = {
  user: User;
  authorizations: UserApplicationAuthorization[];
};

export type UserRoleAssignment = {
  userId: string;
  roleIds: string[];
};

export type MemberAuthorization = {
  users: User[];
  roles: ApplicationRole[];
  permissionCodes: PermissionCode[];
  scopes: ApplicationScope[];
  resources: ApplicationResource[];
  roleGrants: RoleGrant[];
  assignments: UserRoleAssignment[];
};

export type UserCreateInput = {
  displayName: string;
  employeeNo?: string;
  email?: string;
  mobile?: string;
  departmentId?: string;
};

export type UserQuery = {
  departmentId?: string;
  status?: string;
  keyword?: string;
};

export type DepartmentCreateInput = {
  parentId?: string;
  name: string;
  code: string;
  sortOrder?: number;
};

export type UserRoleUpdateInput = {
  roleIds: string[];
};
