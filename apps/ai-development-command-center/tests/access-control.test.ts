import test from "node:test";
import assert from "node:assert/strict";
import { canApprove, canRead } from "../lib/access-control";

test("only designated human application roles can approve", () => {
  assert.equal(canApprove("owner"), true);
  assert.equal(canApprove("admin"), true);
  assert.equal(canApprove("engineering_lead"), true);
  assert.equal(canApprove("reviewer"), true);
  assert.equal(canApprove("developer"), false);
  assert.equal(canApprove("auditor"), false);
});
test("all known application roles can read authorized scopes", () => {
  for (const role of ["owner", "admin", "engineering_lead", "developer", "reviewer", "auditor"] as const) assert.equal(canRead(role), true);
});
