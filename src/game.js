import * as splash from "./screens/splash.js";

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
      const div = document.createElement("div");
      div.style.cssText = "padding:40px;font:bold 32px sans-serif;color:#2A1B0A;";
      div.textContent = "Map placeholder — replaced in Task 25.";
      stage.appendChild(div);
      this.current = () => div.remove();
    } else if (name === "settings") {
      alert("Settings — Task 33");
    }
  }
};

router.go("splash");
