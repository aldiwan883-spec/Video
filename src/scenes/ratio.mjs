// 02/03 — Numbers + Diagram: "الحاجة نفسها هي الشرح". الشركة = خانات، حصة المستثمر خانة منهم،
// ولما الخانات كلها تتملي بيطلع التقييم. مثال واحد حقيقي بيمشي لحد الإجابة.
import { frame, groundIn, exitAll, rich, color } from "./common.mjs";
import { formatNumber } from "../lib/text.mjs";

export default {
  type: "ratio",
  family: "numbers",
  build(ctx) {
    const { id, p } = ctx;
    const cells = p.cells ?? 10;
    const take = p.take ?? 1;
    const cols = cells <= 10 ? 5 : 10;
    const tile = cols === 5 ? 140 : 70;
    const gap = cols === 5 ? 22 : 12;
    const tiles = Array.from({ length: cells }, (_, i) =>
      `<div class="${id}-t${i < take ? ` ${id}-take` : ` ${id}-rest`}" id="${id}-t${i}"></div>`).join("");
    const inner = `
      <div id="${id}-slot" data-layout-allow-overlap><div id="${id}-kicker" class="sz-body"><span>${rich(p.kicker)}</span></div><div id="${id}-formula" class="sz-h2"><span>${rich(p.formula, { words: true })}</span></div></div>
      <div id="${id}-total" class="num" data-accent>${formatNumber(p.partValue)}</div>
      <div id="${id}-totalLbl" class="sz-label">${rich(p.totalLabel)}</div>
      <div id="${id}-grid">${tiles}</div>
      <div id="${id}-legend" class="sz-body"><span id="${id}-sw"></span><span class="txt">${rich(p.legend)}</span></div>`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:26px" });
    const extra = `
#${id}-slot{position:relative;width:100%;height:110px}
#${id}-slot > div{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
#${id}-kicker{color:${color.muted}}
#${id}-total{font-size:140px;font-weight:800;line-height:1;color:${color.ink}}
#${id}-grid{display:grid;grid-template-columns:repeat(${cols},${tile}px);gap:${gap}px;margin:18px 0 6px}
#${id}-grid > div{width:${tile}px;height:${tile}px;border-radius:${tile / 7}px;border:4px solid ${color.ink};background:transparent}
#${id}-legend{display:flex;align-items:center;gap:18px}
#${id}-sw{width:44px;height:44px;border-radius:9px;background:${color.accent};display:inline-block}`;
    const tTake = ctx.at(p.at.take);
    const tTotal = ctx.at(p.at.total);
    const tFormula = ctx.at(p.at.formula);
    const land = tTotal + 0.95;
    const js = [groundIn(ctx),
      `FB.blurLine(tl, "#${id}-kicker", 0.05);`,
      `FB.pop(tl, "#${id}-grid", 0.15, { child: "div", from: 0.4, stagger: 0.04, dur: 0.35 });`,
      `FB.exit(tl, "#${id}-kicker", ${tFormula - 0.15}, { dur: 0.15 });`,
      `FB.blurWords(tl, "#${id}-formula", ${tFormula});`,
      // حصة المستثمر
      `FB.fill(tl, "#${id}-grid", ${tTake}, { child: ".${id}-take", from: "rgba(0,0,0,0)", to: "${color.accent}" });`,
      `tl.fromTo(".${id}-take", { borderColor: "${color.ink}" }, { borderColor: "${color.accent}", duration: 0.18 }, ${tTake});`,
      `FB.rise(tl, "#${id}-legend", ${tTake + 0.1}, { y: 24, dur: 0.45 });`,
      // الشركة كلها
      `FB.fill(tl, "#${id}-grid", ${tTotal}, { child: ".${id}-rest", from: "rgba(0,0,0,0)", to: "${color.ink}", stagger: 0.07 });`,
      `tl.to(".${id}-take", { backgroundColor: "${color.ink}", borderColor: "${color.ink}", duration: 0.3 }, ${land - 0.1});`,
      `tl.to("#${id}-sw", { backgroundColor: "${color.ink}", duration: 0.3 }, ${land - 0.1});`,
      `tl.fromTo("#${id}-total", { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5, ease: "expo.out" }, ${tTotal});`,
      `FB.count(tl, "#${id}-total", ${p.partValue}, ${p.totalValue}, ${tTotal}, { dur: 0.95 });`,
      `tl.to("#${id}-total", { color: "${color.accent}", duration: 0.2 }, ${land});`,
      `tl.fromTo("#${id}-total", { scale: 1 }, { scale: 1.06, duration: 0.12, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false }, ${land});`,
      `FB.blurLine(tl, "#${id}-totalLbl", ${tTotal + 0.2});`,
      exitAll(ctx)];
    ctx.cue("pop", tTake + 0.03);
    ctx.cue("riser", land, { lead: true, volume: 0.28 });
    ctx.cue("impact-bass-1", land, { volume: 0.4 });
    return { css: css + extra, html, js: js.join("\n") };
  },
};
