export function mount(stage, state, router) {
  const sec = document.createElement("section");
  sec.className = "screen active";
  sec.style.cssText = "background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;";
  const card = document.createElement("div");
  card.style.cssText = "background:#FFFAF0;padding:48px;border-radius:32px;border:5px solid #2A1B0A;text-align:center;";

  const heading = document.createElement("h2");
  heading.textContent = "SETTINGS";
  heading.style.cssText = "margin:0 0 24px;font-family:Lilita One;";
  card.appendChild(heading);

  const note = document.createElement("p");
  note.textContent = "(replaced in Task 33)";
  card.appendChild(note);

  const close = document.createElement("button");
  close.className = "btn";
  close.textContent = "CLOSE";
  close.style.marginTop = "16px";
  close.addEventListener("pointerup", () => router.go("splash"));
  card.appendChild(close);

  sec.appendChild(card);
  stage.appendChild(sec);
  return () => sec.remove();
}
