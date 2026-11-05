// 01 — Typography: المصطلح نفسه. الكلمة الإنجليزي هي البطل، والمعنى العربي تحتها.
import { frame, groundIn, exitAll, rich, letters, fitLatin, color } from "./common.mjs";

export default {
  type: "term",
  family: "typography",
  build(ctx) {
    const { id, p } = ctx;
    const size = fitLatin(p.en);
    const inner = `
      <div id="${id}-kicker" class="sz-label">${rich(p.kicker ?? "المصطلح")}</div>
      <div id="${id}-en" class="en" style="font-size:${size}px;font-weight:900;letter-spacing:-0.02em;line-height:1">${letters(p.en.toUpperCase())}</div>
      <div id="${id}-bar"></div>
      <div id="${id}-ar" class="sz-h1" data-accent>${rich(p.ar)}</div>
      ${p.def ? `<div id="${id}-def" class="sz-body">${rich(p.def, { words: true })}</div>` : ""}`;
    const { css, html } = frame(ctx, inner);
    const extra = `#${id}-bar{width:120px;height:10px;border-radius:5px;background:${ctx.ground === "ink" ? color.paper : color.ink}}
      #${id}-ar{color:${color.accent}}`;
    const tEn = ctx.at(p.at?.en ?? 0);
    const tAr = ctx.at(p.at?.ar ?? 0) ;
    const js = [groundIn(ctx),
      `FB.blurLine(tl, "#${id}-kicker", ${Math.max(0, tEn - 0.25)});`,
      `FB.letters(tl, "#${id}-en", ${tEn});`,
      `FB.drawX(tl, "#${id}-bar", ${tEn + 0.3}, { origin: "center center" });`,
      `FB.blurLine(tl, "#${id}-ar", ${Math.max(tAr, tEn + 0.5)});`];
    ctx.cue("whoosh-short", tEn);
    if (p.def) js.push(`FB.inkWords(tl, "#${id}-def", ${ctx.at(p.at?.def)}, { stagger: 0.12 });`);
    js.push(exitAll(ctx));
    return { css: css + extra, html, js: js.join("\n") };
  },
};
