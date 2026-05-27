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
const LANDSCAPE = { w: 1280, h: 800 };
const PORTRAIT = { w: 720, h: 1280 };
// Aspect threshold: viewports wider than this (w/h > 1.2) use landscape.
const PORTRAIT_ASPECT_THRESHOLD = 1.2;

let lastOrient = null;

function fitStage() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const isPortrait = (vw / vh) < PORTRAIT_ASPECT_THRESHOLD;
  const size = isPortrait ? PORTRAIT : LANDSCAPE;
  const nextOrient = isPortrait ? "portrait" : "landscape";

  stage.dataset.orient = nextOrient;
  const scale = Math.min(vw / size.w, vh / size.h);
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
