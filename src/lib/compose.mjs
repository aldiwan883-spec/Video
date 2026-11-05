// Video Editor: بياخد الحلقة + التوقيت ويبني مشروع HyperFrames كامل (مشاهد + كابشن + هوية + أصوات).
import fs from "node:fs";
import path from "node:path";
import { W, H, FPS, color, safe, baseCss } from "./brand.mjs";
import { SCENES } from "../scenes/index.mjs";
import { findAnchor, round } from "./timing.mjs";
import { buildCaptions } from "./captions.mjs";
import { esc } from "./text.mjs";
import { planVariation, signature } from "./variation.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SFX = () => JSON.parse(fs.readFileSync(path.join(ROOT, "public/sounds/manifest.json"), "utf8"));

export function composeEpisode({ episode, series, timeline, outDir, voiceFile }) {
  const proj = path.join(outDir, "project");
  fs.rmSync(proj, { recursive: true, force: true });
  fs.mkdirSync(path.join(proj, "compositions"), { recursive: true });
  fs.mkdirSync(path.join(proj, "assets/fonts"), { recursive: true });
  fs.mkdirSync(path.join(proj, "assets/sfx"), { recursive: true });
  fs.mkdirSync(path.join(proj, "assets/vendor"), { recursive: true });
  for (const f of ["ReadexPro-Variable.ttf", "Inter-Variable.ttf"])
    fs.copyFileSync(path.join(ROOT, "brand/fonts", f), path.join(proj, "assets/fonts", f));
  fs.copyFileSync(path.join(ROOT, "node_modules/gsap/dist/gsap.min.js"), path.join(proj, "assets/vendor/gsap.min.js"));
  fs.copyFileSync(path.join(ROOT, "src/runtime/fx.js"), path.join(proj, "assets/vendor/fx.js"));

  // ---- توقيت المشاهد: كل مشهد بيبدأ قبل أول كلمة في الجزء بتاعه بشوية
  const segs = timeline.segments;
  // القطع بين المشاهد في نص السكتة الطبيعية بين الجملتين (مش على أول كلمة)
  const starts = segs.map((s, i) => (i === 0 ? 0 : round(Math.max(segs[i - 1].end + 0.05, s.start - Math.min(0.3, (s.start - segs[i - 1].end) / 2)))));
  const scenes = episode.segments.map((seg, i) => {
    const start = starts[i];
    const end = i < segs.length - 1 ? starts[i + 1] : timeline.total;
    return { seg, timing: segs[i], start, dur: round(end - start), id: `s${i + 1}` };
  });

  const cues = [];
  const notes = []; // تحذيرات التوقيت من المشاهد نفسها
  const manifest = SFX();
  const plan = planVariation(episode, series);
  const built = scenes.map((sc, i) => {
    const def = SCENES[sc.seg.scene.type];
    if (!def) throw new Error(`نوع مشهد مش معروف: ${sc.seg.scene.type}`);
    const v = plan[i];
    const ground = v.ground, prevGround = v.prevGround;
    const ctx = {
      id: sc.id, p: sc.seg.scene, dur: sc.dur, ground, prevGround, series, episode, v,
      density: series.creative?.visualDensity ?? "medium",
      isFirst: i === 0, isLast: i === scenes.length - 1,
      at: (a) => {
        if (a == null) return 0;
        const t = round(Math.max(0, findAnchor(sc.timing, a) - sc.start));
        if (t > sc.dur - 0.4) notes.push({ level: "warn", msg: `${sc.id}: العنصر المربوط بـ "${a}" بيظهر في آخر ${(sc.dur - t).toFixed(2)}s من المشهد — مش هيلحق يتقري` });
        return t;
      },
      cue: (name, t, o = {}) => cues.push({ name, t: round(sc.start + t), ...o, scene: sc.id }),
    };
    const out = def.build(ctx);
    const accents = (out.html.match(/data-accent/g) || []).length;
    fs.writeFileSync(path.join(proj, "compositions", `${sc.id}.html`), sceneFile(sc, out));
    if (sc.dur < 1.5) notes.push({ level: "warn", msg: `${sc.id}: المشهد قصير جداً (${sc.dur}s)` });
    return { ...sc, ground, type: def.type, family: def.family, accents, v, sig: signature(def.type, v) };
  });

  // ---- Chrome: اسم السلسلة + رقم الحلقة + شريط التقدم (ثابتين طول الفيديو)
  fs.writeFileSync(path.join(proj, "compositions", "chrome.html"), chromeFile(built, series, episode, timeline.total));
  // ---- Captions
  const cap = buildCaptions(timeline, episode, built, series.creative?.captionStyle ?? "karaoke");
  fs.writeFileSync(path.join(proj, "compositions", "captions.html"), cap.file);

  // ---- Audio
  const audio = [];
  if (voiceFile) {
    fs.copyFileSync(voiceFile, path.join(proj, "assets/voice.wav"));
    audio.push(`<audio id="voice" class="clip" src="assets/voice.wav" data-start="0" data-duration="${timeline.total}" data-track-index="10" data-volume="1"></audio>`);
  }
  // مستوى الـ SFX كله من series.json → mix.sfx (1 = الأصلي، 0.5 = النص). الافتراضي هادي وتحت صوتك.
  const sfxGain = series.mix?.sfx ?? 0.45;
  const placed = [];
  const used = {};
  const trackEnds = [];
  const trackFor = (s, e) => {
    let k = trackEnds.findIndex((end) => end <= s);
    if (k < 0) { k = trackEnds.length; trackEnds.push(0); }
    trackEnds[k] = e;
    return 11 + k;
  };
  cues.sort((a, b) => a.t - b.t).forEach((c, k) => {
    const m = manifest[c.name];
    if (!m) return;
    const file = `assets/sfx/${m.file}`;
    if (!used[m.file]) fs.copyFileSync(path.join(ROOT, "public/sounds", m.file), path.join(proj, file));
    used[m.file] = true;
    // الذروة بتاعة الصوت تيجي بعد الصورة بفريم (الضوء قبل الصوت)
    let start = c.t + 1 / FPS - m.peak;
    let dur = m.duration, fadeIn = 0, fadeOut = 0, mediaStart = 0;
    if (c.name === "riser") { dur = m.peak + 0.3; fadeIn = 1.2; fadeOut = 0.25; }
    if (start < 0) { mediaStart = -start; dur -= mediaStart; start = 0; }
    dur = Math.min(dur, timeline.total - start);
    if (dur <= 0.05) return;
    placed.push({ name: c.name, file: m.file, t: c.t, start: round(start), dur: round(dur), volume: round((c.volume ?? 0.3) * sfxGain) });
    audio.push(`<audio id="sfx-${k}" class="clip" src="${file}" data-start="${round(start)}" data-duration="${round(dur)}"${mediaStart ? ` data-media-start="${round(mediaStart)}"` : ""} data-track-index="${trackFor(start, start + dur)}" data-volume="${round((c.volume ?? 0.3) * sfxGain)}"${fadeIn ? ` data-fade-in="${fadeIn}"` : ""}${fadeOut ? ` data-fade-out="${fadeOut}"` : ""}></audio>`);
  });

  fs.writeFileSync(path.join(proj, "index.html"), indexFile(built, timeline.total, audio, series));
  fs.writeFileSync(path.join(proj, "hyperframes.json"), JSON.stringify({ paths: { blocks: "compositions", assets: "assets" }, media: { autoProxy: true } }, null, 2));
  fs.writeFileSync(path.join(proj, "meta.json"), JSON.stringify({ id: `fb-${episode.id}`, name: `${series.name} ${episode.id}` }, null, 2));
  return { proj, scenes: built, cues, sfx: placed, notes, captions: cap.groups, total: timeline.total };
}

