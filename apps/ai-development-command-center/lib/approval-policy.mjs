const APPROVER_ROLES = new Set(["owner", "admin", "engineering_lead", "reviewer"]);

/**
 * Pure policy function. Identity and role must come from trusted server-side data.
 * @param {{requesterId: string, requesterKind: string, status: string}} context
 * @param {{id: string, kind: string, role: string}} actor
 * @param {"approved" | "rejected"} decision
 * @param {string} [reason]
 * @returns {{allowed: boolean, reason: string}}
 */
export function evaluateApprovalDecision(context, actor, decision, reason = "") {
  if (decision !== "approved" && decision !== "rejected") {
    return { allowed: false, reason: "Decision must be approved or rejected." };
  }
  if (context.status !== "pending") return { allowed: false, reason: "Approval is not pending." };
  if (actor.kind !== "human") return { allowed: false, reason: "Only an authenticated human can decide an approval." };
  if (actor.id === context.requesterId) return { allowed: false, reason: "The requester cannot approve their own request." };
  if (!APPROVER_ROLES.has(actor.role)) return { allowed: false, reason: "Actor role is not authorized to approve." };
  if (decision === "rejected" && reason.trim().length < 8) {
    return { allowed: false, reason: "A rejection reason of at least 8 characters is required." };
  }
  return { allowed: true, reason: "Decision satisfies the approval policy." };
}
