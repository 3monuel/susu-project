import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import WorkspaceProvider from "@/components/workspace-provider";
import { AssistantScreen } from "@/components/susu/assistant";
import { ProjectDetailScreen } from "@/components/susu/detail";
import { LocalAccess } from "@/components/susu/local-access";
import { NotesScreen } from "@/components/susu/notes";
import { CalendarScreen, ProjectsScreen } from "@/components/susu/overview";
import { WelcomeTour } from "@/components/susu/shell";
import { completeWelcomeTour, hasCompletedWelcomeTour } from "@/lib/onboarding";
import { hasActiveSession } from "@/lib/session";

function ProtectedWorkspace() {
  if (!hasActiveSession()) return <Navigate to="/iniciar-sesion" replace />;
  if (!hasCompletedWelcomeTour()) return <Navigate to="/bienvenida" replace />;

  return (
    <WorkspaceProvider>
      <Outlet />
    </WorkspaceProvider>
  );
}

function WelcomeRoute() {
  const navigate = useNavigate();

  if (!hasActiveSession()) return <Navigate to="/iniciar-sesion" replace />;
  if (hasCompletedWelcomeTour()) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-[var(--ui-page)]">
      <WelcomeTour
        onComplete={() => {
          completeWelcomeTour();
          navigate("/", { replace: true });
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/iniciar-sesion" element={<LocalAccess />} />
        <Route path="/registro" element={<LocalAccess screen="register" />} />
        <Route path="/recuperar-contrasena" element={<LocalAccess screen="recover" />} />
        <Route path="/verificar-correo" element={<LocalAccess screen="verify" />} />
        <Route path="/bienvenida" element={<WelcomeRoute />} />

        <Route element={<ProtectedWorkspace />}>
          <Route path="/" element={<ProjectsScreen />} />
          <Route path="/nuevo-proyecto" element={<ProjectsScreen />} />
          <Route path="/proyectos" element={<ProjectDetailScreen />} />
          <Route path="/proyectos/:projectSlug" element={<ProjectDetailScreen />} />
          <Route path="/calendario" element={<CalendarScreen />} />
          <Route path="/notas" element={<NotesScreen />} />
          <Route path="/asistente" element={<AssistantScreen />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
