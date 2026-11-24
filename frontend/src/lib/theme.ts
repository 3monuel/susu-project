type Theme = "light" | "dark";
export type Contrast = "normal" | "high";

export const CONTRAST_KEY = "uniplan-contrast";

export function resolveTheme(savedTheme: string | null, systemDark: boolean): Theme {
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return systemDark ? "dark" : "light";
}

// Alto contraste se activa solo por elección explícita o si el sistema lo pide.
export function resolveContrast(
  savedContrast: string | null,
  systemPrefersMore: boolean,
): Contrast {
  if (savedContrast === "high" || savedContrast === "normal") return savedContrast;
  return systemPrefersMore ? "high" : "normal";
}

export function initializeTheme(): Theme {
  const savedTheme = localStorage.getItem("uniplan-theme");
  const theme = resolveTheme(savedTheme, window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = theme;
  // Capture the device preference once; subsequent visits preserve the user's choice.
  if (savedTheme !== "light" && savedTheme !== "dark") {
    localStorage.setItem("uniplan-theme", theme);
  }
  document.documentElement.dataset.contrast = resolveContrast(
    localStorage.getItem(CONTRAST_KEY),
    window.matchMedia("(prefers-contrast: more)").matches,
  );
  return theme;
}
