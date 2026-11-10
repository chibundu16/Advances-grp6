// Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { resolveDoubleDown, DOUBLE_DOWN_PENALTY } from "./doubleDown.js";

test("even roll doubles the turn points, then adds the roll", () => {
  for (const roll of [2, 4, 6]) {
    const r = resolveDoubleDown(roll, 14, 30);
    assert.equal(r.success, true);
    assert.equal(r.newRunning, 28 + roll);
    assert.equal(r.newTotal, 30); // banked points untouched
    assert.equal(r.penaltyApplied, 0);
  }
});

test("odd roll loses the turn points and costs 10 banked points", () => {
  for (const roll of [1, 3, 5]) {
    const r = resolveDoubleDown(roll, 14, 30);
    assert.equal(r.success, false);
    assert.equal(r.newRunning, 0);
    assert.equal(r.newTotal, 30 - DOUBLE_DOWN_PENALTY);
    assert.equal(r.penaltyApplied, DOUBLE_DOWN_PENALTY);
  }
});

test("the penalty never takes banked points below zero", () => {
  const r = resolveDoubleDown(3, 8, 4);
  assert.equal(r.newTotal, 0);
  assert.equal(r.penaltyApplied, 4);
});

test("doubling with zero turn points just gives the roll", () => {
  assert.equal(resolveDoubleDown(6, 0, 0).newRunning, 6);
});
