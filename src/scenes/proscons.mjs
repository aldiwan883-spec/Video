// Pros & cons: الـ trade-off قدامك، والحكم في الآخر (مش قبل ما الطرفين يبانوا).
import { frame, groundIn, exitAll, camera, rich, color } from "./common.mjs";

export default {
  type: "proscons", family: "diagram",
  build(ctx) {
    const { id, p } = ctx;
    const ink = ctx.ground === "ink" ? color.paper : color.ink;
    const col = (key, items, mark) => `<div class="${id}-col" id="${id}-${key}"><div class="${id}-h">${rich(p.labels?.[key] ?? (key === "pros" ? "مع" : "ضد"))}</div>${items.map((it, i) => `<div class="${id}-it" id="${id}-${key}${i}"><b>${mark}</b><span>${rich(it.text ?? it)}</span></div>`).join("")}</div>`;
    const inner = `
      ${p.title ? `<div id="${id}-title" class="sz-h2">${rich(p.title, { words: true })}</div>` : ""}
      <div id="${id}-cols">${col("pros", p.pros, "+")}${col("cons", p.cons, "−")}</div>
      ${p.verdict ? `<div id="${id}-verdict" class="sz-h2" data-accent>${rich(p.verdict, { words: true })}</div>` : ""}`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:40px" });
    const extra = `
#${id}-cols{display:grid;grid-template-columns:1fr 1fr;gap:28px;width:100%}
.${id}-col{text-align:right;display:flex;flex-direction:column;gap:22px}
.${id}-h{font-size:40px;font-weight:700;padding-bottom:12px;border-bottom:4px solid ${ink}}
.${id}-it{display:flex;gap:14px;font-size:38px;font-weight:500;line-height:1.3}
.${id}-it b{flex:none;font-family:'FB Inter';font-weight:900;width:30px}
#${id}-cons .${id}-it b{color:${color.muted}}
#${id}-verdict .hl{color:${color.accent}}`;
    const js = [groundIn(ctx), p.title ? `FB.blurWords(tl, "#${id}-title", 0.05);` : "",
      `FB.blurLine(tl, "#${id}-pros .${id}-h", 0.2);`, `FB.blurLine(tl, "#${id}-cons .${id}-h", 0.3);`];
    for (const key of ["pros", "cons"]) p[key].forEach((it, i) => {
      const t = ctx.at(it.at ?? 0.6 + i * 0.6 + (key === "cons" ? 1.5 : 0));
      js.push(`FB.blurLine(tl, "#${id}-${key}${i}", ${t});`);
      ctx.cue("click-soft", t + 0.03, { volume: 0.18 });
    });
    if (p.verdict) { const t = ctx.at(p.at?.verdict ?? 4); js.push(`FB.blurWords(tl, "#${id}-verdict", ${t});`, camera(ctx, t)); }
    js.push(exitAll(ctx));
    return { css: css + extra, html, js: js.join("\n") };
  },
};
