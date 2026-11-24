// Navegación espacial con flechas y WASD. Funciones puras para poder probarlas sin navegador.

export type Direction = "up" | "down" | "left" | "right";

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

/** Dirección asociada a una tecla, o null si la tecla no navega. */
export function directionForKey(key: string): Direction | null {
  return KEY_DIRECTIONS[key.length === 1 ? key.toLowerCase() : key] ?? null;
}

export function isLetterKey(key: string) {
  return key.length === 1;
}

const TEXT_INPUT_TYPES = new Set([
  "text",
  "email",
  "password",
  "search",
  "tel",
  "url",
  "number",
  "date",
  "datetime-local",
  "month",
  "time",
  "week",
  "range",
]);

/**
 * Indica si el elemento necesita las teclas para sí mismo (escribir o elegir opciones).
 * En esos casos no se intercepta ni WASD ni las flechas.
 */
export function ownsKeys(element: {
  tagName: string;
  type?: string;
  isContentEditable?: boolean;
  getAttribute?: (name: string) => string | null;
}) {
  const tag = element.tagName.toLowerCase();
  if (element.isContentEditable) return true;
  if (tag === "textarea" || tag === "select") return true;
  if (tag === "input")
    return TEXT_INPUT_TYPES.has((element.type ?? "text").toLowerCase()) || element.type === "radio";
  const role = element.getAttribute?.("role");
  return role === "textbox" || role === "combobox" || role === "listbox" || role === "slider";
}

const centerX = (box: Box) => (box.left + box.right) / 2;
const centerY = (box: Box) => (box.top + box.bottom) / 2;

/**
 * Elige el índice del elemento más cercano en la dirección indicada.
 * Prioriza los que están alineados con el actual y penaliza la desviación lateral.
 */
export function pickNext(current: Box, candidates: Box[], direction: Direction): number {
  let best = -1;
  let bestScore = Number.POSITIVE_INFINITY;
  const tolerance = 1;
  candidates.forEach((box, index) => {
    let primary: number;
    let lateral: number;
    if (direction === "right" || direction === "left") {
      const inDirection =
        direction === "right"
          ? centerX(box) > centerX(current) + tolerance && box.right > current.right - tolerance
          : centerX(box) < centerX(current) - tolerance && box.left < current.left + tolerance;
      if (!inDirection) return;
      primary =
        direction === "right"
          ? Math.max(0, box.left - current.right)
          : Math.max(0, current.left - box.right);
      const overlap = Math.min(box.bottom, current.bottom) - Math.max(box.top, current.top);
      lateral = overlap > 0 ? 0 : Math.abs(centerY(box) - centerY(current));
    } else {
      const inDirection =
        direction === "down"
          ? centerY(box) > centerY(current) + tolerance && box.bottom > current.bottom - tolerance
          : centerY(box) < centerY(current) - tolerance && box.top < current.top + tolerance;
      if (!inDirection) return;
      primary =
        direction === "down"
          ? Math.max(0, box.top - current.bottom)
          : Math.max(0, current.top - box.bottom);
      const overlap = Math.min(box.right, current.right) - Math.max(box.left, current.left);
      lateral = overlap > 0 ? 0 : Math.abs(centerX(box) - centerX(current));
    }
    const score = primary + lateral * 2;
    if (score < bestScore) {
      bestScore = score;
      best = index;
    }
  });
  return best;
}
