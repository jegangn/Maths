import { sfx } from "./audio.js";
import { confettiShape } from "./svg.js";

// ===== TASK 16: Tile Animations =====

export function tilePickup(el) {
  el.classList.add("dragging");
  sfx.tilePickup();
}

export function tileBounceBack(el, origin, parentInfo) {
  return new Promise((resolve) => {
    const stage = document.getElementById("stage");
    const sRect = stage.getBoundingClientRect();
    const scale = sRect.width / 1280;
    const elRect = el.getBoundingClientRect();
    const startLocalX = (elRect.left - sRect.left) / scale;
    const startLocalY = (elRect.top  - sRect.top)  / scale;
    const dx = origin.x - startLocalX;
    const dy = origin.y - startLocalY;
    const apex = -24;
    el.style.transition = "none";
    el.classList.remove("dragging");
    el.animate(
      [
        { transform: `translate(0,0) rotate(0)` },
        { transform: `translate(${dx/2}px, ${dy/2 + apex}px) rotate(-8deg)` },
        { transform: `translate(${dx}px, ${dy}px) rotate(0)` },
      ],
      { duration: 450, easing: "cubic-bezier(0.7,-0.5,0.3,1.5)" }
    ).onfinish = () => {
      el.style.position = "";
      el.style.left = "";
      el.style.top = "";
      el.style.transform = "";
      // Re-parent back to the original container (digit-tray) so the tile
      // re-joins the flex layout after a failed drop.
      if (parentInfo?.originalParent) {
        if (parentInfo.originalNextSibling) {
          parentInfo.originalParent.insertBefore(el, parentInfo.originalNextSibling);
        } else {
          parentInfo.originalParent.appendChild(el);
        }
      }
      resolve();
    };
    sfx.tileDropWrong();
  });
}

export function tileSnapIn(el, targetEl) {
  return new Promise((resolve) => {
    const start = el.getBoundingClientRect();
    const target = targetEl.getBoundingClientRect();
    const dx = target.left + (target.width - start.width)/2 - start.left;
    const dy = target.top  + (target.height - start.height)/2 - start.top;
    el.classList.remove("dragging");
    el.animate(
      [
        { transform: `translate(0,0) scale(1.15)` },
        { transform: `translate(${dx}px,${dy}px) scale(0.96)`, offset: 0.8 },
        { transform: `translate(${dx}px,${dy}px) scale(1)` },
      ],
      { duration: 220, easing: "cubic-bezier(0.25,0.9,0.3,1.4)" }
    ).onfinish = () => {
      el.remove();
      targetEl.classList.remove("active");
      targetEl.classList.add("filled");
      targetEl.textContent = el.textContent;
      targetEl.classList.add("just-filled");
      setTimeout(() => targetEl.classList.remove("just-filled"), 700);
      correctBurst(targetEl);
      const mascot = document.querySelector(".corner-mascot svg");
      if (mascot) mascotQuickHop(mascot);
      resolve();
    };
    sfx.correctDing();
  });
}

// Mini sparkle burst from a slot when a correct answer lands
export function correctBurst(slotEl) {
  const stage = document.getElementById("stage");
  if (!stage) return;
  const stageRect = stage.getBoundingClientRect();
  const slotRect = slotEl.getBoundingClientRect();
  const scale = stageRect.width / 1280;
  const cx = (slotRect.left + slotRect.width / 2 - stageRect.left) / scale;
  const cy = (slotRect.top + slotRect.height / 2 - stageRect.top) / scale;

  const colors = ["#FFC83A", "#FFF1A8", "#4AD66D", "#FF7A40"];
  const N = 14;
  for (let i = 0; i < N; i++) {
    const p = document.createElement("div");
    p.className = "spark-particle";
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    p.style.background = colors[i % colors.length];
    stage.appendChild(p);
    const angle = (Math.PI * 2 * i) / N + (Math.random() - 0.5) * 0.4;
    const dist = 90 + Math.random() * 50;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 20;
    p.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.6)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5}px)) scale(1.2)`, opacity: 1, offset: 0.4 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.4)`, opacity: 0 },
      ],
      { duration: 700 + Math.random() * 200, easing: "cubic-bezier(0.34,1.6,0.5,1)", fill: "forwards" }
    ).onfinish = () => p.remove();
  }
}

export function mascotQuickHop(svgRoot) {
  svgRoot.animate(
    [
      { transform: "translateY(0) scale(1)" },
      { transform: "translateY(-16px) scale(1.06)", offset: 0.4 },
      { transform: "translateY(0) scale(1)" },
    ],
    { duration: 400, easing: "cubic-bezier(0.34,1.6,0.5,1)" }
  );
}

// ===== TASK 17: Carry Chip Animation =====

