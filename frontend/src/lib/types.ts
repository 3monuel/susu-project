export type Priority = "baja" | "media" | "alta";
export type TaskState = "pending" | "completed";

export interface RecordDates {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Project extends RecordDates {
  id: string;
  slug: string;
  name: string;
  description: string;
  startDate: string | null;
  dueDate: string | null;
  priority: Priority;
  difficulty: Priority;
  estimatedDurationMinutes: number | null;
}

export interface Task extends RecordDates {
  id: string;
  projectId: string | null;
  parentTaskId: string | null;
  name: string;
  description: string;
  dueDate: string | null;
  priority: Priority;
  state: TaskState;
  order: number;
  reminderAt: string | null;
}

export interface Note extends RecordDates {
  id: string;
  projectId: string | null;
  title: string;
  content: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Reminder {
  id: string;
  taskId: string;
  remindAt: string;
  status: string;
}

export interface ErrorReport {
  id: string;
  userId: string;
  type: string;
  affectedArea: string;
  description: string;
  createdAt: string;
  status: string;
}
