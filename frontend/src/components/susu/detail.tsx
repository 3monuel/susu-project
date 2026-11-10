import { useState } from "react";
import Link, { useProjectParams } from "@/components/navigation";
import { useWorkspace } from "@/components/workspace-provider";
import { active, projectTasks, sortTasks, taskProgress } from "@/lib/workspace-model";
import { Icon } from "./icon";
import { SecondaryScreen } from "./shell";
import { action, secondary, formatDate, TaskForm, TaskList, TaskSortControl } from "./tasks";

export function ProjectDetailScreen() {
  const { projectSlug } = useProjectParams();
  const { workspace, removeCompleted } = useWorkspace();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
        <Link href="/" className={secondary}>
          Ver proyectos
        </Link>
      </div>
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
