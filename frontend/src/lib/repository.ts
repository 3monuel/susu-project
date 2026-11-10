import type { Note, Project, Task } from "./types";

export interface WorkspaceRepository {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(project: Project): Promise<Project>;
  updateProject(id: string, project: Project): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  listTasks(projectId?: string | null): Promise<Task[]>;
  getTask(id: string): Promise<Task | null>;
  createTask(task: Task): Promise<Task>;
  updateTask(id: string, task: Task): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  listNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | null>;
  createNote(note: Note): Promise<Note>;
  updateNote(id: string, note: Note): Promise<Note>;
  deleteNote(id: string): Promise<void>;
}
