// Copies the static assets Next's standalone output doesn't include
// (.next/static and public/) into the standalone tree so the packaged
// server can serve them. Run after `next build`.

import { cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const standalone = join(webRoot, ".next", "standalone");

if (!existsSync(join(standalone, "server.js"))) {
  console.error(
    "✗ No standalone build found. Ensure next.config has output:'standalone' and run `next build`."
  );
  process.exit(1);
}

cpSync(join(webRoot, ".next", "static"), join(standalone, ".next", "static"), {
  recursive: true,
});

const pub = join(webRoot, "public");
if (existsSync(pub)) {
  cpSync(pub, join(standalone, "public"), { recursive: true });
}

console.log("✓ Standalone prepared (static assets copied).");
