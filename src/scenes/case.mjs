// Business case study: كارت الحالة — مين، أرقامها الأساسية، وافتراضاتها معلنة.
import { frame, groundIn, exitAll, camera, rich, esc, color } from "./common.mjs";

export default {
  type: "case", family: "case",
  build(ctx) {
    const { id, p } = ctx;
    const inner = `
      <div id="${id}-card">
        <div id="${id}-tag" class="sz-label">${rich(p.label ?? "حالة افتراضية")}</div>
        <div id="${id}-title" class="sz-h1">${rich(p.title, { words: true })}</div>
        <div id="${id}-facts">${p.facts.map((f, i) => `
          <div class="${id}-fact" id="${id}-f${i}"${f.hl ? " data-accent" : ""}><span class="k">${rich(f.k)}</span><span class="v">${rich(f.v)}</span></div>`).join("")}
        </div>
      </div>
      ${p.note ? `<div id="${id}-note" class="sz-body">${rich(p.note, { words: true })}</div>` : ""}`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:36px" });
    const card = ctx.ground === "ink" ? "#1F1F1F" : color.card;
    const ink = ctx.ground === "ink" ? color.paper : color.ink;
    const extra = `
#${id}-card{width:100%;background:${card};border:4px solid ${ink};border-radius:26px;box-shadow:10px 10px 0 ${ink};padding:40px 44px;text-align:right}
#${id}-title{margin:6px 0 22px}
#${id}-facts{display:flex;flex-direction:column}
.${id}-fact{display:flex;justify-content:space-between;align-items:baseline;gap:24px;padding:18px 0;border-top:2px solid ${ctx.ground === "ink" ? "#FFFFFF22" : color.line};font-size:40px}
.${id}-fact .k{font-weight:500;color:${color.muted}}
.${id}-fact .v{font-weight:700;text-align:left}
.${id}-fact[data-accent] .v{color:${color.accent}}`;
    const js = [groundIn(ctx), `FB.rise(tl, "#${id}-card", 0.05, { y: 60, dur: 0.6 });`, `FB.blurWords(tl, "#${id}-title", 0.25);`];
    let last = 0.5;
    p.facts.forEach((f, i) => {
      const t = ctx.at(f.at ?? 0.6 + i * 0.5); last = Math.max(last, t);
      js.push(`FB.blurLine(tl, "#${id}-f${i}", ${t});`);
      if (f.hl) ctx.cue("pop", t + 0.05, { volume: 0.25 });
    });
    if (p.note) js.push(`FB.blurWords(tl, "#${id}-note", ${ctx.at(p.at?.note ?? last + 0.8)});`);
    js.push(camera(ctx, p.facts.some((f) => f.hl) ? ctx.at(p.facts.find((f) => f.hl).at ?? 1) : null), exitAll(ctx));
    return { css: css + extra, html, js: js.join("\n") };
  },
};
