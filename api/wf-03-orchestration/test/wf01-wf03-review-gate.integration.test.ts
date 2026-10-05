import assert from "node:assert/strict";
import test from "node:test";
import { IntakeService } from "../../wf-01-intake/src/intake-service.js";
import { MemoryIntakeRepository } from "../../wf-01-intake/test/memory-repository.js";
import type { IntakeRequest, IntakeResponse } from "../../wf-01-intake/src/types.js";
import { PlanningService } from "../../wf-02-planning/src/planning-service.js";
import { MemoryPlanningRepository } from "../../wf-02-planning/test/memory-repository.js";
import type { PlanningInput, PlanningResponse } from "../../wf-02-planning/src/types.js";
import { OrchestrationService } from "../src/orchestration-service.js";
import type { OrchestrationInput, OrchestrationTask } from "../src/types.js";
import { MemoryOrchestrationRepository } from "./memory-repository.js";

const fixedClock = () => new Date("2026-06-01T12:00:00.000Z");

function intakeService(): IntakeService {
  return new IntakeService(new MemoryIntakeRepository(), {
    clock: fixedClock,
    idGenerator: () => "00000000-0000-4000-8000-000000000101",
  });
}

function planningService(): PlanningService {
  return new PlanningService(new MemoryPlanningRepository(), {
    clock: fixedClock,
    idGenerator: () => "00000000-0000-4000-8000-000000000102",
  });
}

function orchestrationService(): OrchestrationService {
  return new OrchestrationService(new MemoryOrchestrationRepository(), {
    clock: fixedClock,
    idGenerator: () => "00000000-0000-4000-8000-000000000103",
  });
}

type PlanningDetails = Pick<PlanningInput, "title" | "requirements" | "tasks">;

function planningInputFromIntake(
  intake: IntakeResponse,
  details: PlanningDetails,
): PlanningInput {
  if (intake.request_id === null || (intake.state !== "ACCEPTED" && intake.state !== "DUPLICATE")) {
    throw new Error(`Expected an accepted WF-01 request, received ${intake.state}`);
  }

  return {
    request_id: intake.request_id,
    source: {
      workflow: "WF-01",
      request_id: intake.request_id,
      intake_state: intake.state,
    },
    intake_review_signal: {
      human_review_required: intake.human_review_required,
      approval_status: intake.approval_status,
    },
    ...details,
  };
}

function orchestrationInputFromPlan(
  plan: PlanningResponse,
  planId: string,
  dependenciesByTaskId: Record<string, string[]> = {},
): OrchestrationInput {
  if (plan.request_id === null || plan.state !== "PLANNED" || plan.planning_state !== "PLANNED" || !plan.tasks) {
    throw new Error(`Expected a complete WF-02 plan, received ${plan.state}`);
  }

  // Dependency edges are WF-03 input. Keep the task set authoritative: every WF-03 task
  // below is copied from this WF-02 plan; only supported WF-03 dependency metadata is added.
  const tasks: OrchestrationTask[] = plan.tasks.map((task) => {
    const depends_on = dependenciesByTaskId[task.task_id];
    return {
      task_id: task.task_id,
      title: task.title,
      requirement_ids: [...task.requirement_ids],
      ...(depends_on ? { depends_on: [...depends_on] } : {}),
    };
  });

  return {
    request_id: plan.request_id,
    plan_id: planId,
    source: {
      workflow: "WF-02",
      request_id: plan.request_id,
      planning_state: "PLANNED",
    },
    review_signal: {
      human_review_required: plan.human_review_required,
      approval_status: plan.approval_status,
      reason_codes: [...plan.reason_codes],
      review_requirement_ids: [...plan.review_requirement_ids],
    },
    tasks,
  };
}

function assertReviewGateIsNotApprovalOrExecution(
  intake: IntakeResponse,
  plan: PlanningResponse,
  result: Awaited<ReturnType<OrchestrationService["orchestrate"]>>,
): void {
  assert.equal(intake.execution_permitted, false);
  assert.equal(plan.execution_permitted, false);
  assert.equal("approval_status" in result, false);
  assert.equal("completed_task_ids" in result, false);
  assert.equal("execution_permitted" in result, false);
}

