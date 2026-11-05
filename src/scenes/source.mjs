// Sources & assumptions: الأرقام جت منين، والافتراضات اللي بنينا عليها. مصداقية مش زينة.
import { frame, groundIn, exitAll, rich, esc, color } from "./common.mjs";

export default {
  type: "source", family: "reference",
  build(ctx) {
    const { id, p } = ctx;
    const inner = `
      <div id="${id}-h" class="sz-h2">${rich(p.title ?? "الأرقام دي جت منين؟")}</div>
      <div id="${id}-list">${p.items.map((it, i) => `<div class="${id}-it" id="${id}-i${i}"><span class="${id}-tag">${it.kind === "assumption" ? "افتراض" : "مصدر"}</span><span>${rich(it.text)}</span></div>`).join("")}</div>`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:36px" });
    const extra = `
#${id}-list{display:flex;flex-direction:column;gap:22px;width:100%}
.${id}-it{display:flex;gap:18px;align-items:baseline;text-align:right;font-size:36px;font-weight:500;line-height:1.35}
.${id}-tag{flex:none;font-size:26px;font-weight:700;padding:4px 14px;border-radius:30px;border:2px solid currentColor;color:${color.muted}}`;
    const js = [groundIn(ctx), `FB.blurLine(tl, "#${id}-h", 0.05);`];
    p.items.forEach((it, i) => js.push(`FB.blurLine(tl, "#${id}-i${i}", ${ctx.at(it.at ?? 0.4 + i * 0.5)});`));
    js.push(exitAll(ctx));
    return { css: css + extra, html, js: js.join("\n") };
  },
};
