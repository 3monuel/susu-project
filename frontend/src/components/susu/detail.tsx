import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link, { useNavigate, useProjectParams } from "@/components/navigation";
import { useWorkspace } from "@/components/workspace-provider";
import { active, projectTasks, sortTasks, taskProgress } from "@/lib/workspace-model";
import { Icon } from "./icon";
import { SecondaryScreen } from "./shell";
import { action, secondary, formatDate, TaskForm, TaskList, TaskSortControl } from "./tasks";

function DeleteProjectDialog({
  projectName,
  taskCount,
  noteCount,
  onCancel,
  onConfirm,
}: {
  projectName: string;
  taskCount: number;
  noteCount: number;
  onCancel: () => void;
  onConfirm: () => Promise<boolean>;
}) {
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const cancel = useRef(onCancel);
  cancel.current = onCancel;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = dialog.current!;
    panel.querySelector<HTMLInputElement>('input[type="checkbox"]')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancel.current();
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled])"),
      );
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);

  return createPortal(
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
      className="fixed inset-0 z-[80] grid place-items-center bg-[var(--ui-action)]/30 p-4 text-[var(--ui-ink)] backdrop-blur-sm"
    >
      <div
        ref={dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-project-title"
        aria-describedby="delete-project-description"
        className="w-full max-w-[520px] rounded-[24px] border border-[var(--ui-danger)] bg-[var(--ui-surface)] p-6 shadow-[0_24px_70px_var(--ui-elevation)] sm:p-8"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full border border-[var(--ui-danger)] bg-[var(--ui-danger-soft)] text-[var(--ui-danger-ink)]">
          <Icon name="trash" size={20} />
        </span>
        <h2
          id="delete-project-title"
          className="mt-5 font-[family-name:var(--font-display)] text-3xl leading-tight tracking-[-0.035em]"
        >
          ¿Eliminar «{projectName}»?
        </h2>
        <div id="delete-project-description" className="mt-4 space-y-2 text-sm leading-6">
          <p>
            Se eliminará el proyecto completo y{" "}
            <b>{taskCount === 1 ? "su tarea" : `sus ${taskCount} tareas`}</b>, incluidas las
            subtareas.
          </p>
          {noteCount > 0 && (
            <p>
              {noteCount === 1
                ? "La nota asociada se conservará"
                : `Las ${noteCount} notas asociadas se conservarán`}{" "}
              sin proyecto.
            </p>
          )}
        </div>
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--ui-danger)] bg-[var(--ui-danger-soft)] p-4 text-sm font-semibold text-[var(--ui-danger-ink)]">
          <input
            type="checkbox"
            checked={understood}
            onChange={(event) => setUnderstood(event.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--ui-danger-ink)]"
          />
          Entiendo que esta acción no se puede deshacer.
        </label>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className={secondary}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={!understood || busy}
            onClick={async () => {
              setBusy(true);
              if (!(await onConfirm())) setBusy(false);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--ui-danger-ink)] bg-[var(--ui-danger-ink)] px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ui-surface)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="trash" size={14} />
            {busy ? "Eliminando…" : "Eliminar proyecto"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ProjectDetailScreen() {
  const { projectSlug } = useProjectParams();
  const { workspace, removeCompleted, deleteProject } = useWorkspace();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const project = active(workspace.projects).find((p) => p.slug === projectSlug);
  if (!project)
    return (
      <SecondaryScreen active="">
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--ui-muted)]">
          Espacio local
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl tracking-tight">
          Proyecto no encontrado
        </h1>
        <p className="my-6 max-w-xl text-sm leading-6 text-[var(--ui-muted)]">
          Este proyecto no existe en este navegador o fue eliminado. Los proyectos personales no se
          comparten mediante el enlace: puedes importar una copia en Ajustes.
        </p>
        <Link href="/" className={secondary}>
          Volver a mis proyectos
        </Link>
      </SecondaryScreen>
    );
  const tasks = projectTasks(workspace, project.id);
  const { completed, total, progress } = taskProgress(tasks);
  const nextTask = sortTasks(
    tasks.filter((t) => t.state === "pending"),
    "dueDate",
  )[0];
  const notes = active(workspace.notes).filter((n) => n.projectId === project.id);
  return (
    <SecondaryScreen active="">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--ui-ink)]/20 pb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ui-muted)]">
            Proyecto en curso · {project.priority}
          </p>
          <h1 className="mt-3 max-w-[760px] font-[family-name:var(--font-display)] text-5xl leading-[0.98] tracking-[-0.06em] sm:text-6xl">
            {project.name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className={secondary}>
            Ver proyectos
          </Link>
          <button
            type="button"
            onClick={() => setDeletingProject(true)}
            className={`${secondary} border-[var(--ui-danger)] text-[var(--ui-danger-ink)]`}
          >
            <Icon name="trash" size={14} />
            Eliminar proyecto
          </button>
        </div>
      </div>
      {deletingProject && (
        <DeleteProjectDialog
          projectName={project.name}
          taskCount={tasks.length}
          noteCount={notes.length}
          onCancel={() => setDeletingProject(false)}
          onConfirm={async () => {
            const ok = await deleteProject(project.id);
            if (ok) navigate("/", { replace: true });
            return ok;
          }}
        />
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="project-elevated rounded-[24px] border border-[var(--ui-ink)]/20 bg-[var(--ui-project-card)] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--ui-ink)]/15 pb-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--ui-muted)]">
                Plan de trabajo
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight">
                Tareas
              </h2>
            </div>
            <button onClick={() => setAdding(!adding)} aria-expanded={adding} className={action}>
              <Icon name="plus" size={15} />
              Añadir tarea
            </button>
          </div>
          {adding && <TaskForm projectId={project.id} onClose={() => setAdding(false)} />}
          <div className="my-5 max-w-xs">
            <TaskSortControl />
          </div>
          <TaskList tasks={tasks} />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--ui-ink)]/15 pt-5">
            <p className="text-sm text-[var(--ui-muted)]">
              {completed} de {total} tareas completadas.
            </p>
            <button
              onClick={() => setDeleting(true)}
              disabled={!completed}
              className={`${secondary} text-[var(--ui-danger-ink)] disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <Icon name="trash" size={14} />
              Eliminar completadas
            </button>
          </div>
          {deleting && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-[var(--ui-danger)] bg-[var(--ui-danger-soft)] p-5 text-sm text-[var(--ui-danger-ink)]"
            >
              <p>
                ¿Eliminar las {completed} tareas completadas de este proyecto? No se tocarán las de
                otros proyectos. No se puede deshacer.
              </p>
              <div className="mt-4 flex gap-3">
                <button onClick={() => setDeleting(false)} className={secondary}>
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (await removeCompleted(project.id)) setDeleting(false);
                  }}
                  className={secondary}
                >
                  Confirmar eliminación
                </button>
              </div>
            </div>
          )}
        </section>
        <aside className="space-y-5">
          <section className="calendar-elevated rounded-[24px] border border-[var(--ui-ink)]/20 bg-[var(--ui-panel)] p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--ui-muted)]">
              Progreso general
            </p>
            <p className="mt-4 font-[family-name:var(--font-display)] text-5xl tracking-tight">
              {progress}%
            </p>
            <div
              role="progressbar"
              aria-label="Progreso general del proyecto"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-4 h-3 border border-[var(--ui-ink)]/55 p-[3px]"
            >
              <div
                className={`h-full bg-[var(--ui-action)] ${project.tone}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>
          <section className="day-tasks-elevated rounded-[24px] border border-[var(--ui-ink)]/20 p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--ui-muted)]">
              Detalles del proyecto
            </p>
            {project.description && (
              <p className="my-4 whitespace-pre-wrap text-sm leading-6">{project.description}</p>
            )}
            <dl className="mt-3 divide-y divide-[var(--ui-ink)]/15">
              {[
                ["Inicio", formatDate(project.startDate)],
                ["Fecha límite", formatDate(project.dueDate)],
                ["Prioridad", project.priority],
                ["Dificultad", project.difficulty],
                [
                  "Duración",
                  project.estimatedDurationMinutes === null
                    ? "Sin estimar"
                    : `${project.estimatedDurationMinutes / 60} horas`,
                ],
              ].map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 py-3 text-sm">
                  <dt className="text-[var(--ui-muted)]">{key}</dt>
                  <dd className="text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-[24px] border border-[var(--ui-ink)]/20 p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--ui-muted)]">
              Próximo paso
            </p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-2xl leading-tight tracking-tight">
              {nextTask?.name ?? "Todo al día. Puedes añadir una nueva tarea."}
            </p>
            <Link
              href={`/asistente?proyecto=${encodeURIComponent(project.id)}`}
              className={`${secondary} mt-5`}
            >
              <Icon name="sparkle" size={15} />
              Preparar solicitud
            </Link>
          </section>
        </aside>
      </div>
      <section className="mt-8 border-t border-[var(--ui-ink)]/20 pt-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
            Notas del proyecto
          </h2>
          <Link
            href={`/notas?proyecto=${encodeURIComponent(project.id)}&nueva=1`}
            className={secondary}
          >
            <Icon name="plus" size={14} />
            Añadir nota
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/notas?nota=${encodeURIComponent(note.id)}`}
              className="note-card-elevated rounded-2xl border border-[var(--ui-ink)]/20 p-5 transition hover:bg-[var(--ui-panel)]"
            >
              <h3 className="font-[family-name:var(--font-display)] text-2xl">{note.title}</h3>
              <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[var(--ui-muted)]">
                {note.content || "Nota sin contenido."}
              </p>
            </Link>
          ))}
        </div>
        {!notes.length && (
          <p className="mt-5 text-sm text-[var(--ui-muted)]">
            Todavía no hay notas asociadas a este proyecto.
          </p>
        )}
      </section>
    </SecondaryScreen>
  );
}
