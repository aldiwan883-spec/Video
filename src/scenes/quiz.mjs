// 05 — Quiz: سؤال للمشاهد بأرقام جديدة + عدّاد، والإجابة في أول كومنت.
import { frame, groundIn, exitAll, rich, color } from "./common.mjs";

export default {
  type: "quiz",
  family: "quiz",
  build(ctx) {
    const { id, p } = ctx;
    const n = p.countdown ?? 3;
    const inner = `
      <div id="${id}-kicker" class="sz-label">${rich(p.kicker ?? "دورك")}</div>
      <div id="${id}-q" class="sz-h1">${rich(p.question, { words: true })}</div>
      <div id="${id}-mark" data-accent>؟</div>
      <div id="${id}-ask" class="sz-h2">${rich(p.ask, { words: true })}</div>
      <div id="${id}-timer"><i id="${id}-fill"></i></div>
      <div id="${id}-cta" class="sz-body">${rich(p.cta)} <svg width="44" height="44" viewBox="0 0 24 24"><path d="M12 4v14m0 0-6-6m6 6 6-6" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:24px" });
    const ink = ctx.ground === "ink" ? color.paper : color.ink;
    const extra = `
#${id}-mark{font-size:300px;font-weight:700;line-height:.9;color:${color.accent}}
#${id}-timer{width:520px;height:12px;border-radius:6px;background:${ctx.ground === "ink" ? "#FFFFFF22" : color.ghost};overflow:hidden;margin-top:16px}
#${id}-fill{display:block;width:100%;height:100%;background:${ink}}
#${id}-cta{display:flex;align-items:center;gap:12px;font-weight:600}`;
    const tQ = ctx.at(p.at.question), tAsk = ctx.at(p.at.ask), tCta = ctx.at(p.at.cta);
    const js = [groundIn(ctx),
      `FB.blurLine(tl, "#${id}-kicker", 0.1);`,
      `FB.blurWords(tl, "#${id}-q", ${tQ});`,
      `FB.pop(tl, "#${id}-mark", ${tAsk - 0.1}, { from: 0.3, dur: 0.6 });`,
      `FB.inkWords(tl, "#${id}-ask", ${tAsk}, { to: "${ink}" });`,
      `FB.blurLine(tl, "#${id}-timer", ${tAsk + 0.5});`,
      `tl.fromTo("#${id}-fill", { scaleX: 1, transformOrigin: "left center" }, { scaleX: 0, duration: ${n}, ease: "none" }, ${tAsk + 0.6});`,
      `FB.rise(tl, "#${id}-cta", ${tCta}, { y: 30 });`,
      `tl.fromTo("#${id}-cta svg", { y: -6 }, { y: 8, duration: 0.45, ease: "power2.inOut", yoyo: true, repeat: 3 }, ${tCta + 0.5});`,
      exitAll(ctx)];
    ctx.cue("pop", tAsk + 0.02);
    for (let i = 0; i < n; i++) ctx.cue(i % 2 ? "key-press" : "click-soft", tAsk + 0.6 + i, { volume: 0.22 });
    return { css: css + extra, html, js: js.join("\n") };
  },
};
