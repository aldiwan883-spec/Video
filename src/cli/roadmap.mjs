// npm run roadmap → يبني ROADMAP.md و RATINGS.md و PUBLISHING_ORDER.md من docs/roadmap/data/S*.json
// ويتأكد إن مفيش prerequisite دايري ولا مفقود.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const D = path.join(ROOT, "docs/roadmap");
const SERIES = { 1: "قاموس المستثمر", 2: "إزاي تبقى أحمد طارق في نفسك؟", 3: "إزاي تكسب ثقة الشاركس؟", 4: "فك شفرة البيزنس", 5: "من فكرة لشركة" };
const all = [1, 2, 3, 4, 5].flatMap((n) => JSON.parse(fs.readFileSync(path.join(D, `data/S${n}.json`), "utf8")).map((e) => ({ ...e, sn: n })));
const byId = Object.fromEntries(all.map((e) => [e.id, e]));
const esc = (s) => String(s ?? "").replace(/\|/g, "/").replace(/\n/g, " ");
const r = (e) => e.ratings;
// Composite: القيمة التعليمية أهم حاجة، وبعدها العملي والأصالة والإمكانية البصرية
const score = (e) => +(r(e).educational * 0.35 + r(e).practical * 0.25 + r(e).originality * 0.2 + r(e).visual * 0.2).toFixed(2);

// ---- cycles + topological publishing order (round-robin بين السلاسل، مع احترام المتطلبات)
const errors = [];
for (const e of all) for (const p of e.prerequisites) if (!byId[p]) errors.push(`${e.id}: prerequisite ${p} مش موجود`);
const state = {};
const visit = (id, stack) => {
  if (state[id] === 2) return;
  if (state[id] === 1) { errors.push(`دايرة: ${[...stack, id].join(" → ")}`); return; }
  state[id] = 1; for (const p of byId[id].prerequisites) if (byId[p]) visit(p, [...stack, id]); state[id] = 2;
};
all.forEach((e) => visit(e.id, []));
const pinned = ["S1-01", "S1-02", "S5-01", "S1-04", "S4-01", "S2-02", "S1-03", "S5-02", "S2-03", "S4-02", "S1-14", "S3-01", "S3-07", "S2-04", "S1-06"];
const done = new Set(), order = [];
const ready = (e) => !done.has(e.id) && e.prerequisites.every((p) => done.has(p));
for (const id of pinned) { const e = byId[id]; if (ready(e)) { done.add(id); order.push({ e, note: "" }); } else { const miss = e.prerequisites.filter((p) => !done.has(p)); order.push({ e, note: `⚠️ قبل متطلباته: ${miss.join(", ")}` }); done.add(id); } }
let last = 0, guard = 0;
while (done.size < all.length && guard++ < 500) {
  let picked = null;
  for (let k = 1; k <= 5 && !picked; k++) { const sn = ((last + k - 1) % 5) + 1; picked = all.filter((e) => e.sn === sn).find(ready); }
  if (!picked) picked = all.find(ready);
  if (!picked) { errors.push("مفيش حلقة جاهزة — فيه متطلبات مستحيلة"); break; }
  done.add(picked.id); order.push({ e: picked, note: "" }); last = picked.sn;
}

// ---- ROADMAP.md
const L = ["# Roadmap — 100 حلقة", "", "> متولّد من `docs/roadmap/data/S*.json` بالأمر `npm run roadmap`. متعدّلش هنا، عدّل الـ JSON.", "",
  `- ${all.length} حلقة · ${all.filter((e) => e.pilot).length} pilots (★) · الترتيب والمتطلبات: \`docs/strategy/CONCEPT_MAP.md\``,
  `- ${errors.length ? `❌ ${errors.length} مشاكل في المتطلبات: ${errors.join(" · ")}` : "✅ كل المتطلبات موجودة ومفيش دواير"}`, ""];
