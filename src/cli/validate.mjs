// npm run validate -- 102 103 … (أو --all) → فحص سريع من غير Chrome:
// البوابة التعليمية + بناء المشروع (كل الـ anchors موجودة، المشاهد معروفة، الكابشن والملفات سليمة).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findEpisodeDir, loadEpisode, loadSeries, listEpisodeDirs } from "../lib/episode.mjs";
import { eduReview } from "../lib/edu-qc.mjs";
import { buildTimeline } from "../lib/timing.mjs";
import { composeEpisode } from "../lib/compose.mjs";
import { assetReport, captionReport } from "../lib/qc.mjs";

let ids = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (process.argv.includes("--all") || !ids.length) ids = listEpisodeDirs().map((d) => path.basename(d).split("-")[0]);
let bad = 0;
for (const id of ids) {
  const problems = [];
  let ep;
  try {
    ep = loadEpisode(findEpisodeDir(id));
    const series = loadSeries(ep);
    const edu = eduReview(ep, series);
    for (const c of edu.issues) problems.push(`${c.critical ? "EDU ❌" : "EDU ⚠️"} ${c.title} → ${c.fix}`);
    const tl = buildTimeline(ep, null);
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "fbv-"));
    const c = composeEpisode({ episode: ep, series, timeline: tl, outDir: out });
    for (const f of [...assetReport(c.proj), ...captionReport(c), ...c.notes]) if (f.level === "error" || f.level === "warn") problems.push(`${f.level === "error" ? "❌" : "⚠️"} ${f.msg}`);
    for (const s of c.scenes) if (s.accents > 2) problems.push(`⚠️ ${s.id}: ${s.accents} accents`);
    const words = ep.segments.reduce((n, s) => n + s.say.split(/\s+/).length, 0);
    problems.push(`ℹ️ ${ep.segments.length} مشاهد · ${words} كلمة · ~${tl.total.toFixed(0)}s تقديري · ${[...new Set(c.scenes.map((s) => s.type))].join(",")}`);
    fs.rmSync(out, { recursive: true, force: true });
  } catch (e) { problems.push(`❌ ${e.message}`); }
  const fail = problems.some((p) => p.startsWith("❌") || p.startsWith("EDU ❌"));
  if (fail) bad++;
  console.log(`${fail ? "❌" : "✅"} ${id} ${ep?.term?.en ?? ""}`);
  for (const p of problems) console.log("   " + p);
}
process.exit(bad ? 1 : 0);
