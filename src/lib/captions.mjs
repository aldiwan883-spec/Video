// Captions: 3–5 كلمات في المجموعة، الكلمة اللي بتتقال دلوقتي بتنوّر. مكانها ثابت في باند الكابشن.
import { W, H, color, safe, baseCss } from "./brand.mjs";
import { esc, normalize } from "./text.mjs";
import { round } from "./timing.mjs";

const MAX_WORDS = 4, MAX_CHARS = 24;

export function buildCaptions(timeline, episode, scenes) {
  const groups = [];
  timeline.segments.forEach((seg, si) => {
    if (episode.segments[si].captions === false) return;
    let cur = [];
    const flush = () => { if (cur.length) groups.push({ seg: si, words: cur }); cur = []; };
    seg.words.forEach((w, i) => {
      const prev = seg.words[i - 1];
      const chars = cur.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
      if (cur.length && (cur.length >= MAX_WORDS || chars > MAX_CHARS || (prev && w.start - prev.end >= 0.15))) flush();
      cur.push(w);
      if (/[.؟?!:…،,]$/.test(w.text)) flush();
    });
    flush();
  });
  const darkAt = (t) => scenes.some((s) => s.ground === "ink" && t >= s.start && t < s.start + s.dur);
  const html = [], js = [];
  groups.forEach((g, gi) => {
    const start = round(Math.max(0.15, g.words[0].start - 0.08));
    const next = groups[gi + 1];
    const end = round(Math.min(g.words.at(-1).end + 0.35, next ? next.words[0].start - 0.1 : 1e9));
    g.start = start; g.end = end;
    const dark = darkAt(start);
    const words = g.words.map((w, wi) => `<span class="cw" id="cap-${gi}-${wi}">${esc(w.text.replace(/[*]/g, "").replace(/[،,]$/, ""))}</span>`).join(" ");
    html.push(`<div class="cg${dark ? " dark" : ""}" id="cap-${gi}">${words}</div>`);
    js.push(`tl.fromTo("#cap-${gi}", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.14, ease: "power3.out" }, ${start});`);
    g.words.forEach((w, wi) => js.push(`tl.fromTo("#cap-${gi}-${wi}", { color: "${dark ? "#9C9488" : "#8A8172"}" }, { color: "${dark ? color.paper : color.ink}", duration: 0.06 }, ${round(w.start)});`));
    js.push(`tl.to("#cap-${gi}", { opacity: 0, duration: 0.1, ease: "power2.in" }, ${round(end - 0.1)});`);
    js.push(`tl.set("#cap-${gi}", { visibility: "hidden" }, ${end});`);
  });
  const file = `<template>
<style>
${baseCss()}
#root .cg{position:absolute;left:150px;right:150px;top:${safe.captionTop + 40}px;text-align:center;font-size:54px;font-weight:600;line-height:1.35;opacity:0;color:${color.ink};overflow:visible}
</style>
<div id="root" data-composition-id="captions" data-width="${W}" data-height="${H}">
${html.join("\n")}
</div>
<script>
(() => {
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
window.__timelines["captions"] = tl;
})();
</script>
</template>
`;
  return { file, groups };
}
