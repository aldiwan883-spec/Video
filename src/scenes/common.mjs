import { color, type, safe } from "../lib/brand.mjs";
import { rich, esc } from "../lib/text.mjs";

export const SIZE = {
  hero: `font-size:${type.hero}px;font-weight:700;line-height:1.05`,
  h1: `font-size:${type.h1}px;font-weight:700;line-height:1.25`,
  h2: `font-size:${type.h2}px;font-weight:600;line-height:1.35`,
  body: `font-size:${type.body}px;font-weight:500;line-height:1.5`,
  quiet: `font-size:${type.quiet}px;font-weight:500;line-height:1.5;color:${color.muted}`,
  label: `font-size:${type.label}px;font-weight:600;line-height:1.4;color:${color.muted}`,
};

// الأرضية والـ stage المشتركين لكل مشهد
export function frame(ctx, inner, { stageCss = "" } = {}) {
  const { id } = ctx;
  const g = ctx.ground === "ink" ? color.ink : color.paper;
  const ink = ctx.ground === "ink" ? color.paper : color.ink;
  const css = `
#${id}-ground{position:absolute;inset:0;background:${g}}
#${id}-stage{position:absolute;top:${safe.top + 70}px;left:${safe.side}px;right:${safe.side}px;height:${safe.contentBottom - safe.top - 70}px;
  display:flex;flex-direction:column;justify-content:center;align-items:center;gap:30px;text-align:center;color:${ink};${stageCss}}
${Object.entries(SIZE).map(([k, v]) => `#${id}-stage .sz-${k}{${v}}`).join("\n")}
${ctx.ground === "ink" ? `#${id}-stage .sz-quiet,#${id}-stage .sz-label{color:#A79F92}` : ""}`;
  const html = `<div id="${id}-ground"></div><div id="${id}-stage">${inner}</div>`;
  return { css, html };
}

// دخول الأرضية: لو لون الأرضية اتغيّر عن المشهد اللي قبله → دايرة بتفرش اللون + whoosh
export function groundIn(ctx) {
  if (ctx.prevGround && ctx.prevGround !== ctx.ground) {
    ctx.cue("whoosh", 0.1);
    return `FB.flood(tl, "#${ctx.id}-ground", 0, { dur: 0.5 });`;
  }
  return "";
}

export function exitAll(ctx) {
  if (ctx.isLast) return "";
  return `FB.exit(tl, "#${ctx.id}-stage", ${(ctx.dur - 0.22).toFixed(3)});`;
}

export function letters(text) {
  return [...String(text)].map((c) => (c === " " ? " " : `<span class="l">${esc(c)}</span>`)).join("");
}

// حجم الكلمة اللاتيني الكبيرة بحيث تملا العرض من غير ما تخرج برّه
export function fitLatin(text, maxWidth = 888, max = 210, k = 0.74) {
  return Math.min(max, Math.floor(maxWidth / (k * String(text).length)));
}

export { rich, esc, color, type, safe };
