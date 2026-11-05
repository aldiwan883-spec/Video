// npm run build:episode -- 001 [203 402 …] [--all] [--silent] [--no-render] [--draft] [--force]
// Content → Edu QC → Voice → Design → Video → Visual QC. كل حلقة بتطلع في output/<id>-<slug>/
//   --silent     يتجاهل voice.wav ويطلع preview صامت بتوقيت تقديري
//   --no-render  كل حاجة ما عدا ملف الـ MP4 (أسرع للمراجعة)
//   --draft      ريندر أسرع بجودة أقل
//   --force      يكمّل الريندر حتى لو الـ QC فيه errors
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, findEpisodeDir, loadEpisode, loadSeries, findVoice, listEpisodeDirs } from "../lib/episode.mjs";
import { buildTimeline } from "../lib/timing.mjs";
import { composeEpisode } from "../lib/compose.mjs";
import { composeCover } from "../lib/cover.mjs";
import { runHyperframesCheck, loudness, writeReport, sfxReport, captionReport, assetReport } from "../lib/qc.mjs";
import { measureLayout } from "../lib/layout-qc.mjs";
import { eduReview } from "../lib/edu-qc.mjs";
import { writeStoryboard } from "../lib/storyboard.mjs";
import { writeScript } from "./script.mjs";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
let ids = args.filter((a) => !a.startsWith("--"));
if (flags.has("--all")) ids = listEpisodeDirs().map((d) => path.basename(d).split("-")[0]);
if (!ids.length) { console.error("استخدام: npm run build:episode -- 001 [203 …] [--all] [--silent] [--no-render] [--draft]"); process.exit(1); }
if (!fs.existsSync(path.join(ROOT, "public/sounds/manifest.json"))) { console.error("شغّل npm run setup الأول عشان مكتبة الأصوات."); process.exit(1); }

const results = [];
for (const id of ids) {
  const t0 = Date.now();
  try { results.push({ id, ...(await buildOne(id)), secs: (Date.now() - t0) / 1000 }); }
  catch (e) { console.error(`\n❌ ${id}: ${e.message}`); results.push({ id, status: "failed", error: e.message, secs: (Date.now() - t0) / 1000 }); }
}
if (ids.length > 1) {
  console.log("\n══ Batch summary ══");
  for (const r of results) console.log(`  ${r.status === "ok" ? "✅" : r.status === "blocked" ? "⛔" : "❌"} ${r.id} ${r.status}${r.errors ? ` (${r.errors} errors, ${r.warns} warnings)` : ""} — ${r.secs.toFixed(0)}s`);
}
process.exit(results.some((r) => r.status !== "ok") ? 2 : 0);

