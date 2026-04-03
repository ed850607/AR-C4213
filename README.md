# AR Assembly Manual (browser)

English UI for installers. Scan a QR code that points to the deployed **HTTPS** site, grant camera access, align the virtual product, then follow step-by-step instructions with part highlighting.

## Requirements

- **Node.js** 18+ (includes `npm`) — [https://nodejs.org/](https://nodejs.org/)
- Mobile testing: **HTTPS** or `localhost` (camera APIs require a secure context)

## Setup

```bash
cd "J:\Users\Administrator\Desktop\cursor\AR说明书"
npm install
npm run dev
```

Open the printed URL on your phone (same Wi‑Fi) or use tunneling if needed.

## Build

```bash
npm run build
```

Output is in `dist/`. Deploy `dist` to **GitHub Pages** or any static host.

## GitHub Pages

1. Create a GitHub repository and push this folder.
2. **Settings → Pages → Build and deployment**: set **Source** to **GitHub Actions** (the included workflow publishes `dist`).
3. Push to `main` (or `master`). After the workflow succeeds, open the URL shown under **Settings → Pages**.
4. Point your QR code to that **https** URL.

If assets fail to load on a project site, set `base` in [`vite.config.ts`](vite.config.ts) to `/<your-repo-name>/` (see [Vite: public base](https://vitejs.dev/guide/build.html#public-base-path)).

## Content

- Step data: [`public/manifest.json`](public/manifest.json)
- Manufacturer GLB guidelines: [`CONTENT_SPEC.md`](CONTENT_SPEC.md)

## License

Private / your company — add a license file if you redistribute.
