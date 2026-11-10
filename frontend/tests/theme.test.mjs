import assert from "node:assert/strict";
import { test } from "node:test";
import { initializeTheme, resolveTheme } from "../src/lib/theme.ts";

test("device theme is used once, and an explicit choice always wins", () => {
  assert.equal(resolveTheme(null, true), "dark");
  assert.equal(resolveTheme(null, false), "light");
  for (const systemDark of [true, false]) {
    assert.equal(resolveTheme("light", systemDark), "light");
    assert.equal(resolveTheme("dark", systemDark), "dark");
  }
  assert.equal(resolveTheme("invalid", true), "dark");
});
test("initialization applies and persists the device preference without overriding a saved choice", () => {
  const keys = ["localStorage", "window", "document"];
  const originals = keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  const values = new Map();
  const dataset = {};
  let systemDark = true;
  try {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
      },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { matchMedia: () => ({ matches: systemDark }) },
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { documentElement: { dataset } },
    });
    assert.equal(initializeTheme(), "dark");
    assert.equal(dataset.theme, "dark");
    assert.equal(values.get("uniplan-theme"), "dark");
    systemDark = false;
    assert.equal(initializeTheme(), "dark");
    values.set("uniplan-theme", "light");
    assert.equal(initializeTheme(), "light");
    assert.equal(dataset.theme, "light");
  } finally {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
