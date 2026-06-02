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
  const logicalW = stage.offsetWidth || 1280;
  const scale = rect.width / logicalW;
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
  // Track EVERY active pointer independently, keyed by pointerId. Kids play on
  // touchscreens and routinely press two tiles at once; with a single shared
  // drag slot a second touch would overwrite the first, so the first pointer's
  // pointerup no longer matched and its clone was never removed (and its source
  // tile stayed hidden) — leaving "stuck" number tiles piling up on the stage.
  // A per-pointer map means each touch owns its own drag and cleans itself up.
  const drags = new Map();

  // Window listeners are shared across all active pointers, so bind them only
  // while at least one drag is live and drop them when the last one ends. That
  // keeps the per-problem managers (re-created on every render) from leaking
  // listeners, while still covering concurrent pointers under one binding.
  function bindListeners() {
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }
  function unbindListeners() {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
  }

  function start(e, sourceEl, payload) {
    e.preventDefault();
    // Guard against a duplicate pointerdown for a pointer that's already dragging.
    if (drags.has(e.pointerId)) return;

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

    // Drag a CLONE and keep the ORIGINAL tile in its tray slot, just hidden, so
    // the palette never reflows. The original "disappears" for the duration of
    // the drag (its space is reserved) and reappears the moment the drag ends —
    // whether the value lands in the answer or bounces back. Digits stay
    // reusable and the tray layout is perfectly stable.
    const dragEl = sourceEl.cloneNode(true);
    dragEl.classList.add("drag-clone");
    dragEl.classList.remove("dim", "hint-dim", "hint-target");
    dragEl.style.position = "absolute";
    dragEl.style.left = `${origin.x}px`;
    dragEl.style.top  = `${origin.y}px`;
    dragEl.style.margin = "0";
    dragEl.style.pointerEvents = "none";
    stage.appendChild(dragEl);

    sourceEl.style.visibility = "hidden";

    if (drags.size === 0) bindListeners();
    drags.set(e.pointerId, { dragEl, sourceEl, payload, origin, offsetX, offsetY });
    sourceEl.setPointerCapture?.(e.pointerId);
    onPickup?.(payload, dragEl);

    dragEl.classList.add("dragging");
  }

  function move(e) {
    const d = drags.get(e.pointerId);
    if (!d) return;
    const p = toStageLocal(e.clientX, e.clientY);
    d.dragEl.style.left = `${p.x - d.offsetX}px`;
    d.dragEl.style.top  = `${p.y - d.offsetY}px`;
  }

  function end(e) {
    const d = drags.get(e.pointerId);
    if (!d) return;
    drags.delete(e.pointerId);
    if (drags.size === 0) unbindListeners();
    const { dragEl, sourceEl, payload, origin } = d;
    const targets = getTargets();
    // Targets use viewport-pixel rects (from getBoundingClientRect on slots).
    // Pointer event is in viewport pixels too. Hit-test stays in viewport space.
    const target = findDropTarget(targets, e.clientX, e.clientY, 40);
    dragEl.classList.remove("dragging");
    // Reveal the original tile again — it never left its tray slot.
    sourceEl.style.visibility = "";
    // The clone carries the snap-in / bounce-back animation, then removes itself.
    onDrop?.(payload, target, dragEl, origin, { sourceEl });
  }

  return { start };
}