async function buildOne(id) {
  const epDir = findEpisodeDir(id);
  const episode = loadEpisode(epDir);
  const series = loadSeries(episode);
  const outDir = path.join(ROOT, "output", `${episode.id}-${episode.slug}`);
  fs.mkdirSync(outDir, { recursive: true });
  const logLines = [];
  const log = (s) => { console.log(s); logLines.push(s); };
  const flushLog = () => fs.writeFileSync(path.join(outDir, "build.log"), logLines.join("\n") + "\n");
  const hf = (cwd, ...a) => {
    const r = spawnSync("npx", ["hyperframes", ...a], { cwd, encoding: "utf8", maxBuffer: 64 << 20 });
    logLines.push(`$ hyperframes ${a.join(" ")} → exit ${r.status}`);
    if (r.status !== 0) { logLines.push(r.stdout, r.stderr); flushLog(); throw new Error(`hyperframes ${a[0]} failed (شوف build.log)`); }
    return r.stdout;
  };
  const step = (s) => log(`\n▸ [${episode.id}] ${s}`);

  step(`${series.name} — ${episode.term?.en ?? episode.slug}`);
  step("Content: السكريبت + المراجعة التعليمية");
  writeScript(epDir, episode);
  const edu = eduReview(episode, series);
  fs.writeFileSync(path.join(outDir, "EDU_QC.md"), edu.markdown);
  log(`  Edu QC: ${edu.passed ? "✅" : "⚠️"} ${edu.score}/${edu.max} — ${edu.issues.length} ملاحظات`);

  step("Voice + Alignment");
  const voice = flags.has("--silent") ? null : findVoice(epDir);
  const alignment = path.join(epDir, ".work/alignment.json");
  let voiceFile = null, voiceDiag = null;
  if (voice) {
    const { prepareVoice } = await import("../lib/voice.mjs");
    ({ clean: voiceFile, diag: voiceDiag } = await prepareVoice({ epDir, episode, series, voice, log }));
  } else log(flags.has("--silent") ? "  --silent: preview صامت بتوقيت تقديري." : "  مفيش voice.wav — preview صامت بتوقيت تقديري.");
  const timeline = buildTimeline(episode, voiceFile ? alignment : null);
  log(`  التوقيت: ${timeline.source}, المدة ${timeline.total.toFixed(1)}s (المستهدف ${series.targetDuration?.join("–") ?? "60–75"}s)`);

  step("Design + Video: بناء مشروع HyperFrames");
  const composed = composeEpisode({ episode, series, timeline, outDir, voiceFile });
  log(`  ${composed.scenes.length} مشاهد (${[...new Set(composed.scenes.map((s) => s.type))].join(", ")})، ${composed.captions.length} كابشن، ${composed.sfx.length} SFX`);

  step("Cover");
  const coverProj = composeCover({ episode, series, outDir });
  fs.rmSync(path.join(outDir, ".cover"), { recursive: true, force: true });
  hf(coverProj, "snapshot", "--at", "0", "--no-end", "--keep", "-o", path.join(outDir, ".cover"));
  const coverShot = fs.readdirSync(path.join(outDir, ".cover")).find((f) => f.endsWith(".png"));
  fs.copyFileSync(path.join(outDir, ".cover", coverShot), path.join(outDir, "cover.png"));

  step("Visual QC");
  const check = runHyperframesCheck(composed.proj);
  fs.writeFileSync(path.join(outDir, ".check.json"), JSON.stringify(check, null, 2));
  const layout = await measureLayout(composed.proj, composed);
  const extra = [...sfxReport(composed, series), ...captionReport(composed), ...assetReport(composed.proj), ...composed.notes.map((n) => ({ level: n.level, area: "timing", msg: n.msg }))];
  let qc = writeReport({ outDir, episode, series, timeline, composed, check, layout, extra, edu, voiceDiag, audio: null });
  log(`  QC: ${qc.errors.length} errors, ${qc.warns.length} warnings`);

  step("Storyboard preview");
  hf(composed.proj, "snapshot", "--review", "-o", path.join(outDir, "review"));
  await writeStoryboard({ outDir, composed, episode, series, timeline, hf });
  log("  ✓ storyboard.md + storyboard.jpg");

  const tags = [series.hashtag, ...(episode.post?.hashtags ?? []), ...(series.hashtags ?? [])].filter(Boolean).join(" ");
  fs.writeFileSync(path.join(outDir, "caption.txt"),
    `${episode.post?.caption ?? ""}\n\n${tags}\n\n---\nأول كومنت (الإجابة):\n${episode.post?.first_comment ?? ""}\n`);

  if (qc.errors.length && !flags.has("--force")) {
    log(`\n⛔ QC وقف الريندر (${qc.errors.length} errors) — شوف ${path.relative(ROOT, outDir)}/QC.md`);
    flushLog();
    return { status: "blocked", errors: qc.errors.length, warns: qc.warns.length };
  }
  if (!flags.has("--no-render")) {
    step("Render");
    const video = path.join(outDir, `${episode.id}-${episode.slug}.mp4`);
    hf(composed.proj, "render", "-q", flags.has("--draft") ? "draft" : "delivery", "-o", video);
    const audio = loudness(video);
    qc = writeReport({ outDir, episode, series, timeline, composed, check, layout, extra, edu, voiceDiag, audio, silent: !voiceFile });
    log(`  ✓ ${path.basename(video)} — ${audio.lufs ?? "?"} LUFS, peak ${audio.truePeak ?? "?"} dBFS`);
  }
  log(`\n✅ ${path.relative(ROOT, outDir)}/ — ${fs.readdirSync(outDir).filter((f) => !f.startsWith(".")).join(", ")}`);
  flushLog();
  return { status: "ok", errors: qc.errors.length, warns: qc.warns.length };
}