export function flyCarry(carrySlotEl, fromEl) {
  return new Promise((resolve) => {
    const chip = document.createElement("div");
    chip.className = "carry-chip";
    chip.textContent = "1";
    document.body.appendChild(chip);

    const start = fromEl.getBoundingClientRect();
    const end = carrySlotEl.getBoundingClientRect();
    const startX = start.left + start.width / 2;
    const startY = start.top + start.height / 2;
    const endX = end.left + end.width / 2;
    const endY = end.top + end.height / 2;
    const apexX = (startX + endX) / 2;
    const apexY = Math.min(startY, endY) - 80;

    chip.style.left = `${startX - 30}px`;
    chip.style.top = `${startY - 30}px`;
    chip.style.transform = "scale(0)";

    sfx.carryWhoosh();
    requestAnimationFrame(() => {
      chip.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }],
        { duration: 200, easing: "cubic-bezier(0.34,1.6,0.5,1)", fill: "forwards" });
      setTimeout(() => {
        chip.animate(
          [
            { left: `${startX - 30}px`, top: `${startY - 30}px`, transform: "scale(1) rotate(0)" },
            { left: `${apexX - 30}px`,  top: `${apexY - 30}px`,  transform: "scale(1.05) rotate(6deg)", offset: 0.5 },
            { left: `${endX - 30}px`,   top: `${endY - 30}px`,   transform: "scale(1) rotate(0)" },
          ],
          { duration: 500, easing: "cubic-bezier(0.4,0,0.6,1)", fill: "forwards" }
        ).onfinish = () => {
          chip.animate([{ transform: "scale(1.1)" }, { transform: "scale(1)" }],
            { duration: 200, easing: "cubic-bezier(0.25,0.9,0.3,1.4)", fill: "forwards" });
          carrySlotEl.textContent = "1";
          carrySlotEl.classList.add("filled");
          setTimeout(() => { chip.remove(); resolve(); }, 220);
        };
      }, 200);
    });
  });
}

// ===== TASK 18: Borrow Animation (descent with strikethrough and chip drop) =====

