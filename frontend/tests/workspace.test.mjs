import assert from "node:assert/strict";
import { test } from "node:test";
import {
  active,
  buildPlanningPrompt,
  decodeWorkspace,
  emptyWorkspace,
  projectTasks,
  putRecord,
  sortTasks,
  taskProgress,
  validDate,
} from "../src/lib/workspace-model.ts";
import { acknowledgeSync, syncBatch } from "../src/lib/workspace-sync.ts";

const meta = (id) => ({
  id,
  remoteId: null,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  deletedAt: null,
});
const project = (id = "project-1") => ({
  ...meta(id),
  slug: id,
  name: "Investigación",
  description: "Hábitos de movilidad",
  startDate: "2026-10-01",
  dueDate: "2026-11-12",
  priority: "alta",
  difficulty: "media",
  estimatedDurationMinutes: 1320,
  tone: "line",
});
const task = (id = "task-1", patch = {}) => ({
  ...meta(id),
  name: id,
  description: "",
  dueDate: "2026-11-05",
  priority: "media",
  projectId: null,
  parentTaskId: null,
  state: "pending",
  order: 0,
  ...patch,
});
const roundTrip = (w) => decodeWorkspace(JSON.stringify(w));

test("empty workspace is versioned and defaults to deadline-first sorting", () => {
  const w = roundTrip(emptyWorkspace());
  assert.equal(w.schemaVersion, 1);
  assert.equal(w.preferences.taskSort, "dueDate");
  assert.deepEqual(w.projects, []);
});
test("independent and project tasks share one ID when associated", () => {
  let w = { ...emptyWorkspace(), projects: [project()] };
  w = putRecord(w, "tasks", task());
  assert.equal(projectTasks(w, null).length, 1);
  w = putRecord(w, "tasks", { ...w.tasks[0], projectId: "project-1" });
  assert.equal(w.tasks.length, 1);
  assert.equal(projectTasks(w, "project-1")[0].id, "task-1");
  assert.equal(projectTasks(w, null).length, 0);
  assert.equal(roundTrip(w).tasks[0].projectId, "project-1");
});
test("progress uses real tasks and handles an empty project", () => {
  assert.deepEqual(taskProgress([]), { completed: 0, total: 0, progress: 0 });
  assert.deepEqual(taskProgress([task(), task("done", { state: "completed" })]), {
    completed: 1,
    total: 2,
    progress: 50,
  });
});
test("tombstones do not appear in active lists or project progress", () => {
  const w = {
    ...emptyWorkspace(),
    tasks: [task(), task("deleted", { deletedAt: "2026-11-01T00:00:00.000Z" })],
  };
  assert.equal(active(w.tasks).length, 1);
  assert.equal(taskProgress(projectTasks(w, null)).total, 1);
});
test("deadline sorting puts undated tasks last without mutating its input", () => {
  const tasks = [
    task("undated", { dueDate: null }),
    task("late", { dueDate: "2026-12-01" }),
    task("early", { dueDate: "2026-11-01" }),
  ];
  assert.deepEqual(
    sortTasks(tasks, "dueDate").map((t) => t.id),
    ["early", "late", "undated"],
  );
  assert.equal(tasks[0].id, "undated");
});
test("sort preferences change the real ordering", () => {
  const tasks = [
    task("Zeta", { priority: "baja" }),
    task("Beta", { priority: "alta" }),
    task("Alfa", { priority: "media", createdAt: "2026-11-01T00:00:00.000Z" }),
  ];
  assert.deepEqual(
    sortTasks(tasks, "priority").map((t) => t.id),
    ["Beta", "Alfa", "Zeta"],
  );
  assert.deepEqual(
    sortTasks(tasks, "name").map((t) => t.id),
    ["Alfa", "Beta", "Zeta"],
  );
  assert.equal(sortTasks(tasks, "createdAt")[0].id, "Alfa");
});
test("dates validate actual days and leap years", () => {
  assert.ok(validDate("2024-02-29"));
  for (const date of ["2026-02-29", "2026-04-31", "2026-13-01", "not-a-date", "", null])
    assert.equal(validDate(date), false);
});
test("invalid JSON and unsupported versions are rejected rather than reset", () => {
  assert.throws(() => decodeWorkspace("{invalid"));
  assert.throws(() => roundTrip({ ...emptyWorkspace(), schemaVersion: 2 }));
});
test("duplicate IDs and project slugs are rejected", () => {
  assert.throws(() => roundTrip({ ...emptyWorkspace(), tasks: [task(), task()] }));
  assert.throws(() =>
    roundTrip({
      ...emptyWorkspace(),
      projects: [project(), { ...project("project-2"), slug: "project-1" }],
    }),
  );
});
test("invalid dates, metadata, priorities, names and date ranges are rejected", () => {
  for (const patch of [
    { dueDate: "2026-02-31" },
    { priority: "urgent" },
    { name: "  " },
    { updatedAt: "yesterday" },
    { state: "unknown" },
  ]) {
    assert.throws(() => roundTrip({ ...emptyWorkspace(), tasks: [task("invalid", patch)] }));
  }
  assert.throws(() =>
    roundTrip({
      ...emptyWorkspace(),
      projects: [{ ...project(), startDate: "2026-12-01" }],
    }),
  );
});
test("dangling project and parent-task references are rejected", () => {
  assert.throws(() =>
    roundTrip({
      ...emptyWorkspace(),
      tasks: [task("orphan", { projectId: "missing" })],
    }),
  );
  assert.throws(() =>
    roundTrip({
      ...emptyWorkspace(),
      tasks: [task("orphan", { parentTaskId: "missing" })],
    }),
  );
  assert.throws(() =>
    roundTrip({
      ...emptyWorkspace(),
      tasks: [task("self", { parentTaskId: "self" })],
    }),
  );
});
test("note relationships survive round-trip and can be detached without losing content", () => {
  let w = {
    ...emptyWorkspace(),
    projects: [project()],
    notes: [
      {
        ...meta("note-1"),
        projectId: "project-1",
        title: "Entrevistas",
        content: "Tres preguntas",
      },
    ],
  };
  assert.equal(roundTrip(w).notes[0].projectId, "project-1");
  w = putRecord(w, "notes", { ...w.notes[0], projectId: null });
  assert.equal(roundTrip(w).notes[0].content, "Tres preguntas");
});
test("planning prompt carries every relevant project field and does not invent data", () => {
  const prompt = buildPlanningPrompt(project());
  for (const text of [
    "Investigación",
    "Hábitos de movilidad",
    "2026-10-01",
    "2026-11-12",
    "alta",
    "media",
    "1320 minutos",
    "no los inventes",
  ])
    assert.ok(prompt.includes(text), text);
  assert.ok(
    buildPlanningPrompt({
      ...project(),
      dueDate: null,
      estimatedDurationMinutes: null,
    }).includes("Sin especificar"),
  );
});
test("each update replaces only its queued operation and includes the current record", () => {
  let w = putRecord(emptyWorkspace(), "tasks", task());
  const firstOperation = w.outbox[0].operationId;
  w = putRecord(w, "tasks", { ...w.tasks[0], name: "Revisada" });
  assert.equal(w.outbox.length, 1);
  assert.notEqual(w.outbox[0].operationId, firstOperation);
  assert.equal(syncBatch(w).records.tasks[0].name, "Revisada");
});
test("sync batches exclude unchanged records and include tombstones", () => {
  let w = { ...emptyWorkspace(), tasks: [task("unchanged")] };
  w = putRecord(w, "tasks", task("removed", { deletedAt: "2026-11-01T00:00:00.000Z" }));
  const batch = syncBatch(w);
  assert.equal(batch.records.tasks.length, 1);
  assert.equal(batch.records.tasks[0].id, "removed");
  assert.ok(batch.records.tasks[0].deletedAt);
});
test("only exact acknowledgements clear operations and preserve ID type", () => {
  let w = putRecord(emptyWorkspace(), "tasks", task());
  w = acknowledgeSync(w, [{ operationId: w.outbox[0].operationId, remoteId: "remote-uuid" }]);
  assert.equal(w.outbox.length, 0);
  assert.equal(w.tasks[0].remoteId, "remote-uuid");
  assert.equal(roundTrip(w).tasks[0].id, "task-1");
});
test("late acknowledgements never clear newer local edits", () => {
  let w = putRecord(emptyWorkspace(), "tasks", task());
  const oldOperation = w.outbox[0].operationId;
  w = putRecord(w, "tasks", { ...w.tasks[0], name: "Newer" });
  w = acknowledgeSync(w, [
    { operationId: oldOperation, remoteId: 42 },
    { operationId: "unknown", remoteId: "x" },
  ]);
  assert.equal(w.outbox.length, 1);
  assert.equal(w.tasks[0].name, "Newer");
});
test("orphan queued operations cannot enter storage", () => {
  assert.throws(() =>
    roundTrip({
      ...emptyWorkspace(),
      outbox: [
        {
          operationId: "op",
          entity: "tasks",
          recordId: "missing",
          updatedAt: meta("x").updatedAt,
        },
      ],
    }),
  );
});
