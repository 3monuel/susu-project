import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveContrast } from "../src/lib/theme.ts";
import { directionForKey, ownsKeys, pickNext } from "../src/lib/keyboard-navigation.ts";

test("alto contraste: la elección guardada gana y si no hay, se sigue al sistema", () => {
  assert.equal(resolveContrast("high", false), "high");
  assert.equal(resolveContrast("normal", true), "normal");
  assert.equal(resolveContrast(null, true), "high");
  assert.equal(resolveContrast(null, false), "normal");
  assert.equal(resolveContrast("otro", false), "normal");
});

test("flechas y WASD (mayúsculas o minúsculas) se traducen a direcciones", () => {
  assert.equal(directionForKey("ArrowUp"), "up");
  assert.equal(directionForKey("ArrowDown"), "down");
  assert.equal(directionForKey("ArrowLeft"), "left");
  assert.equal(directionForKey("ArrowRight"), "right");
  assert.equal(directionForKey("w"), "up");
  assert.equal(directionForKey("A"), "left");
  assert.equal(directionForKey("s"), "down");
  assert.equal(directionForKey("d"), "right");
  assert.equal(directionForKey("q"), null);
  assert.equal(directionForKey("Enter"), null);
});

test("los campos de texto conservan las teclas; botones y casillas no", () => {
  const el = (tagName, type, role = null) => ({ tagName, type, getAttribute: () => role });
  assert.equal(ownsKeys(el("INPUT", "text")), true);
  assert.equal(ownsKeys(el("INPUT", "date")), true);
  assert.equal(ownsKeys(el("TEXTAREA")), true);
  assert.equal(ownsKeys(el("SELECT")), true);
  assert.equal(ownsKeys({ ...el("DIV"), isContentEditable: true }), true);
  assert.equal(ownsKeys(el("INPUT", "checkbox")), false);
  assert.equal(ownsKeys(el("BUTTON")), false);
  assert.equal(ownsKeys(el("A")), false);
});

test("se elige el elemento más cercano y alineado en cada dirección", () => {
  // Cuadrícula de 2x2 más un botón lejano a la derecha.
  const box = (left, top, w = 100, h = 50) => ({ left, top, right: left + w, bottom: top + h });
  const current = box(0, 0);
  const candidates = [box(120, 0), box(0, 70), box(120, 70), box(600, 0)];
  assert.equal(pickNext(current, candidates, "right"), 0);
  assert.equal(pickNext(current, candidates, "down"), 1);
  assert.equal(pickNext(current, candidates, "left"), -1);
  assert.equal(pickNext(current, candidates, "up"), -1);
  // Desde abajo a la derecha, arriba lleva a la celda alineada, no a la diagonal.
  assert.equal(pickNext(box(120, 70), [box(0, 0), box(120, 0)], "up"), 1);
});
