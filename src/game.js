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

// Logical canvas dimensions per orientation.
// Landscape stays fixed at 1280×800 (tablet target). Portrait fixes WIDTH at
// 720 and stretches HEIGHT to match the phone's aspect ratio — that way the
// stage fills the entire phone viewport with no letterbox bars on any device.
const LANDSCAPE = { w: 1280, h: 800 };
const PORTRAIT_W = 720;
// Aspect threshold: viewports wider than this (w/h > 1.2) use landscape.
const PORTRAIT_ASPECT_THRESHOLD = 1.2;

let lastOrient = null;

function fitStage() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const isPortrait = (vw / vh) < PORTRAIT_ASPECT_THRESHOLD;
  const nextOrient = isPortrait ? "portrait" : "landscape";
  stage.dataset.orient = nextOrient;

  let scale;
  if (isPortrait) {
    // Scale to fit width; canvas height stretches so the stage fills the
    // viewport exactly. Elements anchored to top/bottom move with the edges;
    // central elements (worksheet, firefly-area) centre via top:50%.
    scale = vw / PORTRAIT_W;
    const logicalH = vh / scale;
    stage.style.width = `${PORTRAIT_W}px`;
    stage.style.height = `${logicalH}px`;
    // Expose for code that needs to read the current logical canvas size.
    stage.style.setProperty("--stage-h", `${logicalH}px`);
  } else {
    scale = Math.min(vw / LANDSCAPE.w, vh / LANDSCAPE.h);
    stage.style.width = `${LANDSCAPE.w}px`;
    stage.style.height = `${LANDSCAPE.h}px`;
    stage.style.setProperty("--stage-h", `${LANDSCAPE.h}px`);
  }
  stage.style.transform = `scale(${scale})`;

  // Re-render active screen when orientation flips so JS-positioned elements recompute.
  if (lastOrient !== null && lastOrient !== nextOrient && router.lastRoute) {
    router.go(router.lastRoute.name, router.lastRoute.ctx);
  }
  lastOrient = nextOrient;
}

const state = { progress: loadProgress() };

const router = {
  current: null,
  lastRoute: null,
  go(name, ctx = {}) {
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
  },
};

window.addEventListener("resize", fitStage);
window.addEventListener("orientationchange", fitStage);
fitStage();

router.go("splash");
window.__router = router;
