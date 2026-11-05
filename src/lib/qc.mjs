// Visual + audio QC. كل finding ليه level: error (بيوقف الريندر) أو warn (لازم تبص عليه).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export function runHyperframesCheck(proj) {
  const r = spawnSync("npx", ["hyperframes", "check", "--json"], { cwd: proj, encoding: "utf8", maxBuffer: 64 << 20 });
  try { return JSON.parse(r.stdout.slice(r.stdout.indexOf("{"))); }
  catch { return { ok: false, raw: ((r.stdout || "") + (r.stderr || "")).slice(-3000) }; }
}

export function loudness(file) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8" });
  const s = r.stderr || "";
  const I = s.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop()?.match(/-?[\d.]+/)[0];
  const TP = s.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop()?.match(/-?[\d.]+/)[0];
  return { lufs: I ? Number(I) : null, truePeak: TP ? Number(TP) : null };
}

// SFX overuse: أكتر من N صوت في أي 10 ثواني، أو نفس الصوت مسيطر
export function sfxReport(composed, series) {
  const out = [], max = series.mix?.maxSfxPer10s ?? 3, s = composed.sfx;
  let worst = 0, at = 0;
  for (const a of s) { const n = s.filter((b) => b.t >= a.t && b.t < a.t + 10).length; if (n > worst) { worst = n; at = a.t; } }
  if (worst > max + 2) out.push({ level: "warn", area: "sfx", msg: `${worst} SFX في 10 ثواني (من ${at.toFixed(1)}s) — الحد ${max}. كتير = template` });
  else if (worst > max) out.push({ level: "info", area: "sfx", msg: `${worst} SFX في 10 ثواني (من ${at.toFixed(1)}s) — فوق الحد ${max} بشوية` });
  const byFile = {};
  for (const x of s) byFile[x.file] = (byFile[x.file] ?? 0) + 1;
  for (const [f, n] of Object.entries(byFile)) if (s.length >= 8 && n / s.length > 0.45) out.push({ level: "warn", area: "sfx", msg: `${f} مستخدم ${n} من ${s.length} مرة — نوّع` });
  const loud = s.filter((x) => x.volume > 0.25);
  if (loud.length) out.push({ level: "warn", area: "sfx", msg: `${loud.length} SFX صوتهم أعلى من 0.25 — ممكن يغطوا على الكلام` });
  return out;
}

// Caption alignment: الكابشن ميتداخلش، ميبقاش أسرع من القراية، ويغطي الكلام
export function captionReport(composed) {
  const out = [], g = composed.captions;
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c.end - c.start < 0.45) out.push({ level: "warn", area: "captions", msg: `كابشن "${c.words.map((w) => w.text).join(" ")}" ظاهر ${(c.end - c.start).toFixed(2)}s بس` });
    if (g[i + 1] && c.end > g[i + 1].start + 0.01) out.push({ level: "error", area: "captions", msg: `كابشن ${i} و${i + 1} متداخلين` });
    if (c.start > c.words[0].start + 0.12 || c.end < c.words.at(-1).end - 0.05) out.push({ level: "warn", area: "captions", msg: `كابشن ${i} مش مغطي وقت الكلام بتاعه` });
  }
  return out;
}

