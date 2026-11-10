import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dateFromKey,
  localDateKey,
  millisecondsUntilNextDay,
  monthCells,
  shiftMonth,
} from "../src/lib/calendar.ts";

test("date keys use the local calendar day rather than UTC", () => {
  assert.equal(localDateKey(new Date(2026, 0, 1, 0, 15)), "2026-01-01");
  assert.equal(localDateKey(new Date(2026, 11, 31, 23, 45)), "2026-12-31");
  assert.equal(localDateKey(dateFromKey("2024-02-29")), "2024-02-29");
  assert.notEqual(localDateKey(new Date(2026, 0, 16)), localDateKey(new Date(2026, 1, 16)));
  assert.notEqual(localDateKey(new Date(2026, 0, 16)), localDateKey(new Date(2027, 0, 16)));
});

test("month grids start on Monday and include complete weeks", () => {
  const mondayStart = monthCells(new Date(2021, 1, 1));
  assert.equal(mondayStart[0], 1);
  assert.equal(mondayStart.length, 28);
  const sundayStart = monthCells(new Date(2024, 8, 1));
  assert.deepEqual(sundayStart.slice(0, 7), [null, null, null, null, null, null, 1]);
  assert.equal(sundayStart.length % 7, 0);
});

test("February respects leap years, including century rules", () => {
  for (const [year, days] of [
    [2023, 28],
    [2024, 29],
    [2000, 29],
    [2100, 28],
  ]) {
    const actualDays = monthCells(new Date(year, 1, 1)).filter((day) => day !== null);
    assert.equal(actualDays.length, days);
    assert.equal(actualDays[actualDays.length - 1], days);
  }
});

test("every month contains each valid day exactly once", () => {
  for (const year of [2024, 2025, 2026, 2100]) {
    for (let month = 0; month < 12; month++) {
      const cells = monthCells(new Date(year, month, 1));
      const days = new Date(year, month + 1, 0).getDate();
      assert.equal(cells.length % 7, 0);
      assert.deepEqual(
        cells.filter((day) => day !== null),
        Array.from({ length: days }, (_, index) => index + 1),
      );
    }
  }
});

test("month navigation clamps the selected day instead of skipping short months", () => {
  assert.equal(shiftMonth("2025-01-31", 1), "2025-02-28");
  assert.equal(shiftMonth("2024-01-31", 1), "2024-02-29");
  assert.equal(shiftMonth("2025-03-31", -1), "2025-02-28");
  assert.equal(shiftMonth("2026-04-16", 1), "2026-05-16");
});

test("month navigation crosses year boundaries in both directions", () => {
  assert.equal(shiftMonth("2026-12-31", 1), "2027-01-31");
  assert.equal(shiftMonth("2027-01-31", -1), "2026-12-31");
});

test("the next-day refresh uses local midnight, not a fixed 24-hour delay", () => {
  for (const now of [
    new Date(2026, 11, 31, 23, 59, 59),
    new Date(2024, 2, 10),
    new Date(2024, 10, 3),
  ]) {
    const next = new Date(now.getTime() + millisecondsUntilNextDay(now));
    assert.equal(
      localDateKey(next),
      localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)),
    );
    assert.equal(next.getHours(), 0);
    assert.equal(next.getMinutes(), 0);
  }
  if (process.env.TZ === "America/Los_Angeles") {
    assert.equal(millisecondsUntilNextDay(new Date(2024, 2, 10)), 23 * 60 * 60 * 1000);
    assert.equal(millisecondsUntilNextDay(new Date(2024, 10, 3)), 25 * 60 * 60 * 1000);
  }
});
