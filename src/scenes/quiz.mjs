// 05 — Quiz: سؤال للمشاهد بأرقام جديدة + عدّاد، والإجابة في أول كومنت.
import { frame, groundIn, exitAll, rich, color } from "./common.mjs";

export default {
  type: "quiz",
  family: "quiz",
  build(ctx) {
    const { id, p } = ctx;
    const n = p.countdown ?? 3;
    const ink0 = ctx.ground === "ink" ? color.paper : color.ink;
    const inner = `
      <div id="${id}-kicker" class="sz-label">${rich(p.kicker ?? "دورك")}</div>
      <div id="${id}-q" class="sz-h1">${rich(p.question, { words: true })}</div>
      ${p.options ? `<div id="${id}-opts">${p.options.map((o, i) => `<div class="${id}-op" id="${id}-op${i}"><b>${o.key}</b><span>${rich(o.text)}</span></div>`).join("")}</div>` : `<div id="${id}-mark" data-accent>؟</div>`}
      <div id="${id}-ask" class="sz-h2">${rich(p.ask, { words: true })}</div>
      ${p.options ? "" : `<div id="${id}-timer"><i id="${id}-fill"></i></div>`}
      <div id="${id}-cta" class="sz-body">${rich(p.cta)} <svg width="44" height="44" viewBox="0 0 24 24"><path d="M12 4v14m0 0-6-6m6 6 6-6" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:24px" });
    const ink = ink0;
    const extra = `
#${id}-opts{display:flex;flex-direction:column;gap:18px;width:100%}
.${id}-op{display:flex;gap:18px;align-items:center;text-align:right;border:3px solid ${ink};border-radius:18px;padding:12px 22px;font-size:34px;font-weight:600;line-height:1.3}
.${id}-op b{flex:none;width:58px;height:58px;border-radius:50%;background:${color.accent};color:${color.paper};display:flex;align-items:center;justify-content:center;font-size:34px}
#${id}-q{font-size:${p.options ? 52 : 104}px}
${p.options ? `#${id}-stage #${id}-ask{font-size:44px} #${id}-stage{gap:${p.options.length > 3 ? 14 : 18}px} ${p.options.length > 3 ? `.${id}-op{padding:10px 20px;font-size:32px}` : ""}` : ""}
#${id}-mark{font-size:220px;font-weight:700;line-height:.9;color:${color.accent}}
#${id}-timer{width:520px;height:12px;border-radius:6px;background:${ctx.ground === "ink" ? "#FFFFFF22" : color.ghost};overflow:hidden;margin-top:16px}
#${id}-fill{display:block;width:100%;height:100%;background:${ink}}
#${id}-cta{display:flex;align-items:center;gap:12px;font-weight:600}`;
    const tQ = ctx.at(p.at.question), tAsk = ctx.at(p.at.ask), tCta = ctx.at(p.at.cta);
    const js = [groundIn(ctx),
      `FB.blurLine(tl, "#${id}-kicker", 0.1);`,
      `FB.blurWords(tl, "#${id}-q", ${tQ});`,
      p.options ? p.options.map((o, i) => `FB.rise(tl, "#${id}-op${i}", ${ctx.at(o.at ?? tAsk + 0.3 + i * 0.5)}, { y: 24, dur: 0.4 });`).join("\n") : `FB.pop(tl, "#${id}-mark", ${tAsk - 0.1}, { from: 0.3, dur: 0.6 });`,
      `FB.inkWords(tl, "#${id}-ask", ${tAsk}, { to: "${ink}" });`,
      p.options ? "" : `FB.blurLine(tl, "#${id}-timer", ${tAsk + 0.5});`,
      p.options ? "" : `tl.fromTo("#${id}-fill", { scaleX: 1, transformOrigin: "left center" }, { scaleX: 0, duration: ${n}, ease: "none" }, ${tAsk + 0.6});`,
      `FB.rise(tl, "#${id}-cta", ${tCta}, { y: 30 });`,
      `tl.fromTo("#${id}-cta svg", { y: -6 }, { y: 8, duration: 0.45, ease: "power2.inOut", yoyo: true, repeat: 3 }, ${tCta + 0.5});`,
      exitAll(ctx)];
    ctx.cue("pop", tAsk + 0.02);
    if (!p.options) for (let i = 0; i < n; i++) ctx.cue(i % 2 ? "key-press" : "click-soft", tAsk + 0.6 + i, { volume: 0.22 });
    return { css: css + extra, html, js: js.join("\n") };
  },
};
