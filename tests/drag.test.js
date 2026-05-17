import { test, expect } from "bun:test";
import { findDropTarget, withinTolerance } from "../src/drag.js";

test("withinTolerance: point inside expanded rect", () => {
  const rect = { left: 100, top: 100, right: 200, bottom: 200 };
  expect(withinTolerance(rect, 150, 150, 0)).toBe(true);
  expect(withinTolerance(rect, 250, 250, 0)).toBe(false);
  expect(withinTolerance(rect, 240, 240, 60)).toBe(true);
});

test("findDropTarget picks closest active target within tolerance", () => {
  const targets = [
    { id: "a", rect: { left: 0,   top: 0,   right: 50,  bottom: 50  }, active: true },
    { id: "b", rect: { left: 100, top: 100, right: 200, bottom: 200 }, active: true },
    { id: "c", rect: { left: 200, top: 200, right: 300, bottom: 300 }, active: false },
  ];
  expect(findDropTarget(targets, 150, 150, 60)?.id).toBe("b");
  expect(findDropTarget(targets, 250, 250, 40)?.id).toBe(undefined);
  expect(findDropTarget(targets, 25, 25, 60)?.id).toBe("a");
});
