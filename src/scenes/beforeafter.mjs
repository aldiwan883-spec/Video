// Before / After: نفس الحالة قبل وبعد تغيير واحد. الفرق بيبان بمسح من اليمين للشمال.
import { frame, groundIn, exitAll, camera, rich, color } from "./common.mjs";

export default {
  type: "beforeafter", family: "compare",
  build(ctx) {
    const { id, p } = ctx;
    const ink = ctx.ground === "ink" ? color.paper : color.ink;
    const panel = (key, d) => `<div class="${id}-p" id="${id}-${key}"><div class="${id}-lb">${rich(d.label)}</div>${d.lines.map((l, i) => `<div class="${id}-l" id="${id}-${key}${i}">${rich(l)}</div>`).join("")}</div>`;
    const inner = `
      ${p.title ? `<div id="${id}-title" class="sz-h2">${rich(p.title, { words: true })}</div>` : ""}
      ${panel("before", p.before)}
      <svg id="${id}-arrow" width="70" height="70" viewBox="0 0 24 24"><path d="M12 3v16m0 0-6-6m6 6 6-6" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      ${panel("after", p.after)}`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:22px" });
    const extra = `
.${id}-p{width:100%;border-radius:24px;padding:28px 36px;text-align:right}
#${id}-before{border:3px dashed ${color.muted};color:${color.muted}}
#${id}-after{border:5px solid ${ink};background:${ctx.ground === "ink" ? "#1F1F1F" : color.card}}
.${id}-lb{font-size:32px;font-weight:700;margin-bottom:10px;color:${color.muted}}
.${id}-l{font-size:44px;font-weight:600;line-height:1.35}
#${id}-after .hl{color:${color.accent}}`;
    const tb = ctx.at(p.at?.before ?? 0.2), ta = ctx.at(p.at?.after ?? 2);
    const js = [groundIn(ctx), p.title ? `FB.blurWords(tl, "#${id}-title", 0.05);` : "",
      `FB.rise(tl, "#${id}-before", ${tb}, { y: 30 });`,
      `FB.blurLine(tl, "#${id}-arrow", ${ta - 0.3});`,
      `tl.fromTo("#${id}-after", { clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0%)", duration: 0.55, ease: "power3.inOut" }, ${ta});`,
      camera(ctx, ta + 0.5), exitAll(ctx)];
    ctx.cue("whoosh-short", ta + 0.05, { volume: 0.22 });
    return { css: css + extra, html, js: js.join("\n") };
  },
};
