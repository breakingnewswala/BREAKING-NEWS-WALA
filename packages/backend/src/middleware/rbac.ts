/**
 * BREAKING NEWS WALA — Role-Based Access Control (RBAC) & Authorization Middleware
 * Grounded in docs/14-Auth.md (Section 8) and docs/DECISIONS.md (DEC-048, DEC-069)
 * Strictly enforces server-side role boundaries, resource ownership, and territory jurisdiction.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';

/**
 * Normalizes role names by stripping ROLE_ prefix and converting to lowercase.
 */
export function normalizeRole(role: string): string {
  if (!role || typeof role !== 'string') return '';
  return role.trim().toUpperCase().replace(/^ROLE_/, '');
}

/**
 * Validates that an array of user roles does not contain the unapproved ROLE_CHIEF_EDITOR.
 * Invariant DEC-048: Chief Editor role remains Pending Approval and must be blocked with 403 Forbidden.
 */
export function assertNoChiefEditor(userRoles: string[] = []): void {
  const hasChiefEditor = userRoles.some((r) => normalizeRole(r) === 'CHIEF_EDITOR');
  if (hasChiefEditor) {
    throw AppError.forbidden(
      'Role ROLE_CHIEF_EDITOR remains Pending Approval under governance DEC-048. Access denied (ERR_ROLE_PENDING_APPROVAL).'
    );
  }
}

/**
 * Checks if a user has at least one of the specified allowed roles.
 */
export function hasAnyRole(userRoles: string[] = [], allowedRoles: string[] = []): boolean {
  assertNoChiefEditor(userRoles);

  const normalizedUserRoles = new Set(userRoles.map(normalizeRole));
  return allowedRoles.some((r) => normalizedUserRoles.has(normalizeRole(r)));
}

/**
 * Express Middleware: Requires that the authenticated user holds at least one of the allowed roles.
 * Must be preceded by requireAuth middleware.
 */
export function requireRoles(...allowedRoles: string[]) {
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      return next(AppError.unauthorized('Authentication required before evaluating role permissions.'));
    }

    const userRoles: string[] = user.roles || [];

    try {
      assertNoChiefEditor(userRoles);

      const isPermitted = hasAnyRole(userRoles, normalizedAllowed);
      if (!isPermitted) {
        return next(
          AppError.forbidden(
            `Insufficient permissions. Required one of: [${allowedRoles.join(', ')}]. Access denied.`
          )
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Resource Ownership Verification (Anti-IDOR Guard)
 * Asserts that the requesting actor is the owner of the resource OR holds an approved administrative override role.
 */
export function verifyResourceOwnership(
  actorId: string,
  resourceOwnerId: string,
  userRoles: string[] = [],
  overrideRoles: string[] = ['ADMIN', 'SUPER_ADMIN']
): boolean {
  if (!actorId || !resourceOwnerId) return false;

  // Direct ownership
  if (actorId === resourceOwnerId) {
    return true;
  }

  // Administrative override
  return hasAnyRole(userRoles, overrideRoles);
}

/**
 * Territory Jurisdiction Verification (RULE-GEO-001)
 * Asserts that the reporter is assigned to the target district, unless holding state-wide editorial/admin role.
 */
export function verifyTerritoryJurisdiction(
  targetDistrictCode: string,
  assignedDistrictCodes: string[] = [],
  userRoles: string[] = []
): boolean {
  // Editors, Bureau Chiefs, Admins, and Super Admins hold state-wide jurisdiction
  const stateWideRoles = ['BUREAU_CHIEF', 'DESK_EDITOR', 'SUB_EDITOR', 'ADMIN', 'SUPER_ADMIN'];
  if (hasAnyRole(userRoles, stateWideRoles)) {
    return true;
  }

  if (!targetDistrictCode) return false;

  const target = targetDistrictCode.toLowerCase().trim();
  return assignedDistrictCodes.some((code) => code.toLowerCase().trim() === target);
}

