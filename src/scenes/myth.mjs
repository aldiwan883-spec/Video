// غلطة شائعة: الفكرة الغلط بتتشطب، والصح بيتختم فوقها. (عادة على أرضية سودا عشان الإيقاع يتغيّر)
import { frame, groundIn, exitAll, rich, color } from "./common.mjs";

export default {
  type: "myth",
  family: "typography",
  build(ctx) {
    const { id, p } = ctx;
    const ink = ctx.ground === "ink" ? color.paper : color.ink;
    const wrongs = p.wrong.map((w, i) => `<div class="${id}-wrong sz-h2" id="${id}-w${i}"><span>${rich(w)}</span><i id="${id}-x${i}"></i></div>`).join("");
    const inner = `
      <div id="${id}-title" class="sz-label">${rich(p.title)}</div>
      ${wrongs}
      <div id="${id}-right" data-accent><div class="sz-label" id="${id}-rl">${rich(p.rightLabel ?? "الصح")}</div><div class="sz-h1">${rich(p.right)}</div></div>`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:34px" });
    const extra = `
.${id}-wrong{position:relative;display:inline-block;padding:0 12px;white-space:nowrap;font-size:84px}
.${id}-wrong i{position:absolute;right:-6px;left:-6px;top:52%;height:9px;border-radius:5px;background:${ink}}
#${id}-title{font-size:44px}
#${id}-right{display:flex;flex-direction:column;gap:34px;margin-top:40px;background:${color.accent};color:${color.ink};padding:26px 48px 34px;border-radius:22px}
#${id}-right #${id}-rl{color:${color.ink};opacity:.75;line-height:1.2}`;
    const js = [groundIn(ctx),
      `FB.blurLine(tl, "#${id}-title", 0.35);`,];
    p.wrong.forEach((_, i) => {
      const t = ctx.at(p.at.wrong[i]);
      js.push(`FB.blurLine(tl, "#${id}-w${i}", ${t});`);
      const tx = ctx.at(p.at.strike) + i * 0.18;
      js.push(`FB.drawX(tl, "#${id}-x${i}", ${tx}, { dur: 0.3, ease: "power3.out" });`);
      js.push(`tl.to("#${id}-w${i} span", { opacity: 0.35, duration: 0.25 }, ${tx + 0.15});`);
      ctx.cue(i === 0 ? "click" : "click-soft", tx + 0.05, { volume: 0.35 });
    });
    const tR = ctx.at(p.at.right);
    js.push(`FB.stamp(tl, "#${id}-right", ${tR}, { rot: -2 });`);
    ctx.cue("pop", tR + 0.05);
    js.push(exitAll(ctx));
    return { css: css + extra, html, js: js.join("\n") };
  },
};
