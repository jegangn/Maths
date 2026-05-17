import * as splash from "./screens/splash.js";
import * as map from "./screens/map.js";
import * as add from "./screens/add.js";
import * as sub from "./screens/sub.js";
import * as multTap from "./screens/mult-tap.js";
import * as multDrag from "./screens/mult-drag.js";
import * as complete from "./screens/complete.js";

const stage = document.getElementById("stage");
const viewport = document.getElementById("viewport");

function fitStage() {
  const scale = Math.min(viewport.clientWidth / 1280, viewport.clientHeight / 800);
  stage.style.transform = `scale(${scale})`;
}
window.addEventListener("resize", fitStage);
window.addEventListener("orientationchange", fitStage);
fitStage();

const router = {
  current: null,
  go(name, ctx = {}) {
    if (this.current) this.current();
    if (name === "splash") {
      this.current = splash.mount(stage, {}, this);
    } else if (name === "map") {
      this.current = map.mount(stage, {}, this);
    } else if (name === "level") {
      if (ctx.world === "add") {
        this.current = add.mount(stage, ctx, this);
      } else if (ctx.world === "sub") {
        this.current = sub.mount(stage, ctx, this);
      } else if (ctx.world === "mult" && ctx.level <= 3) {
        this.current = multTap.mount(stage, ctx, this);
      } else if (ctx.world === "mult" && ctx.level >= 4) {
        this.current = multDrag.mount(stage, ctx, this);
      } else {
        const div = document.createElement("div");
        div.style.cssText = "padding:40px;font:bold 32px sans-serif;color:#2A1B0A;";
        div.textContent = `Level placeholder: ${ctx.world} L${ctx.level} — replaced in Tasks 27-29.`;
        stage.appendChild(div);
        this.current = () => div.remove();
      }
    } else if (name === "complete") {
      this.current = complete.mount(stage, ctx, this);
    } else if (name === "settings") {
      alert("Settings — Task 33");
    }
  }
};

router.go("splash");
