import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import WorkspaceProvider from "@/components/workspace-provider";
import { AssistantScreen } from "@/components/susu/assistant";
import { ProjectDetailScreen } from "@/components/susu/detail";
import { LocalAccess } from "@/components/susu/local-access";
import { NotesScreen } from "@/components/susu/notes";
import { CalendarScreen, ProjectsScreen } from "@/components/susu/overview";

export default function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <Routes>
          <Route path="/" element={<ProjectsScreen />} />
          <Route path="/nuevo-proyecto" element={<ProjectsScreen />} />
          <Route path="/proyectos" element={<ProjectDetailScreen />} />
          <Route path="/proyectos/:projectSlug" element={<ProjectDetailScreen />} />
          <Route path="/calendario" element={<CalendarScreen />} />
          <Route path="/notas" element={<NotesScreen />} />
          <Route path="/asistente" element={<AssistantScreen />} />
          <Route path="/iniciar-sesion" element={<LocalAccess />} />
          <Route path="/registro" element={<LocalAccess screen="register" />} />
          <Route path="/recuperar-contrasena" element={<LocalAccess screen="recover" />} />
          <Route path="/verificar-correo" element={<LocalAccess screen="verify" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </WorkspaceProvider>
    </BrowserRouter>
  );
}
