// npm run script -- 001 → يطلّع السكريبت اللي هتسجله (episodes/001-*/script.md)
import fs from "node:fs";
import path from "node:path";
import { findEpisodeDir, loadEpisode } from "../lib/episode.mjs";

export function writeScript(dir, ep) {
  const words = ep.segments.reduce((n, s) => n + s.say.split(/\s+/).length, 0);
  const L = [`# السكريبت — الحلقة ${ep.id}: ${ep.term.en} (${ep.term.ar})`, "",
    `حوالي ${words} كلمة ≈ ${Math.round(words / 2.6)} ثانية.`, "",
    "**طريقة التسجيل:** ملف واحد WAV (أو MP3) باسم `voice.wav` جوه فولدر الحلقة. اسكت حوالي نص ثانية بين كل جزء والتاني. الوقفات الطبيعية جوه الجملة سيبها زي ما هي.", "", "---", ""];
  ep.segments.forEach((s, i) => L.push(`**[${i + 1} — ${s.id}]**`, s.say.replace(/\*/g, ""), ""));
  if (ep.post?.first_comment) L.push("---", "", `**أول كومنت:** ${ep.post.first_comment}`);
  fs.writeFileSync(path.join(dir, "script.md"), L.join("\n") + "\n");
  return path.join(dir, "script.md");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = findEpisodeDir(process.argv[2]);
  console.log("✓", writeScript(dir, loadEpisode(dir)));
}
