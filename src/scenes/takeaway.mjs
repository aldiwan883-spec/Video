// Key takeaway: الفكرة الواحدة اللي المشاهد ياخدها معاه — سطر كبير وثابت، و2 نقطة داعمة بس.
import { frame, groundIn, exitAll, rich, color } from "./common.mjs";

export default {
  type: "takeaway", family: "typography",
  build(ctx) {
    const { id, p } = ctx;
    const inner = `
      <div id="${id}-kick" class="sz-label">${rich(p.kicker ?? "الخلاصة")}</div>
      <div id="${id}-line" class="sz-h1"${p.line.includes("*") ? " data-accent" : ""}>${rich(p.line, { words: true })}</div>
      ${(p.points ?? []).map((pt, i) => `<div class="${id}-pt sz-body" id="${id}-p${i}">${rich(pt)}</div>`).join("")}`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:24px" });
    const extra = `#${id}-line{max-width:880px}
#${id}-stage .${id}-pt{font-size:42px;padding-top:16px;border-top:3px solid ${ctx.ground === "ink" ? "#FFFFFF22" : color.line};width:86%}`;
    const t0 = ctx.at(p.at?.line ?? 0.2);
    const js = [groundIn(ctx), `FB.blurLine(tl, "#${id}-kick", ${Math.max(0, t0 - 0.3)});`, `FB.blurWords(tl, "#${id}-line", ${t0}, { stagger: 0.07 });`];
    (p.points ?? []).forEach((_, i) => js.push(`FB.rise(tl, "#${id}-p${i}", ${ctx.at(p.at?.points?.[i] ?? t0 + 1.5 + i)}, { y: 24 });`));
    js.push(exitAll(ctx));
    return { css: css + extra, html, js: js.join("\n") };
  },
};
