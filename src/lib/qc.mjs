// Quality Control: بيقيس قبل ما نعتمد الفيديو. أي ERROR يوقف الريندر.
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "../..");

export function runHyperframesCheck(proj) {
  const r = spawnSync("npx", ["hyperframes", "check", "--json"], { cwd: proj, encoding: "utf8", maxBuffer: 64 << 20 });
  try {
    const start = r.stdout.indexOf("{");
    return JSON.parse(r.stdout.slice(start));
  } catch {
    return { ok: false, raw: (r.stdout || "") + (r.stderr || "") };
  }
}

// الإخراج لازم يتغيّر من حلقة للتانية: بنقارن ترتيب المشاهد بآخر 3 حلقات
export function samenessReport(episode) {
  const dir = path.join(ROOT, "episodes");
  const seq = episode.segments.map((s) => s.scene.type);
  const others = fs.readdirSync(dir).filter((d) => d !== `${episode.id}-${episode.slug}` && fs.existsSync(path.join(dir, d, "episode.json")))
    .map((d) => JSON.parse(fs.readFileSync(path.join(dir, d, "episode.json"), "utf8")))
    .filter((e) => e.number < episode.number).sort((a, b) => b.number - a.number).slice(0, 3);
  const out = [];
  for (const o of others) {
    const os = o.segments.map((s) => s.scene.type);
    const sim = lcs(seq, os) / Math.max(seq.length, os.length);
    const level = seq.join() === os.join() ? "ERROR" : sim > 0.75 ? "WARN" : "OK";
    out.push({ level, msg: `ترتيب المشاهد شبه الحلقة ${o.id} بنسبة ${Math.round(sim * 100)}%` });
  }
  for (let i = 1; i < seq.length; i++)
    if (seq[i] === seq[i - 1]) out.push({ level: "WARN", msg: `مشهدين ورا بعض من نفس النوع (${seq[i]}) — الإيقاع هيبقى ممل` });
  return out;
}

function lcs(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length];
}

export function loudness(file) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8" });
  const s = r.stderr;
  const I = s.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop()?.match(/-?[\d.]+/)[0];
  const TP = s.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop()?.match(/-?[\d.]+/)[0];
  return { lufs: I ? Number(I) : null, truePeak: TP ? Number(TP) : null };
}

export function writeReport({ outDir, episode, timeline, composed, check, sameness, audio }) {
  const L = [];
  const errors = [], warns = [];
  L.push(`# QC — الحلقة ${episode.id} (${episode.term.en})`, "");
  L.push(`- المدة: **${composed.total.toFixed(1)} ثانية** — ${composed.total >= 20 && composed.total <= 60 ? "✅" : "⚠️ برّه المدى المثالي 20–60"}`);
  L.push(`- مصدر التوقيت: ${timeline.source === "voice" ? "✅ صوتك الحقيقي (alignment)" : "⚠️ تقدير (لسه مفيش تسجيل صوت)"}`);
  if (timeline.alignScore != null) {
    const s = Math.round(timeline.alignScore * 100);
    L.push(`- مطابقة السكريبت للتسجيل: ${s}% ${s >= 75 ? "✅" : "⚠️ راجع episodes/<id>/.work/transcript.txt — يمكن قلت كلام مختلف عن السكريبت أو Whisper غلط"}`);
    if (s < 75) warns.push(`مطابقة السكريبت ${s}%`);
  }
  L.push(`- عدد المشاهد: ${composed.scenes.length} — ${[...new Set(composed.scenes.map((s) => s.type))].length} أنواع مختلفة`);
  L.push(`- عدد الـ SFX: ${composed.cues.length}`, "");
  L.push("## Art Direction");
  for (const s of composed.scenes) {
    const ok = s.accents <= 2;
    if (!ok) warns.push(`${s.id}: ${s.accents} عناصر accent`);
    L.push(`- ${s.id} \`${s.type}\` (${s.dur.toFixed(1)}s, ${s.ground}) — accent: ${s.accents} ${ok ? "✅" : "⚠️ كتير — العين مش هتعرف تبص فين"}`);
  }
  L.push("", "## Variety (مقارنة بالحلقات اللي قبل)");
  if (!sameness.length) L.push("- مفيش حلقات قبلها للمقارنة.");
  for (const s of sameness) { L.push(`- ${s.level === "OK" ? "✅" : s.level === "WARN" ? "⚠️" : "❌"} ${s.msg}`); if (s.level === "ERROR") errors.push(s.msg); if (s.level === "WARN") warns.push(s.msg); }
  L.push("", "## HyperFrames check (layout / overlap / contrast / timing)");
  const findings = Object.values(check).flatMap((v) => (v && Array.isArray(v.findings) ? v.findings : []))
    .filter((f) => f.code !== "composition_file_too_large");
  const errs = findings.filter((f) => f.severity === "error");
  const ws = findings.filter((f) => f.severity === "warning");
  L.push(`- errors: ${errs.length}, warnings: ${ws.length}`);
  for (const f of [...errs, ...ws]) L.push(`  - [${f.severity}] \`${f.code ?? f.rule}\` ${f.message ?? ""}`.slice(0, 400));
  errs.forEach((f) => errors.push(`${f.code}: ${f.message}`));
  if (audio) {
    L.push("", "## الصوت (متقاس، مش متسمع)");
    L.push(`- Loudness: ${audio.lufs} LUFS (المطلوب -16 لـ -13) ${audio.lufs != null && audio.lufs >= -17 && audio.lufs <= -12 ? "✅" : "⚠️"}`);
    L.push(`- True peak: ${audio.truePeak} dBFS ${audio.truePeak != null && audio.truePeak <= -1 ? "✅" : "⚠️"}`);
  }
  L.push("", `**النتيجة: ${errors.length ? `❌ ${errors.length} errors` : "✅ عدّى"}${warns.length ? ` — ${warns.length} warnings` : ""}**`);
  fs.writeFileSync(path.join(outDir, "QC.md"), L.join("\n") + "\n");
  return { errors, warns };
}
