// Pack a set of square PNGs into a multi-resolution Windows .ico (PNG-in-ICO,
// supported by Windows Vista+). No external dependencies.
// Usage: node electron/make-ico.mjs <out.ico> <png16> <png32> ...

import { readFileSync, writeFileSync } from "node:fs";

const [out, ...pngPaths] = process.argv.slice(2);
if (!out || !pngPaths.length) {
  console.error("usage: make-ico.mjs <out.ico> <png...>");
  process.exit(1);
}

const images = pngPaths.map((p) => {
  const data = readFileSync(p);
  // PNG IHDR width/height at bytes 16..24 (big-endian)
  const w = data.readUInt32BE(16);
  const h = data.readUInt32BE(20);
  return { data, w, h };
});

const count = images.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(count, 4);

const dir = Buffer.alloc(16 * count);
let offset = 6 + 16 * count;
images.forEach((img, i) => {
  const e = dir.subarray(i * 16, i * 16 + 16);
  e.writeUInt8(img.w >= 256 ? 0 : img.w, 0); // 0 means 256
  e.writeUInt8(img.h >= 256 ? 0 : img.h, 1);
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // color planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(img.data.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += img.data.length;
});

writeFileSync(out, Buffer.concat([header, dir, ...images.map((i) => i.data)]));
console.log(`✓ ${out} (${count} sizes: ${images.map((i) => i.w).join(", ")})`);