export function animateBorrow({ tensTopEl, onesTopEl, newTensDigit, newOnesValue }) {
  return new Promise((resolve) => {
    sfx.borrowWhoosh();

    const strike = document.createElement("div");
    strike.className = "strike";
    tensTopEl.appendChild(strike);

    const newTens = document.createElement("div");
    newTens.className = "borrow-replacement";
    newTens.textContent = String(newTensDigit);
    tensTopEl.parentElement.appendChild(newTens);

    newTens.style.left = `${tensTopEl.offsetLeft}px`;
    newTens.style.top  = `${tensTopEl.offsetTop - 70}px`;
    newTens.animate([{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 200, easing: "ease-out", fill: "forwards" });

    setTimeout(() => {
      const chip = document.createElement("div");
      chip.className = "borrow-chip";
      chip.textContent = "10";
      document.body.appendChild(chip);

      const tens = tensTopEl.getBoundingClientRect();
      const ones = onesTopEl.getBoundingClientRect();
      const sx = tens.left + tens.width/2;
      const sy = tens.top + tens.height/2;
      const ex = ones.left + ones.width/2;
      const ey = ones.top + ones.height/2;
      chip.style.left = `${sx - 30}px`;
      chip.style.top  = `${sy - 30}px`;

      chip.animate(
        [
          { left: `${sx - 30}px`, top: `${sy - 30}px`, transform: "scale(1)" },
          { left: `${(sx+ex)/2 - 30}px`, top: `${(sy+ey)/2 - 30}px`, transform: "scale(1.1)", offset: 0.6 },
          { left: `${ex - 30}px`, top: `${ey - 30}px`, transform: "scale(1)" },
        ],
        { duration: 600, easing: "cubic-bezier(0.4,0,0.6,1)", fill: "forwards" }
      ).onfinish = () => {
        onesTopEl.animate([{ opacity: 1 }, { opacity: 0 }],
          { duration: 150, fill: "forwards" }).onfinish = () => {
            onesTopEl.textContent = String(newOnesValue);
            onesTopEl.animate([{ opacity: 0 }, { opacity: 1 }],
              { duration: 150, fill: "forwards" }).onfinish = () => {
                chip.remove();
                resolve();
              };
          };
      };
    }, 300);
  });
}

// ===== TASK 19: Block Tap-Count Badge + Fly-In Animation =====

export function tapBlock(blockEl, count) {
  blockEl.classList.remove("untapped");
  blockEl.classList.add("tapped");
  let badge = blockEl.querySelector(".count-badge");
  if (!badge) {
    badge = document.createElement("div");
    badge.className = "count-badge";
    blockEl.appendChild(badge);
  }
  badge.textContent = String(count);
  requestAnimationFrame(() => badge.classList.add("show"));
  sfx.blockTap(count);
}

export function blockFlyIn(blocks) {
  blocks.forEach((el, i) => {
    el.style.opacity = "0";
    el.style.transform = `translate(${(Math.random()-0.5)*120}px, -200px) rotate(${(Math.random()-0.5)*40}deg)`;
    setTimeout(() => {
      el.animate(
        [
          { opacity: 0, transform: el.style.transform },
          { opacity: 1, transform: "translate(0,0) rotate(0)" },
        ],
        { duration: 600, easing: "cubic-bezier(0.34,1.6,0.5,1)", fill: "forwards" }
      ).onfinish = () => { el.classList.add("idle-wobble"); el.style.opacity = ""; el.style.transform = ""; };
    }, i * 40);
  });
}

// ===== TASK 20: Star Reveal with Escalating Ding =====

export function revealStars(starEls, earnedCount) {
  const delays = [400, 1100, 1900];
  const overshoots = [1.3, 1.5, 1.7];
  return new Promise((resolve) => {
    starEls.forEach((el, i) => {
      if (i >= earnedCount) {
        el.classList.add("empty");
        return;
      }
      setTimeout(() => {
        el.classList.remove("empty");
        el.classList.add("earned");
        sfx.starDing(i + 1);
        el.animate(
          [
            { transform: "translateY(-80px) scale(0)", opacity: 0 },
            { transform: `translateY(0) scale(${overshoots[i]})`, opacity: 1, offset: 0.6 },
            { transform: "translateY(0) scale(1)", opacity: 1 },
          ],
          { duration: 500 + i * 100, easing: "cubic-bezier(0.34,1.6,0.5,1)", fill: "forwards" }
        );
        if (i === earnedCount - 1) {
          setTimeout(resolve, 500 + i * 100 + 200);
        }
      }, delays[i]);
    });
    if (earnedCount === 0) setTimeout(resolve, 600);
  });
}

// ===== TASK 21: Mascot Idle (breathing, blinking) and Celebrate (jump & wings) =====

export function mascotIdle(svgRoot) {
  svgRoot.classList.add("idle");
  svgRoot.classList.remove("celebrate");
}

export function mascotCelebrate(svgRoot) {
  svgRoot.classList.remove("idle");
  svgRoot.classList.add("celebrate");
  setTimeout(() => mascotIdle(svgRoot), 2400);
}

// ===== TASK 22: Confetti Particle Burst (80 particles, 4 shapes, 6 colors) =====

const CONFETTI_COLORS = ["#FFC83A", "#FF7A40", "#4AAE3F", "#3DC5C5", "#E03E3E", "#FFB933"];
const CONFETTI_KINDS = ["rect", "tear", "circle", "zig"];

export function burstConfetti(container, count = 80) {
  for (let i = 0; i < count; i++) {
    const wrap = document.createElement("div");
    wrap.className = "confetti-particle";
    const kind = CONFETTI_KINDS[i % 4];
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    wrap.insertAdjacentHTML("beforeend", confettiShape(kind, color));
    const startX = container.clientWidth / 2 + (Math.random() - 0.5) * 200;
    const endX = startX + (Math.random() - 0.5) * 800;
    const endY = container.clientHeight + 100;
    wrap.style.left = `${startX}px`;
    wrap.style.top = "0px";
    wrap.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(wrap);
    wrap.animate(
      [
        { transform: `translate(0,0) rotate(0deg)` },
        { transform: `translate(${endX - startX}px, ${endY}px) rotate(${720 + Math.random()*720}deg)` },
      ],
      { duration: 2500 + Math.random()*500, easing: "cubic-bezier(0.4,0,0.6,1)", fill: "forwards" }
    ).onfinish = () => wrap.remove();
  }
}

// ===== TASK 23: Node Unlock with Padlock Break Animation =====

export function unlockNode(nodeEl) {
  return new Promise((resolve) => {
    nodeEl.classList.add("unlocking");
    sfx.nodeUnlockPop();
    setTimeout(() => {
      const padlock = nodeEl.querySelector(".padlock");
      if (padlock) {
        padlock.animate(
          [
            { transform: "rotate(0) translateY(0)", opacity: 1 },
            { transform: "rotate(40deg) translateY(80px)", opacity: 0 },
          ],
          { duration: 500, easing: "ease-in", fill: "forwards" }
        ).onfinish = () => padlock.remove();
      }
      sfx.starDing(1);
    }, 400);
    setTimeout(() => {
      nodeEl.classList.remove("locked", "unlocking");
      nodeEl.classList.add("unlocked");
      resolve();
    }, 1400);
  });
}
