// DOM rectangles include the interface scale; scroll offsets and padding do not.
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "@/components/navigation";
import { useWorkspace } from "@/components/workspace-provider";
import {
  active,
  taskProgress,
  projectTasks,
  buildPlanningPrompt,
  type Priority,
} from "@/lib/workspace-model";
import { dateFromKey, localDateKey, monthCells, shiftMonth } from "@/lib/calendar";
import { useDeviceDate } from "@/lib/use-device-date";
import { Icon } from "./icon";
import {
  AppHeader,
  FloatingNavigation,
  SecondaryScreen,
  useMobileHeaderVisibility,
} from "./shell";
import { TaskForm, TaskList, AllTasks } from "./tasks";
function ProjectForm() {
  const navigate = useNavigate();
  const { createProject } = useWorkspace();
  const [error, setError] = useState("");
  const [aiPlan, setAiPlan] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const readProject = () => {
    const data = new FormData(formRef.current!);
    return {
      name: String(data.get("name") ?? ""),
      description: String(data.get("description") ?? ""),
      startDate: String(data.get("startDate") ?? "") || null,
      dueDate: String(data.get("dueDate") ?? "") || null,
      priority: priority as Priority,
      difficulty: difficulty as Priority,
      estimatedDurationMinutes: data.get("duration") ? Number(data.get("duration")) * 60 : null,
      tone: "hatch",
    };
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const input = readProject();
    if (input.startDate && input.dueDate && input.startDate > input.dueDate) {
      setError("La fecha límite no puede ser anterior al inicio.");
      return;
    }
    const project = await createProject(input);
    if (project) navigate(`/proyectos/${project.slug}`);
    else setError("No se pudo guardar el proyecto. Revisa los campos y el almacenamiento local.");
  };
  const [priority, setPriority] = useState("media");
  const [difficulty, setDifficulty] = useState("media");
  const [isClosing, setIsClosing] = useState(false);
  const fieldClass =
    "mt-2 w-full rounded-xl border border-[var(--ui-ink)]/25 bg-[var(--ui-surface)] px-3.5 py-3 text-sm outline-none transition placeholder:text-[var(--ui-muted)]/65 focus:border-[var(--ui-ink)] focus:ring-2 focus:ring-[var(--ui-accent)]";
  const labelClass =
    "font-mono text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--ui-muted)]";
  const closeForm = () => {
    if (isClosing) return;
    if (
      document.documentElement.dataset.reduceMotion === "true" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      navigate("/");
      return;
    }
    setIsClosing(true);
    window.setTimeout(() => navigate("/"), 240);
  };

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "Escape") closeForm();
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>("button, input, textarea, select"),
        );
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeForm();
      }}
      className={`project-form-overlay mobile-scroll fixed inset-x-0 bottom-0 top-[78px] z-30 overflow-y-auto overscroll-contain bg-[var(--ui-action)]/20 p-3 backdrop-blur-sm sm:inset-0 sm:p-7 ${
        isClosing ? "is-closing" : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-title"
    >
      <div
        className={`project-form-panel mx-auto min-h-full max-w-[900px] rounded-[28px] border border-[var(--ui-ink)]/25 bg-[var(--ui-surface)] shadow-[0_22px_70px_rgba(32,33,31,0.22)] ${
          isClosing ? "is-closing" : ""
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--ui-ink)]/15 bg-[var(--ui-panel)] px-5 py-4 sm:px-8">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--ui-muted)]">
              Nuevo espacio de trabajo
            </p>
            <h2
              id="form-title"
              className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-[-0.035em]"
            >
              Añadir proyecto
            </h2>
          </div>
          <button
            onClick={closeForm}
            className="group grid h-10 w-10 place-items-center rounded-full border border-[var(--ui-ink)]/25 transition hover:bg-[var(--ui-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ink)]"
            aria-label="Cerrar formulario"
          >
            <span className="transition-transform duration-300 group-hover:rotate-90">
              <Icon name="close" />
            </span>
          </button>
        </div>
        <form ref={formRef} onSubmit={submit} className="p-5 sm:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <label className={`md:col-span-2 ${labelClass}`}>
              Nombre del proyecto
              <input
                autoFocus
                name="name"
                required
                className={fieldClass}
                placeholder="Ej. Diseño de investigación"
              />
            </label>
            <label className={`md:col-span-2 ${labelClass}`}>
              Descripción
              <textarea
                name="description"
                className={`${fieldClass} min-h-24 resize-y`}
                placeholder="¿Qué quieres conseguir con este proyecto?"
              />
            </label>
            <label className={labelClass}>
              Fecha de inicio
              <input name="startDate" required type="date" className={fieldClass} />
            </label>
            <label className={labelClass}>
              Fecha límite
              <input name="dueDate" required type="date" className={fieldClass} />
            </label>
            <fieldset className={labelClass}>
              <legend>Prioridad</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  {
                    value: "baja",
                    label: "Baja",
                    color:
                      "border-[var(--ui-success)] bg-[var(--ui-success-soft)] text-[var(--ui-success-ink)]",
                  },
                  {
                    value: "media",
                    label: "Media",
                    color:
                      "border-[var(--ui-warning)] bg-[var(--ui-warning-soft)] text-[var(--ui-warning-ink)]",
                  },
                  {
                    value: "alta",
                    label: "Alta",
                    color:
                      "border-[var(--ui-danger)] bg-[var(--ui-danger-soft)] text-[var(--ui-danger-ink)]",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    aria-pressed={priority === option.value}
                    className={`rounded-xl border px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.05em] transition ${option.color} ${
                      priority === option.value ? "ring-1 ring-[var(--ui-ink)] ring-offset-1" : ""
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className={labelClass}>
              <legend>Dificultad</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  {
                    value: "baja",
                    label: "Baja",
                    color:
                      "border-[var(--ui-success)] bg-[var(--ui-success-soft)] text-[var(--ui-success-ink)]",
                  },
                  {
                    value: "media",
                    label: "Media",
                    color:
                      "border-[var(--ui-warning)] bg-[var(--ui-warning-soft)] text-[var(--ui-warning-ink)]",
                  },
                  {
                    value: "alta",
                    label: "Alta",
                    color:
                      "border-[var(--ui-danger)] bg-[var(--ui-danger-soft)] text-[var(--ui-danger-ink)]",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDifficulty(option.value)}
                    aria-pressed={difficulty === option.value}
                    className={`rounded-xl border px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.05em] transition ${option.color} ${
                      difficulty === option.value ? "ring-1 ring-[var(--ui-ink)] ring-offset-1" : ""
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className={`md:col-span-2 ${labelClass}`}>
              Duración estimada (horas)
              <input
                name="duration"
                type="number"
                min="0"
                step="0.25"
                className={fieldClass}
                placeholder="Ej. 18"
              />
            </label>
          </div>

          <section
            className="mt-8 rounded-2xl border border-[var(--ui-ink)]/20 bg-[var(--ui-panel)] p-5 sm:p-6"
            aria-labelledby="ai-title"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--ui-ink)]/25 bg-[var(--ui-surface)]">
                  <Icon name="wand" size={18} />
                </span>
                <div>
                  <h3
                    id="ai-title"
                    className="font-[family-name:var(--font-display)] text-xl tracking-[-0.025em]"
                  >
                    Planificar con asistente de IA
                  </h3>
                  <p className="mt-1 max-w-[490px] text-sm leading-5 text-[var(--ui-muted)]">
                    Prepara una solicitud con tus datos para copiarla a tu herramienta de IA. No se
                    envía información automáticamente.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiPlan(buildPlanningPrompt(readProject()))}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-ink)] bg-[var(--ui-action)] px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ui-surface)] transition hover:bg-[var(--ui-panel-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ink)]"
              >
                <Icon name={aiPlan ? "check" : "sparkle"} size={15} />
                {aiPlan ? "Actualizar solicitud" : "Preparar solicitud"}
              </button>
            </div>
            {aiPlan && (
              <textarea
                aria-label="Solicitud de planificación"
                readOnly
                value={aiPlan}
                className="mt-5 min-h-56 w-full rounded-xl border border-[var(--ui-ink)]/20 bg-[var(--ui-surface)] p-4 text-sm"
              />
            )}
            {error && (
              <p role="alert" className="mt-4 text-sm text-[var(--ui-danger-ink)]">
                {error}
              </p>
            )}
          </section>
          <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-[var(--ui-ink)]/15 pt-5">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-full border border-[var(--ui-ink)]/25 px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.09em] transition hover:bg-[var(--ui-panel-hover)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-full bg-[var(--ui-action)] px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.09em] text-[var(--ui-surface)] transition hover:bg-[var(--ui-panel-hover)]"
            >
              Crear proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProjectsScreen() {
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const projects = active(workspace.projects);
  const projectSummaries = projects.map((project) => ({
    ...project,
    ...taskProgress(projectTasks(workspace, project.id)),
  }));
  const location = useLocation();
  const isFormOpen = location.pathname === "/nuevo-proyecto";
  const { isHidden, onScroll } = useMobileHeaderVisibility();
  useEffect(() => {
    if (!isFormOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFormOpen]);

  return (
    <div className="app-screen-layout min-h-screen bg-[var(--ui-page)] p-0 text-[var(--ui-ink)] selection:bg-[var(--ui-accent)] lg:p-7">
      <div className="relative mx-auto flex h-[100dvh] min-h-screen max-w-[1440px] flex-col overflow-hidden bg-[var(--ui-surface)] shadow-[0_14px_45px_rgba(32,33,31,0.10)] lg:h-[calc(100dvh-3.5rem)] lg:min-h-0 lg:border lg:border-[var(--ui-ink)]/20">
        <AppHeader isHidden={isHidden} />
        <main
          onScroll={onScroll}
          className={`app-screen-content mobile-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-9 pb-52 sm:px-10 sm:pt-12 sm:pb-52 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-14 lg:py-14`}
        >
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--ui-ink)]/20 pb-6">
            <div>
              <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-muted)]">
                <span className="h-2 w-2 bg-[var(--ui-action)]" /> Tu espacio de trabajo
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-[-0.055em] sm:text-6xl">
                Proyectos en curso
              </h1>
            </div>
            <span
              aria-live="polite"
              className="rounded-full border border-[var(--ui-ink)]/25 bg-[var(--ui-surface)]/70 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ui-muted)]"
            >
              {projectSummaries.length}{" "}
              {projectSummaries.length === 1 ? "proyecto en curso" : "proyectos en curso"}
            </span>
          </div>
          <section
            aria-label="Lista de proyectos"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <button
              onClick={() => navigate("/nuevo-proyecto")}
              className="group flex min-h-[166px] flex-col items-start justify-between self-start project-elevated rounded-[22px] border border-[var(--ui-ink)]/30 bg-[var(--ui-panel)] p-5 text-left transition hover:bg-[var(--ui-panel-hover)] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ink)]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--ui-ink)] transition-transform duration-300 group-hover:rotate-90">
                <Icon name="plus" size={21} />
              </span>
              <span>
                <span className="block font-[family-name:var(--font-display)] text-xl tracking-[-0.035em]">
                  Añadir proyecto
                </span>
                <span className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.11em] text-[var(--ui-muted)]">
                  Crear espacio de trabajo <Icon name="arrow" size={14} />
                </span>
              </span>
            </button>
            {projectSummaries.map((project, index) => (
              <button
                type="button"
                onClick={() => navigate(`/proyectos/${project.slug}`)}
                key={project.slug}
                className="relative flex min-h-[270px] flex-col justify-between project-elevated rounded-[22px] border border-[var(--ui-ink)]/20 bg-[var(--ui-project-card)] p-6 text-left transition hover:bg-[var(--ui-panel-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ink)] sm:p-7"
              >
                <span className="absolute right-6 top-6 font-mono text-[10px] text-[var(--ui-muted)]">
                  0{index + 1}
                </span>
                <div>
                  <p className="mb-7 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ui-muted)]">
                    {project.dueDate
                      ? `Entrega ${dateFromKey(project.dueDate!).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`
                      : "Sin fecha límite"}
                  </p>
                  <h2 className="max-w-[220px] font-[family-name:var(--font-display)] text-[27px] leading-[1.04] tracking-[-0.04em]">
                    {project.name}
                  </h2>
                </div>
                <div>
                  <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em]">
                    <span>Progreso</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div
                    className="h-2 border border-[var(--ui-ink)] p-[2px]"
                    aria-label={`${project.progress}% completado`}
                  >
                    <div
                      className={`h-full bg-[var(--ui-action)] ${project.tone}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-[var(--ui-muted)]">
                    {project.completed} de {project.total} tareas
                  </p>
                </div>
              </button>
            ))}
          </section>
          <AllTasks />
        </main>
      </div>
      {!isFormOpen && <FloatingNavigation />}
      {isFormOpen && <ProjectForm />}
    </div>
  );
}

export function CalendarScreen() {
  const navigate = useNavigate();
  const today = useDeviceDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const previousToday = useRef(today);
  const [addingTask, setAddingTask] = useState(false);
  const { workspace } = useWorkspace();
  const projects = active(workspace.projects);
  const taskFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const previous = previousToday.current;
    if (today !== previous) {
      setSelectedDate((current) => (current === previous ? today : current));
      previousToday.current = today;
    }
  }, [today]);

  useLayoutEffect(() => {
    const form = taskFormRef.current;
    const scroller = form?.closest<HTMLElement>(".app-screen-content");
    if (!addingTask || !form || !scroller) return;

    const revealForm = () => {
      const bounds = scroller.getBoundingClientRect();
      const scale = bounds.height / scroller.offsetHeight;
      if (!scale) return;
      const navigation = document.querySelector<HTMLElement>('[aria-label="Navegación principal"]');
      const viewport = window.visualViewport;
      const viewportBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
      const visibleBottom =
        Math.min(
          bounds.bottom,
          viewportBottom,
          navigation?.getBoundingClientRect().top ?? viewportBottom,
        ) - 24;
      scroller.style.setProperty(
        "--calendar-task-clearance",
        `${Math.max(0, (bounds.bottom - visibleBottom) / scale)}px`,
      );
      const formBounds = form.getBoundingClientRect();
      const visibleTop = bounds.top + 16;
      const offset =
        formBounds.bottom > visibleBottom
          ? formBounds.bottom - visibleBottom
          : Math.min(0, formBounds.top - visibleTop);
      scroller.scrollBy({ top: offset / scale, behavior: "instant" });
    };

    form.querySelector("input")?.focus({ preventScroll: true });
    revealForm();
    const frame = requestAnimationFrame(revealForm);
    window.addEventListener("resize", revealForm);
    window.visualViewport?.addEventListener("resize", revealForm);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", revealForm);
      window.visualViewport?.removeEventListener("resize", revealForm);
      scroller.style.removeProperty("--calendar-task-clearance");
    };
  }, [addingTask]);

  const week = ["L", "M", "X", "J", "V", "S", "D"];
  const selected = dateFromKey(selectedDate);
  const cells = monthCells(selected);
  const monthTitle = selected.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
  const dayFormatter = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const selectedLabel = dayFormatter.format(selected);
  const tasksOnDate = (key: string) =>
    active(workspace.tasks).filter(
      (t) => t.dueDate === key && (workspace.preferences.showCompleted || t.state !== "completed"),
    );
  const tasksForDay = tasksOnDate(selectedDate);
  const markerColor = {
    small: "bg-[var(--ui-success)]",
    medium: "bg-[var(--ui-warning)]",
    large: "bg-[var(--ui-danger)]",
  };
  const upcomingProjects = projects
    .filter((project) => project.dueDate && project.dueDate >= today)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  return (
    <SecondaryScreen active="Calendario">
      <div className="mb-8 border-b border-[var(--ui-ink)]/20 pb-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-muted)]">
          {monthTitle} · vista mensual
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl leading-none tracking-[-0.055em] sm:text-6xl">
          Calendario
        </h1>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.6fr_0.8fr]">
        <section className="calendar-elevated rounded-[22px] border border-[var(--ui-ink)]/20 p-3 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2
              id="calendar-month-heading"
              aria-live="polite"
              className="font-[family-name:var(--font-display)] text-2xl capitalize tracking-[-0.035em]"
            >
              {monthTitle}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate((current) => shiftMonth(current, -1))}
                aria-label="Mes anterior"
                className="grid h-9 w-9 place-items-center rounded-full border border-[var(--ui-ink)]/25 transition hover:bg-[var(--ui-panel-hover)]"
              >
                <span className="rotate-180">
                  <Icon name="arrow" size={16} />
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                aria-label="Ir a hoy"
                className="h-9 rounded-full border border-[var(--ui-ink)]/25 px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[var(--ui-panel-hover)]"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate((current) => shiftMonth(current, 1))}
                aria-label="Mes siguiente"
                className="grid h-9 w-9 place-items-center rounded-full border border-[var(--ui-ink)]/25 transition hover:bg-[var(--ui-panel-hover)]"
              >
                <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
          <div
            aria-labelledby="calendar-month-heading"
            className="grid grid-cols-7 gap-1.5 sm:gap-2"
          >
            {week.map((day) => (
              <span
                key={day}
                className="pb-2 text-center font-mono text-[9px] font-semibold text-[var(--ui-muted)] sm:pb-3 sm:text-[10px]"
              >
                {day}
              </span>
            ))}
            {cells.map((day, index) => {
              if (day === null) return <span key={`blank-${index}`} aria-hidden="true" />;
              const date = new Date(selected.getFullYear(), selected.getMonth(), day);
              const key = localDateKey(date);
              const isToday = key === today;
              const count =
                tasksOnDate(key).length + projects.filter((p) => p.dueDate === key).length;
              const workload =
                count >= 3 || projects.some((project) => project.dueDate === key)
                  ? "large"
                  : count === 2
                    ? "medium"
                    : "small";
              return (
                <button
                  key={key}
                  type="button"
                  data-calendar-date={key}
                  aria-label={dayFormatter.format(date)}
                  aria-pressed={selectedDate === key}
                  aria-current={isToday ? "date" : undefined}
                  onClick={() => setSelectedDate(key)}
                  className={`min-h-[54px] rounded-lg border p-1.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ink)] sm:min-h-[82px] sm:rounded-xl sm:p-2 ${
                    selectedDate === key
                      ? "border-[var(--ui-ink)] bg-[var(--ui-panel)]"
                      : "border-[var(--ui-ink)]/15 hover:bg-[var(--ui-panel-hover)]"
                  }`}
                >
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center font-mono text-[10px] sm:text-xs ${
                      isToday
                        ? "rounded-full bg-[var(--ui-action)] font-semibold text-[var(--ui-surface)]"
                        : ""
                    }`}
                  >
                    {day}
                  </span>
                  <span
                    className="mt-2 flex flex-wrap gap-1"
                    aria-label={count ? `${count} pendientes` : "Sin pendientes"}
                  >
                    {count > 0 && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full border border-[var(--ui-ink)]/15 sm:h-2 sm:w-2 ${markerColor[workload]}`}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-[var(--ui-muted)]">
            <span className="flex items-center gap-1">
              <i className="h-2.5 w-2.5 rounded-full bg-[var(--ui-success)]" /> ligera
            </span>
            <span className="flex items-center gap-1">
              <i className="h-2.5 w-2.5 rounded-full bg-[var(--ui-warning)]" /> media
            </span>
            <span className="flex items-center gap-1">
              <i className="h-2.5 w-2.5 rounded-full bg-[var(--ui-danger)]" /> alta / entrega
            </span>
            <span className="ml-auto">Hoy: {dayFormatter.format(dateFromKey(today))}</span>
          </div>
        </section>
        <aside className="day-tasks-elevated rounded-[22px] border border-[var(--ui-ink)]/20 bg-[var(--ui-panel)] p-5">
          <p
            aria-live="polite"
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ui-muted)]"
          >
            {selectedLabel}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-[-0.04em]">
            Tareas del día
          </h2>
          <div className="mt-6">
            <TaskList tasks={tasksForDay} />
          </div>
          {projects
            .filter((p) => p.dueDate === selectedDate)
            .map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/proyectos/${p.slug}`)}
                className="mt-3 block text-left text-sm underline underline-offset-4"
              >
                Entrega: {p.name}
              </button>
            ))}
          <button
            type="button"
            onClick={() => setAddingTask((current) => !current)}
            aria-expanded={addingTask}
            aria-controls="calendar-task-form"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--ui-ink)]/25 bg-[var(--ui-surface)] px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
          >
            <Icon name="plus" size={14} /> Añadir tarea
          </button>
          <div className="mt-6 border-t border-[var(--ui-ink)]/15 pt-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em]">
              Próximas entregas
            </p>
            {upcomingProjects.length ? (
              upcomingProjects.map((project) => (
                <p key={project.slug} className="mt-3 text-sm">
                  <b>
                    {dateFromKey(project.dueDate!).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </b>{" "}
                  · {project.name}
                </p>
              ))
            ) : (
              <p className="mt-3 text-sm text-[var(--ui-muted)]">No hay próximas entregas.</p>
            )}
          </div>
        </aside>
      </div>
      {addingTask && (
        <div id="calendar-task-form" className="calendar-task-form mt-4">
          <TaskForm
            key={selectedDate}
            formRef={taskFormRef}
            dueDate={selectedDate}
            onClose={() => setAddingTask(false)}
          />
        </div>
      )}
    </SecondaryScreen>
  );
}
