// Decision tree: سؤال واحد بيتفرع لـ 2 أو 3 احتمالات، وكل فرع ليه نتيجة. بيعلّم "القرار بيعتمد على إيه".
import { frame, groundIn, exitAll, camera, rich, color } from "./common.mjs";

export default {
  type: "decision", family: "diagram",
  build(ctx) {
    const { id, p } = ctx;
    const ink = ctx.ground === "ink" ? color.paper : color.ink;
    const inner = `
      <div id="${id}-root" class="sz-h2">${rich(p.root, { words: true })}</div>
      <svg id="${id}-wires" width="888" height="90" viewBox="0 0 888 90">${p.branches.map((_, i) => {
        const x = Math.round((888 / p.branches.length) * (i + 0.5));
        return `<path id="${id}-w${i}" d="M444 0 C444 50 ${x} 40 ${x} 90" stroke="${ink}" stroke-width="5" fill="none" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>`;
      }).join("")}</svg>
      <div id="${id}-br">${p.branches.map((b, i) => `
        <div class="${id}-b" id="${id}-b${i}"${b.hl ? " data-accent" : ""}><div class="${id}-cond">${rich(b.cond)}</div><div class="${id}-out">${rich(b.outcome)}</div></div>`).join("")}
      </div>
      ${p.verdict ? `<div id="${id}-verdict" class="sz-body">${rich(p.verdict, { words: true })}</div>` : ""}`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:0" });
    const extra = `
#${id}-root{border:4px solid ${ink};border-radius:20px;padding:22px 34px;max-width:860px}
#${id}-br{display:flex;gap:24px;width:100%;direction:ltr}
.${id}-b{flex:1;direction:rtl;border-radius:20px;padding:26px 18px;background:${ctx.ground === "ink" ? "#1F1F1F" : color.card};border:3px solid ${ctx.ground === "ink" ? "#FFFFFF33" : color.line}}
.${id}-b[data-accent]{border:5px solid ${color.accent}}
.${id}-cond{font-size:32px;font-weight:600;color:${color.muted};margin-bottom:10px}
.${id}-out{font-size:42px;font-weight:700;line-height:1.3}
#${id}-verdict{margin-top:40px}`;
    const js = [groundIn(ctx), `FB.blurWords(tl, "#${id}-root", ${ctx.at(p.at?.root ?? 0.1)});`];
    p.branches.forEach((b, i) => {
      const t = ctx.at(b.at ?? 1 + i * 0.8);
      js.push(`tl.fromTo("#${id}-w${i}", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.4, ease: "power2.out" }, ${t - 0.15});`);
      js.push(`FB.rise(tl, "#${id}-b${i}", ${t}, { y: 30, dur: 0.45 });`);
      ctx.cue("click-soft", t + 0.05, { volume: 0.22 });
    });
    const hl = p.branches.findIndex((b) => b.hl);
    if (hl >= 0 && p.at?.choose) {
      const t = ctx.at(p.at.choose);
      js.push(`tl.fromTo(".${id}-b:not([data-accent])", { opacity: 1 }, { opacity: 0.35, duration: 0.3, immediateRender: false }, ${t});`);
      js.push(camera(ctx, t)); ctx.cue("pop", t + 0.05, { volume: 0.28 });
    }
    if (p.verdict) js.push(`FB.blurWords(tl, "#${id}-verdict", ${ctx.at(p.at?.verdict ?? 3)});`);
    js.push(exitAll(ctx));
    return { css: css + extra, html, js: js.join("\n") };
  },
};
