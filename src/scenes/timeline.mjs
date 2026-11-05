// Timeline: مراحل في الزمن (جولات تمويل، runway، مراحل المشروع). الخط بيتقدم مع الكلام.
import { frame, groundIn, exitAll, rich, color } from "./common.mjs";

export default {
  type: "timeline", family: "diagram",
  build(ctx) {
    const { id, p } = ctx;
    const ink = ctx.ground === "ink" ? color.paper : color.ink;
    const inner = `
      ${p.title ? `<div id="${id}-title" class="sz-h2">${rich(p.title, { words: true })}</div>` : ""}
      <div id="${id}-tl"><div id="${id}-rail"><i id="${id}-prog"></i></div>
        ${p.items.map((it, i) => `<div class="${id}-it" id="${id}-i${i}"${it.hl ? " data-accent" : ""}><div class="${id}-dot"></div><div class="${id}-when num">${rich(it.when)}</div><div class="${id}-txt">${rich(it.text)}</div></div>`).join("")}
      </div>`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:40px" });
    const extra = `
#${id}-tl{position:relative;width:100%;display:flex;flex-direction:column;gap:46px;padding-right:70px}
#${id}-rail{position:absolute;right:22px;top:20px;bottom:20px;width:6px;background:${ctx.ground === "ink" ? "#FFFFFF22" : color.ghost};border-radius:3px}
#${id}-prog{display:block;width:100%;height:100%;background:${ink};border-radius:3px}
.${id}-it{position:relative;text-align:right}
.${id}-dot{position:absolute;right:-62px;top:12px;width:34px;height:34px;border-radius:50%;background:${ctx.ground === "ink" ? color.ink : color.paper};border:6px solid ${ink}}
.${id}-it[data-accent] .${id}-dot{background:${color.accent};border-color:${color.accent}}
.${id}-when{font-size:36px;font-weight:800;color:${color.muted};direction:rtl}
.${id}-txt{font-size:46px;font-weight:600;line-height:1.3}
.${id}-it[data-accent] .${id}-txt{color:${color.accent}}`;
    const n = p.items.length;
    const times = p.items.map((it, i) => ctx.at(it.at ?? 0.4 + i * 0.8));
    const js = [groundIn(ctx), p.title ? `FB.blurWords(tl, "#${id}-title", 0.05);` : "",
      `tl.fromTo("#${id}-prog", { scaleY: 0, transformOrigin: "center top" }, { scaleY: ${(1 / n).toFixed(3)}, duration: 0.4, ease: "power2.out" }, ${times[0]});`];
    times.forEach((t, i) => {
      if (i > 0) js.push(`tl.to("#${id}-prog", { scaleY: ${((i + 1) / n).toFixed(3)}, duration: 0.45, ease: "power2.inOut" }, ${t - 0.1});`);
      js.push(`FB.rise(tl, "#${id}-i${i}", ${t}, { y: 26, dur: 0.45 });`);
      ctx.cue(p.items[i].hl ? "pop" : "click-soft", t + 0.08, { volume: 0.2 });
    });
    js.push(exitAll(ctx));
    return { css: css + extra, html, js: js.join("\n") };
  },
};
