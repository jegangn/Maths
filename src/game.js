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

function fitStage() {
  const scale = Math.min(viewport.clientWidth / 1280, viewport.clientHeight / 800);
  stage.style.transform = `scale(${scale})`;
}
window.addEventListener("resize", fitStage);
window.addEventListener("orientationchange", fitStage);
fitStage();

const state = { progress: loadProgress() };

const router = {
  current: null,
  go(name, ctx = {}) {
    if (this.current) this.current();
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

router.go("splash");
window.__router = router;
