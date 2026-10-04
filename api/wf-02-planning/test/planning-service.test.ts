import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PlanningService } from "../src/planning-service.js";
import type { PlanningInput } from "../src/types.js";
import { MemoryPlanningRepository } from "./memory-repository.js";

const fixturePath = fileURLToPath(
  new URL("../../../workflows/WF-02-planning-validation/examples/valid.json", import.meta.url),
);
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as PlanningInput;
const fixedClock = () => new Date("2026-06-01T12:00:00.000Z");

function service(repository = new MemoryPlanningRepository()): PlanningService {
  return new PlanningService(repository, {
    clock: fixedClock,
    idGenerator: () => "00000000-0000-4000-8000-000000000002",
  });
}

function planningInput(overrides: Partial<PlanningInput> = {}): PlanningInput {
  return { ...fixture, ...overrides };
}

test("accepts a valid WF-02 fixture and returns traceable tasks without execution permission", async () => {
  const repository = new MemoryPlanningRepository();
  const result = await service(repository).plan(planningInput({ request_id: "WF02-accept" }));

  assert.equal(result.state, "PLANNED");
  assert.deepEqual(result.unmapped_requirements, []);
  assert.deepEqual(result.tasks?.map((task) => task.requirement_ids), [["R-001"], ["R-002"]]);
  assert.equal(result.execution_permitted, false);
  assert.equal(result.human_review_required, false);
  assert.equal(repository.records.size, 1);
});

test("returns clarification for a blank requirement description", async () => {
  const result = await service().plan({
    request_id: "WF02-missing-description",
    title: "Checkout planning",
    requirements: [{ requirement_id: "R-001", description: "   " }],
  });

  assert.equal(result.state, "CLARIFICATION_REQUIRED");
  assert.deepEqual(result.missing_fields, ["requirements[0].description"]);
});

test("rejects a generic task title even when linked acceptance criteria are detailed", async () => {
  const result = await service().plan(planningInput({
    request_id: "WF02-vague-title",
    requirements: [{
      requirement_id: "R-001",
      description: "Reduce API latency for the checkout endpoint.",
      acceptance_criteria: ["P95 checkout API latency is below 200 ms under 500 requests per second."],
    }],
    tasks: [{ task_id: "T-001", title: "Perbaiki performa", requirement_ids: ["R-001"] }],
  }));

  assert.equal(result.state, "INVALID_TASK");
  assert.ok(result.validation_errors?.some((error) => error.path === "/tasks/0/title"));
  assert.equal(result.execution_permitted, false);
});

test("accepts a concrete task title without a numeric metric", async () => {
  const result = await service().plan(planningInput({
    request_id: "WF02-scoped-no-metric",
    requirements: [{ requirement_id: "R-001", description: "Reduce checkout API latency." }],
    tasks: [{
      task_id: "T-001",
      title: "Improve checkout API latency",
      requirement_ids: ["R-001"],
    }],
  }));

  assert.equal(result.state, "PLANNED");
});

test("accepts a task title with an explicit measurable target", async () => {
  const result = await service().plan(planningInput({
    request_id: "WF02-metric-title",
    requirements: [{ requirement_id: "R-001", description: "Reduce checkout API latency." }],
    tasks: [{
      task_id: "T-001",
      title: "Reduce checkout latency to under 200 ms",
      requirement_ids: ["R-001"],
    }],
  }));

  assert.equal(result.state, "PLANNED");
});

test("lists every unmapped requirement explicitly, including ten-requirement inputs", async () => {
  const requirements = Array.from({ length: 10 }, (_, index) => ({
    requirement_id: `R-${String(index + 1).padStart(3, "0")}`,
    description: `Requirement ${index + 1} has a defined scope.`,
  }));
  const result = await service().plan(planningInput({
    request_id: "WF02-ten-requirements",
    requirements,
    tasks: [{ task_id: "T-001", title: "Add authorization checks", requirement_ids: ["R-001"] }],
  }));

  assert.equal(result.state, "UNMAPPED_REQUIREMENTS");
  assert.deepEqual(result.unmapped_requirements?.map((item) => item.requirement_id), [
    "R-002", "R-003", "R-004", "R-005", "R-006", "R-007", "R-008", "R-009", "R-010",
  ]);
});

