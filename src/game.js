const stage = document.getElementById("stage");
const viewport = document.getElementById("viewport");

function fitStage() {
  const scale = Math.min(viewport.clientWidth / 1280, viewport.clientHeight / 800);
  stage.style.transform = `scale(${scale})`;
}

window.addEventListener("resize", fitStage);
window.addEventListener("orientationchange", fitStage);
fitStage();
