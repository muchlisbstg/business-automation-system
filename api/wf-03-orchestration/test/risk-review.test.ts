import assert from "node:assert/strict";
import test from "node:test";
import { OrchestrationService } from "../src/orchestration-service.js";
import type { OrchestrationInput, OrchestrationTask } from "../src/types.js";
import { MemoryOrchestrationRepository } from "./memory-repository.js";

for (const risk of ["high", "critical"] as const) {
  test(`requires human review for risk=${risk}`, async () => {
    const task: OrchestrationTask = {
      task_id: "T-001",
      title: "Review API contract",
      requirement_ids: ["R-001"],
      risk,
    };
    const input: OrchestrationInput = {
      request_id: `REQ-risk-${risk}`,
      plan_id: `WF03-risk-${risk}`,
      source: { workflow: "WF-02", request_id: `REQ-risk-${risk}`, planning_state: "PLANNED" },
      review_signal: {
        human_review_required: false,
        approval_status: "not_required",
        reason_codes: [],
        review_requirement_ids: [],
      },
      tasks: [task],
    };
    const service = new OrchestrationService(new MemoryOrchestrationRepository());
    const result = await service.orchestrate(input);

    assert.equal(result.state, "APPROVAL_REQUIRED");
    assert.deepEqual(result.execution_order, []);
    assert.deepEqual(result.blocked_task_ids, ["T-001"]);
  });
}
