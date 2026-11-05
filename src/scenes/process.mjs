// Process: خطوات بالترتيب. الخطوة الحالية واضحة، واللي خلصت بتهدى وعليها ✓.
import { frame, groundIn, exitAll, rich, color } from "./common.mjs";

export default {
  type: "process", family: "diagram",
  build(ctx) {
    const { id, p } = ctx;
    const ink = ctx.ground === "ink" ? color.paper : color.ink;
    const inner = `
      ${p.title ? `<div id="${id}-title" class="sz-h2">${rich(p.title, { words: true })}</div>` : ""}
      <div id="${id}-steps">${p.steps.map((s, i) => `
        <div class="${id}-s" id="${id}-s${i}"${s.hl ? " data-accent" : ""}><div class="${id}-n num">${i + 1}</div>
          <div class="${id}-body"><div class="${id}-t">${rich(s.title)}</div>${s.detail ? `<div class="${id}-d">${rich(s.detail)}</div>` : ""}</div></div>`).join("")}
      </div>`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:36px" });
    const extra = `
#${id}-steps{display:flex;flex-direction:column;gap:26px;width:100%}
.${id}-s{display:flex;gap:28px;align-items:flex-start;text-align:right}
.${id}-n{flex:none;width:76px;height:76px;border-radius:50%;border:5px solid ${ink};display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:800}
.${id}-s[data-accent] .${id}-n{background:${color.accent};border-color:${color.accent};color:${color.paper}}
.${id}-t{font-size:48px;font-weight:700;line-height:1.25}
.${id}-d{font-size:36px;font-weight:500;color:${color.muted};line-height:1.35;margin-top:4px}`;
    const js = [groundIn(ctx), p.title ? `FB.blurWords(tl, "#${id}-title", 0.05);` : ""];
    const times = p.steps.map((s, i) => ctx.at(s.at ?? 0.4 + i * 0.9));
    times.forEach((t, i) => {
      js.push(`FB.rise(tl, "#${id}-s${i}", ${t}, { y: 34, dur: 0.45 });`);
      if (i > 0 && !p.keepAll) js.push(`tl.to("#${id}-s${i - 1}", { opacity: 0.4, duration: 0.3 }, ${t});`);
      ctx.cue(i % 2 ? "key-press" : "click-soft", t + 0.05, { volume: 0.2 });
    });
    js.push(exitAll(ctx));
    return { css: css + extra, html, js: js.join("\n") };
  },
};
