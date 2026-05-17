import { getProblems, createAnswerState, dropDigit, isComplete } from "../logic.js";
import { createDragManager } from "../drag.js";
import { tilePickup, tileBounceBack, tileSnapIn } from "../animate.js";
import { home, pip, mango } from "../svg.js";
import { sfx } from "../audio.js";

export function mount(stage, ctx, router) {
  const { world, level } = ctx;
  stage.dataset.world = "mult";
  const problems = getProblems(world, level);
  let idx = 0;
  let totalWrong = 0;
  let state = null;
  let dragMgr = null;
  const groupContents = [];

  const sec = document.createElement("section");
  sec.className = "screen active";
  sec.id = "screen-mult-drag";

  const topbar = document.createElement("div");
  topbar.className = "topbar";
  const homeBtn = document.createElement("button");
  homeBtn.className = "home-btn small";
  homeBtn.insertAdjacentHTML("beforeend", home());
  homeBtn.addEventListener("pointerup", () => router.go("map"));
  const progressDots = document.createElement("div");
  progressDots.className = "progress-dots";
  topbar.appendChild(homeBtn);
  topbar.appendChild(progressDots);

  const multProblem = document.createElement("div");
  multProblem.className = "mult-problem";

  const groupRow = document.createElement("div");
  groupRow.className = "group-row";

  const blockPile = document.createElement("div");
  blockPile.className = "block-pile";

  const ansHost = document.createElement("div");
  ansHost.className = "ans-host hidden";
  const ansLabel = document.createElement("span");
  ansLabel.className = "display";
  ansLabel.textContent = "HOW MANY TOTAL?";
  const ansSlotHost = document.createElement("div");
  ansSlotHost.className = "ans-slot-host";
  ansHost.appendChild(ansLabel);
  ansHost.appendChild(ansSlotHost);

  const digitTray = document.createElement("div");
  digitTray.className = "digit-tray hidden";

  const cornerMascot = document.createElement("div");
  cornerMascot.className = "corner-mascot";
  cornerMascot.insertAdjacentHTML("beforeend", pip("idle"));

  sec.appendChild(topbar);
  sec.appendChild(multProblem);
  sec.appendChild(groupRow);
  sec.appendChild(blockPile);
  sec.appendChild(ansHost);
  sec.appendChild(digitTray);
  sec.appendChild(cornerMascot);

  renderProgressDots();
  renderProblem();

  function renderProgressDots() {
    progressDots.textContent = "";
    for (let i = 0; i < 5; i++) {
      const dot = document.createElement("span");
      dot.className = "dot" + (i < idx ? " filled" : i === idx ? " current" : "");
      progressDots.appendChild(dot);
    }
  }

  function renderProblem() {
    const p = problems[idx];
    state = createAnswerState(p.answer);
    groupContents.length = 0;

    multProblem.textContent = "";
    const chipA = document.createElement("div");
    chipA.className = "op-chip display";
    chipA.textContent = String(p.a);
    const symMult = document.createElement("div");
    symMult.className = "op-sym display";
    symMult.textContent = "×";
    const chipB = document.createElement("div");
    chipB.className = "op-chip display";
    chipB.textContent = String(p.b);
    const symEq = document.createElement("div");
    symEq.className = "op-sym display";
    symEq.textContent = "=";
    const chipQ = document.createElement("div");
    chipQ.className = "op-chip q display";
    chipQ.textContent = "?";
    multProblem.appendChild(chipA);
    multProblem.appendChild(symMult);
    multProblem.appendChild(chipB);
    multProblem.appendChild(symEq);
    multProblem.appendChild(chipQ);

    groupRow.textContent = "";
    for (let g = 0; g < p.a; g++) {
      const tray = document.createElement("div");
      tray.className = "group-tray";
      tray.dataset.idx = String(g);
      for (let i = 0; i < p.b; i++) {
        const ghost = document.createElement("div");
        ghost.className = "ghost";
        tray.appendChild(ghost);
      }
      const chip = document.createElement("div");
      chip.className = "count-chip";
      chip.textContent = `0 / ${p.b}`;
      tray.appendChild(chip);
      groupRow.appendChild(tray);
      groupContents.push({ filled: 0, needed: p.b });
    }

    blockPile.textContent = "";
    const extra = 3;
    for (let i = 0; i < p.a * p.b + extra; i++) {
      const wrap = document.createElement("div");
      wrap.className = "block-host idle-wobble";
      wrap.style.transform = `rotate(${(Math.random()-0.5)*16}deg)`;
      wrap.insertAdjacentHTML("beforeend", mango());
      wrap.onpointerdown = (e) => dragMgr.start(e, wrap, { kind: "block" });
      blockPile.appendChild(wrap);
    }

    ansHost.classList.add("hidden");
    digitTray.classList.add("hidden");

    dragMgr = createDragManager({
      getTargets() {
        return Array.from(sec.querySelectorAll(".group-tray")).map((el) => ({
          el, rect: el.getBoundingClientRect(),
          active: groupContents[parseInt(el.dataset.idx, 10)].filled < groupContents[parseInt(el.dataset.idx, 10)].needed,
          id: el.dataset.idx,
        })).concat(Array.from(sec.querySelectorAll(".slot")).map((el) => ({
          el, rect: el.getBoundingClientRect(),
          active: el.classList.contains("active"),
          id: "slot-" + el.dataset.index,
        })));
      },
      onPickup(_p, el) { sfx.tilePickup(); el.classList.add("dragging"); },
      async onDrop(payload, target, sourceEl, origin) {
        if (payload.kind === "block") {
          if (!target || !target.id || String(target.id).startsWith("slot-")) {
            sourceEl.classList.remove("dragging");
            return tileBounceBack(sourceEl, origin);
          }
          const gIdx = parseInt(target.id, 10);
          const gc = groupContents[gIdx];
          if (gc.filled >= gc.needed) {
            sourceEl.classList.remove("dragging");
            return tileBounceBack(sourceEl, origin);
          }
          const tray = target.el;
          const ghosts = tray.querySelectorAll(".ghost");
          const slot = ghosts[gc.filled];
          const slotRect = slot.getBoundingClientRect();
          sourceEl.classList.remove("dragging", "idle-wobble");
          sourceEl.classList.add("in-group");
          sourceEl.style.position = "absolute";
          sourceEl.style.left = `${slotRect.left}px`;
          sourceEl.style.top = `${slotRect.top}px`;
          tray.appendChild(sourceEl);
          gc.filled++;
          tray.querySelector(".count-chip").textContent = `${gc.filled} / ${gc.needed}`;
          sfx.trayFull();
          if (gc.filled === gc.needed) {
            tray.classList.add("full");
            tray.querySelector(".count-chip").textContent = `★ ${gc.needed}`;
          }
          if (groupContents.every((g) => g.filled === g.needed)) {
            setTimeout(showAnswerPhase, 800);
          }
        } else if (payload.kind === "digit") {
          if (!target || !String(target.id || "").startsWith("slot-")) return tileBounceBack(sourceEl, origin);
          const slotIndex = parseInt(String(target.id).replace("slot-", ""), 10);
          const next = dropDigit(state, payload.digit, slotIndex);
          if (!next.lastDropCorrect) {
            totalWrong++; state = next;
            return tileBounceBack(sourceEl, origin);
          }
          state = next;
          await tileSnapIn(sourceEl, target.el);
          if (isComplete(state)) {
            idx++; renderProgressDots();
            if (idx >= problems.length) {
              router.go("complete", { world, level, wrongCount: totalWrong });
            } else {
              sfx.transition();
              setTimeout(renderProblem, 500);
            }
          } else {
            sec.querySelectorAll(".slot").forEach((el) => {
              const i = parseInt(el.dataset.index, 10);
              el.classList.remove("active", "inactive");
              if (i === state.activeIndex) el.classList.add("active");
              else if (!el.classList.contains("filled")) el.classList.add("inactive");
            });
          }
        }
      },
    });
  }

  function showAnswerPhase() {
    groupRow.animate(
      [{ opacity: 1 }, { opacity: 0.4 }],
      { duration: 400, fill: "forwards" }
    );
    ansSlotHost.textContent = "";
    if (state.slots.length === 2) {
      const slot0 = document.createElement("div");
      slot0.className = "slot inactive";
      slot0.dataset.index = "0";
      ansSlotHost.appendChild(slot0);
    }
    const slotLast = document.createElement("div");
    slotLast.className = "slot active";
    slotLast.dataset.index = String(state.slots.length - 1);
    ansSlotHost.appendChild(slotLast);
    ansHost.classList.remove("hidden");

    digitTray.classList.remove("hidden");
    digitTray.textContent = "";
    for (let n = 0; n <= 9; n++) {
      const t = document.createElement("div");
      t.className = "tile";
      t.dataset.digit = String(n);
      t.textContent = String(n);
      t.onpointerdown = (e) => dragMgr.start(e, t, { kind: "digit", digit: n });
      digitTray.appendChild(t);
    }
  }

  stage.appendChild(sec);
  return () => sec.remove();
}
