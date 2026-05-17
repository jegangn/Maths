import { banji, cog } from "../svg.js";
import { unlockAudio, sfx } from "../audio.js";

export function mount(stage, state, router) {
  const sec = document.createElement("section");
  sec.className = "screen active";
  sec.id = "screen-splash";

  const cogWrap = document.createElement("div");
  cogWrap.className = "cog-corner";
  cogWrap.insertAdjacentHTML("beforeend", cog());
  sec.appendChild(cogWrap);

  const title = document.createElement("h1");
  title.className = "splash-title display";
  title.textContent = "JHANAV'S MATH";
  sec.appendChild(title);

  const mascot = document.createElement("div");
  mascot.className = "splash-mascot";
  mascot.insertAdjacentHTML("beforeend", banji("idle"));
  sec.appendChild(mascot);

  const btn = document.createElement("button");
  btn.className = "btn pill splash-play";
  btn.textContent = "TAP TO PLAY ▶";
  sec.appendChild(btn);

  function go() {
    unlockAudio();
    sfx.transition();
    router.go("map");
  }
  btn.addEventListener("pointerup", go);
  sec.addEventListener("pointerup", (e) => {
    if (e.target.closest(".cog-corner")) return;
    if (!e.target.closest("button")) go();
  });

  let holdTimer = null;
  cogWrap.addEventListener("pointerdown", () => {
    holdTimer = setTimeout(() => router.go("settings"), 1500);
  });
  cogWrap.addEventListener("pointerup", () => clearTimeout(holdTimer));
  cogWrap.addEventListener("pointerleave", () => clearTimeout(holdTimer));

  stage.appendChild(sec);
  return () => sec.remove();
}
