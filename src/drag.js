export function withinTolerance(rect, x, y, tol = 0) {
  return x >= rect.left - tol && x <= rect.right + tol
      && y >= rect.top  - tol && y <= rect.bottom + tol;
}

function rectCenter(r) { return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 }; }

export function findDropTarget(targets, x, y, tol = 0) {
  let best = null, bestD = Infinity;
  for (const t of targets) {
    if (!t.active) continue;
    if (!withinTolerance(t.rect, x, y, tol)) continue;
    const c = rectCenter(t.rect);
    const d = (c.x - x) ** 2 + (c.y - y) ** 2;
    if (d < bestD) { bestD = d; best = t; }
  }
  return best;
}

function stageInfo() {
  const stage = document.getElementById("stage");
  const rect = stage.getBoundingClientRect();
  const scale = rect.width / 1280;
  return { stage, rect, scale };
}

function toStageLocal(clientX, clientY) {
  const { rect, scale } = stageInfo();
  return {
    x: (clientX - rect.left) / scale,
    y: (clientY - rect.top) / scale,
  };
}

export function createDragManager({ getTargets, onPickup, onDrop }) {
  let dragging = null;

  function start(e, sourceEl, payload) {
    e.preventDefault();
    const tileRect = sourceEl.getBoundingClientRect();
    const { stage, rect: sRect, scale } = stageInfo();
    // Tile origin in stage-local coords
    const tileLocalLeft = (tileRect.left - sRect.left) / scale;
    const tileLocalTop  = (tileRect.top  - sRect.top)  / scale;
    // Pointer in stage-local coords
    const pointerLocal = toStageLocal(e.clientX, e.clientY);
    // Offset from pointer to tile origin, in stage-local coords
    const offsetX = pointerLocal.x - tileLocalLeft;
    const offsetY = pointerLocal.y - tileLocalTop;
    const origin = { x: tileLocalLeft, y: tileLocalTop };

    // Save original DOM position so bounce-back can restore it
    const originalParent = sourceEl.parentNode;
    const originalNextSibling = sourceEl.nextSibling;

    dragging = { sourceEl, payload, origin, offsetX, offsetY, pointerId: e.pointerId,
                 originalParent, originalNextSibling };
    sourceEl.setPointerCapture?.(e.pointerId);
    onPickup?.(payload, sourceEl);

    // Re-parent to #stage so absolute positioning is relative to the stage,
    // not to the digit-tray. Set position before appending to avoid flicker.
    sourceEl.style.position = "absolute";
    sourceEl.style.left = `${origin.x}px`;
    sourceEl.style.top  = `${origin.y}px`;
    stage.appendChild(sourceEl);

    sourceEl.classList.add("dragging");
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  function move(e) {
    if (!dragging || e.pointerId !== dragging.pointerId) return;
    const { sourceEl, offsetX, offsetY } = dragging;
    const p = toStageLocal(e.clientX, e.clientY);
    sourceEl.style.position = "absolute";
    sourceEl.style.left = `${p.x - offsetX}px`;
    sourceEl.style.top  = `${p.y - offsetY}px`;
  }

  function end(e) {
    if (!dragging || e.pointerId !== dragging.pointerId) return;
    const { sourceEl, payload, origin, originalParent, originalNextSibling } = dragging;
    const targets = getTargets();
    // Targets use viewport-pixel rects (from getBoundingClientRect on slots).
    // Pointer event is in viewport pixels too. Hit-test stays in viewport space.
    const target = findDropTarget(targets, e.clientX, e.clientY, 40);
    sourceEl.classList.remove("dragging");
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    dragging = null;
    onDrop?.(payload, target, sourceEl, origin, { originalParent, originalNextSibling });
  }

  return { start };
}
