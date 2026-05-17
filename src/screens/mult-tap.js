import { getProblems, createAnswerState, dropDigit, isComplete } from "../logic.js";
import { createDragManager } from "../drag.js";
import { tilePickup, tileBounceBack, tileSnapIn, tapBlock, blockFlyIn } from "../animate.js";
import { home, pip, lilypad, firefly } from "../svg.js";
import { sfx } from "../audio.js";

export function mount(stage, ctx, router) {
  const { world, level } = ctx;
  stage.dataset.world = "mult";
  const problems = getProblems(world, level);
  let idx = 0;
  let totalWrong = 0;
  let state = null;
  let dragMgr = null;
  let globalCount = 0;
  let tappedSet = new Set();

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
    <div class="total-reveal hidden"><span class="display">TOTAL</span><div class="ans-slot-host"></div></div>
    <div class="digit-tray"></div>
    <div class="corner-mascot"></div>
  `;
  sec.querySelector(".home-btn").insertAdjacentHTML("beforeend", home());
  sec.querySelector(".home-btn").addEventListener("pointerup", () => router.go("map"));
  sec.querySelector(".corner-mascot").insertAdjacentHTML("beforeend", pip("idle"));

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
    const p = problems[idx];
    state = createAnswerState(p.answer);
    globalCount = 0;
    tappedSet.clear();

    const probEl = sec.querySelector(".mult-problem");
    probEl.innerHTML = `
      <div class="op-chip display">${p.a}</div>
      <div class="op-sym display">×</div>
      <div class="op-chip display">${p.b}</div>
      <div class="op-sym display">=</div>
      <div class="op-chip q display">?</div>
    `;

    const area = sec.querySelector(".firefly-area");
    area.innerHTML = "";
    const blockEls = [];
    for (let g = 0; g < p.a; g++) {
      const pad = document.createElement("div");
      pad.className = "lily-group";
      pad.insertAdjacentHTML("beforeend", lilypad());
      const blocks = document.createElement("div");
      blocks.className = "block-grid";
      for (let i = 0; i < p.b; i++) {
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
    blockFlyIn(blockEls);

    const reveal = sec.querySelector(".total-reveal");
    reveal.classList.add("hidden");
    sec.querySelector(".digit-tray").innerHTML = "";
  }

  function onBlockTap(wrap) {
    const id = `${wrap.dataset.groupIndex}-${wrap.dataset.blockIndex}`;
    if (tappedSet.has(id)) { sfx.mascotChirp(); return; }
    tappedSet.add(id);
    globalCount++;
    tapBlock(wrap, globalCount);

    const total = problems[idx].answer;
    if (globalCount === total) {
      showReveal();
    }
  }

  function showReveal() {
    const reveal = sec.querySelector(".total-reveal");
    const host = reveal.querySelector(".ans-slot-host");
    host.innerHTML = "";
    if (state.slots.length === 2) host.insertAdjacentHTML("beforeend", '<div class="slot inactive" data-index="0"></div>');
    host.insertAdjacentHTML("beforeend", `<div class="slot active" data-index="${state.slots.length - 1}"></div>`);
    reveal.classList.remove("hidden");
    reveal.animate(
      [{ opacity: 0, transform: "translateY(20px) scale(0.9)" }, { opacity: 1, transform: "translateY(0) scale(1)" }],
      { duration: 400, easing: "cubic-bezier(0.34,1.6,0.5,1)", fill: "forwards" }
    );

    const tray = sec.querySelector(".digit-tray");
    tray.innerHTML = "";
    for (let n = 0; n <= 9; n++) {
      const t = document.createElement("div");
      t.className = "tile";
      t.dataset.digit = String(n);
      t.textContent = String(n);
      tray.appendChild(t);
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
      async onDrop(payload, target, sourceEl, origin) {
        if (!target) return tileBounceBack(sourceEl, origin);
        const next = dropDigit(state, payload.digit, parseInt(target.id, 10));
        if (!next.lastDropCorrect) {
          totalWrong++; state = next;
          await tileBounceBack(sourceEl, origin);
          return;
        }
        state = next;
        await tileSnapIn(sourceEl, target.el);
        if (isComplete(state)) {
          idx++;
          renderProgressDots();
          if (idx >= problems.length) {
            router.go("complete", { world, level, wrongCount: totalWrong });
            return;
          }
          sfx.transition();
          setTimeout(renderProblem, 500);
        } else {
          sec.querySelectorAll(".slot").forEach((el) => {
            const i = parseInt(el.dataset.index, 10);
            el.classList.remove("active", "inactive");
            if (i === state.activeIndex) el.classList.add("active");
            else if (!el.classList.contains("filled")) el.classList.add("inactive");
          });
        }
        renderTrayListeners();
      },
    });
    renderTrayListeners();
  }

  function renderTrayListeners() {
    sec.querySelectorAll(".tile").forEach((tile) => {
      tile.onpointerdown = (e) => dragMgr.start(e, tile, { digit: parseInt(tile.dataset.digit, 10) });
    });
  }

  stage.appendChild(sec);
  return () => sec.remove();
}
