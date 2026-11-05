// npm run index → EPISODES.md: فهرس الـ 100 حلقة (جاهزة؟ السكريبت فين؟ محتاجة مراجعة أرقام؟)
import fs from "node:fs";
import path from "node:path";
import { ROOT, listEpisodeDirs, loadEpisode, loadSeries } from "../lib/episode.mjs";
import { eduReview } from "../lib/edu-qc.mjs";
import { writeScript } from "./script.mjs";

const NAMES = { dictionary: "قاموس المستثمر", "investor-mind": "فكّر زي المستثمر", trust: "إزاي تكسب ثقة الشاركس؟", decode: "فك شفرة البيزنس", "idea-to-company": "من فكرة لشركة" };
const road = [1, 2, 3, 4, 5].flatMap((n) => JSON.parse(fs.readFileSync(path.join(ROOT, `docs/roadmap/data/S${n}.json`), "utf8")));
const eps = Object.fromEntries(listEpisodeDirs().map((d) => { const e = loadEpisode(d); return [e.roadmap ?? e.id, { e, dir: d }]; }));
const order = fs.readFileSync(path.join(ROOT, "docs/roadmap/PUBLISHING_ORDER.md"), "utf8").match(/\| \d+ \| (?:★ )?(S\d-\d\d)/g)?.map((m) => m.match(/S\d-\d\d/)[0]) ?? [];
let ready = 0, verify = 0;
const rows = road.map((r) => {
  const x = eps[r.id];
  if (!x) return { r, line: `| ${r.id} | ${r.title} | — | ❌ مش مكتوبة | | |` };
  writeScript(x.dir, x.e);
  const q = eduReview(x.e, loadSeries(x.e));
  const words = x.e.segments.reduce((n, s) => n + s.say.split(/\s+/).length, 0);
  const v = x.e.edu?.verify?.length ?? 0;
  if (q.passed) ready++;
  if (v) verify++;
  const rel = path.relative(ROOT, x.dir);
  return { r, line: `| ${r.id} | ${r.title} | [\`${path.basename(x.dir)}\`](${rel}/script.md) | ${q.passed ? "✅ جاهزة" : `⚠️ ${q.score}/${q.max}`} | ${words} | ${v ? `⚠️ ${v}` : ""} |` };
});
const L = ["# الـ 100 حلقة", "", `> متولّد بـ \`npm run index\`. **${ready}/100 جاهزة للتسجيل** · ${verify} حلقة فيها أرقام لازم تتراجع يوم التسجيل (العمود ⚠️ — التفاصيل في آخر \`script.md\`).`, "",
  "**إزاي تسجّل أي حلقة:** افتح `script.md` → سجّل → حط `voice.wav` في نفس الفولدر → `npm run build:episode -- <رقم الفولدر>`.", ""];
for (const [slug, name] of Object.entries(NAMES)) {
  L.push(`## ${name}`, "", "| ID | العنوان | السكريبت | الحالة | كلمات | راجع قبل التسجيل |", "|---|---|---|---|---|---|");
  for (const x of rows.filter((x) => x.r.series === slug)) L.push(x.line);
  L.push("");
}
L.push("## ترتيب النشر المقترح", "", order.map((id, i) => `${i + 1}. ${id}${eps[id] ? ` → \`${path.basename(eps[id].dir)}\`` : ""}`).join("\n"), "");
fs.writeFileSync(path.join(ROOT, "EPISODES.md"), L.join("\n"));
console.log(`✓ EPISODES.md — ${ready}/100 جاهزة، ${Object.keys(eps).length} مكتوبة`);
