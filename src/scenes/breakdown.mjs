// Financial breakdown (waterfall): من الإيرادات للربح، أو من post-money لـ pre-money.
// كل سطر بيظهر وانت بتقوله، والعمود بيبدأ من آخر رصيد — فالعين بتشوف الطرح نفسه.
import { frame, groundIn, exitAll, camera, rich, esc, color } from "./common.mjs";

export default {
  type: "breakdown", family: "numbers",
  build(ctx) {
    const { id, p } = ctx;
    const W = 470;
    let run = 0;
    const max = p.max ?? Math.max(...p.rows.map((r) => (r.op === "-" ? 0 : r.value)), ...p.rows.reduce((a, r) => { run = r.op === "-" ? run - r.value : r.op === "=" ? run : r.op === "+" ? run + r.value : r.value; a.push(run); return a; }, []));
    run = 0;
    const rows = p.rows.map((r, i) => {
      let from, to;
      if (r.op === "-") { from = run - r.value; to = run; run -= r.value; }
      else if (r.op === "+") { from = run; to = run + r.value; run += r.value; }
      else if (r.op === "=") { from = 0; to = r.value ?? run; run = to; }
      else { from = 0; to = r.value; run = r.value; }
      const right = Math.round((from / max) * W), width = Math.max(6, Math.round(((to - from) / max) * W));
      const fill = r.hl ? color.accent : r.op === "-" ? color.muted : color.ink;
      return { i, r, right, width, fill };
    });
    const inner = `
      ${p.title ? `<div id="${id}-title" class="sz-h2">${rich(p.title, { words: true })}</div>` : ""}
      <div id="${id}-rows">${rows.map(({ i, r, right, width, fill }) => `
        <div class="${id}-row${r.op === "=" ? ` ${id}-res` : ""}" id="${id}-r${i}"${r.hl ? " data-accent" : ""}>
          <div class="${id}-lbl">${r.op && r.op !== "=" ? `<b>${r.op === "-" ? "−" : "+"}</b> ` : ""}${rich(r.label)}</div>
          <div class="${id}-track"><i id="${id}-b${i}" style="right:${right}px;width:${width}px;background:${fill}"></i></div>
          <div class="${id}-val num" id="${id}-v${i}">${esc(r.display ?? r.value.toLocaleString("en-US"))}</div>
        </div>`).join("")}
      </div>
      ${p.unit ? `<div id="${id}-unit" class="sz-label">${rich(p.unit)}</div>` : ""}
      ${p.note ? `<div id="${id}-note" class="sz-body">${rich(p.note, { words: true })}</div>` : ""}`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:34px" });
    const ink = ctx.ground === "ink" ? color.paper : color.ink;
    const extra = `
#${id}-rows{display:flex;flex-direction:column;gap:30px;width:100%}
.${id}-row{display:grid;grid-template-columns:250px ${W}px 1fr;align-items:center;gap:18px;font-size:38px;font-weight:600}
.${id}-res{border-top:4px solid ${ink};padding-top:24px}
.${id}-lbl{text-align:right;line-height:1.25}
.${id}-lbl b{color:${color.muted}}
.${id}-track{position:relative;height:54px}
.${id}-track i{position:absolute;top:0;height:100%;border-radius:8px;display:block}
.${id}-val{text-align:left;font-size:44px;font-weight:800}
.${id}-res .${id}-val{font-size:54px}`;
    const js = [groundIn(ctx)];
    if (p.title) js.push(`FB.blurWords(tl, "#${id}-title", 0.1);`);
    let last = 0;
    rows.forEach(({ i, r }) => {
      const t = ctx.at(r.at ?? 0.3 + i * 0.6); last = Math.max(last, t);
      js.push(`FB.blurLine(tl, "#${id}-r${i} .${id}-lbl", ${t});`);
      js.push(`FB.barTo(tl, "#${id}-b${i}", ${t + 0.05}, 1, { origin: "${r.op === "-" ? "left" : "right"} center", dur: 0.55 });`);
      js.push(`FB.blurLine(tl, "#${id}-v${i}", ${t + 0.35});`);
      ctx.cue(r.op === "=" ? "pop" : "click-soft", t + 0.38, { volume: r.op === "=" ? 0.3 : 0.2 });
    });
    if (p.unit) js.push(`FB.blurLine(tl, "#${id}-unit", 0.6);`);
    if (p.note) js.push(`FB.inkWords(tl, "#${id}-note", ${ctx.at(p.at?.note ?? last + 0.8)}, { to: "${ink}" });`);
    js.push(camera(ctx, last + 0.4), exitAll(ctx));
    return { css: css + extra, html, js: js.join("\n") };
  },
};
