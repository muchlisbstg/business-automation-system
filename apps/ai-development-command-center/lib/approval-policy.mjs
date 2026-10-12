export type ApprovalDecision = 'approved' | 'rejected';
export type ActorKind = 'human' | 'ai_agent' | 'system';
export type ActorRole = 'owner' | 'admin' | 'engineering_lead' | 'reviewer' | 'developer' | 'auditor';
export interface ApprovalContext {
  requesterId: string;
  requesterKind: ActorKind;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
}
export interface DecisionActor { id: string; kind: ActorKind; role: ActorRole; }
export interface PolicyResult { allowed: boolean; reason: string; }
const APPROVER_ROLES = new Set<ActorRole>(['owner', 'admin', 'engineering_lead', 'reviewer']);

/** Pure policy function. Call only after deriving actor identity/role from a trusted server-side session. */
export function evaluateApprovalDecision(context: ApprovalContext, actor: DecisionActor, decision: ApprovalDecision, reason = ''): PolicyResult {
  if (context.status !== 'pending') return { allowed: false, reason: 'Approval is not pending.' };
  if (actor.kind !== 'human') return { allowed: false, reason: 'Only an authenticated human can decide an approval.' };
  if (context.requesterKind === 'ai_agent' && actor.id === context.requesterId) return { allowed: false, reason: 'The requester cannot approve their own request.' };
  if (actor.id === context.requesterId) return { allowed: false, reason: 'The requester cannot approve their own request.' };
  if (!APPROVER_ROLES.has(actor.role)) return { allowed: false, reason: 'Actor role is not authorized to approve.' };
  if (decision === 'rejected' && reason.trim().length < 8) return { allowed: false, reason: 'A rejection reason of at least 8 characters is required.' };
  return { allowed: true, reason: 'Decision satisfies the approval policy.' };
}