test("canonicalizes Unicode, whitespace, and object-key order for idempotent replay", async () => {
  const repository = new MemoryPlanningRepository();
  const planner = service(repository);
  const original = planningInput({
    request_id: "WF02-replay",
    title: "  Cafe\u0301 export  ",
    tasks: [{
      task_id: "T-001",
      title: "  Add authorization middleware and tests  ",
      requirement_ids: ["R-001"],
    }, { task_id: "T-002", title: "Add audit event and tests", requirement_ids: ["R-002"] }],
  });
  const replay = {
    tasks: [
      { title: "Add authorization middleware and tests", requirement_ids: ["R-001"], task_id: "T-001" },
      { requirement_ids: ["R-002"], task_id: "T-002", title: "Add audit event and tests" },
    ],
    requirements: original.requirements,
    title: "Café export",
    request_id: "WF02-replay",
  };

  assert.equal((await planner.plan(original)).state, "PLANNED");
  const result = await planner.plan(replay);
  assert.equal(result.state, "DUPLICATE");
  assert.deepEqual(result.reason_codes, ["IDEMPOTENT_REPLAY"]);
  assert.equal(repository.records.size, 1);
});

test("returns conflict when a request ID is reused with changed normalized content", async () => {
  const repository = new MemoryPlanningRepository();
  const planner = service(repository);
  await planner.plan(planningInput({ request_id: "WF02-conflict" }));
  const result = await planner.plan(planningInput({
    request_id: "WF02-conflict",
    title: "Different planning request",
  }));

  assert.equal(result.state, "CONFLICT");
  assert.ok(result.reason_codes.includes("REQUEST_ID_PAYLOAD_MISMATCH"));
  assert.equal(result.execution_permitted, false);
  assert.equal(repository.records.size, 1);
});

test("rejects unsupported dependency properties instead of inventing WF-02 ordering", async () => {
  const input = {
    ...planningInput({ request_id: "WF02-no-dependencies" }),
    tasks: [{
      task_id: "T-001",
      title: "Add authorization middleware and tests",
      requirement_ids: ["R-001"],
      depends_on: ["T-000"],
    }, { task_id: "T-002", title: "Add authorization audit event and tests", requirement_ids: ["R-002"] }],
  };
  const result = await service().plan(input);

  assert.equal(result.state, "REJECTED");
  assert.ok(result.validation_errors?.some((error) => error.path === "/tasks/0"));
});

test("treats prompt injection as requirement data and never marks tasks done or enables execution", async () => {
  const injectionPath = fileURLToPath(
    new URL("../../../workflows/WF-02-planning-validation/examples/prompt-injection.json", import.meta.url),
  );
  const injection = JSON.parse(readFileSync(injectionPath, "utf8")) as PlanningInput;
  const result = await service().plan({ ...injection, request_id: "WF02-injection" });

  assert.equal(result.state, "PLANNED");
  assert.equal(result.tasks?.[0]?.title, "Validate requirement as untrusted input");
  assert.equal(result.execution_permitted, false);
  assert.equal(result.human_review_required, true);
  assert.equal(result.approval_status, "pending_human_review");
});

test("flags production/destructive intent for human review without approval or execution", async () => {
  const result = await service().plan(planningInput({
    request_id: "WF02-high-impact",
    title: "Delete customer records in production",
  }));

  assert.equal(result.state, "PLANNED");
  assert.equal(result.human_review_required, true);
  assert.equal(result.approval_status, "pending_human_review");
  assert.equal(result.execution_permitted, false);
});

test("flags a production promotion for downstream human review", async () => {
  const result = await service().plan(planningInput({
    request_id: "WF02-production-promotion",
    title: "Promote the service to production",
  }));

  assert.equal(result.state, "PLANNED");
  assert.equal(result.human_review_required, true);
  assert.equal(result.approval_status, "pending_human_review");
  assert.equal(result.execution_permitted, false);
});

test("does not flag an explicitly negated production promotion", async () => {
  const result = await service().plan(planningInput({
    request_id: "WF02-no-production-promotion",
    title: "Do not promote the service to production",
  }));

  assert.equal(result.state, "PLANNED");
  assert.equal(result.human_review_required, false);
  assert.equal(result.approval_status, "not_required");
});

test("rejects tasks that reference unknown requirements and preserves the actual unmapped requirement", async () => {
  const result = await service().plan(planningInput({
    request_id: "WF02-unknown-reference",
    tasks: [
      { task_id: "T-001", title: "Add authorization middleware and tests", requirement_ids: ["R-UNKNOWN"] },
      { task_id: "T-002", title: "Add authorization audit event and tests", requirement_ids: ["R-002"] },
    ],
  }));

  assert.equal(result.state, "INVALID_TASK");
  assert.ok(result.validation_errors?.some((error) => error.message.includes("R-UNKNOWN")));
  assert.deepEqual(result.unmapped_requirements?.map((item) => item.requirement_id), ["R-001"]);
});