function sceneFile(sc, out) {
  return `<template>
<style>
${baseCss()}
${out.css}
</style>
<div id="root" data-composition-id="${sc.id}" data-width="${W}" data-height="${H}">
${out.html}
</div>
<script>
(() => {
const tl = gsap.timeline({ paused: true });
${out.js}
window.__timelines["${sc.id}"] = tl;
})();
</script>
</template>
`;
}

function chromeFile(scenes, series, episode, total) {
  const dark = scenes.filter((s) => s.ground === "ink");
  const js = [`tl.fromTo("#chrome-fill", { scaleX: 0, transformOrigin: "right center" }, { scaleX: 1, duration: ${total}, ease: "none" }, 0);`];
  for (const s of dark) {
    js.push(`tl.to("#chrome-bar", { color: "${color.paper}", duration: 0.3 }, ${round(s.start + 0.15)});`);
    js.push(`tl.to("#chrome-fill", { backgroundColor: "${color.paper}", duration: 0.3 }, ${round(s.start + 0.15)});`);
    js.push(`tl.to("#chrome-bar", { color: "${color.ink}", duration: 0.3 }, ${round(s.start + s.dur + 0.15)});`);
    js.push(`tl.to("#chrome-fill", { backgroundColor: "${color.ink}", duration: 0.3 }, ${round(s.start + s.dur + 0.15)});`);
  }
  return `<template>
<style>
${baseCss()}
#chrome-bar{position:absolute;top:${safe.top - 40}px;left:${safe.side}px;right:${safe.side}px;display:flex;justify-content:space-between;align-items:center;color:${color.ink};font-size:34px;font-weight:700}
#chrome-bar .dot{display:inline-block;width:14px;height:14px;border-radius:50%;background:${color.accent};margin-inline-start:12px;vertical-align:middle}
#chrome-ep{font-weight:600;opacity:.6;font-size:30px}
#chrome-track{position:absolute;top:${safe.top + 16}px;left:${safe.side}px;right:${safe.side}px;height:6px;border-radius:3px;background:${color.ghost};overflow:hidden}
#chrome-fill{width:100%;height:100%;background:${color.ink}}
</style>
<div id="root" data-composition-id="chrome" data-width="${W}" data-height="${H}">
  <div id="chrome-bar"><div>${esc(series.brand ?? series.name)}<span class="dot"></span></div><div id="chrome-ep">${esc(series.brand ? series.name : "")} <span class="num">${String(episode.number).padStart(2, "0")}</span></div></div>
  <div id="chrome-track" data-layout-ignore><div id="chrome-fill"></div></div>
</div>
<script>
(() => {
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
window.__timelines["chrome"] = tl;
})();
</script>
</template>
`;
}

