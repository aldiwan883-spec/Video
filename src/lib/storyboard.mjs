// Storyboard preview: جدول بكل مشهد (الوقت، النوع، الإخراج، الكلام، الـ SFX) + صورة لكل مشهد وهو مكتمل.
import fs from "node:fs";
import path from "node:path";

export async function writeStoryboard({ outDir, composed, episode, series, timeline, hf }) {
  const L = [`# Storyboard — ${episode.id} ${episode.term?.en ?? ""} · ${series.name}`, "",
    `المدة ${composed.total.toFixed(1)}s · التوقيت: ${timeline.source === "voice" ? "صوتك" : "تقديري"} · الصورة: storyboard.jpg`, "",
    "| # | من–لـ | المشهد | الإخراج | الكلام | SFX |", "|---|---|---|---|---|---|"];
  composed.scenes.forEach((s, i) => {
    const sfx = composed.sfx.filter((x) => x.t >= s.start && x.t < s.start + s.dur).map((x) => x.name);
    L.push(`| ${i + 1} | ${s.start.toFixed(1)}–${(s.start + s.dur).toFixed(1)} | **${s.type}** | ${s.v.layout} · ${s.v.tIn}${s.v.camera === "punch" ? " · punch" : ""}${s.ground === "ink" ? " · ink" : ""} | ${s.seg.say.replace(/\|/g, "/")} | ${sfx.join(", ") || "—"} |`);
  });
  fs.writeFileSync(path.join(outDir, "storyboard.md"), L.join("\n") + "\n");
  const times = composed.scenes.map((s) => Math.max(s.start + 0.3, s.start + s.dur - 0.45).toFixed(2)).join(",");
  const dir = path.join(outDir, ".storyboard");
  fs.rmSync(dir, { recursive: true, force: true });
  hf(composed.proj, "snapshot", "--at", times, "--no-end", "-o", dir);
  const sheet = fs.readdirSync(dir).find((f) => f.startsWith("contact-sheet"));
  if (sheet) fs.copyFileSync(path.join(dir, sheet), path.join(outDir, "storyboard.jpg"));
}