test("positive WF-01 review propagates to every WF-02 requirement and blocks every planned WF-03 task", async () => {
  const request: IntakeRequest = {
    request_id: "REQ-review-gate-positive",
    title: "Deploy the billing service to production",
    requester: "user-001",
    description: "Provide a repeatable release process for the billing service.",
  };
  const intake = await intakeService().submit(request);

  assert.equal(intake.state, "ACCEPTED");
  assert.equal(intake.human_review_required, true);
  assert.equal(intake.approval_status, "pending_human_review");
  assert.equal(intake.execution_permitted, false);

  const requirements = [
    { requirement_id: "R-INVOICE", description: "Display invoice status to account owners." },
    { requirement_id: "R-AUDIT", description: "Record an audit event when invoice history is viewed." },
  ];
  const planningInput = planningInputFromIntake(intake, {
    title: "Invoice history and account controls",
    requirements,
    tasks: [
      { task_id: "T-INVOICE", title: "Display invoice status to account owners", requirement_ids: ["R-INVOICE"] },
      { task_id: "T-AUDIT", title: "Record invoice history views", requirement_ids: ["R-AUDIT"] },
    ],
  });
  const plan = await planningService().plan(planningInput);

  assert.equal(plan.state, "PLANNED");
  assert.equal(plan.human_review_required, true);
  assert.equal(plan.approval_status, "pending_human_review");
  assert.equal(plan.execution_permitted, false);
  assert.deepEqual(plan.review_requirement_ids, ["R-AUDIT", "R-INVOICE"]);
  assert.deepEqual(plan.tasks?.map((task) => task.task_id), ["T-INVOICE", "T-AUDIT"]);

  const orchestrationInput = orchestrationInputFromPlan(plan, "PLAN-review-gate-positive");
  const plannedTaskIds = plan.tasks?.map((task) => task.task_id).sort();
  assert.deepEqual(orchestrationInput.tasks.map((task) => task.task_id).sort(), plannedTaskIds);
  assert.ok(orchestrationInput.tasks.every((task) =>
    task.requirement_ids.every((requirementId) => plan.review_requirement_ids.includes(requirementId))));

  const result = await orchestrationService().orchestrate(orchestrationInput);

  assert.equal(result.state, "APPROVAL_REQUIRED");
  assert.ok(result.reason_codes.includes("HIGH_IMPACT_REVIEW_REQUIRED"));
  assert.deepEqual(result.blocked_task_ids, plannedTaskIds);
  assert.deepEqual(result.execution_order, []);
  assertReviewGateIsNotApprovalOrExecution(intake, plan, result);
});

test("without a positive WF-01 signal, a reviewed WF-02 requirement blocks its linked and dependent planned tasks only", async () => {
  const request: IntakeRequest = {
    request_id: "REQ-review-gate-requirement-only",
    title: "Invoice history and retention controls",
    requester: "user-002",
    description: "Provide a searchable invoice history view for support staff.",
  };
  const intake = await intakeService().submit(request);

  assert.equal(intake.state, "ACCEPTED");
  assert.equal(intake.human_review_required, false);
  assert.equal(intake.approval_status, "not_required");
  assert.equal(intake.execution_permitted, false);

  const planningInput = planningInputFromIntake(intake, {
    title: "Invoice history implementation",
    requirements: [
      { requirement_id: "R-RETENTION", description: "Remove expired invoice records from production after the retention window." },
      { requirement_id: "R-HISTORY", description: "Capture an audit event whenever invoice history is viewed." },
    ],
    tasks: [
      { task_id: "T-REVIEWED", title: "Filter invoice records against the retention window", requirement_ids: ["R-RETENTION"] },
      { task_id: "T-DEPENDENT", title: "Rebuild invoice search indexes from retained records", requirement_ids: ["R-HISTORY"] },
      { task_id: "T-INDEPENDENT", title: "Record invoice timeline views", requirement_ids: ["R-HISTORY"] },
    ],
  });
  const plan = await planningService().plan(planningInput);

  assert.equal(plan.state, "PLANNED");
  assert.equal(plan.human_review_required, true);
  assert.equal(plan.approval_status, "pending_human_review");
  assert.equal(plan.execution_permitted, false);
  assert.deepEqual(plan.review_requirement_ids, ["R-RETENTION"]);
  assert.deepEqual(plan.tasks?.map((task) => task.task_id), ["T-REVIEWED", "T-DEPENDENT", "T-INDEPENDENT"]);

  const orchestrationInput = orchestrationInputFromPlan(
    plan,
    "PLAN-review-gate-requirement-only",
    { "T-DEPENDENT": ["T-REVIEWED"] },
  );
  const plannedTaskIds = plan.tasks?.map((task) => task.task_id).sort();
  assert.deepEqual(orchestrationInput.tasks.map((task) => task.task_id).sort(), plannedTaskIds);
  assert.ok(orchestrationInput.tasks.every((task) => plannedTaskIds?.includes(task.task_id)));

  const result = await orchestrationService().orchestrate(orchestrationInput);

  assert.equal(result.state, "APPROVAL_REQUIRED");
  assert.ok(result.reason_codes.includes("HIGH_IMPACT_REVIEW_REQUIRED"));
  assert.deepEqual(result.blocked_task_ids, ["T-DEPENDENT", "T-REVIEWED"]);
  assert.deepEqual(result.execution_order, ["T-INDEPENDENT"]);
  assertReviewGateIsNotApprovalOrExecution(intake, plan, result);
});
