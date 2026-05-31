# Deployment

`bun build.js` inlines everything (HTML + CSS + JS) into a single self-contained
`index.html` at the **project root**. That one file is the whole app — upload it
or open it anywhere. It works offline (except Google Fonts on first load).

## Option A — Vercel / Netlify (manual upload, no GitHub)

1. Run `bun build.js`. This writes `index.html` to the project root.
2. **Vercel:** install the CLI once (`bun add -g vercel`), run `vercel` in this
   folder, log in via the browser when prompted. **Netlify:** go to
   app.netlify.com/drop and drag this folder in.
3. Bookmark the resulting URL on the tablet; in Chrome use **Add to Home
   Screen** for an app-like launch.

## Option B — Local file (offline)

1. Run `bun build.js`.
2. Transfer `index.html` to the tablet via USB, Google Drive, or email.
3. Open in Chrome — works offline.

## Option C — GitHub Pages (automatic)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes to the `gh-pages` branch. Retire this anytime if you've moved fully to
Vercel/Netlify.

## Option D — LAN dev (for testing changes)

1. Edit `dev.js`: change `port: 5173` to `port: 5173, hostname: "0.0.0.0"` and
   print your LAN IP.
2. `bun run dev`.
3. From the tablet's Chrome, visit `http://<lan-ip>:5173`.
