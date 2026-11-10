import type { Note, Priority, Project, Task } from "./types";

export type { Priority } from "./types";
export type TaskSort = "dueDate" | "priority" | "name" | "createdAt";
export type EntityKind = "projects" | "tasks" | "notes";
export type RemoteId = string | number;
export interface RecordMeta {
  id: string;
  remoteId: RemoteId | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
export interface ProjectRecord extends Project, RecordMeta {
  tone: string;
}
export interface TaskRecord extends Task, RecordMeta {}
export interface NoteRecord extends Note, RecordMeta {}
export interface SyncOperation {
  operationId: string;
  entity: EntityKind;
  recordId: string;
  updatedAt: string;
}
export interface Workspace {
  schemaVersion: 1;
  projects: ProjectRecord[];
  tasks: TaskRecord[];
  notes: NoteRecord[];
  preferences: { showCompleted: boolean; taskSort: TaskSort };
  outbox: SyncOperation[];
}
export const STORAGE_KEY = "susu.workspace.v1";
export const emptyWorkspace = (): Workspace => ({
  schemaVersion: 1,
  projects: [],
  tasks: [],
  notes: [],
  preferences: { showCompleted: true, taskSort: "dueDate" },
  outbox: [],
});
export function active<T extends RecordMeta>(records: T[]): T[] {
  return records.filter((record) => !record.deletedAt);
}
export function projectTasks(workspace: Workspace, projectId: string | null): TaskRecord[] {
  return active(workspace.tasks).filter((task) => task.projectId === projectId);
}
export function taskProgress(tasks: TaskRecord[]) {
  const completed = tasks.filter((task) => task.state === "completed").length;
  return {
    completed,
    total: tasks.length,
    progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
  };
}
export function sortTasks(tasks: TaskRecord[], sort: TaskSort): TaskRecord[] {
  const priority = { alta: 0, media: 1, baja: 2 };
  return [...tasks].sort((a, b) => {
    const comparison =
      sort === "priority"
        ? priority[a.priority] - priority[b.priority]
        : sort === "name"
          ? a.name.localeCompare(b.name, "es", { sensitivity: "base" })
          : sort === "createdAt"
            ? b.createdAt.localeCompare(a.createdAt)
            : (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31");
    return comparison || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
  });
}
export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
export function decodeWorkspace(raw: string): Workspace {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object") throw new Error("Formato de datos no válido.");
  const w = value as Workspace;
  const timestamp = (v: unknown) =>
    typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v));
  const meta = (r: RecordMeta) =>
    r &&
    typeof r.id === "string" &&
    !!r.id &&
    timestamp(r.createdAt) &&
    timestamp(r.updatedAt) &&
    (r.deletedAt === null || timestamp(r.deletedAt)) &&
    (r.remoteId === null || typeof r.remoteId === "string" || typeof r.remoteId === "number");
  const priority = (p: unknown) => ["baja", "media", "alta"].includes(String(p));
  const optionalDate = (d: unknown) => d === null || validDate(d);
  if (
    w.schemaVersion !== 1 ||
    !Array.isArray(w.projects) ||
    !Array.isArray(w.tasks) ||
    !Array.isArray(w.notes) ||
    !w.preferences ||
    typeof w.preferences.showCompleted !== "boolean" ||
    !["dueDate", "priority", "name", "createdAt"].includes(w.preferences.taskSort) ||
    !Array.isArray(w.outbox) ||
    !w.projects.every(
      (p) =>
        meta(p) &&
        typeof p.slug === "string" &&
        typeof p.name === "string" &&
        !!p.name.trim() &&
        typeof p.description === "string" &&
        priority(p.priority) &&
        priority(p.difficulty) &&
        optionalDate(p.startDate) &&
        optionalDate(p.dueDate) &&
        typeof p.tone === "string" &&
        (p.estimatedDurationMinutes === null ||
          (Number.isFinite(p.estimatedDurationMinutes) && p.estimatedDurationMinutes >= 0)),
    ) ||
    !w.tasks.every(
      (t) =>
        meta(t) &&
        typeof t.name === "string" &&
        !!t.name.trim() &&
        typeof t.description === "string" &&
        priority(t.priority) &&
        optionalDate(t.dueDate) &&
        ["pending", "completed"].includes(t.state) &&
        Number.isFinite(t.order) &&
        (t.reminderAt === undefined ||
          t.reminderAt === null ||
          (typeof t.reminderAt === "string" && Number.isFinite(Date.parse(t.reminderAt)))) &&
        (t.projectId === null || typeof t.projectId === "string") &&
        (t.parentTaskId === null || typeof t.parentTaskId === "string"),
    ) ||
    !w.notes.every(
      (n) =>
        meta(n) &&
        typeof n.title === "string" &&
        !!n.title.trim() &&
        typeof n.content === "string" &&
        (n.projectId === null || typeof n.projectId === "string"),
    ) ||
    !w.outbox.every(
      (o) =>
        o &&
        typeof o.operationId === "string" &&
        ["projects", "tasks", "notes"].includes(o.entity) &&
        typeof o.recordId === "string" &&
        typeof o.updatedAt === "string",
    )
  )
    throw new Error(
      "Los datos locales no corresponden al formato esperado. No se han sobrescrito.",
    );
  for (const records of [w.projects, w.tasks, w.notes]) {
    if (new Set(records.map((r) => r.id)).size !== records.length)
      throw new Error("Hay identificadores duplicados en los datos locales.");
  }
  const projectIds = new Set(w.projects.map((p) => p.id));
  if ([...w.tasks, ...w.notes].some((r) => r.projectId !== null && !projectIds.has(r.projectId)))
    throw new Error("Hay asociaciones de proyecto no válidas.");
  if (
    new Set(w.projects.map((p) => p.slug)).size !== w.projects.length ||
    w.projects.some((p) => !p.slug || (p.startDate && p.dueDate && p.startDate > p.dueDate))
  )
    throw new Error("Hay slugs duplicados o fechas de proyecto no válidas.");
  const taskIds = new Set(w.tasks.map((t) => t.id));
  if (
    w.tasks.some(
      (t) => t.parentTaskId !== null && (!taskIds.has(t.parentTaskId) || t.parentTaskId === t.id),
    )
  )
    throw new Error("Hay subtareas con asociaciones no válidas.");
  if (
    w.outbox.some(
      (o) => !w[o.entity].some((r) => r.id === o.recordId) || !timestamp(o.updatedAt),
    ) ||
    new Set(w.outbox.map((o) => o.operationId)).size !== w.outbox.length
  )
    throw new Error("Hay operaciones pendientes no válidas.");
  return w;
}
export function putRecord<K extends EntityKind>(
  workspace: Workspace,
  kind: K,
  record: Workspace[K][number],
): Workspace {
  const records = workspace[kind] as RecordMeta[];
  const next = records.some((r) => r.id === record.id)
    ? records.map((r) => (r.id === record.id ? record : r))
    : [...records, record];
  return {
    ...workspace,
    [kind]: next,
    outbox: [
      ...workspace.outbox.filter((o) => o.entity !== kind || o.recordId !== record.id),
      {
        operationId: crypto.randomUUID(),
        entity: kind,
        recordId: record.id,
        updatedAt: record.updatedAt,
      },
    ],
  };
}
export function buildPlanningPrompt(
  project: Pick<
    ProjectRecord,
    | "name"
    | "description"
    | "startDate"
    | "dueDate"
    | "priority"
    | "difficulty"
    | "estimatedDurationMinutes"
  >,
): string {
  return `Ayúdame a planificar este proyecto en tareas concretas y subtareas, ordenadas por fecha de vencimiento.\n\nTítulo: ${project.name || "Sin especificar"}\nDescripción: ${project.description || "Sin especificar"}\nFecha de inicio: ${project.startDate || "Sin especificar"}\nFecha límite: ${project.dueDate || "Sin especificar"}\nPrioridad: ${project.priority}\nDificultad estimada: ${project.difficulty}\nDuración estimada: ${
    project.estimatedDurationMinutes === null
      ? "Sin especificar"
      : `${project.estimatedDurationMinutes} minutos`
  }\n\nRespeta las fechas y el tiempo disponible. Identifica dependencias y propone una fecha límite para cada tarea. Pregunta por los datos que falten; no los inventes.`;
}
