import { color, type, safe } from "../lib/brand.mjs";
import { rich, esc } from "../lib/text.mjs";
import { DENSITY } from "../lib/variation.mjs";

const SIZE_BASE = {
  hero: [type.hero, 700, 1.05],
  h1: [type.h1, 700, 1.25],
  h2: [type.h2, 600, 1.35],
  body: [type.body, 500, 1.5],
  quiet: [type.quiet, 500, 1.5],
  label: [type.label, 600, 1.4],
};
export const SIZE = Object.fromEntries(Object.entries(SIZE_BASE).map(([k, [s, w, lh]]) => [k, `font-size:${s}px;font-weight:${w};line-height:${lh}`]));

const JUSTIFY = { center: "center", start: "flex-start", low: "flex-end" };

// الأرضية والـ stage المشتركين لكل مشهد. الـ layout بيتغيّر حسب خطة الإخراج.
export function frame(ctx, inner, { stageCss = "", layout } = {}) {
  const { id } = ctx;
  const k = DENSITY[ctx.density] ?? 1;
  const lay = layout ?? ctx.v?.layout ?? "center";
  const dark = ctx.ground === "ink";
  const g = dark ? color.ink : color.paper;
  const ink = dark ? color.paper : color.ink;
  const quiet = dark ? "#A79F92" : color.muted;
  const sizes = Object.entries(SIZE_BASE).map(([n, [s, w, lh]]) =>
    `#${id}-stage .sz-${n}{font-size:${Math.round(s * k)}px;font-weight:${w};line-height:${lh}${n === "quiet" || n === "label" ? `;color:${quiet}` : ""}}`).join("\n");
  const source = ctx.p.source ? `<div id="${id}-src" class="${id}-src">${esc(ctx.p.source)}</div>` : "";
  const css = `
#${id}-ground{position:absolute;inset:0;background:${g}}
#${id}-stage{position:absolute;top:${safe.top + 70}px;left:${safe.side}px;right:${safe.side}px;height:${safe.contentBottom - safe.top - 70}px;
  display:flex;flex-direction:column;justify-content:${JUSTIFY[lay] ?? "center"};align-items:center;gap:30px;text-align:center;color:${ink};${stageCss}}
${sizes}
.${id}-src{position:absolute;left:${safe.side}px;right:${safe.side}px;top:${safe.contentBottom + 4}px;text-align:center;font-size:30px;font-weight:500;color:${quiet}}`;
  const html = `<div id="${id}-ground"></div><div id="${id}-stage">${inner}</div>${source}`;
  return { css, html };
}

// دخول المشهد حسب الـ transition المخطط (flood لما الأرضية تتغير، whip, iris, blur, cut)
export function groundIn(ctx) {
  const id = ctx.id, t = ctx.v?.tIn ?? (ctx.prevGround && ctx.prevGround !== ctx.ground ? "flood" : "blur");
  const js = [];
  if (t === "flood") { ctx.cue("whoosh", 0.1); js.push(`FB.flood(tl, "#${id}-ground", 0, { dur: 0.5 });`); }
  else if (t === "whip") { ctx.cue("whoosh-short", 0.02, { volume: 0.22 }); js.push(`FB.whipIn(tl, "#${id}-stage", 0);`); }
  else if (t === "iris") js.push(`FB.iris(tl, "#${id}-stage", 0);`);
  if (ctx.p.source) js.push(`FB.blurLine(tl, "#${id}-src", 0.4);`);
  return js.join("\n");
}

export function exitAll(ctx) {
  if (ctx.isLast) return "";
  const t = ctx.v?.tOut ?? "blur", id = ctx.id;
  if (t === "cut") return "";
  if (t === "whip") return `FB.whipOut(tl, "#${id}-stage", ${(ctx.dur - 0.2).toFixed(3)});`;
  if (t === "flood") return `FB.exit(tl, "#${id}-stage", ${(ctx.dur - 0.3).toFixed(3)}, { dur: 0.25 });`;
  return `FB.exit(tl, "#${id}-stage", ${(ctx.dur - 0.22).toFixed(3)});`;
}

// كاميرا: punch-in خفيف على لحظة الـ payoff (مش zoom بطيء — ده من علامات الـ AI templates)
export function camera(ctx, t) {
  if (ctx.v?.camera !== "punch" || t == null) return "";
  return `tl.fromTo("#${ctx.id}-stage", { scale: 1 }, { scale: 1.045, duration: 0.35, ease: "expo.out", immediateRender: false }, ${t});`;
}

export function letters(text) {
  return [...String(text)].map((c) => (c === " " ? " " : `<span class="l">${esc(c)}</span>`)).join("");
}

export function fitLatin(text, maxWidth = 888, max = 210, k = 0.74) {
  return Math.min(max, Math.floor(maxWidth / (k * String(text).length)));
}

// عدد لعرض: 20000000 → "20M" أو "20,000,000"
export function fmt(v, style = "full") {
  if (typeof v === "string") return v;
  if (style === "short") {
    const a = Math.abs(v);
    if (a >= 1e9) return `${+(v / 1e9).toFixed(2)}B`;
    if (a >= 1e6) return `${+(v / 1e6).toFixed(2)}M`;
    if (a >= 1e3) return `${+(v / 1e3).toFixed(1)}K`;
  }
  return Math.round(v).toLocaleString("en-US");
}

export { rich, esc, color, type, safe };
