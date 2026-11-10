type Theme = "light" | "dark";

export function resolveTheme(savedTheme: string | null, systemDark: boolean): Theme {
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return systemDark ? "dark" : "light";
}

export function initializeTheme(): Theme {
  const savedTheme = localStorage.getItem("uniplan-theme");
  const theme = resolveTheme(savedTheme, window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = theme;
  // Capture the device preference once; subsequent visits preserve the user's choice.
  if (savedTheme !== "light" && savedTheme !== "dark") {
    localStorage.setItem("uniplan-theme", theme);
  }
  return theme;
}
