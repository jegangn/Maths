import { file } from "bun";
import { join, normalize } from "node:path";

const ROOT = new URL("./src/", import.meta.url).pathname;
const PORT = 5173;

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let path = decodeURIComponent(url.pathname);
    if (path === "/") path = "/index.html";
    const safe = normalize(path).replace(/^(\.\.[\/\\])+/, "");
    const f = file(join(ROOT, safe));
    if (!(await f.exists())) return new Response("Not found", { status: 404 });
    return new Response(f);
  },
});

console.log(`Dev server: http://localhost:${PORT}`);
