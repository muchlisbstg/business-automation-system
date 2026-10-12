import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateApprovalDecision } from '../lib/approval-policy.mjs';

const pending = { requesterId: 'agent-17', requesterKind: 'ai_agent', status: 'pending' };
const reviewer = { id: 'human-22', kind: 'human', role: 'reviewer' };

test('allows an independent authorized human to approve a pending request', () => {
  assert.equal(evaluateApprovalDecision(pending, reviewer, 'approved').allowed, true);
});
test('denies requester self-approval', () => {
  assert.equal(evaluateApprovalDecision({ ...pending, requesterId: 'human-22', requesterKind: 'human' }, reviewer, 'approved').allowed, false);
});
test('denies AI actors from deciding approvals', () => {
  assert.equal(evaluateApprovalDecision(pending, { id: 'agent-99', kind: 'ai_agent', role: 'admin' }, 'approved').allowed, false);
});
test('denies actors without an approver role', () => {
  assert.equal(evaluateApprovalDecision(pending, { id: 'dev-1', kind: 'human', role: 'developer' }, 'approved').allowed, false);
});
test('denies decisions for non-pending requests', () => {
  assert.equal(evaluateApprovalDecision({ ...pending, status: 'approved' }, reviewer, 'approved').allowed, false);
});
test('requires a meaningful reason for rejection', () => {
  assert.equal(evaluateApprovalDecision(pending, reviewer, 'rejected', 'no').allowed, false);
  assert.equal(evaluateApprovalDecision(pending, reviewer, 'rejected', 'Security gate failed').allowed, true);
});
