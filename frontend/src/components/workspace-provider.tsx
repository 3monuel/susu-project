import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { API_ENABLED } from "@/lib/config";
import { LocalRepository } from "@/lib/local-repository";
import { repository } from "@/lib/repository-factory";
import {
  active,
  decodeWorkspace,
  emptyWorkspace,
  STORAGE_KEY,
  validDate,
  type NoteRecord,
  type ProjectRecord,
  type TaskRecord,
  type Workspace,
} from "@/lib/workspace-model";
import { initializeTheme } from "@/lib/theme";

const freshMeta = () => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    remoteId: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
};

function messageFor(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo completar la operación. Vuelve a intentarlo.";
}

function useWorkspaceStore(initial?: Workspace) {
  const [workspace, setWorkspace] = useState<Workspace>(initial ?? emptyWorkspace());
  const state = useRef(workspace);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const apply = (next: Workspace) => {
    state.current = next;
    setWorkspace(next);
  };

  const load = async () => {
    try {
      if (repository instanceof LocalRepository) {
        apply(await repository.snapshot());
      } else {
        const [projects, tasks, notes] = await Promise.all([
          repository.listProjects(),
          repository.listTasks(),
          repository.listNotes(),
        ]);
        apply({
          ...emptyWorkspace(),
          projects: projects.map((item) => ({
            ...item,
            remoteId: null,
            tone: "hatch",
          })),
          tasks: tasks.map((item) => ({
            ...item,
            remoteId: null,
            reminderAt: item.reminderAt ?? null,
          })),
          notes: notes.map((item) => ({ ...item, remoteId: null })),
        });
      }
      setError("");
    } catch (cause) {
      setError(`No se pudieron cargar los datos. ${messageFor(cause)}`);
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    initializeTheme();
    document.documentElement.dataset.reduceMotion =
      localStorage.getItem("uniplan-reduce-motion") === "true" ? "true" : "false";
    document.documentElement.dataset.interfaceSize = (
      localStorage.getItem("uniplan-interface-size") ?? "Normal"
    ).toLowerCase();
    void load();
    const onStorage = (event: StorageEvent) => {
      if (!API_ENABLED && (event.key === STORAGE_KEY || event.key === null)) void load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const createProject = async (
    input: Omit<ProjectRecord, keyof ReturnType<typeof freshMeta> | "slug">,
  ) => {
    if (
      !input.name.trim() ||
      (input.dueDate && !validDate(input.dueDate)) ||
      (input.startDate && !validDate(input.startDate)) ||
      (input.startDate && input.dueDate && input.startDate > input.dueDate)
    )
      return null;
    const meta = freshMeta();
    const record: ProjectRecord = {
      ...meta,
      ...input,
      name: input.name.trim(),
      description: input.description.trim(),
      slug: `${
        input.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "proyecto"
      }-${meta.id.slice(0, 8)}`,
    };
    try {
      await repository.createProject(record);
      await load();
      return record;
    } catch (cause) {
      setError(`No se guardó el proyecto. ${messageFor(cause)}`);
      return null;
    }
  };

  const addTaskRecord = async (
    input: Pick<
      TaskRecord,
      "name" | "description" | "projectId" | "dueDate" | "priority" | "reminderAt"
    >,
  ) => {
    if (!input.name.trim()) return false;
    const record: TaskRecord = {
      ...freshMeta(),
      ...input,
      name: input.name.trim(),
      description: input.description.trim(),
      state: "pending",
      parentTaskId: null,
      order: state.current.tasks.length,
    };
    try {
      await repository.createTask(record);
      await load();
      return true;
    } catch (cause) {
      setError(`No se guardó la tarea. ${messageFor(cause)}`);
      return false;
    }
  };

  const updateTask = async (
    id: string,
    patch: Partial<
      Pick<
        TaskRecord,
        "projectId" | "name" | "description" | "dueDate" | "priority" | "state" | "reminderAt"
      >
    >,
  ) => {
    const current = active(state.current.tasks).find((task) => task.id === id);
    if (!current) return false;
    try {
      await repository.updateTask(id, {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString(),
      });
      await load();
      return true;
    } catch (cause) {
      setError(`No se actualizó la tarea. ${messageFor(cause)}`);
      return false;
    }
  };

  const saveNote = async (input: {
    id?: string;
    projectId: string | null;
    title: string;
    content: string;
  }) => {
    if (!input.title.trim()) return false;
    const previous = input.id
      ? active(state.current.notes).find((note) => note.id === input.id)
      : undefined;
    const record: NoteRecord = {
      ...(previous ?? freshMeta()),
      projectId: input.projectId,
      title: input.title.trim(),
      content: input.content.trim(),
      updatedAt: new Date().toISOString(),
    };
    try {
      if (previous) await repository.updateNote(previous.id, record);
      else await repository.createNote(record);
      await load();
      return true;
    } catch (cause) {
      setError(`No se guardó la nota. ${messageFor(cause)}`);
      return false;
    }
  };

  const removeCompleted = async (projectId: string) => {
    try {
      await Promise.all(
        active(state.current.tasks)
          .filter((task) => task.projectId === projectId && task.state === "completed")
          .map((task) => repository.deleteTask(task.id)),
      );
      await load();
      return true;
    } catch (cause) {
      setError(`No se eliminaron las tareas. ${messageFor(cause)}`);
      return false;
    }
  };

  const setPreferences = (patch: Partial<Workspace["preferences"]>) => {
    const next = {
      ...state.current,
      preferences: { ...state.current.preferences, ...patch },
    };
    if (repository instanceof LocalRepository)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    apply(next);
  };

  const commit = (change: (current: Workspace) => Workspace) => {
    if (!(repository instanceof LocalRepository)) {
      setError("Esta operación de copia local no está disponible al usar la API.");
      return false;
    }
    try {
      const next = decodeWorkspace(JSON.stringify(change(state.current)));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      apply(next);
      return true;
    } catch (cause) {
      setError(`No se guardó el cambio. ${messageFor(cause)}`);
      return false;
    }
  };

  const restoreWorkspace = (candidate: Workspace) => {
    if (!(repository instanceof LocalRepository)) return false;
    try {
      const restored = decodeWorkspace(JSON.stringify(candidate));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
      apply(restored);
      return true;
    } catch {
      setError("No se pudo restaurar la copia. Los datos actuales se conservan.");
      return false;
    }
  };

  return {
    workspace,
    ready,
    error,
    createProject,
    addTaskRecord,
    updateTask,
    saveNote,
    removeCompleted,
    setPreferences,
    commit,
    restoreWorkspace,
  };
}

const WorkspaceContext = createContext<ReturnType<typeof useWorkspaceStore> | null>(null);

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("Workspace provider is required.");
  return context;
}

export default function WorkspaceProvider({
  initial,
  children,
}: {
  initial?: Workspace;
  children: ReactNode;
}) {
  const store = useWorkspaceStore(initial);
  const [dismissedError, setDismissedError] = useState("");
  if (!store.ready)
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--ui-surface)] font-mono text-sm text-[var(--ui-ink)]">
        Abriendo tu espacio…
      </div>
    );
  return (
    <WorkspaceContext.Provider value={store}>
      {store.error && store.error !== dismissedError && (
        <div
          role="alert"
          className="fixed inset-x-3 top-2 z-[100] rounded-xl border border-[var(--ui-danger)] bg-[var(--ui-danger-soft)] p-4 text-sm text-[var(--ui-danger-ink)]"
        >
          <p>{store.error}</p>
          <button
            type="button"
            onClick={() => setDismissedError(store.error)}
            className="mt-2 font-semibold underline underline-offset-4"
          >
            Ocultar aviso
          </button>
        </div>
      )}
      {children}
    </WorkspaceContext.Provider>
  );
}
