import { useEffect } from "react";
import {
  directionForKey,
  isLetterKey,
  ownsKeys,
  pickNext,
  type Box,
} from "@/lib/keyboard-navigation";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// El diálogo abierto más reciente limita la navegación, igual que hace Tab.
function activeScope(): ParentNode {
  const dialogs = document.querySelectorAll<HTMLElement>(
    '[role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]',
  );
  return dialogs[dialogs.length - 1] ?? document;
}

function isVisible(element: HTMLElement) {
  if (!element.getClientRects().length) return false;
  if (element.closest('[aria-hidden="true"], [inert]')) return false;
  const style = getComputedStyle(element);
  return style.visibility !== "hidden" && style.pointerEvents !== "none";
}

function toBox(rect: DOMRect): Box {
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
}

/**
 * Permite recorrer la interfaz con flechas o WASD y marcar casillas con Espacio o Enter.
 * Las teclas no se interceptan mientras se escribe en un campo de texto.
 */
export function useKeyboardNavigation() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target instanceof HTMLElement ? event.target : null;

      // Enter también marca casillas nativas (Espacio ya lo hace el navegador).
      if (
        event.key === "Enter" &&
        target instanceof HTMLInputElement &&
        target.type === "checkbox"
      ) {
        event.preventDefault();
        target.click();
        return;
      }

      const direction = directionForKey(event.key);
      if (!direction) return;
      if (isLetterKey(event.key) && event.shiftKey) return;
      if (target && target !== document.body && ownsKeys(target)) return;

      const scope = activeScope();
      const candidates = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        isVisible,
      );
      if (!candidates.length) return;

      const current =
        target && target !== document.body && scope.contains(target) && candidates.includes(target)
          ? target
          : null;
      if (!current) {
        event.preventDefault();
        candidates[0].focus();
        return;
      }

      const others = candidates.filter((element) => element !== current);
      const index = pickNext(
        toBox(current.getBoundingClientRect()),
        others.map((element) => toBox(element.getBoundingClientRect())),
        direction,
      );
      // Sin destino en esa dirección, la flecha conserva su función normal (desplazar).
      if (index === -1) return;
      event.preventDefault();
      const next = others[index];
      next.focus({ preventScroll: true });
      next.scrollIntoView({ block: "nearest", inline: "nearest" });
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
}
