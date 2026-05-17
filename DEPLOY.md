# Deployment

## Option A — Cloudflare Pages (recommended)

1. Push the repo to GitHub.
2. Visit cloudflare.com → Pages → Create → connect repo.
3. Build command: `npm run build`. Output directory: `dist`.
4. Bookmark `https://<your-pages>.pages.dev` on the tablet.
5. In Chrome on the tablet: **Add to Home Screen** for app-like launch.

## Option B — Local file (offline)

1. Run `npm run build` locally (or `node build.js`).
2. Transfer `dist/index.html` to the tablet via USB, Google Drive, or email.
3. Open in Chrome — works offline because everything is inlined (except Google Fonts on first load).

## Option C — LAN dev (for testing changes)

1. Edit `dev.js`: change `port: 5173` to `port: 5173, hostname: "0.0.0.0"` and print your LAN IP.
2. `npm run dev`.
3. From the tablet's Chrome, visit `http://<lan-ip>:5173`.
