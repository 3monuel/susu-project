import { useState, type FormEvent, type RefObject } from "react";
import { useWorkspace } from "@/components/workspace-provider";
import {
  active,
  sortTasks,
  type Priority,
  type TaskRecord,
  type TaskSort,
} from "@/lib/workspace-model";
import { dateFromKey, localDateKey } from "@/lib/calendar";
import { Icon } from "./icon";

export const field =
  "mt-2 w-full rounded-xl border border-[var(--ui-ink)]/25 bg-[var(--ui-surface)] px-3.5 py-3 text-sm outline-none focus:border-[var(--ui-ink)]";
export const label =
  "block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ui-muted)]";
export const action =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ui-action)] px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ui-surface)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40";
export const secondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-[var(--ui-ink)]/25 px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[var(--ui-panel-hover)]";
export function formatDate(date: string | null) {
  return date
    ? dateFromKey(date).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Sin fecha";
}
export function TaskForm({
  projectId = null,
  dueDate = null,
  task,
  onClose,
  formRef,
}: {
  projectId?: string | null;
  dueDate?: string | null;
  task?: TaskRecord;
  onClose: () => void;
  formRef?: RefObject<HTMLFormElement | null>;
}) {
  const { workspace, addTaskRecord, updateTask } = useWorkspace();
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = {
      name: String(data.get("name") ?? "").trim(),
      description: String(data.get("description") ?? ""),
      projectId: String(data.get("projectId") ?? "") || null,
      dueDate: String(data.get("dueDate") ?? "") || null,
      priority: String(data.get("priority")) as Priority,
      reminderAt: data.get("reminderAt")
        ? new Date(String(data.get("reminderAt"))).toISOString()
        : null,
    };
    if (!input.name) {
      setError("Escribe un título para la tarea.");
      return;
    }
    if (await (task ? updateTask(task.id, input) : addTaskRecord(input))) onClose();
    else setError("No se pudo guardar. Revisa los datos y los permisos del almacenamiento local.");
  };
  return (
    <form
      ref={formRef}
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      aria-label={task ? "Editar tarea" : "Añadir tarea"}
      className="my-5 space-y-4 rounded-2xl border border-[var(--ui-ink)]/20 bg-[var(--ui-panel)] p-5"
    >
      <label className={label}>
        Título de la tarea
        <input
          autoFocus
          required
          name="name"
          defaultValue={task?.name}
          className={field}
          placeholder="Ej. Revisar el primer borrador"
        />
      </label>
      <label className={label}>
        Detalle (opcional)
        <textarea
          name="description"
          defaultValue={task?.description}
          className={field}
          placeholder="Una indicación o un recordatorio"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Fecha límite
          <input
            type="date"
            name="dueDate"
            defaultValue={task?.dueDate ?? dueDate ?? ""}
            className={field}
          />
        </label>
        <label className={label}>
          Prioridad
          <select name="priority" defaultValue={task?.priority ?? "media"} className={field}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </label>
      </div>
      <label className={label}>
        Asociar a proyecto
        <select
          name="projectId"
          defaultValue={task ? (task.projectId ?? "") : (projectId ?? "")}
          className={field}
        >
          <option value="">Sin proyecto · tarea independiente</option>
          {active(workspace.projects).map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        Recordatorio (opcional)
        <input
          type="datetime-local"
          name="reminderAt"
          defaultValue={task?.reminderAt?.slice(0, 16) ?? ""}
          className={field}
        />
        <span className="mt-2 block normal-case tracking-normal text-[var(--ui-muted)]">
          Se guardará con la tarea. Susu no envía notificaciones del sistema todavía.
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-[var(--ui-danger-ink)]">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onClose} className={secondary}>
          Cancelar
        </button>
        <button type="submit" className={action}>
          Guardar tarea
        </button>
      </div>
    </form>
  );
}
export function TaskList({ tasks }: { tasks: TaskRecord[] }) {
  const { workspace, updateTask } = useWorkspace();
  const [editing, setEditing] = useState<string | null>(null);
  const visible = sortTasks(tasks, workspace.preferences.taskSort).filter(
    (task) => workspace.preferences.showCompleted || task.state !== "completed",
  );
  if (!visible.length)
    return (
      <p role="status" className="py-6 text-sm leading-6 text-[var(--ui-muted)]">
        {tasks.length
          ? "No hay tareas pendientes. Puedes mostrar las completadas en Ajustes."
          : "Todavía no hay tareas. Añade la primera para empezar."}
      </p>
    );
  return (
    <div id="project-task-list" className="divide-y divide-[var(--ui-ink)]/15">
      {visible.map((task) => {
        const done = task.state === "completed";
        const project = active(workspace.projects).find((p) => p.id === task.projectId);
        const overdue = !done && !!task.dueDate && task.dueDate < localDateKey(new Date());
        return (
          <div key={task.id} data-task-id={task.id} className="py-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() =>
                  void updateTask(task.id, {
                    state: done ? "pending" : "completed",
                  })
                }
                aria-label={`${done ? "Marcar pendiente" : "Completar"}: ${task.name}`}
                aria-pressed={done}
                className={`task-status-indicator mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                  done
                    ? "is-complete border-[var(--ui-success)] bg-[var(--ui-success)] text-[var(--ui-success-ink)]"
                    : "border-[var(--ui-ink)]/45 bg-[var(--ui-surface)]"
                }`}
              >
                {done && <Icon name="check" size={15} />}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`break-words text-[15px] font-semibold ${
                    done ? "text-[var(--ui-muted)] line-through" : ""
                  }`}
                >
                  {task.name}
                </p>
                {task.description && (
                  <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-[var(--ui-muted)]">
                    {task.description}
                  </p>
                )}
                <p
                  className={`mt-2 font-mono text-[9px] uppercase leading-5 tracking-wide ${
                    overdue ? "text-[var(--ui-danger-ink)]" : "text-[var(--ui-muted)]"
                  }`}
                >
                  {formatDate(task.dueDate)}
                  {overdue && " · Atrasada"} · {task.priority} · {project?.name ?? "Sin proyecto"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(editing === task.id ? null : task.id)}
                className="rounded-full p-2 hover:bg-[var(--ui-panel)]"
                aria-label={`Editar: ${task.name}`}
              >
                <Icon name="edit" size={16} />
              </button>
            </div>
            {editing === task.id && <TaskForm task={task} onClose={() => setEditing(null)} />}
          </div>
        );
      })}
    </div>
  );
}
export function TaskSortControl() {
  const { workspace, setPreferences } = useWorkspace();
  return (
    <label className={label}>
      Ordenar tareas por
      <select
        className={field}
        value={workspace.preferences.taskSort}
        onChange={(event) => setPreferences({ taskSort: event.target.value as TaskSort })}
      >
        <option value="dueDate">Fecha de vencimiento</option>
        <option value="priority">Prioridad</option>
        <option value="name">Nombre</option>
        <option value="createdAt">Más recientes</option>
      </select>
    </label>
  );
}
export function AllTasks() {
  const { workspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState("all");
  const tasks = active(workspace.tasks).filter(
    (t) => filter === "all" || (filter === "none" ? t.projectId === null : t.projectId === filter),
  );
  return (
    <section
      className="mt-12 border-t border-[var(--ui-ink)]/20 pt-8"
      aria-labelledby="all-tasks-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={label}>Tu plan, sin duplicados</p>
          <h2
            id="all-tasks-heading"
            className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-[-0.04em]"
          >
            Todas las tareas
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-controls="all-tasks-content"
            className={secondary}
          >
            {isOpen ? "Ocultar tareas" : "Mostrar tareas"}
          </button>
          {isOpen && (
            <button onClick={() => setAdding(!adding)} className={action}>
              <Icon name="plus" size={15} />
              Añadir tarea
            </button>
          )}
        </div>
      </div>
      {isOpen && (
        <div id="all-tasks-content">
          <div className="my-5 grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Proyecto
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className={field}
              >
                <option value="all">Todos los proyectos</option>
                <option value="none">Sin proyecto</option>
                {active(workspace.projects).map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <TaskSortControl />
          </div>
          {adding && <TaskForm onClose={() => setAdding(false)} />}
          <TaskList tasks={tasks} />
        </div>
      )}
    </section>
  );
}
