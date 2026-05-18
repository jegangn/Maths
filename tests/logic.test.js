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

import { analyze } from "../src/logic.js";

test("analyze: addition with no carry", () => {
  const r = analyze({ op: "+", a: 12, b: 3, answer: 15 });
  expect(r).toEqual({
    aTens: 1, aOnes: 2, bTens: 0, bOnes: 3,
    answerTens: 1, answerOnes: 5,
    carry: false,
  });
});

test("analyze: addition with carry on ones", () => {
  const r = analyze({ op: "+", a: 15, b: 6, answer: 21 });
  expect(r).toEqual({
    aTens: 1, aOnes: 5, bTens: 0, bOnes: 6,
    answerTens: 2, answerOnes: 1,
    carry: true,
  });
});

test("analyze: subtraction without borrow", () => {
  const r = analyze({ op: "-", a: 45, b: 23, answer: 22 });
  expect(r).toEqual({
    aTens: 4, aOnes: 5, bTens: 2, bOnes: 3,
    answerTens: 2, answerOnes: 2,
    borrow: false,
  });
});

test("analyze: subtraction with borrow", () => {
  const r = analyze({ op: "-", a: 32, b: 15, answer: 17 });
  expect(r).toEqual({
    aTens: 3, aOnes: 2, bTens: 1, bOnes: 5,
    answerTens: 1, answerOnes: 7,
    borrow: true,
    borrowFromTens: 2,
    borrowedOnes: 12,
  });
});

import { createAnswerState, dropDigit, dropCompound, isComplete } from "../src/logic.js";

test("answer state for 2-digit answer: ones is active first", () => {
  const s = createAnswerState(15);
  expect(s.slots).toEqual([null, null]);
  expect(s.activeIndex).toBe(1);
});

test("answer state for 1-digit answer: single slot", () => {
  const s = createAnswerState(8);
  expect(s.slots).toEqual([null]);
  expect(s.activeIndex).toBe(0);
});

test("dropping correct ones digit advances to tens", () => {
  let s = createAnswerState(21);
  s = dropDigit(s, 1);
  expect(s.slots).toEqual([null, 1]);
  expect(s.activeIndex).toBe(0);
  expect(s.lastDropCorrect).toBe(true);
});

test("dropping wrong digit rejects and increments wrongCount", () => {
  let s = createAnswerState(21);
  s = dropDigit(s, 7);
  expect(s.slots).toEqual([null, null]);
  expect(s.activeIndex).toBe(1);
  expect(s.lastDropCorrect).toBe(false);
  expect(s.wrongCount).toBe(1);
});

test("dropping on inactive slot is rejected", () => {
  let s = createAnswerState(21);
  s = dropDigit(s, 2, 0);
  expect(s.slots).toEqual([null, null]);
  expect(s.lastDropCorrect).toBe(false);
  expect(s.wrongCount).toBe(1);
});

test("dropCompound: valid 11 fills ones slot and signals carryFromCompound=1", () => {
  let s = createAnswerState(21); // expected = [2, 1]
  s = dropCompound(s, 11, 11);
  expect(s.slots).toEqual([null, 1]);
  expect(s.activeIndex).toBe(0);
  expect(s.lastDropCorrect).toBe(true);
  expect(s.carryFromCompound).toBe(1);
  expect(s.wrongCount).toBe(0);
});

test("dropCompound: wrong compound value rejected, wrongCount incremented", () => {
  let s = createAnswerState(21);
  s = dropCompound(s, 12, 11);
  expect(s.slots).toEqual([null, null]);
  expect(s.activeIndex).toBe(1);
  expect(s.lastDropCorrect).toBe(false);
  expect(s.wrongCount).toBe(1);
});

test("dropCompound: rejected when not at ones slot (activeIndex=0)", () => {
  let s = createAnswerState(21);
  s = { ...s, activeIndex: 0 };
  s = dropCompound(s, 11, 11);
  expect(s.lastDropCorrect).toBe(false);
  expect(s.wrongCount).toBe(1);
});

test("dropCompound: rejected on 1-digit answer state", () => {
  let s = createAnswerState(8);
  s = dropCompound(s, 11, 11);
  expect(s.lastDropCorrect).toBe(false);
});

test("dropCompound: valid 15 (e.g., 7+8) fills ones=5, carryFromCompound=1", () => {
  // answer = 15, expected = [1, 5]
  let s = createAnswerState(15);
  s = dropCompound(s, 15, 15);
  expect(s.slots).toEqual([null, 5]);
  expect(s.carryFromCompound).toBe(1);
  expect(s.lastDropCorrect).toBe(true);
});

test("isComplete returns true only when all slots filled", () => {
  let s = createAnswerState(21);
  expect(isComplete(s)).toBe(false);
  s = dropDigit(s, 1);
  expect(isComplete(s)).toBe(false);
  s = dropDigit(s, 2);
  expect(isComplete(s)).toBe(true);
});

import { starsFor } from "../src/logic.js";

test("starsFor returns 3 stars for 0 or 1 wrongs", () => {
  expect(starsFor(0)).toBe(3);
  expect(starsFor(1)).toBe(3);
});

test("starsFor returns 2 stars for 2-4 wrongs", () => {
  expect(starsFor(2)).toBe(2);
  expect(starsFor(3)).toBe(2);
  expect(starsFor(4)).toBe(2);
});

test("starsFor returns 1 star for 5+ wrongs", () => {
  expect(starsFor(5)).toBe(1);
  expect(starsFor(20)).toBe(1);
});

import { loadProgress, recordStars, isLevelUnlocked, totalStars } from "../src/logic.js";

const fakeStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};

test("loadProgress returns empty map on fresh storage", () => {
  expect(loadProgress(fakeStorage())).toEqual({ add: {}, sub: {}, mult: {} });
});

test("recordStars writes new high-water mark; loadProgress reads it", () => {
  const s = fakeStorage();
  recordStars(s, "add", 1, 2);
  expect(loadProgress(s).add[1]).toBe(2);
});

test("recordStars does not overwrite a higher prior score", () => {
  const s = fakeStorage();
  recordStars(s, "add", 1, 3);
  recordStars(s, "add", 1, 1);
  expect(loadProgress(s).add[1]).toBe(3);
});

test("recordStars DOES overwrite when score improves", () => {
  const s = fakeStorage();
  recordStars(s, "add", 1, 1);
  recordStars(s, "add", 1, 3);
  expect(loadProgress(s).add[1]).toBe(3);
});

test("L1 always unlocked; L2+ requires prior level cleared", () => {
  expect(isLevelUnlocked({ add: {}, sub: {}, mult: {} }, "add", 1)).toBe(true);
  expect(isLevelUnlocked({ add: {}, sub: {}, mult: {} }, "add", 2)).toBe(false);
  expect(isLevelUnlocked({ add: { 1: 2 }, sub: {}, mult: {} }, "add", 2)).toBe(true);
});

test("totalStars sums across worlds", () => {
  expect(totalStars({ add: { 1: 3, 2: 2 }, sub: { 1: 1 }, mult: {} })).toBe(6);
});
