export const ORGANIZATION_ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export type OrganizationPermission =
  | 'organization:read'
  | 'records:create'
  | 'members:manage'
  | 'ownership:transfer';

const PERMISSIONS: Readonly<Record<OrganizationRole, ReadonlySet<OrganizationPermission>>> = {
  OWNER: new Set(['organization:read', 'records:create', 'members:manage', 'ownership:transfer']),
  ADMIN: new Set(['organization:read', 'records:create', 'members:manage']),
  MEMBER: new Set(['organization:read', 'records:create']),
  VIEWER: new Set(['organization:read']),
};

/**
 * Pure policy evaluation only. Callers must verify the user's active
 * membership from the database before passing its role to this function.
 */
export function hasOrganizationPermission(
  role: OrganizationRole | null | undefined,
  permission: OrganizationPermission,
): boolean {
  return role !== null && role !== undefined && PERMISSIONS[role]?.has(permission) === true;
}

export interface OrganizationMembershipContext {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
}

/** Deny by default if membership, tenant or account status does not match. */
export function canAccessOrganization(
  membership: OrganizationMembershipContext | null | undefined,
  organizationId: string,
  permission: OrganizationPermission,
): boolean {
  return Boolean(
    membership &&
      membership.organizationId === organizationId &&
      membership.status === 'ACTIVE' &&
      hasOrganizationPermission(membership.role, permission),
  );
}
