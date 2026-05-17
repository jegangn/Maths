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

export function createDragManager({ getTargets, onPickup, onDrop }) {
  let dragging = null;

  function start(e, sourceEl, payload) {
    e.preventDefault();
    const rect = sourceEl.getBoundingClientRect();
    const origin = { x: rect.left, y: rect.top };
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    dragging = { sourceEl, payload, origin, offsetX, offsetY, pointerId: e.pointerId };
    sourceEl.setPointerCapture?.(e.pointerId);
    sourceEl.classList.add("dragging");
    onPickup?.(payload, sourceEl);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  function move(e) {
    if (!dragging || e.pointerId !== dragging.pointerId) return;
    const { sourceEl, offsetX, offsetY } = dragging;
    sourceEl.style.position = "absolute";
    sourceEl.style.left = `${e.clientX - offsetX}px`;
    sourceEl.style.top  = `${e.clientY - offsetY}px`;
  }

  function end(e) {
    if (!dragging || e.pointerId !== dragging.pointerId) return;
    const { sourceEl, payload, origin } = dragging;
    const targets = getTargets();
    const target = findDropTarget(targets, e.clientX, e.clientY, 40);
    sourceEl.classList.remove("dragging");
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    dragging = null;
    onDrop?.(payload, target, sourceEl, origin);
  }

  return { start };
}