// Missing assets: كل src في المشروع لازم يكون موجود
export function assetReport(proj) {
  const out = [];
  const files = [path.join(proj, "index.html"), ...fs.readdirSync(path.join(proj, "compositions")).map((f) => path.join(proj, "compositions", f))];
  for (const f of files) {
    const html = fs.readFileSync(f, "utf8");
    for (const m of html.matchAll(/(?:src|href)="(assets\/[^"]+|compositions\/[^"]+)"/g))
      if (!fs.existsSync(path.join(proj, m[1]))) out.push({ level: "error", area: "assets", msg: `ملف ناقص: ${m[1]} (في ${path.basename(f)})` });
    for (const m of html.matchAll(/url\('(assets\/[^']+)'\)/g))
      if (!fs.existsSync(path.join(proj, m[1]))) out.push({ level: "error", area: "assets", msg: `ملف ناقص: ${m[1]}` });
  }
  return out;
}

// تكرار التكوين البصري: نفس (نوع/layout/transition) كذا مرة = شكل template
export function compositionReport(composed) {
  const out = [], seen = {};
  composed.scenes.forEach((s, i) => {
    seen[s.sig] = (seen[s.sig] ?? 0) + 1;
    const prev = composed.scenes[i - 1];
    if (prev && prev.type === s.type && prev.v.layout === s.v.layout) out.push({ level: "warn", area: "variety", msg: `${prev.id} و${s.id}: نفس النوع ونفس التكوين ورا بعض` });
  });
  for (const [sig, n] of Object.entries(seen)) if (n > 2) out.push({ level: "warn", area: "variety", msg: `التكوين ${sig} متكرر ${n} مرات` });
  const fams = new Set(composed.scenes.map((s) => s.family));
  if (composed.scenes.length >= 6 && fams.size < 3) out.push({ level: "warn", area: "variety", msg: `كل المشاهد من ${fams.size} عائلات بصرية بس` });
  return out;
}

export function writeReport({ outDir, episode, series, timeline, composed, check, layout, extra, edu, voiceDiag, audio, silent }) {
  const L = [], errors = [], warns = [];
  const add = (f) => { if (f.level === "error") errors.push(f); else if (f.level === "warn") warns.push(f); };
  const icon = (l) => (l === "error" ? "❌" : l === "warn" ? "⚠️" : l === "info" ? "ℹ️" : "✅");
  const [tmin, tmax] = series.targetDuration ?? [60, 75];
  L.push(`# QC — ${episode.id} ${episode.term?.en ?? episode.slug} (${series.name})`, "");
  const durOk = composed.total >= tmin - 5 && composed.total <= tmax + 15;
  L.push(`- المدة: **${composed.total.toFixed(1)}s** (المستهدف ${tmin}–${tmax}) ${durOk ? "✅" : "⚠️"}`);
  if (!durOk) add({ level: "warn", area: "duration", msg: `المدة ${composed.total.toFixed(1)}s برّه ${tmin}–${tmax}` });
  L.push(`- التوقيت: ${timeline.source === "voice" ? "✅ صوتك (alignment)" : "ℹ️ تقديري — preview صامت"}`);
  if (timeline.alignScore != null) {
    const s = Math.round(timeline.alignScore * 100);
    L.push(`- مطابقة السكريبت للتسجيل: ${s}% ${s >= 70 ? "✅" : "⚠️"}`);
    if (s < 70) add({ level: "warn", area: "voice", msg: `مطابقة السكريبت ${s}% — راجع .work/transcript.txt` });
  }
  L.push(`- المراجعة التعليمية: ${edu.passed ? "✅" : "⚠️"} ${edu.score}/${edu.max} (التفاصيل في EDU_QC.md)`);
  if (!edu.passed) add({ level: "warn", area: "education", msg: "السكريبت معدّاش معيار العمق التعليمي — EDU_QC.md" });

  if (voiceDiag) {
    L.push("", "## الصوت الخام (voice diagnostics)");
    for (const f of voiceDiag.findings) { L.push(`- ${icon(f.level)} ${f.msg}`); add({ ...f, area: "voice" }); }
  }

  L.push("", "## المشاهد");
  L.push("| # | النوع | layout | دخول | المدة | الأرضية | accent |", "|---|---|---|---|---|---|---|");
  for (const s of composed.scenes) {
    L.push(`| ${s.id} | ${s.type} | ${s.v.layout} | ${s.v.tIn} | ${s.dur.toFixed(1)}s | ${s.ground} | ${s.accents}${s.accents > 2 ? " ⚠️" : ""} |`);
    if (s.accents > 2) add({ level: "warn", area: "art", msg: `${s.id}: ${s.accents} عناصر accent — العين مش هتعرف تبص فين` });
  }

  const findings = Object.values(check ?? {}).flatMap((v) => (v && Array.isArray(v.findings) ? v.findings : []))
    .filter((f) => f.code !== "composition_file_too_large");
  const hfF = findings.map((f) => ({ level: f.severity === "error" ? "error" : f.severity === "warning" ? "warn" : "info", area: "hyperframes", msg: `\`${f.code}\` ${f.time != null ? `@${Number(f.time).toFixed(1)}s ` : ""}${(f.message ?? "").slice(0, 220)}` }));
  if (check?.raw) hfF.push({ level: "error", area: "hyperframes", msg: `check ماشتغلش: ${check.raw.slice(0, 300)}` });

  const groups = [
    ["Layout: safe zones / overflow / تداخل النص", layout?.findings ?? [{ level: "info", msg: "اتعمل skip (مفيش Chrome)" }]],
    ["HyperFrames check (lint / runtime / contrast / وقت القراية)", hfF],
    ["تنوّع التكوين", compositionReport(composed)],
    ["التوقيت والكابشن والـ SFX والملفات", extra],
  ];
  for (const [title, list] of groups) {
    L.push("", `## ${title}`);
    if (!list.length) L.push("- ✅ مفيش ملاحظات");
    for (const f of list) { L.push(`- ${icon(f.level)} ${f.msg}`); add(f); }
  }
  if (audio) {
    L.push("", "## الصوت النهائي (متقاس، مش متسمع)");
    if (silent) L.push("- ℹ️ preview صامت (SFX بس) — الـ loudness هيتظبط لما صوتك يتضاف");
    else {
      const okL = audio.lufs != null && audio.lufs >= -17 && audio.lufs <= -12;
      L.push(`- Loudness: ${audio.lufs} LUFS (المطلوب -16 لـ -13) ${okL ? "✅" : "⚠️"}`);
      if (!okL) add({ level: "warn", area: "audio", msg: `Loudness ${audio.lufs} LUFS` });
    }
    const tp = audio.truePeak;
    const lvl = tp == null ? "warn" : tp > 0 ? "error" : tp > -1 ? "warn" : "ok";
    L.push(`- True peak: ${tp} dBFS ${icon(lvl)}`);
    if (lvl !== "ok") add({ level: lvl, area: "audio", msg: `True peak ${tp} dBFS — clipping` });
  }
  L.push("", `**النتيجة: ${errors.length ? `❌ ${errors.length} errors` : "✅ مفيش errors"} · ${warns.length} warnings**`);
  fs.writeFileSync(path.join(outDir, "QC.md"), L.join("\n") + "\n");
  return { errors, warns };
}
