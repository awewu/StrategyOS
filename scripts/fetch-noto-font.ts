#!/usr/bin/env npx tsx
/**
 * Download Noto Sans SC Subset OTF for Chinese PDF generation.
 * Run: npm run fonts:fetch
 */
import fs from "fs";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "public/fonts");
const OUT_FILE = path.join(OUT_DIR, "NotoSansSC-Regular.otf");

const SOURCES = [
  "https://fastly.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf",
  "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf",
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const url of SOURCES) {
    try {
      console.log(`Fetching ${url} ...`);
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) {
        console.warn(`HTTP ${res.status} from ${url}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 100_000) {
        console.warn(`Response too small (${buf.length} bytes), skipping`);
        continue;
      }
      fs.writeFileSync(OUT_FILE, buf);
      console.log(`Wrote ${OUT_FILE} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
      return;
    } catch (e) {
      console.warn(`Failed ${url}:`, e);
    }
  }

  console.error(
    "Could not download font. Manual: place NotoSansSC-Regular.otf in public/fonts/"
  );
  process.exit(1);
}

main();
