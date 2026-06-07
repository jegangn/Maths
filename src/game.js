import { loadProgress } from "./logic.js";
import * as splash from "./screens/splash.js";
import * as map from "./screens/map.js";
import * as add from "./screens/add.js";
import * as sub from "./screens/sub.js";
import * as multTap from "./screens/mult-tap.js";
import * as multDrag from "./screens/mult-drag.js";
import * as complete from "./screens/complete.js";
import * as settings from "./screens/settings.js";

const stage = document.getElementById("stage");
const viewport = document.getElementById("viewport");

// Logical canvas dimensions. The game has two fixed designs: a 720×1280
// portrait canvas and a 1280×800 landscape canvas. fitStage() maps the real
// viewport onto one of them using THREE bands of aspect ratio (w/h):
//
//   aspect < 0.65            → STRETCH portrait. Fix width 720, stretch height to
//                              the screen. Fills tall phones edge-to-edge (no
//                              bars); the extra height is room the design absorbs.
//   0.65 ≤ aspect < 0.9      → FIT portrait. Render the full 720×1280 design and
//                              scale-to-fit with side letterbox. 4:3 tablets held
//                              in portrait (iPad 0.75) are too SHORT to stretch
//                              without cramping — map titles collide with level
//                              nodes, the tall carry tray covers the answer slots.
//                              Fitting the 1280-tall design keeps proportions
//                              correct with no cramping (themed side bars).
//   aspect ≥ 0.9             → FIT landscape. The 1280×800 design scaled-to-fit,
//                              centered. Near-square foldables (Find N5 unfolded:
//                              1.10 / 0.91 rotated) and all landscape tablets.
//
// Boundaries: 0.9 keeps a safe margin so a near-square foldable never collapses
// to a short portrait canvas; 0.65 sits just above the tallest tablet that still
// stretches cleanly (Samsung 10:16 = 0.625, ~1152 logical px) and below the 4:3
// tablets (0.75, ~960 logical px) that cramp.
const LANDSCAPE = { w: 1280, h: 800 };
const PORTRAIT_W = 720;
const PORTRAIT_H = 1280;
const PORTRAIT_ASPECT_THRESHOLD = 0.9; // at/above → landscape
const STRETCH_MAX_ASPECT = 0.65;        // below → stretch-fill portrait; between → fit portrait

let lastOrient = null;

function fitStage() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  // A 0-sized viewport (can happen for one frame at load) would compute
  // scale(0) and blank the whole game until the next resize. Skip until the
  // viewport has real dimensions.
  if (!vw || !vh) return;
  const aspect = vw / vh;

  let scale, logicalW, logicalH, nextOrient;
  if (aspect >= PORTRAIT_ASPECT_THRESHOLD) {
    // Near-square & wider → landscape design, scaled to fit (themed letterbox).
    nextOrient = "landscape";
    logicalW = LANDSCAPE.w;
    logicalH = LANDSCAPE.h;
    scale = Math.min(vw / logicalW, vh / logicalH);
  } else if (aspect >= STRETCH_MAX_ASPECT) {
    // 4:3-ish tablet held portrait → render the full 720×1280 design and
    // scale-to-fit (side letterbox). Keeps correct proportions; no cramming.
    nextOrient = "portrait";
    logicalW = PORTRAIT_W;
    logicalH = PORTRAIT_H;
    scale = Math.min(vw / logicalW, vh / logicalH);
  } else {
    // Tall phone → stretch the portrait design to fill the screen height. The
    // canvas grows taller than 1280; content anchored top/centre/bottom fills it.
    nextOrient = "portrait";
    logicalW = PORTRAIT_W;
    scale = vw / PORTRAIT_W;
    logicalH = vh / scale;
  }
  stage.dataset.orient = nextOrient;
  stage.style.width = `${logicalW}px`;
  stage.style.height = `${logicalH}px`;
  // Expose the live logical canvas height for code/CSS that needs it.
  stage.style.setProperty("--stage-h", `${logicalH}px`);
  stage.style.transform = `scale(${scale})`;

  // Re-render active screen when orientation flips so JS-positioned elements recompute.
  if (lastOrient !== null && lastOrient !== nextOrient && router.lastRoute) {
    router.go(router.lastRoute.name, router.lastRoute.ctx);
  }
  lastOrient = nextOrient;

  // Let the active gameplay screen re-run its portrait layout pass for plain
  // resizes (browser height change, on-screen keyboard) that don't flip
  // orientation — orientation flips already re-render above.
  if (typeof window.__activeRelayout === "function") window.__activeRelayout();
}

const state = { progress: loadProgress() };

const router = {
  current: null,
  lastRoute: null,
  go(name, ctx = {}, opts = {}) {
    if (this.current) this.current();
    this.lastRoute = { name, ctx };
    let unmount;
    switch (name) {
      case "splash":
        unmount = splash.mount(stage, state, this);
        break;
      case "map":
        state.progress = loadProgress();
        unmount = map.mount(stage, state, this);
        break;
      case "level":
        if (ctx.world === "add") unmount = add.mount(stage, ctx, this);
        else if (ctx.world === "sub") unmount = sub.mount(stage, ctx, this);
        else if (ctx.world === "mult" && ctx.level <= 3) unmount = multTap.mount(stage, ctx, this);
        else if (ctx.world === "mult" && ctx.level >= 4) unmount = multDrag.mount(stage, ctx, this);
        break;
      case "complete":
        unmount = complete.mount(stage, ctx, this);
        break;
      case "settings":
        unmount = settings.mount(stage, state, this);
        break;
      default:
        console.warn("Unknown route:", name);
    }
    this.current = unmount;

    // Mirror navigation into browser history so the device/browser Back button
    // walks back THROUGH the game (level → map → splash) instead of leaving the
    // site. Calls that replay an existing entry (fromPop) must not push again.
    if (!opts.fromPop) {
      const entry = { mathRoute: { name, ctx } };
      try {
        if (opts.replace) history.replaceState(entry, "");
        else history.pushState(entry, "");
      } catch (_) { /* history unavailable — navigation still works */ }
    }
  },
};

// Device/browser Back button → step back through the game rather than leaving.
window.addEventListener("popstate", (e) => {
  const r = e.state && e.state.mathRoute;
  if (r && r.name) {
    router.go(r.name, r.ctx || {}, { fromPop: true });
  } else {
    // Backed out past the first screen — keep the kid on the home screen
    // instead of letting Back fall through to a different page.
    router.go("splash", {}, { fromPop: true });
  }
});

window.addEventListener("resize", fitStage);
window.addEventListener("orientationchange", fitStage);
fitStage();

// Seed exactly one base history entry for the home screen.
router.go("splash", {}, { replace: true });
window.__router = router;
