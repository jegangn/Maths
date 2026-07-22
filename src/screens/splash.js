import { banji, cog } from "../svg.js";
import { unlockAudio, sfx } from "../audio.js";
import { mascotCheer } from "../animate.js";

export function getPlayerName() {
  return (localStorage.getItem("bm.playerName") || "").trim();
}

export function mount(stage, state, router) {
  const sec = document.createElement("section");
  sec.className = "screen active";
  sec.id = "screen-splash";

  const cogWrap = document.createElement("div");
  cogWrap.className = "cog-corner";
  const cogLabel = document.createElement("span");
  cogLabel.className = "cog-label display";
  cogLabel.textContent = "PARENTS";
  cogWrap.appendChild(cogLabel);
  cogWrap.insertAdjacentHTML("beforeend", cog());
  sec.appendChild(cogWrap);

  const title = document.createElement("h1");
  title.className = "splash-title display";
  sec.appendChild(title);

  const mascot = document.createElement("div");
  mascot.className = "splash-mascot";
  mascot.insertAdjacentHTML("beforeend", banji("idle"));
  sec.appendChild(mascot);

  const btn = document.createElement("button");
  btn.className = "btn pill splash-play";
  btn.textContent = "TAP TO PLAY ▶";

  // First run: no stored name yet — ask who's playing before showing the
  // personalised splash. The name lives in localStorage (bm.playerName) and
  // can be changed later from the parent settings screen.
  let nameForm = null;

  function showSplash(name) {
    if (nameForm) { nameForm.remove(); nameForm = null; }
    title.textContent = `${name}'S MATH`;
    if (!btn.isConnected) sec.appendChild(btn);
  }

  function showNameEntry() {
    title.textContent = "WHO'S PLAYING?";
    nameForm = document.createElement("form");
    nameForm.className = "name-entry";
    const input = document.createElement("input");
    input.className = "name-input";
    input.type = "text";
    input.maxLength = 12;
    input.placeholder = "TYPE YOUR NAME";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Your name");
    const go = document.createElement("button");
    go.type = "submit";
    go.className = "btn pill name-go";
    go.textContent = "LET'S GO ▶";
    nameForm.append(input, go);
    nameForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const cleaned = input.value
        .replace(/[^\p{L}\p{N} ]/gu, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 12)
        .toUpperCase();
      if (!cleaned) { input.focus(); return; }
      localStorage.setItem("bm.playerName", cleaned);
      unlockAudio();
      sfx.mascotChirp();
      const svg = mascot.querySelector("svg");
      if (svg) mascotCheer(svg);
      showSplash(cleaned);
    });
    sec.appendChild(nameForm);
    setTimeout(() => input.focus(), 50);
  }

  const playerName = getPlayerName();
  if (playerName) showSplash(playerName);
  else showNameEntry();

  // Parent-gate lock-out: if a previous gate attempt failed twice, the
  // splash is locked for 5 seconds — block all interaction and show a
  // countdown message so the parent (and not the kid) knows to wait.
  const lockUntil = parseInt(localStorage.getItem("bm.parentLockUntil") || "0", 10);
  const lockRemaining = Math.max(0, lockUntil - Date.now());
  let lockBanner = null;
  let lockTimer = null;
  if (lockRemaining > 0) {
    lockBanner = document.createElement("div");
    lockBanner.className = "parent-lock-banner display";
    // Block any pointer/click reaching the underlying splash so the parent
    // can't accidentally start the game or re-open the gate while locked.
    const swallow = (e) => { e.stopPropagation(); e.preventDefault(); };
    lockBanner.addEventListener("pointerdown", swallow);
    lockBanner.addEventListener("pointerup", swallow);
    lockBanner.addEventListener("click", swallow);
    sec.appendChild(lockBanner);
    const tick = () => {
      const left = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      if (left <= 0) {
        localStorage.removeItem("bm.parentLockUntil");
        lockBanner.remove();
        lockBanner = null;
        clearInterval(lockTimer);
      } else {
        lockBanner.textContent = `PARENTS: PLEASE WAIT ${left}s`;
      }
    };
    tick();
    lockTimer = setInterval(tick, 250);
  }

  function isLocked() { return lockBanner !== null; }

  function go() {
    if (isLocked() || nameForm) return;
    unlockAudio();
    sfx.transition();
    router.go("map");
  }
  btn.addEventListener("pointerup", go);
  sec.addEventListener("pointerup", (e) => {
    if (nameForm) return; // typing a name — taps must not start the game
    if (e.target.closest(".cog-corner")) return;
    if (e.target.closest(".splash-mascot")) return; // poking the mascot is its own game
    if (!e.target.closest("button")) go();
  });

  // Kids poke characters — reward it with a chirp and a little dance instead
  // of yanking them into the map. The big PLAY button (or any other tap)
  // still starts the game.
  mascot.addEventListener("pointerup", () => {
    if (isLocked()) return;
    unlockAudio();
    sfx.mascotChirp();
    const svg = mascot.querySelector("svg");
    if (svg) mascotCheer(svg);
  });

  cogWrap.addEventListener("pointerup", () => {
    if (isLocked()) return;
    router.go("settings");
  });

  stage.appendChild(sec);
  return () => {
    if (lockTimer) clearInterval(lockTimer);
    sec.remove();
  };
}
