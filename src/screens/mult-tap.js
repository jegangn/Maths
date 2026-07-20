import { getProblems } from "../logic.js";
import { createDragManager } from "../drag.js";
import { tilePickup, tileBounceBack, tileSnapIn, tapBlock, blockFlyIn, praiseBurst } from "../animate.js";
import { home, pip, lilypad, firefly } from "../svg.js";
import { sfx } from "../audio.js";
import { layoutMultTap } from "../layout.js";

// Build a sequential 10..max compound-tile range so the kid sees a clear
// counting ladder. Range goes from 10 up to at least 20, extending if the
// correct answer is higher (so the answer is always in range).
function compoundOptions(correct) {
  const max = Math.max(20, correct);
  const tiles = [];
  for (let n = 10; n <= max; n++) tiles.push(n);
  return tiles;
}

export function mount(stage, ctx, router) {
  const { world, level } = ctx;
  stage.dataset.world = "mult";
  const problems = getProblems(world, level);
  let idx = 0;
  let totalWrong = 0;
  let dragMgr = null;
  let globalCount = 0;
  let tappedSet = new Set();
  let trayWrongOnCurrentSlot = 0;

  const sec = document.createElement("section");
  sec.className = "screen active";
  sec.id = "screen-mult-tap";

  sec.innerHTML = `
    <div class="topbar">
      <button class="home-btn small"></button>
      <div class="progress-dots"></div>
    </div>
    <div class="mult-problem"></div>
    <div class="firefly-area"></div>
    <div class="digit-tray"></div>
    <div class="corner-mascot"></div>
  `;
  sec.querySelector(".home-btn").insertAdjacentHTML("beforeend", home());
  sec.querySelector(".home-btn").addEventListener("pointerup", () => router.go("map"));
  sec.querySelector(".corner-mascot").insertAdjacentHTML("beforeend", pip("idle"));

  const relayout = () => layoutMultTap(stage, sec);

  renderProgressDots();
  renderProblem();

  function renderProgressDots() {
    const d = sec.querySelector(".progress-dots");
    d.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      const dot = document.createElement("span");
      dot.className = "dot" + (i < idx ? " filled" : i === idx ? " current" : "");
      d.appendChild(dot);
    }
  }

  function renderProblem() {
    trayWrongOnCurrentSlot = 0;
    const p = problems[idx];
    globalCount = 0;
    tappedSet.clear();

    const probEl = sec.querySelector(".mult-problem");
    probEl.innerHTML = `
      <div class="op-chip display">${p.a}</div>
      <div class="op-sym display">×</div>
      <div class="op-chip display">${p.b}</div>
      <div class="op-sym display">=</div>
      <div class="op-chip q slot active display" data-index="0"></div>
    `;

    const area = sec.querySelector(".firefly-area");
    area.innerHTML = "";
    const blockEls = [];
    for (let g = 0; g < p.b; g++) {            // b groups
      const pad = document.createElement("div");
      pad.className = "lily-group";
      pad.insertAdjacentHTML("beforeend", lilypad());
      const blocks = document.createElement("div");
      blocks.className = "block-grid";
      blocks.dataset.count = String(p.a);       // a items per group
      for (let i = 0; i < p.a; i++) {           // a items
        const wrap = document.createElement("div");
        wrap.className = "block-host untapped";
        wrap.dataset.groupIndex = String(g);
        wrap.dataset.blockIndex = String(i);
        wrap.insertAdjacentHTML("beforeend", firefly());
        wrap.addEventListener("pointerup", () => onBlockTap(wrap));
        blocks.appendChild(wrap);
        blockEls.push(wrap);
      }
      pad.appendChild(blocks);
      area.appendChild(pad);
    }
    area.dataset.groups = String(p.b);           // drives the 5-group CSS tier
    blockFlyIn(blockEls);

    // The answer box (after "=") and the digit tray are shown immediately so the
    // kid can drop the answer straight away. Tapping the bees is still available
    // for counting practice but is no longer required.
    buildTray();
    relayout();
  }

  function onBlockTap(wrap) {
    const id = `${wrap.dataset.groupIndex}-${wrap.dataset.blockIndex}`;
    if (tappedSet.has(id)) { sfx.mascotChirp(); return; }
    tappedSet.add(id);
    globalCount++;
    tapBlock(wrap, globalCount);
  }

  function buildTray() {
    const p = problems[idx];
    const tray = sec.querySelector(".digit-tray");
    tray.innerHTML = "";
    tray.classList.remove("two-row");
    if (p.answer >= 10) {
      const values = compoundOptions(p.answer);
      const buildTile = (n) => {
        const t = document.createElement("div");
        t.className = "tile compound mult-option";
        t.dataset.value = String(n);
        t.textContent = String(n);
        return t;
      };
      // Up to 11 tiles (range 10–20) sit comfortably in one row. Beyond that
      // (e.g. 5×5=25 needs 10–25 = 16 tiles) split into two rows.
      if (values.length > 11) {
        tray.classList.add("two-row");
        const half = Math.ceil(values.length / 2);
        const row1 = document.createElement("div"); row1.className = "tile-row";
        const row2 = document.createElement("div"); row2.className = "tile-row";
        values.forEach((n, i) => (i < half ? row1 : row2).appendChild(buildTile(n)));
        tray.appendChild(row1); tray.appendChild(row2);
      } else {
        values.forEach((n) => tray.appendChild(buildTile(n)));
      }
    } else {
      for (let n = 0; n <= 9; n++) {
        const t = document.createElement("div");
        t.className = "tile";
        t.dataset.value = String(n);
        t.textContent = String(n);
        tray.appendChild(t);
      }
    }
    setupDrag();
  }

  function setupDrag() {
    dragMgr = createDragManager({
      getTargets() {
        return Array.from(sec.querySelectorAll(".slot")).map((el) => ({
          el, rect: el.getBoundingClientRect(),
          active: el.classList.contains("active"),
          id: el.dataset.index,
        }));
      },
      onPickup(payload, el) { tilePickup(el); },
      async onDrop(payload, target, sourceEl, origin, parentInfo) {
        if (!target) return tileBounceBack(sourceEl, origin, parentInfo);
        const correct = problems[idx].answer;
        if (payload.value !== correct) {
          totalWrong++;
          trayWrongOnCurrentSlot++;
          await tileBounceBack(sourceEl, origin, parentInfo);
          target.el.classList.add("flash-no");
          setTimeout(() => target.el.classList.remove("flash-no"), 200);
          if (trayWrongOnCurrentSlot >= 2) applyHint();
          return;
        }
        await tileSnapIn(sourceEl, target.el);
        sfx.correctYay();
        praiseBurst();
        idx++;
        renderProgressDots();
        if (idx >= problems.length) {
          router.go("complete", { world, level, wrongCount: totalWrong });
          return;
        }
        sfx.transition();
        setTimeout(renderProblem, 500);
      },
    });
    renderTrayListeners();
  }

  // Same two-wrongs help the add/sub screens give: dim every wrong tile and
  // let the correct one pulse, so a stuck kid always has a way forward.
  function applyHint() {
    const correct = problems[idx].answer;
    sec.querySelectorAll(".tile").forEach((tile) => {
      if (parseInt(tile.dataset.value, 10) === correct) {
        tile.classList.remove("dim", "hint-dim");
        tile.classList.add("hint-target");
      } else {
        tile.classList.add("hint-dim");
      }
    });
    sfx.hintHmm();
  }

  function renderTrayListeners() {
    sec.querySelectorAll(".tile").forEach((tile) => {
      tile.onpointerdown = (e) => dragMgr.start(e, tile, { value: parseInt(tile.dataset.value, 10) });
    });
  }

  stage.appendChild(sec);
  window.__activeRelayout = relayout;
  relayout();
  return () => {
    if (window.__activeRelayout === relayout) window.__activeRelayout = null;
    sec.remove();
  };
}
