// 03 — Diagram: مقارنة بنسبة حقيقية. العمودين بنفس المقياس، فالفرق بيبان بعينك.
import { frame, groundIn, exitAll, rich, color } from "./common.mjs";

export default {
  type: "compare",
  family: "diagram",
  build(ctx) {
    const { id, p } = ctx;
    const max = Math.max(p.a.value, p.b.value);
    const H = 520;
    const ha = Math.max(14, Math.round((p.a.value / max) * H));
    const hb = Math.max(14, Math.round((p.b.value / max) * H));
    const inner = `
      <div id="${id}-q" class="sz-h2">${rich(p.question, { words: true })}</div>
      <div id="${id}-chart">
        <div class="${id}-col" id="${id}-ca"><div class="num ${id}-val" id="${id}-va">${p.a.display}</div><div class="${id}-bar" id="${id}-ba"></div></div>
        <div class="${id}-col" id="${id}-cb"><div class="num ${id}-val" id="${id}-vb">${p.b.display}</div><div class="${id}-bar" id="${id}-bb"></div></div>
        <div id="${id}-badge" class="num" data-accent>${p.badge}</div>
      </div>
      <div id="${id}-base"></div>
      <div id="${id}-labels"><div class="sz-body">${rich(p.a.label)}</div><div class="sz-body">${rich(p.b.label)}</div></div>`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:0" });
    const extra = `
#${id}-q{margin-bottom:56px}
#${id}-chart{position:relative;display:flex;gap:150px;align-items:flex-end;height:${H + 90}px}
.${id}-col{width:250px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:14px;position:relative;height:100%}
.${id}-val{font-size:64px;font-weight:800}
#${id}-ba{width:250px;height:${ha}px;background:${color.muted};border-radius:14px 14px 0 0}
#${id}-bb{width:250px;height:${hb}px;background:${color.ink};border-radius:14px 14px 0 0}
#${id}-badge{position:absolute;bottom:${Math.round(hb * 0.55)}px;left:0;right:0;margin:auto;width:150px;text-align:center;font-size:64px;font-weight:900;color:${color.accent}}
#${id}-base{width:700px;height:4px;background:${color.ink}}
#${id}-labels{display:flex;gap:150px;margin-top:18px}
#${id}-labels > div{width:320px;margin:0 -35px;white-space:nowrap}`;
    const tA = ctx.at(p.at.a), tB = ctx.at(p.at.b), tQ = ctx.at(p.at.question);
    const js = [groundIn(ctx),
      `FB.drawX(tl, "#${id}-base", 0.05, { origin: "center center" });`,
      `FB.blurLine(tl, "#${id}-labels > div:nth-child(1)", ${tA});`,
      `FB.growY(tl, "#${id}-ba", ${tA}, { dur: 0.5 });`,
      `FB.blurLine(tl, "#${id}-va", ${tA + 0.35});`,
      `FB.blurLine(tl, "#${id}-labels > div:nth-child(2)", ${tB});`,
      `FB.growY(tl, "#${id}-bb", ${tB}, { dur: 1.0, ease: "power3.inOut" });`,
      `FB.blurLine(tl, "#${id}-vb", ${tB + 0.85});`,
      `FB.stamp(tl, "#${id}-badge", ${tB + 1.05}, { rot: -6 });`,
      `FB.blurWords(tl, "#${id}-q", ${tQ});`,
      exitAll(ctx)];
    ctx.cue("whoosh-short", tB + 0.1, { volume: 0.25 });
    ctx.cue("pop", tB + 1.06);
    return { css: css + extra, html, js: js.join("\n") };
  },
};
