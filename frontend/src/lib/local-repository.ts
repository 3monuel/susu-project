import type { WorkspaceRepository } from "./repository";
import {
  decodeWorkspace,
  emptyWorkspace,
  putRecord,
  STORAGE_KEY,
  type Workspace,
} from "./workspace-model.ts";
import type { Note, Project, Task } from "./types";

export class LocalRepository implements WorkspaceRepository {
  private readonly seed: Workspace;

  constructor(seed: Workspace = emptyWorkspace()) {
    this.seed = seed;
  }

  private read(): Workspace {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return decodeWorkspace(raw);
    const initial = decodeWorkspace(JSON.stringify(this.seed));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  private write(workspace: Workspace): void {
    const valid = decodeWorkspace(JSON.stringify(workspace));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
  }

  private save<K extends "projects" | "tasks" | "notes">(
    kind: K,
    record: Workspace[K][number],
  ): Workspace[K][number] {
    this.write(putRecord(this.read(), kind, record));
    return record;
  }

  async snapshot(): Promise<Workspace> {
    return this.read();
  }

  async listProjects() {
    return this.read().projects.filter((item) => !item.deletedAt);
  }
  async getProject(id: string) {
    return this.read().projects.find((item) => item.id === id && !item.deletedAt) ?? null;
  }
  async createProject(project: Project) {
    const existing = this.read().projects.find((item) => item.id === project.id);
    return this.save("projects", {
      ...(existing ?? { remoteId: null, tone: "hatch" }),
      ...project,
    });
  }
  async updateProject(_id: string, project: Project) {
    const existing = this.read().projects.find((item) => item.id === project.id);
    return this.save("projects", {
      ...(existing ?? { remoteId: null, tone: "hatch" }),
      ...project,
    });
  }
  async deleteProject(id: string) {
    const project = await this.getProject(id);
    if (project)
      this.save("projects", {
        ...project,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
  }

  async listTasks(projectId?: string | null) {
    const tasks = this.read().tasks.filter((item) => !item.deletedAt);
    return projectId === undefined ? tasks : tasks.filter((item) => item.projectId === projectId);
  }
  async getTask(id: string) {
    return this.read().tasks.find((item) => item.id === id && !item.deletedAt) ?? null;
  }
  async createTask(task: Task) {
    const existing = this.read().tasks.find((item) => item.id === task.id);
    return this.save("tasks", { ...(existing ?? { remoteId: null }), ...task });
  }
  async updateTask(_id: string, task: Task) {
    const existing = this.read().tasks.find((item) => item.id === task.id);
    return this.save("tasks", { ...(existing ?? { remoteId: null }), ...task });
  }
  async deleteTask(id: string) {
    const task = await this.getTask(id);
    if (task)
      this.save("tasks", {
        ...task,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
  }

  async listNotes() {
    return this.read().notes.filter((item) => !item.deletedAt);
  }
  async getNote(id: string) {
    return this.read().notes.find((item) => item.id === id && !item.deletedAt) ?? null;
  }
  async createNote(note: Note) {
    const existing = this.read().notes.find((item) => item.id === note.id);
    return this.save("notes", { ...(existing ?? { remoteId: null }), ...note });
  }
  async updateNote(_id: string, note: Note) {
    const existing = this.read().notes.find((item) => item.id === note.id);
    return this.save("notes", { ...(existing ?? { remoteId: null }), ...note });
  }
  async deleteNote(id: string) {
    const note = await this.getNote(id);
    if (note)
      this.save("notes", {
        ...note,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
  }
}
