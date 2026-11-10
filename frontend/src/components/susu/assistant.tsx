import { useState } from "react";
import { useSearchParams } from "@/components/navigation";
import { useWorkspace } from "@/components/workspace-provider";
import { active, buildPlanningPrompt } from "@/lib/workspace-model";
import { assistantService, type SuggestedTask } from "@/lib/assistant-service";
import { Icon } from "./icon";
import { SecondaryScreen } from "./shell";
import { action, field, label, secondary } from "./tasks";

export function AssistantScreen() {
  const { workspace, addTaskRecord } = useWorkspace();
  const [search] = useSearchParams();
  const projects = active(workspace.projects);
  const [context] = useState<{
    title: string;
    content: string;
    projectId: string | null;
  } | null>(() => {
    try {
      const value = JSON.parse(sessionStorage.getItem("susu.assistant-context") ?? "null");
      return value && typeof value.title === "string" && typeof value.content === "string"
        ? value
        : null;
    } catch {
      return null;
    }
  });
  const [projectId, setProjectId] = useState(
    search.get("proyecto") ?? context?.projectId ?? projects[0]?.id ?? "",
  );
  const [request, setRequest] = useState("");
  const [includeNotes, setIncludeNotes] = useState(false);
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const project = projects.find((p) => p.id === projectId);
  const prompt = [
    project
      ? buildPlanningPrompt(project)
      : "Ayúdame a organizar estas ideas en tareas concretas. Pregunta por los datos que falten; no los inventes.",
    context
      ? `\nBorrador de nota compartido localmente:\n${context.title}\n${context.content}`
      : "",
    includeNotes && project
      ? `\nNotas asociadas:\n${
          active(workspace.notes)
            .filter((n) => n.projectId === project.id)
            .map((n) => `${n.title}\n${n.content}`)
            .join("\n\n") || "No hay notas asociadas."
        }`
      : "",
    request.trim() ? `\nMi solicitud:\n${request.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return (
    <SecondaryScreen active="Asistente">
      <div className="mb-8 border-b border-[var(--ui-ink)]/20 pb-6">
        <p className={label}>Asistente de planificación</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl leading-none tracking-[-0.055em] sm:text-6xl">
          Asistente
        </h1>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="chat-bubble-elevated rounded-[24px] border border-[var(--ui-ink)]/20 bg-[var(--ui-panel)] p-6">
          <span className="mb-5 grid h-12 w-12 place-items-center rounded-full border border-[var(--ui-ink)]/25 bg-[var(--ui-surface)]">
            <Icon name="sparkle" size={22} />
          </span>
          <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
            Un buen plan empieza con contexto.
          </h2>
          <p className="mt-4 text-sm leading-6 text-[var(--ui-muted)]">
            Prepara una solicitud con las fechas, la prioridad, la dificultad y el tiempo estimado
            de tu proyecto.
          </p>
          <p className="mt-4 rounded-xl border border-[var(--ui-ink)]/20 bg-[var(--ui-surface)]/70 p-4 text-sm leading-6">
            <b>
              {assistantService.isConfigured
                ? "API del asistente configurada."
                : "Modo local, sin IA conectada."}
            </b>
            <br />
            {assistantService.isConfigured
              ? "La propuesta no se añadirá al proyecto hasta que la confirmes."
              : "No se envían datos ni se generan respuestas simuladas. Puedes copiar la solicitud y usarla en tu herramienta de confianza."}
          </p>
          <label className={`${label} mt-6`}>
            Proyecto
            <select
              value={projectId}
              onChange={(event) => {
                setProjectId(event.target.value);
                setMessage("");
              }}
              className={field}
            >
              <option value="">Sin proyecto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className={`${label} mt-5`}>
            ¿En qué necesitas ayuda?
            <textarea
              className={`${field} min-h-32 normal-case tracking-normal leading-6`}
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              placeholder="Ej. Dividir el trabajo en sesiones de 45 minutos"
            />
          </label>
          <label className="mt-5 flex items-start gap-3 text-sm leading-6">
            <input
              type="checkbox"
              checked={includeNotes}
              onChange={(event) => setIncludeNotes(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--ui-action)]"
            />
            Incluir las notas guardadas del proyecto seleccionado
          </label>
          {context && (
            <button
              className={`${secondary} mt-5`}
              onClick={() => {
                sessionStorage.removeItem("susu.assistant-context");
                window.location.reload();
              }}
            >
              Quitar borrador de nota
            </button>
          )}
        </section>
        <section className="rounded-[24px] border border-[var(--ui-ink)]/20 p-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
            Tu solicitud, lista para revisar
          </h2>
          <label className={`${label} mt-5`}>
            Contexto preparado
            <textarea
              readOnly
              value={prompt}
              className={`${field} min-h-[420px] resize-y normal-case tracking-normal leading-6`}
              onFocus={(event) => event.currentTarget.select()}
            />
          </label>
          <button
            disabled={loading || (assistantService.isConfigured && !projectId)}
            onClick={async () => {
              if (!assistantService.isConfigured) {
                try {
                  await navigator.clipboard.writeText(prompt);
                  setMessage("Solicitud copiada. No hay una IA conectada.");
                } catch {
                  setMessage("No se pudo acceder al portapapeles. Copia el texto manualmente.");
                }
                return;
              }
              setLoading(true);
              setMessage("");
              setSuggestions([]);
              try {
                const proposed = await assistantService.suggestPlan(projectId, prompt);
                setSuggestions(proposed);
                setMessage("Revisa la propuesta. No se ha añadido ninguna tarea todavía.");
              } catch (error) {
                setMessage(
                  error instanceof Error ? error.message : "No se pudo obtener una propuesta.",
                );
              } finally {
                setLoading(false);
              }
            }}
            className={`${action} mt-5`}
          >
            <Icon name="note" size={15} />
            {loading
              ? "Consultando…"
              : assistantService.isConfigured
                ? "Solicitar propuesta"
                : "Copiar solicitud"}
          </button>
          {suggestions.length > 0 && (
            <div className="mt-6 border-t border-[var(--ui-ink)]/15 pt-5">
              <h3 className="font-[family-name:var(--font-display)] text-2xl">Tareas propuestas</h3>
              <ul className="mt-4 space-y-3">
                {suggestions.map((task, index) => (
                  <li
                    key={`${task.name}-${index}`}
                    className="rounded-xl border border-[var(--ui-ink)]/20 p-4"
                  >
                    <b className="text-sm">{task.name}</b>
                    {task.description && (
                      <p className="mt-1 text-xs text-[var(--ui-muted)]">{task.description}</p>
                    )}
                    <p className="mt-2 font-mono text-[9px] uppercase text-[var(--ui-muted)]">
                      {task.dueDate ?? "Sin fecha"} · {task.priority}
                    </p>
                  </li>
                ))}
              </ul>
              <button
                className={`${action} mt-5`}
                onClick={async () => {
                  const results = await Promise.all(
                    suggestions.map((task) =>
                      addTaskRecord({ ...task, projectId, reminderAt: null }),
                    ),
                  );
                  if (results.every(Boolean)) {
                    setSuggestions([]);
                    setMessage("Propuesta confirmada y añadida al proyecto.");
                  } else {
                    setMessage("No se pudieron añadir todas las tareas. Revisa el aviso superior.");
                  }
                }}
              >
                Confirmar y añadir tareas
              </button>
              <button className={`${secondary} ml-3 mt-5`} onClick={() => setSuggestions([])}>
                Descartar
              </button>
            </div>
          )}
          {message && (
            <p role="status" className="mt-4 text-sm leading-6">
              {message}
            </p>
          )}
        </section>
      </div>
    </SecondaryScreen>
  );
}
