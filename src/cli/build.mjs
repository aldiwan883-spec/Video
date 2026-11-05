// npm run build:episode -- 001 [--no-render] [--draft]
// Content → Audio → Design → Video → QC. كل حاجة بتطلع في output/<id>/
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, findEpisodeDir, loadEpisode, loadSeries, findVoice } from "../lib/episode.mjs";
import { buildTimeline } from "../lib/timing.mjs";
import { composeEpisode } from "../lib/compose.mjs";
import { composeCover } from "../lib/cover.mjs";
import { runHyperframesCheck, samenessReport, loudness, writeReport } from "../lib/qc.mjs";
import { writeScript } from "./script.mjs";

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith("--"));
const noRender = args.includes("--no-render");
const draft = args.includes("--draft");
const force = args.includes("--force");

const step = (s) => console.log(`\n▸ ${s}`);
const hf = (cwd, ...a) => {
  const r = spawnSync("npx", ["hyperframes", ...a], { cwd, encoding: "utf8", maxBuffer: 64 << 20 });
  if (r.status !== 0) { console.error(r.stdout, r.stderr); throw new Error(`hyperframes ${a[0]} failed`); }
  return r.stdout;
};

if (!fs.existsSync(path.join(ROOT, "public/sounds/manifest.json"))) {
  console.error("شغّل npm run setup الأول عشان مكتبة الأصوات."); process.exit(1);
}

const epDir = findEpisodeDir(id);
const episode = loadEpisode(epDir);
const series = loadSeries();
const outDir = path.join(ROOT, "output", `${episode.id}-${episode.slug}`);
fs.mkdirSync(outDir, { recursive: true });

step("Content: السكريبت");
writeScript(epDir, episode);

step("Voice + Alignment");
const voice = findVoice(epDir);
const alignment = path.join(epDir, ".work/alignment.json");
let voiceFile = null;
if (voice) {
  const { prepareVoice } = await import("../lib/voice.mjs");
  voiceFile = await prepareVoice({ epDir, episode, voice });
} else {
  console.log("  مفيش voice.wav — هنستخدم توقيت تقديري (preview بس).");
}
const timeline = buildTimeline(episode, voiceFile ? alignment : null);
console.log(`  التوقيت: ${timeline.source}, المدة ${timeline.total.toFixed(1)}s`);

step("Design + Video: بناء مشروع HyperFrames");
const composed = composeEpisode({ episode, series, timeline, outDir, voiceFile });
console.log(`  ${composed.scenes.length} مشاهد، ${composed.captions.length} كابشن، ${composed.cues.length} sound effects`);

step("Cover");
const coverProj = composeCover({ episode, series, outDir });
hf(coverProj, "snapshot", "--at", "0", "--no-end", "--keep", "-o", path.join(outDir, ".cover"));
const coverShot = fs.readdirSync(path.join(outDir, ".cover")).find((f) => f.endsWith(".png"));
fs.copyFileSync(path.join(outDir, ".cover", coverShot), path.join(outDir, "cover.png"));
console.log("  ✓ cover.png");

step("QC");
const check = runHyperframesCheck(composed.proj);
fs.writeFileSync(path.join(outDir, ".check.json"), JSON.stringify(check, null, 2));
const sameness = samenessReport(episode);

let audio = null, video = null;
let qc = writeReport({ outDir, episode, timeline, composed, check, sameness, audio });
if (qc.errors.length && !force) {
  console.error(`\n❌ QC وقف الريندر (${qc.errors.length} errors) — شوف ${path.relative(ROOT, outDir)}/QC.md`);
  process.exit(2);
}

step("Snapshots للمراجعة");
hf(composed.proj, "snapshot", "--review", "-o", path.join(outDir, "review"));

if (!noRender) {
  step("Render");
  video = path.join(outDir, `${episode.id}-${episode.slug}.mp4`);
  hf(composed.proj, "render", "-q", draft ? "draft" : "delivery", "-o", video);
  audio = loudness(video);
  qc = writeReport({ outDir, episode, timeline, composed, check, sameness, audio });
}

step("Post: الكابشن والهاشتاجات");
const tags = [series.hashtag, ...(episode.post?.hashtags ?? []), ...series.hashtags].join(" ");
fs.writeFileSync(path.join(outDir, "caption.txt"),
  `${episode.post?.caption ?? ""}\n\n${tags}\n\n---\nأول كومنت:\n${episode.post?.first_comment ?? ""}\n`);

console.log(`\n✅ خلصت: ${path.relative(ROOT, outDir)}/`);
for (const f of fs.readdirSync(outDir)) if (!f.startsWith(".")) console.log("   -", f);
if (qc.warns.length) console.log(`   ⚠️ ${qc.warns.length} warnings في QC.md`);
