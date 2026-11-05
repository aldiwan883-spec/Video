// 01 — Typography: الـ Hook. أول سطر لازم يكون ظاهر من الفريم 0 (هو الـ thumbnail).
import { frame, groundIn, exitAll, rich, fitLatin } from "./common.mjs";

export default {
  type: "hook",
  family: "typography",
  build(ctx) {
    const { id, p } = ctx;
    const lines = p.lines.map((l, i) => {
      const words = l.fx !== "line";
      const fit = l.size === "hero" && /^[\d,.%M ]+$/.test(l.text) ? ` style="font-size:${fitLatin(l.text, 860, 190, 0.6)}px"` : "";
      return `<div id="${id}-l${i}" class="sz-${l.size ?? "h2"}"${fit}${l.text.includes("*") ? " data-accent" : ""}>${rich(l.text, { words })}</div>`;
    });
    if (p.emph) lines.push(`<div id="${id}-emph" class="emph" data-accent></div>`);
    const { css, html } = frame(ctx, lines.join(""), {});
    const js = [groundIn(ctx)];
    p.lines.forEach((l, i) => {
      const sel = `#${id}-l${i}`;
      const t = l.at == null ? 0 : ctx.at(l.at);
      if (t <= 0.05 && ctx.isFirst) {
        // ظاهر من الفريم 0 — بس بيستقر بهدوء عشان الصورة متبقاش ميتة
        js.push(`tl.fromTo("${sel}", { scale: 1.035 }, { scale: 1, duration: 1.2, ease: "power2.out" }, 0);`);
        return;
      }
      const fx = l.fx ?? (l.size === "hero" ? "pop" : "blurWords");
      if (fx === "pop") { js.push(`FB.pop(tl, "${sel}", ${t}, { from: 0.8 });`); ctx.cue("pop", t + 0.12); }
      else if (fx === "line") js.push(`FB.blurLine(tl, "${sel}", ${t});`);
      else if (fx === "ink") js.push(`FB.inkWords(tl, "${sel}", ${t});`);
      else js.push(`FB.blurWords(tl, "${sel}", ${t});`);
    });
    // punch-in: السطر بيكبر لحظة وقت ما الكلمة بتتقال (تأكيد بالصوت والصورة)
    p.lines.forEach((l, i) => {
      if (!l.punch) return;
      const t = ctx.at(l.punch);
      js.push(`tl.fromTo("#${id}-l${i}", { scale: 1 }, { scale: 1.08, duration: 0.13, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false }, ${t});`);
      ctx.cue(l.size === "hero" ? "pop" : "click-soft", t + 0.1, { volume: l.size === "hero" ? 0.35 : 0.3 });
    });
    // تأكيد على كلمة: خط تحت السطر بيترسم وقت ما بتتقال
    let extraCss = "";
    if (p.emph) {
      const t = ctx.at(p.emph.at);
      extraCss = `#${id}-emph{width:${p.emph.width ?? 520}px;height:14px;border-radius:7px;background:#EC4E2A;margin-top:-18px;order:${p.emph.after + 1}}
      ${p.lines.map((_, i) => `#${id}-l${i}{order:${i <= p.emph.after ? i : i + 1}}`).join("")}`;
      js.push(`FB.drawX(tl, "#${id}-emph", ${t}, { dur: 0.4 });`);
      ctx.cue("click-soft", t + 0.05);
    }
    js.push(exitAll(ctx));
    return { css: css + extraCss, html, js: js.join("\n") };
  },
};
