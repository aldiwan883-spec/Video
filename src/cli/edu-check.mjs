// npm run edu-check -- 001 [203 …|--all] → المراجعة التعليمية بس (من غير بناء الفيديو)
import path from "node:path";
import { findEpisodeDir, loadEpisode, loadSeries, listEpisodeDirs } from "../lib/episode.mjs";
import { eduReview } from "../lib/edu-qc.mjs";

let ids = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (process.argv.includes("--all") || !ids.length) ids = listEpisodeDirs().map((d) => path.basename(d).split("-")[0]);
let failed = 0;
for (const id of ids) {
  const ep = loadEpisode(findEpisodeDir(id));
  const r = eduReview(ep, loadSeries(ep));
  console.log(`\n${r.passed ? "✅" : "❌"} ${ep.id} ${ep.term?.en ?? ep.slug} — ${r.score}/${r.max}`);
  for (const c of r.issues) console.log(`   ${c.critical ? "❌" : "⚠️"} ${c.title}\n      → ${c.fix}`);
  if (!r.passed) failed++;
}
process.exit(failed ? 1 : 0);
