// Rasterize an SVG file to a square PNG at a given size using Playwright's
// bundled Chromium (the one icon-grade rasterizer available locally).
// Usage: node web/electron/svg-to-png.mjs <input.svg> <output.png> <size>
// Run from the career-ops repo root so "playwright" resolves.

import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const [, , svgPath, outPath, sizeArg] = process.argv;
const size = Number(sizeArg || 1024);
const svg = readFileSync(svgPath, "utf8");

const html = `<!doctype html><html><head><style>
  html,body{margin:0;padding:0;background:transparent}
  #c{width:${size}px;height:${size}px}
  #c svg{width:100%;height:100%;display:block}
</style></head><body><div id="c">${svg}</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: size, height: size },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: "networkidle" });
const buf = await page.locator("#c").screenshot({ omitBackground: true });
writeFileSync(outPath, buf);
await browser.close();
console.log(`✓ ${outPath} (${size}×${size})`);
