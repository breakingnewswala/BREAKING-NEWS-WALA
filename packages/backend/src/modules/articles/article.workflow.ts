/**
 * BREAKING NEWS WALA — Article Editorial Workflow State Machine
 * Grounded in docs/05-Workflows.md (Section 23.1: Article Editorial Lifecycle State Machine)
 * and docs/06-Business-Rules.md (RULE-EDIT-001 through RULE-EDIT-007)
 */

import { AppError } from '../../errors/app-error';
import { ArticleStatus } from './types';

/**
 * Strict transition matrix defining permitted state transitions.
 * Derived from BPMN 2.0 State Machine in docs/05-Workflows.md Section 23.1.
 */
export const ALLOWED_TRANSITIONS: Record<ArticleStatus, ArticleStatus[]> = {
  draft: ['draft', 'pending_review', 'published'],
  pending_review: ['under_review', 'published', 'revision_requested', 'rejected'],
  under_review: ['pending_review', 'published', 'revision_requested', 'rejected'],
  revision_requested: ['draft', 'pending_review'],
  rejected: [], // Terminal State
  published: ['archived', 'retracted'],
  archived: [], // Terminal State
  retracted: [], // Terminal State
};

export interface WorkflowTransitionContext {
  userId: string;
  userRoles: string[];
  isAuthor: boolean;
  assignedDistricts?: string[];
  articleDistrictId?: string;
  reasonCode?: string;
  feedbackComments?: string;
}

export class ArticleWorkflowEngine {
  /**
   * Checks whether a state transition is structurally allowed by the state machine.
   */
  public static isTransitionAllowed(fromStatus: ArticleStatus, toStatus: ArticleStatus): boolean {
    if (fromStatus === toStatus) return true;
    const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
    return allowed.includes(toStatus);
  }

  /**
   * Normalizes role names (e.g. 'ROLE_ADMIN' -> 'admin', 'reporter_standard' -> 'reporter_standard').
   */
  public static hasRole(roles: string[], targetRole: string): boolean {
    const target = targetRole.toLowerCase().replace(/^role_/, '');
    return roles.some((r) => r.toLowerCase().replace(/^role_/, '') === target);
  }

  public static isElevatedEditor(roles: string[]): boolean {
    return (
      this.hasRole(roles, 'admin') ||
      this.hasRole(roles, 'super_admin') ||
      this.hasRole(roles, 'editor') ||
      this.hasRole(roles, 'desk_editor') ||
      this.hasRole(roles, 'sub_editor') ||
      this.hasRole(roles, 'bureau_chief')
    );
  }

  public static isTrustedReporter(roles: string[]): boolean {
    return this.hasRole(roles, 'reporter_trusted');
  }

  /**
   * Validates and executes an editorial transition, enforcing RBAC and editorial rules.
   */
  public static validateTransition(
    currentStatus: ArticleStatus,
    targetStatus: ArticleStatus,
    context: WorkflowTransitionContext
  ): { targetStatus: ArticleStatus; rerouted?: boolean; note?: string } {
    // 1. Structural State Machine check
    if (!this.isTransitionAllowed(currentStatus, targetStatus)) {
      throw AppError.validationFailed(
        `Invalid workflow transition from "${currentStatus}" to "${targetStatus}". Not permitted by editorial lifecycle.`
      );
    }

    // 2. Draft -> Published (Trusted Reporter Direct-Publishing: RULE-EDIT-002, RULE-EDIT-003)
    if (currentStatus === 'draft' && targetStatus === 'published') {
      const isTrusted = this.isTrustedReporter(context.userRoles);
      const isEditor = this.isElevatedEditor(context.userRoles);

      if (!isTrusted && !isEditor) {
        throw AppError.forbidden(
          'Standard reporters cannot direct-publish articles. Submission to editorial review queue is required (RULE-EDIT-001).'
        );
      }

      if (isTrusted && !isEditor) {
        // Enforce district territorial boundary (RULE-EDIT-003)
        const assigned = context.assignedDistricts || [];
        const articleDistrict = context.articleDistrictId;

        const hasTerritoryMatch = articleDistrict ? assigned.includes(articleDistrict) : false;

        if (!hasTerritoryMatch) {
          // RULE-EDIT-003: Fall back to PENDING_REVIEW if district outside beat
          return {
            targetStatus: 'pending_review',
            rerouted: true,
            note: 'Article tagged with unassigned district. Fast-track publishing rerouted to Central Editorial Queue (RULE-EDIT-003).',
          };
        }
      }
    }

    // 3. Draft -> Pending Review (Reporter Submit)
    if (currentStatus === 'draft' && targetStatus === 'pending_review') {
      if (!context.isAuthor && !this.isElevatedEditor(context.userRoles)) {
        throw AppError.forbidden('Only the author or an authorized editor can submit this draft for review.');
      }
    }

    // 4. Review Desk Transitions (Pending Review / Under Review -> Published, Rejected, Revision Requested)
    if (
      (currentStatus === 'pending_review' || currentStatus === 'under_review') &&
      (targetStatus === 'published' ||
        targetStatus === 'rejected' ||
        targetStatus === 'revision_requested' ||
        targetStatus === 'under_review')
    ) {
      if (!this.isElevatedEditor(context.userRoles)) {
        throw AppError.forbidden('Editorial review actions require editor or administrator privileges.');
      }

      // RULE-EDIT-005: Mandatory Rejection Reason and Minimum 10 chars feedback
      if (targetStatus === 'rejected') {
        if (!context.reasonCode || context.reasonCode.trim() === '') {
          throw AppError.validationFailed('Rejection requires a valid reason category code (RULE-EDIT-005).');
        }
        if (!context.feedbackComments || context.feedbackComments.trim().length < 10) {
          throw AppError.validationFailed(
            'Rejection requires actionable editorial feedback of at least 10 characters (RULE-EDIT-005).'
          );
        }
      }

      // Revision Request comments requirement
      if (targetStatus === 'revision_requested') {
        if (!context.feedbackComments || context.feedbackComments.trim().length < 10) {
          throw AppError.validationFailed(
            'Revision request requires actionable feedback comments of at least 10 characters.'
          );
        }
      }
    }

    // 5. Published -> Retracted (Emergency Retraction: RULE-EDIT-007)
    if (currentStatus === 'published' && targetStatus === 'retracted') {
      if (!this.isElevatedEditor(context.userRoles)) {
        throw AppError.forbidden('Article retraction requires administrator or editorial authority (RULE-EDIT-007).');
      }
    }

    return { targetStatus };
  }
}
