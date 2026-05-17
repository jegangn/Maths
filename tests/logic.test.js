import { test, expect } from "bun:test";
import { getProblems } from "../src/logic.js";

test("addition L1: no-carry 2-digit + 1-digit, 5 problems", () => {
  const probs = getProblems("add", 1);
  expect(probs).toHaveLength(5);
  expect(probs[0]).toEqual({ op: "+", a: 12, b: 3, answer: 15 });
  expect(probs[4]).toEqual({ op: "+", a: 41, b: 5, answer: 46 });
});

test("addition L3: introduces carry on ones", () => {
  const probs = getProblems("add", 3);
  expect(probs[0]).toEqual({ op: "+", a: 15, b: 6, answer: 21 });
  for (const p of probs) {
    expect(p.a % 10 + p.b % 10).toBeGreaterThanOrEqual(10);
  }
});

test("subtraction L4: borrow always required", () => {
  const probs = getProblems("sub", 4);
  expect(probs).toHaveLength(5);
  for (const p of probs) {
    expect(p.op).toBe("-");
    expect(p.a % 10).toBeLessThan(p.b % 10);
    expect(p.a).toBeGreaterThanOrEqual(p.b);
  }
});

test("multiplication L1: tap-count mode, 2 x N", () => {
  const probs = getProblems("mult", 1);
  expect(probs).toHaveLength(5);
  for (const p of probs) {
    expect(p.op).toBe("×");
    expect(p.a).toBe(2);
    expect(p.mode).toBe("tap");
  }
});

test("multiplication L4: drag-groups mode", () => {
  const probs = getProblems("mult", 4);
  for (const p of probs) {
    expect(p.mode).toBe("drag");
  }
});

test("all multiplication problems within 5x5 ceiling", () => {
  for (let l = 1; l <= 6; l++) {
    for (const p of getProblems("mult", l)) {
      expect(p.a).toBeLessThanOrEqual(5);
      expect(p.b).toBeLessThanOrEqual(5);
      expect(p.answer).toBe(p.a * p.b);
    }
  }
});

test("all addition answers stay <= 99 (2-digit slot ceiling)", () => {
  for (let l = 1; l <= 6; l++) {
    for (const p of getProblems("add", l)) {
      expect(p.answer).toBeLessThanOrEqual(99);
      expect(p.answer).toBe(p.a + p.b);
    }
  }
});

test("all subtraction problems have non-negative answer", () => {
  for (let l = 1; l <= 6; l++) {
    for (const p of getProblems("sub", l)) {
      expect(p.answer).toBe(p.a - p.b);
      expect(p.answer).toBeGreaterThanOrEqual(0);
    }
  }
});
