import { useState, type FormEvent } from "react";
import { useNavigate } from "@/components/navigation";
import { authService } from "@/lib/auth-service";
import { action, field, label, secondary } from "./tasks";
import { WelcomeTour } from "./shell";

export function LocalAccess({
  screen = "login",
}: {
  screen?: "login" | "register" | "verify" | "recover";
}) {
  const navigate = useNavigate();
  const [tour, setTour] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isForm = authService.isConfigured && (screen === "login" || screen === "register");
  const titles = {
    login: authService.isConfigured ? "Vuelve a tu espacio." : "Tu espacio, a tu ritmo.",
    register: authService.isConfigured ? "Crea tu cuenta." : "Empieza en este navegador.",
    verify: "Verificación por definir.",
    recover: "Recuperación por definir.",
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (screen === "register" && name.length < 2) return setError("Escribe tu nombre.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setError("Escribe un correo electrónico válido.");
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    setLoading(true);
    try {
      if (screen === "register") await authService.register(name, email, password);
      else await authService.login(email, password);
      navigate("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo completar el acceso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ui-page)] p-4 text-[var(--ui-ink)] sm:p-8">
      <main className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-[1180px] items-center justify-center rounded-[34px] border border-[var(--ui-ink)]/20 bg-[var(--ui-auth-surface)] p-6 shadow-[0_14px_45px_var(--ui-elevation)] sm:min-h-[calc(100dvh-4rem)] sm:p-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-10 text-center">
            <div className="auth-brand-mark mx-auto h-14 w-14 overflow-hidden border border-[var(--ui-ink)]">
              <img
                className="auth-brand-mark-light h-full w-full object-cover"
                src="/susu/susu-logo-light.jpg"
                width="56"
                height="56"
                alt="Susu"
              />
              <img
                className="auth-brand-mark-dark h-full w-full object-cover"
                src="/susu/susu-logo-dark.jpg"
                width="56"
                height="56"
                alt="Susu"
              />
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ui-muted)]">
              Planifica con claridad
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-5xl tracking-[-0.06em]">
              Susu
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--ui-muted)]">
            {authService.isConfigured ? "Cuenta conectada por API" : "Modo local · sin cuenta"}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight tracking-[-0.05em]">
            {titles[screen]}
          </h1>
          {isForm ? (
            <form onSubmit={submit} className="mt-7 space-y-5">
              {screen === "register" && (
                <label className={label}>
                  Nombre
                  <input name="name" autoComplete="name" className={field} required />
                </label>
              )}
              <label className={label}>
                Correo electrónico
                <input name="email" type="email" autoComplete="email" className={field} required />
              </label>
              <label className={label}>
                Contraseña
                <input
                  name="password"
                  type="password"
                  autoComplete={screen === "register" ? "new-password" : "current-password"}
                  minLength={8}
                  className={field}
                  required
                />
              </label>
              {error && (
                <p role="alert" className="text-sm text-[var(--ui-danger-ink)]">
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading} className={`${action} w-full`}>
                {loading
                  ? "Conectando…"
                  : screen === "register"
                    ? "Crear cuenta"
                    : "Iniciar sesión"}
              </button>
            </form>
          ) : (
            <>
              <p className="my-6 text-sm leading-7 text-[var(--ui-muted)]">
                {authService.isConfigured
                  ? "Este flujo aún no está definido por la API. No se enviará ningún dato."
                  : "Proyectos, tareas y notas se guardan en tu navegador. No se recopilan contraseñas ni se simulan verificaciones."}
              </p>
              <button className={`${action} w-full`} onClick={() => navigate("/")}>
                Abrir mi espacio local
              </button>
            </>
          )}
          <button className={`${secondary} mt-4 w-full`} onClick={() => setTour(true)}>
            Conocer Susu
          </button>
          <div className="mt-7 flex justify-center gap-5 text-xs text-[var(--ui-muted)]">
            <button
              onClick={() => navigate("/iniciar-sesion")}
              className="underline underline-offset-4"
            >
              Iniciar sesión
            </button>
            <button onClick={() => navigate("/registro")} className="underline underline-offset-4">
              Registro
            </button>
          </div>
        </div>
      </main>
      {tour && <WelcomeTour onComplete={() => setTour(false)} />}
    </div>
  );
}
