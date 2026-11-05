// npm run setup — يجهز مكتبة الـ SFX المجانية (Pixabay Content License) ويقيس لحظة الذروة في كل صوت.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(ROOT, "public/sounds");
const FILES = [
  "pop", "click-soft", "click", "key-press", "whoosh", "whoosh-short", "whoosh-cinematic",
  "riser", "impact-bass-1", "impact-bass-2", "error", "sparkle", "ping",
];
const LOCAL = path.join(os.homedir(), ".agents/skills/media-use/audio/assets/sfx");
const REMOTE = "https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/media-use/audio/assets/sfx";

fs.mkdirSync(OUT, { recursive: true });
const manifest = {};
for (const name of FILES) {
  const dest = path.join(OUT, `${name}.mp3`);
  if (!fs.existsSync(dest)) {
    const local = path.join(LOCAL, `${name}.mp3`);
    if (fs.existsSync(local)) fs.copyFileSync(local, dest);
    else {
      const res = await fetch(`${REMOTE}/${name}.mp3`);
      if (!res.ok) { console.warn(`✗ ${name}: ${res.status}`); continue; }
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    }
  }
  const out = execFileSync("npx", ["hyperframes", "audio", dest, "--only", "moments", "--json"], {
    cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
  });
  const item = JSON.parse(out).items[0];
  manifest[name] = { file: `${name}.mp3`, duration: item.duration, peak: item.moments.peak };
  console.log(`✓ ${name.padEnd(18)} ${item.duration.toFixed(2)}s  peak @ ${item.moments.peak.toFixed(3)}s`);
}
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("\nمكتبة الأصوات جاهزة في public/sounds (Pixabay Content License — مجانية تجارياً من غير ذكر المصدر).");
