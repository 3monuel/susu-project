import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeTheme } from "./lib/theme";

// Aplica tema y contraste también en las pantallas de acceso.
initializeTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Registra el service worker para que SuSu se pueda instalar como app.
// Solo en la versión publicada: en desarrollo interferiría con la recarga automática.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Si el navegador no lo permite, la app sigue funcionando como página web.
    });
  });
}