for (let n = 1; n <= 5; n++) {
  const list = all.filter((e) => e.sn === n);
  L.push(`## S${n} — ${SERIES[n]}`, "", "| ID | العنوان | Hook | الهدف | Format | ⭐ |", "|---|---|---|---|---|---|");
  for (const e of list) L.push(`| ${e.pilot ? "★ " : ""}${e.id} | **${esc(e.title)}**<br><sub>${esc(e.title_en)}</sub> | ${esc(e.hook)} | ${esc(e.objective)} | ${e.format.join(" → ")} | ${score(e)} |`);
  L.push("");
  for (const e of list) {
    L.push(`### ${e.pilot ? "★ " : ""}${e.id} · ${e.title}`, "",
      `- **Hook:** ${e.hook}`, `- **الهدف التعليمي:** ${e.objective}`,
      `- **المفاهيم:** ${e.key_concepts.join("، ")} · **Domains:** ${(e.domains ?? []).join(", ")} · **Level:** ${e.level}`,
      ...(e.supporting_insights?.length ? [`- **أفكار داعمة:** ${e.supporting_insights.join(" · ")}`] : []),
      `- **الحالة العملية:** ${e.case}`, `- **الفكرة غير الواضحة:** ${e.non_obvious_insight}`,
      `- **المتطلبات:** ${e.prerequisites.length ? e.prerequisites.join(", ") : "—"}`, `- **Format:** ${e.format.join(" → ")}`,
      `- **سؤال الختام:** ${e.closing_question}`, `- **البحث المطلوب:** ${e.research}`,
      `- **التقييم:** تعليمي ${r(e).educational} · عملي ${r(e).practical} · أصالة ${r(e).originality} · صعوبة البحث ${r(e).research_difficulty} · بصري ${r(e).visual}`, "");
  }
}
fs.writeFileSync(path.join(D, "ROADMAP.md"), L.join("\n") + "\n");

// ---- RATINGS.md
const R = ["# Ratings — كل الحلقات", "", "Composite = تعليمي×0.35 + عملي×0.25 + أصالة×0.2 + بصري×0.2 (صعوبة البحث مش داخلة في السكور، بتحدد الجهد بس).", "",
  "| ID | العنوان | تعليمي | عملي | أصالة | صعوبة بحث | بصري | Composite |", "|---|---|---|---|---|---|---|---|"];
for (const e of [...all].sort((a, b) => score(b) - score(a))) R.push(`| ${e.id} | ${esc(e.title)} | ${r(e).educational} | ${r(e).practical} | ${r(e).originality} | ${r(e).research_difficulty} | ${r(e).visual} | **${score(e)}** |`);
const avg = (k) => (all.reduce((s, e) => s + r(e)[k], 0) / all.length).toFixed(2);
R.push("", `المتوسطات: تعليمي ${avg("educational")} · عملي ${avg("practical")} · أصالة ${avg("originality")} · صعوبة ${avg("research_difficulty")} · بصري ${avg("visual")}`);
const dom = {};
for (const e of all) for (const d of e.domains ?? []) dom[d] = (dom[d] ?? 0) + 1;
R.push("", "## تغطية المجالات", "", "| Domain | عدد الحلقات |", "|---|---|", ...Object.entries(dom).sort((a, b) => b[1] - a[1]).map(([d, n]) => `| ${d} | ${n} |`));
fs.writeFileSync(path.join(D, "RATINGS.md"), R.join("\n") + "\n");

// ---- PUBLISHING_ORDER.md
const P = ["# ترتيب النشر المقترح", "", "أول 15 حلقة مثبتة يدوياً (CONCEPT_MAP §5)، والباقي متولّد: بالتبادل بين السلاسل، ومفيش حلقة قبل متطلباتها.", "",
  "| # | ID | السلسلة | العنوان | ملاحظة |", "|---|---|---|---|---|",
  ...order.map((o, i) => `| ${i + 1} | ${o.e.pilot ? "★ " : ""}${o.e.id} | ${SERIES[o.e.sn]} | ${esc(o.e.title)} | ${o.note} |`)];
fs.writeFileSync(path.join(D, "PUBLISHING_ORDER.md"), P.join("\n") + "\n");
console.log(`✓ ROADMAP.md, RATINGS.md, PUBLISHING_ORDER.md — ${all.length} حلقة، ${errors.length} مشاكل`);
for (const x of errors) console.log("  ❌", x);
console.log("Top 15 by composite:", [...all].sort((a, b) => score(b) - score(a)).slice(0, 15).map((e) => `${e.id}(${score(e)})`).join(" "));
const warnPinned = order.filter((o) => o.note);
if (warnPinned.length) console.log("Pinned order warnings:", warnPinned.map((o) => `${o.e.id} ${o.note}`).join(" | "));
