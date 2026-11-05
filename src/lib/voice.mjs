// Voice Engine: تنظيف صوتك + Whisper + محاذاة السكريبت المتراجع على التسجيل (توقيت كل كلمة).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { tokenize, normalize } from "./text.mjs";
import { round } from "./timing.mjs";

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 256 << 20, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} failed:\n${(r.stderr || "").slice(-2000)}`);
  return r.stdout;
};

export async function prepareVoice({ epDir, episode, voice }) {
  const work = path.join(epDir, ".work");
  fs.mkdirSync(work, { recursive: true });
  const hash = crypto.createHash("sha1").update(fs.readFileSync(voice)).update(JSON.stringify(episode.segments.map((s) => s.say))).digest("hex").slice(0, 12);
  const clean = path.join(work, "voice.clean.wav");
  const alignPath = path.join(work, "alignment.json");
  const stamp = path.join(work, "stamp.txt");
  if (fs.existsSync(stamp) && fs.readFileSync(stamp, "utf8") === hash && fs.existsSync(alignPath)) {
    console.log("  (الصوت متجهز قبل كده — مفيش تغيير)");
    return clean;
  }

  // 1) تنظيف: شيل الهمهمة والـ noise، قصّر السكتات الطويلة بس (الوقفات الطبيعية تفضل)، وظبط الـ loudness
  console.log("  تنظيف الصوت…");
  run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", voice, "-af", [
    "highpass=f=80",
    "afftdn=nf=-25",
    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05:stop_periods=-1:stop_duration=0.7:stop_threshold=-45dB:stop_silence=0.45",
    "adelay=300:all=1",
    "loudnorm=I=-15:TP=-1.5:LRA=11",
  ].join(","), "-ar", "48000", "-ac", "1", clean]);

  // 2) Whisper (محلي) — عربي
  const model = process.env.FB_WHISPER_MODEL || "medium";
  console.log(`  Whisper (${model})… أول مرة بينزّل الموديل`);
  const out = run("npx", ["hyperframes", "transcribe", clean, "--model", model, "--language", "ar", "--json", "--dir", work], { cwd: work });
  const tjson = JSON.parse(out.slice(out.indexOf("{")));
  const tPath = tjson.transcriptPath ?? tjson.path ?? path.join(work, "assets/transcript.json");
  const raw = tjson.words ?? JSON.parse(fs.readFileSync(tPath, "utf8"));
  const heard = (Array.isArray(raw) ? raw : raw.words).filter((w) => normalize(w.text).length);
  fs.writeFileSync(path.join(work, "transcript.txt"), heard.map((w) => w.text).join(" ") + "\n");

  // 3) محاذاة: السكريبت (اللي انت راجعته) ↔ الكلام اللي اتسمع
  const aligned = align(episode, heard);
  fs.writeFileSync(alignPath, JSON.stringify(aligned, null, 2));
  fs.writeFileSync(stamp, hash);
  console.log(`  ✓ alignment: ${Math.round(aligned.score * 100)}% من كلمات السكريبت اتسمعت زي ما هي`);
  return clean;
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
  const H = heard.map((w) => ({ ...w, n: normalize(w.text) }));
  const n = script.length, m = H.length, GAP = 0.7;
  const cost = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
  const back = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1));
  for (let i = 1; i <= n; i++) { cost[i][0] = i * GAP; back[i][0] = 1; }
  for (let j = 1; j <= m; j++) { cost[0][j] = j * GAP; back[0][j] = 2; }
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const sub = cost[i - 1][j - 1] + (1 - similarity(script[i - 1].n, H[j - 1].n)) * 1.2;
    const del = cost[i - 1][j] + GAP, ins = cost[i][j - 1] + GAP;
    if (sub <= del && sub <= ins) { cost[i][j] = sub; back[i][j] = 0; }
    else if (del <= ins) { cost[i][j] = del; back[i][j] = 1; }
    else { cost[i][j] = ins; back[i][j] = 2; }
  }
  let i = n, j = m, exact = 0;
  while (i > 0 || j > 0) {
    const b = back[i][j];
    if (i > 0 && j > 0 && b === 0) {
      const sim = similarity(script[i - 1].n, H[j - 1].n);
      if (sim >= 0.34) { script[i - 1].start = H[j - 1].start; script[i - 1].end = H[j - 1].end; }
      if (sim >= 0.8) exact++;
      i--; j--;
    } else if (i > 0 && (b === 1 || j === 0)) i--;
    else j--;
  }
  // كلمات من غير وقت: نوزّعها بين أقرب جارين ليهم وقت
  for (let k = 0; k < n; k++) {
    if (script[k].start != null) continue;
    let a = k - 1; while (a >= 0 && script[a].start == null) a--;
    let b = k + 1; while (b < n && script[b].start == null) b++;
    const t0 = a >= 0 ? script[a].end : (H[0]?.start ?? 0.3);
    const t1 = b < n ? script[b].start : (H.at(-1)?.end ?? t0 + 1);
    const span = b - a - 1, pos = k - a;
    script[k].start = t0 + ((t1 - t0) * (pos - 1)) / span;
    script[k].end = t0 + ((t1 - t0) * pos) / span;
  }
  const segments = episode.segments.map((_, si) => ({
    words: script.filter((w) => w.si === si).map((w) => ({ text: w.text, start: round(w.start), end: round(Math.max(w.end, w.start + 0.08)) })),
  }));
  return { score: exact / Math.max(1, n), segments };
}