function indexFile(scenes, total, audio, series) {
  const hosts = scenes.map((s, i) =>
    `<div id="${s.id}" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${s.start}" data-duration="${s.dur}" data-track-index="1" data-track-kind="graphics" data-width="${W}" data-height="${H}" style="z-index:${i + 1}"></div>`);
  return `<!doctype html>
<html lang="ar" dir="rtl" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<script src="assets/vendor/gsap.min.js"></script>
<script src="assets/vendor/fx.js"></script>
<script>window.FB_INTENSITY = ${series.creative?.animationIntensity ?? 1};</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:${color.paper}}
#main{position:relative;width:100%;height:100%}
#bg{position:absolute;inset:0;background:${color.paper}}
</style>
</head>
<body>
<div id="main" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}" data-fps="${FPS}">
<div id="bg"></div>
${hosts.join("\n")}
<div id="chrome" data-composition-id="chrome" data-composition-src="compositions/chrome.html" data-start="0" data-duration="${total}" data-track-index="2" data-track-kind="graphics" data-width="${W}" data-height="${H}" style="z-index:50"></div>
<div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="${total}" data-track-index="3" data-track-kind="captions" data-width="${W}" data-height="${H}" style="z-index:60"></div>
${audio.join("\n")}
</div>
<script>
window.__timelines = window.__timelines || {};
window.__timelines["main"] = gsap.timeline({ paused: true });
</script>
</body>
</html>
`;
}
