import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destDir = join(root, "public", "clerk");

mkdirSync(destDir, { recursive: true });

async function vendor(fromRelative, destName, fallbackUrl) {
  const dest = join(destDir, destName);
  const from = join(root, fromRelative);
  if (existsSync(from)) {
    copyFileSync(from, dest);
    console.log(`vendored ${destName} from node_modules`);
    return;
  }
  if (!fallbackUrl) {
    throw new Error(`Missing ${fromRelative} and no fallback URL for ${destName}`);
  }
  const response = await fetch(fallbackUrl);
  if (!response.ok) {
    throw new Error(`Failed to download ${destName}: ${response.status} ${response.statusText}`);
  }
  writeFileSync(dest, Buffer.from(await response.arrayBuffer()));
  console.log(`vendored ${destName} from CDN fallback`);
}

await vendor(
  "node_modules/@clerk/clerk-js/dist/clerk.browser.js",
  "clerk.browser.js",
  "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@6.32.0/dist/clerk.browser.js",
);
await vendor(
  "node_modules/@clerk/ui/dist/ui.browser.js",
  "ui.browser.js",
  "https://cdn.jsdelivr.net/npm/@clerk/ui@1.32.3/dist/ui.browser.js",
);
