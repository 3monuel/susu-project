import { apiFetch } from "./http";
import type { WorkspaceRepository } from "./repository";
import type { Note, Project, Task } from "./types";

export class ApiRepository implements WorkspaceRepository {
  listProjects = () => apiFetch<Project[]>("/api/projects");
  getProject = (id: string) => apiFetch<Project>(`/api/projects/${id}`);
  createProject = (project: Project) =>
    apiFetch<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(project),
    });
  updateProject = (id: string, project: Project) =>
    apiFetch<Project>(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(project),
    });
  deleteProject = (id: string) => apiFetch<void>(`/api/projects/${id}`, { method: "DELETE" });

  listTasks = async (projectId?: string | null) => {
    if (projectId) return apiFetch<Task[]>(`/api/projects/${projectId}/tasks`);
    return apiFetch<Task[]>("/api/tasks");
  };
  getTask = async (id: string) => (await this.listTasks()).find((task) => task.id === id) ?? null;
  createTask = (task: Task) =>
    apiFetch<Task>(task.projectId ? `/api/projects/${task.projectId}/tasks` : "/api/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  updateTask = (id: string, task: Task) =>
    apiFetch<Task>(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(task),
    });
  deleteTask = (id: string) => apiFetch<void>(`/api/tasks/${id}`, { method: "DELETE" });

  listNotes = () => apiFetch<Note[]>("/api/notes");
  getNote = (id: string) => apiFetch<Note>(`/api/notes/${id}`);
  createNote = (note: Note) =>
    apiFetch<Note>("/api/notes", { method: "POST", body: JSON.stringify(note) });
  updateNote = (id: string, note: Note) =>
    apiFetch<Note>(`/api/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(note),
    });
  deleteNote = (id: string) => apiFetch<void>(`/api/notes/${id}`, { method: "DELETE" });
}
