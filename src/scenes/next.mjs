// الخاتمة: الحلقة الجاية — بتخلي الناس تتابع السلسلة.
import { frame, groundIn, rich, letters, fitLatin, color } from "./common.mjs";

export default {
  type: "next",
  family: "typography",
  build(ctx) {
    const { id, p, series } = ctx;
    const size = fitLatin(p.en, 800, 170);
    const inner = `
      <div id="${id}-label" class="sz-label">${rich(p.label ?? "الحلقة الجاية")}</div>
      <div id="${id}-en" class="en" style="font-size:${size}px;font-weight:900;line-height:1" data-accent>${letters(p.en.toUpperCase())}</div>
      <div id="${id}-ar" class="sz-h2">${rich(p.ar, { words: true })}</div>
      <div id="${id}-series"><b>${rich(series.name)}</b><span class="num">#${String(ctx.episode.number + 1).padStart(2, "0")}</span></div>`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:30px" });
    const extra = `
#${id}-en{color:${color.accent}}
#${id}-series{margin-top:70px;display:flex;gap:18px;align-items:center;font-size:40px;font-weight:700;padding:14px 30px;border:3px solid currentColor;border-radius:60px}
#${id}-series .num{font-weight:800}`;
    const tEn = ctx.at(p.at?.en ?? 0);
    const js = [groundIn(ctx),
      `FB.blurLine(tl, "#${id}-label", ${Math.max(0, tEn - 0.3)});`,
      `FB.letters(tl, "#${id}-en", ${tEn}, { stagger: 0.06 });`,
      `FB.blurWords(tl, "#${id}-ar", ${tEn + 0.5});`,
      `FB.rise(tl, "#${id}-series", ${tEn + 1.1}, { y: 26 });`];
    ctx.cue("whoosh", tEn);
    return { css: css + extra, html, js: js.join("\n") };
  },
};
