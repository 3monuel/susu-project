import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { LocalRepository } from "../src/lib/local-repository.ts";
import { emptyWorkspace } from "../src/lib/workspace-model.ts";

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
  clear: () => values.clear(),
};

const dates = {
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null,
};

beforeEach(() => values.clear());

test("LocalRepository performs project, task and note CRUD without losing relationships", async () => {
  const repository = new LocalRepository(emptyWorkspace());
  const project = {
    ...dates,
    id: "project-1",
    slug: "proyecto-1",
    name: "Proyecto",
    description: "",
    startDate: null,
    dueDate: null,
    priority: "media",
    difficulty: "media",
    estimatedDurationMinutes: null,
  };
  await repository.createProject(project);
  assert.equal((await repository.getProject(project.id))?.name, "Proyecto");
  await repository.updateProject(project.id, { ...project, name: "Proyecto actualizado" });
  assert.equal((await repository.getProject(project.id))?.tone, "hatch");

  const task = {
    ...dates,
    id: "task-1",
    projectId: project.id,
    parentTaskId: null,
    name: "Tarea",
    description: "",
    dueDate: null,
    priority: "alta",
    state: "pending",
    order: 0,
    reminderAt: "2026-01-02T10:00:00.000Z",
  };
  await repository.createTask(task);
  assert.equal((await repository.listTasks(project.id))[0].reminderAt, task.reminderAt);
  await repository.updateTask(task.id, { ...task, name: "Tarea actualizada" });
  assert.equal((await repository.getTask(task.id))?.remoteId, null);

  const note = {
    ...dates,
    id: "note-1",
    projectId: project.id,
    title: "Nota",
    content: "Contenido",
  };
  await repository.createNote(note);
  await repository.updateNote(note.id, { ...note, title: "Nota actualizada" });
  assert.equal((await repository.getNote(note.id))?.title, "Nota actualizada");

  await repository.deleteTask(task.id);
  await repository.deleteNote(note.id);
  await repository.deleteProject(project.id);
  assert.equal((await repository.listTasks()).length, 0);
  assert.equal((await repository.listNotes()).length, 0);
  assert.equal((await repository.listProjects()).length, 0);
});

test("LocalRepository conserva tone y remoteId al actualizar registros existentes", async () => {
  const project = {
    ...dates,
    id: "project-remote",
    remoteId: "project-api-9",
    tone: "line",
    slug: "proyecto-remoto",
    name: "Proyecto remoto",
    description: "",
    startDate: null,
    dueDate: null,
    priority: "media",
    difficulty: "media",
    estimatedDurationMinutes: null,
  };
  const task = {
    ...dates,
    id: "task-remote",
    remoteId: "task-api-9",
    projectId: project.id,
    parentTaskId: null,
    name: "Tarea remota",
    description: "",
    dueDate: null,
    priority: "media",
    state: "pending",
    order: 0,
    reminderAt: null,
  };
  const repository = new LocalRepository({
    ...emptyWorkspace(),
    projects: [project],
    tasks: [task],
  });

  await repository.updateProject(project.id, { ...project, name: "Proyecto editado" });
  await repository.updateTask(task.id, { ...task, name: "Tarea editada" });

  assert.equal((await repository.getProject(project.id))?.tone, "line");
  assert.equal((await repository.getProject(project.id))?.remoteId, "project-api-9");
  assert.equal((await repository.getTask(task.id))?.remoteId, "task-api-9");
});
