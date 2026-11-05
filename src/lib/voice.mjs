// Voice Engine: تشخيص التسجيل → تنظيف (من غير ما نسرّع أو نشيل الوقفات الطبيعية) → loudness على مرحلتين
// → Whisper عربي مع السكريبت كـ prompt → محاذاة السكريبت المتراجع على التسجيل (توقيت كل كلمة).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { tokenize, normalize } from "./text.mjs";
import { round } from "./timing.mjs";

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 256 << 20, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} failed:\n${(r.stderr || "").slice(-2000)}`);
  return r;
};

// ---- 1) تشخيص الصوت الخام
export function diagnose(file) {
  const findings = [];
  const probe = JSON.parse(run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]).stdout);
  const st = probe.streams.find((s) => s.codec_type === "audio");
  const sr = Number(st?.sample_rate), dur = Number(probe.format.duration);
  const stats = run("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "astats=measure_overall=Peak_level+RMS_trough+Peak_count+RMS_level:measure_perchannel=none,ebur128=peak=true", "-f", "null", "-"]).stderr;
  const num = (re) => { const m = stats.match(re); return m ? Number(m[1]) : null; };
  const peak = num(/Peak level dB:\s*(-?[\d.]+|-inf)/), peakCount = num(/Peak count:\s*([\d.]+)/);
  const floor = num(/RMS trough dB:\s*(-?[\d.]+)/), lufs = Number((stats.match(/I:\s+(-?[\d.]+) LUFS/g) ?? []).pop()?.match(/-?[\d.]+/)?.[0]);
  const d = { sampleRate: sr, channels: st?.channels, duration: dur, peakDb: peak, peakCount, noiseFloorDb: floor, lufs };
  findings.push({ level: "ok", msg: `${(sr / 1000).toFixed(1)} kHz · ${st?.channels === 1 ? "mono" : `${st?.channels} ch`} · ${dur.toFixed(1)}s · ${lufs} LUFS · peak ${peak} dBFS · noise floor ${floor} dB` });
  if (sr < 44100) findings.push({ level: "warn", msg: `الـ sample rate ${sr} Hz — سجّل بـ 44.1 أو 48 kHz` });
  if (peak != null && peak >= -0.1 && (peakCount ?? 0) > 4) findings.push({ level: "error", msg: `Clipping: الصوت وصل لـ 0 dBFS ${peakCount} مرة — الأجزاء دي مكسورة ومينفعش تتصلّح. سجّل تاني وبعّد عن المايك أو وطّي الـ gain` });
  else if (peak != null && peak > -1) findings.push({ level: "warn", msg: `الصوت قريب أوي من الـ clipping (peak ${peak} dBFS)` });
  if (floor != null && floor > -40) findings.push({ level: "warn", msg: `دوشة الخلفية عالية (${floor} dB) — جرّب أوضة أهدى أو مايك أقرب` });
  else if (floor != null && floor > -50) findings.push({ level: "info", msg: `فيه دوشة خلفية خفيفة (${floor} dB) — التنظيف هيقللها` });
  if (lufs && lufs < -35) findings.push({ level: "warn", msg: `التسجيل واطي جداً (${lufs} LUFS) — هيتعلّى بس الدوشة هتعلى معاه` });
  return { ...d, findings };
}

// ---- 2) تنظيف + loudness على مرحلتين (قياس ثم ضبط دقيق)
function clean(voice, out, mix) {
  const keep = mix?.keepPause ?? 0.45;
  const pre = ["highpass=f=80", "afftdn=nf=-25",
    `silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05:stop_periods=-1:stop_duration=${Math.max(0.7, keep + 0.25)}:stop_threshold=-45dB:stop_silence=${keep}`,
    "adelay=300:all=1"].join(",");
  const target = mix?.voiceLufs ?? -16;
  const m = run("ffmpeg", ["-hide_banner", "-i", voice, "-af", `${pre},loudnorm=I=${target}:TP=-1.5:LRA=11:print_format=json`, "-f", "null", "-"]).stderr;
  const j = JSON.parse(m.slice(m.lastIndexOf("{"), m.lastIndexOf("}") + 1));
  run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", voice, "-af",
    `${pre},loudnorm=I=${target}:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`,
    "-ar", "48000", "-ac", "1", out]);
}

// ---- 3) Whisper: whisper.cpp مباشرة مع السكريبت كـ prompt (دقة أعلى في المصطلحات والأرقام)، وإلا hyperframes transcribe
function transcribe(cleanWav, work, episode, log) {
  const model = process.env.FB_WHISPER_MODEL || "medium";
  const base = path.join(os.homedir(), ".cache/hyperframes/whisper");
  const bin = path.join(base, "whisper.cpp/build/bin/whisper-cli");
  const modelFile = path.join(base, "models", `ggml-${model}.bin`);
  if (fs.existsSync(bin) && fs.existsSync(modelFile)) {
    const terms = [...new Set(episode.segments.flatMap((s) => s.say.match(/[A-Za-z][A-Za-z-]+/g) ?? []))].join(", ");
    const prompt = `${terms}. ${tokenize(episode.segments.map((s) => s.say).join(" ")).slice(0, 70).join(" ")}`;
    log?.(`  Whisper ${model} (whisper.cpp + prompt من السكريبت)…`);
    const wav16 = path.join(work, "voice.16k.wav");
    run("ffmpeg", ["-y", "-loglevel", "error", "-i", cleanWav, "-ar", "16000", "-ac", "1", wav16]);
    run(bin, ["-m", modelFile, "-f", wav16, "-l", "ar", "-ml", "1", "-sow", "-oj", "-of", path.join(work, "whisper"), "--prompt", prompt, "-t", String(Math.max(2, os.cpus().length - 1))], { timeout: 30 * 60 * 1000 });
    const j = JSON.parse(fs.readFileSync(path.join(work, "whisper.json"), "utf8"));
    return j.transcription.map((t) => ({ text: t.text.trim(), start: t.offsets.from / 1000, end: t.offsets.to / 1000 })).filter((w) => normalize(w.text).length);
  }
  log?.(`  Whisper ${model} (hyperframes transcribe — أول مرة بيبني whisper.cpp وينزّل الموديل)…`);
  const r = run("npx", ["hyperframes", "transcribe", cleanWav, "--model", model, "--language", "ar", "--json", "--dir", work], { cwd: work, timeout: 60 * 60 * 1000 });
  const out = r.stdout;
  const tjson = JSON.parse(out.slice(out.indexOf("{")));
  const raw = tjson.words ?? JSON.parse(fs.readFileSync(tjson.transcriptPath ?? tjson.path ?? path.join(work, "assets/transcript.json"), "utf8"));
  return (Array.isArray(raw) ? raw : raw.words).filter((w) => normalize(w.text).length);
}

export async function prepareVoice({ epDir, episode, series, voice, log = console.log }) {
  const work = path.join(epDir, ".work");
  fs.mkdirSync(work, { recursive: true });
  const hash = crypto.createHash("sha1").update(fs.readFileSync(voice)).update(JSON.stringify(episode.segments.map((s) => s.say)))
    .update(JSON.stringify(series?.mix ?? {})).update(process.env.FB_WHISPER_MODEL || "medium").digest("hex").slice(0, 12);
  const cleanWav = path.join(work, "voice.clean.wav");
  const alignPath = path.join(work, "alignment.json");
  const diagPath = path.join(work, "diagnostics.json");
  const stamp = path.join(work, "stamp.txt");
  if (fs.existsSync(stamp) && fs.readFileSync(stamp, "utf8") === hash && fs.existsSync(alignPath) && fs.existsSync(diagPath)) {
    log("  (الصوت متجهز قبل كده — مفيش تغيير في voice.wav أو السكريبت)");
    return { clean: cleanWav, diag: JSON.parse(fs.readFileSync(diagPath, "utf8")) };
  }
  log("  تشخيص التسجيل…");
  const diag = diagnose(voice);
  for (const f of diag.findings) log(`   ${f.level === "error" ? "❌" : f.level === "warn" ? "⚠️" : "·"} ${f.msg}`);
  log("  تنظيف: noise + السكتات الطويلة بس + loudness على مرحلتين…");
  clean(voice, cleanWav, series?.mix);
  const heard = transcribe(cleanWav, work, episode, log);
  fs.writeFileSync(path.join(work, "transcript.txt"), heard.map((w) => w.text).join(" ") + "\n");
  const aligned = align(episode, heard);
  // إيقاع الكلام (معلومة مش حكم — الأسرع مش أحسن)
  const spoken = aligned.segments.flatMap((s) => s.words);
  const speechSecs = spoken.length ? spoken.at(-1).end - spoken[0].start : 1;
  const wps = spoken.length / speechSecs;
  diag.findings.push({ level: "info", msg: `إيقاع الكلام ${wps.toFixed(2)} كلمة/ثانية (${Math.round(wps * 60)}/دقيقة)${wps > 3.3 ? " — سريع: الأفكار التقيلة محتاجة وقفة" : ""}` });
  diag.findings.push({ level: aligned.score >= 0.7 ? "ok" : "warn", msg: `مطابقة السكريبت للتسجيل: ${Math.round(aligned.score * 100)}% (transcript في .work/transcript.txt)` });
  fs.writeFileSync(alignPath, JSON.stringify(aligned, null, 2));
  fs.writeFileSync(diagPath, JSON.stringify(diag, null, 2));
  fs.writeFileSync(stamp, hash);
  log(`  ✓ alignment ${Math.round(aligned.score * 100)}% · ${wps.toFixed(2)} كلمة/ثانية`);
  return { clean: cleanWav, diag };
}

function similarity(a, b) {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - d[a.length][b.length] / Math.max(a.length, b.length);
}

// Needleman–Wunsch: كل كلمة في السكريبت بتاخد وقت أقرب كلمة اتسمعت؛ اللي متسمعتش بتتوزع بين جيرانها.
export function align(episode, heard) {
  const script = [];
  episode.segments.forEach((s, si) => tokenize(s.say).forEach((text) => script.push({ si, text, n: normalize(text) })));
  const Hd = heard.map((w) => ({ ...w, n: normalize(w.text) }));
  const n = script.length, m = Hd.length, GAP = 0.7;
  const cost = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
  const back = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1));
  for (let i = 1; i <= n; i++) { cost[i][0] = i * GAP; back[i][0] = 1; }
  for (let j = 1; j <= m; j++) { cost[0][j] = j * GAP; back[0][j] = 2; }
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const sub = cost[i - 1][j - 1] + (1 - similarity(script[i - 1].n, Hd[j - 1].n)) * 1.2;
    const del = cost[i - 1][j] + GAP, ins = cost[i][j - 1] + GAP;
    if (sub <= del && sub <= ins) { cost[i][j] = sub; back[i][j] = 0; }
    else if (del <= ins) { cost[i][j] = del; back[i][j] = 1; }
    else { cost[i][j] = ins; back[i][j] = 2; }
  }
  let i = n, j = m, exact = 0;
  while (i > 0 || j > 0) {
    const b = back[i][j];
    if (i > 0 && j > 0 && b === 0) {
      const sim = similarity(script[i - 1].n, Hd[j - 1].n);
      if (sim >= 0.34) { script[i - 1].start = Hd[j - 1].start; script[i - 1].end = Hd[j - 1].end; }
      if (sim >= 0.8) exact++;
      i--; j--;
    } else if (i > 0 && (b === 1 || j === 0)) i--;
    else j--;
  }
  for (let k = 0; k < n; k++) {
    if (script[k].start != null) continue;
    let a = k - 1; while (a >= 0 && script[a].start == null) a--;
    let b = k + 1; while (b < n && script[b].start == null) b++;
    const t0 = a >= 0 ? script[a].end : (Hd[0]?.start ?? 0.3);
    const t1 = b < n ? script[b].start : (Hd.at(-1)?.end ?? t0 + 1);
    const span = b - a - 1, pos = k - a;
    script[k].start = t0 + ((t1 - t0) * (pos - 1)) / span;
    script[k].end = t0 + ((t1 - t0) * pos) / span;
  }
  // كلمات ورا بعض لازم تكون مرتبة زمنياً
  for (let k = 1; k < n; k++) if (script[k].start < script[k - 1].start) script[k].start = script[k - 1].end;
  const segments = episode.segments.map((_, si) => ({
    words: script.filter((w) => w.si === si).map((w) => ({ text: w.text, start: round(w.start), end: round(Math.max(w.end, w.start + 0.08)) })),
  }));
  return { score: exact / Math.max(1, n), segments };
}
