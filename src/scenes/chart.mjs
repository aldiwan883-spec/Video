// Chart: أعمدة أو خط. بيترسم بترتيب القراية: المحور → البيانات → تعليق واحد على النقطة المهمة.
import { frame, groundIn, exitAll, camera, rich, esc, color } from "./common.mjs";

export default {
  type: "chart", family: "numbers",
  build(ctx) {
    const { id, p } = ctx;
    const ink = ctx.ground === "ink" ? color.paper : color.ink;
    const data = p.data, n = data.length, H = 470, W = 888;
    const max = p.max ?? Math.max(...data.map((d) => d.value));
    const hlIdx = data.findIndex((d) => d.hl);
    let plot;
    if ((p.kind ?? "bar") === "line") {
      const pts = data.map((d, i) => [Math.round(40 + (i * (W - 80)) / (n - 1)), Math.round(H - (d.value / max) * (H - 40))]);
      plot = `<svg id="${id}-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="overflow:visible">
        <path id="${id}-line" d="M${pts.map((q) => q.join(" ")).join(" L")}" stroke="${ink}" stroke-width="7" fill="none" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
        ${pts.map((q, i) => `<circle class="${id}-pt" id="${id}-pt${i}" cx="${q[0]}" cy="${q[1]}" r="${i === hlIdx ? 16 : 11}" fill="${i === hlIdx ? color.accent : ink}"/>`).join("")}
      </svg>
      <div id="${id}-labels" style="display:flex;justify-content:space-between;width:${W}px;direction:ltr">${data.map((d, i) => `<div class="${id}-x"><div class="num v" id="${id}-v${i}">${esc(d.display ?? d.value)}</div><div class="k">${rich(d.label)}</div></div>`).join("")}</div>`;
    } else {
      const bw = Math.min(150, Math.floor((W - (n - 1) * 30) / n));
      plot = `<div id="${id}-bars" style="height:${H}px">${data.map((d, i) => `
        <div class="${id}-c"><div class="num v" id="${id}-v${i}">${esc(d.display ?? d.value)}</div>
        <div class="${id}-bar" id="${id}-b${i}" style="width:${bw}px;height:${Math.max(8, Math.round((d.value / max) * (H - 80)))}px;background:${i === hlIdx ? color.accent : d.muted ? color.muted : ink}"></div></div>`).join("")}</div>
        <div id="${id}-axis"></div>
        <div id="${id}-labels" style="display:flex;gap:30px;direction:ltr">${data.map((d) => `<div class="k" style="width:${bw}px">${rich(d.label)}</div>`).join("")}</div>`;
    }
    const inner = `
      ${p.title ? `<div id="${id}-title" class="sz-h2">${rich(p.title, { words: true })}</div>` : ""}
      <div id="${id}-plot"${hlIdx >= 0 ? " data-accent" : ""}>${plot}</div>
      ${p.annotation ? `<div id="${id}-ann" class="sz-body">${rich(p.annotation, { words: true })}</div>` : ""}`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:30px" });
    const extra = `
#${id}-plot{display:flex;flex-direction:column;align-items:center;gap:14px}
#${id}-bars{display:flex;gap:30px;align-items:flex-end;direction:ltr}
.${id}-c{display:flex;flex-direction:column;align-items:center;gap:10px}
.${id}-bar{border-radius:12px 12px 0 0}
#${id}-axis{width:${W}px;height:4px;background:${ink}}
#${id}-plot .v{font-size:40px;font-weight:800;direction:ltr}
#${id}-plot .k{font-size:30px;font-weight:600;color:${color.muted};text-align:center;direction:rtl}
.${id}-x{display:flex;flex-direction:column;align-items:center}`;
    const td = ctx.at(p.at?.draw ?? 0.3);
    const js = [groundIn(ctx), p.title ? `FB.blurWords(tl, "#${id}-title", 0.05);` : ""];
    if ((p.kind ?? "bar") === "line") {
      js.push(`tl.fromTo("#${id}-line", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: ${0.4 + n * 0.25}, ease: "power2.inOut" }, ${td});`);
      data.forEach((_, i) => { js.push(`FB.pop(tl, "#${id}-pt${i}", ${td + 0.1 + i * 0.25}, { dur: 0.3 });`, `FB.blurLine(tl, "#${id}-v${i}", ${td + 0.2 + i * 0.25});`); });
    } else {
      js.push(`FB.drawX(tl, "#${id}-axis", ${td - 0.2}, { origin: "center center", dur: 0.3 });`);
      data.forEach((_, i) => { js.push(`FB.growY(tl, "#${id}-b${i}", ${td + i * 0.18}, { dur: 0.6 });`, `FB.blurLine(tl, "#${id}-v${i}", ${td + i * 0.18 + 0.45});`); });
    }
    ctx.cue("whoosh-short", td, { volume: 0.18 });
    if (p.annotation) { const t = ctx.at(p.at?.annotation ?? td + 1.5); js.push(`FB.blurWords(tl, "#${id}-ann", ${t});`, camera(ctx, t)); }
    js.push(exitAll(ctx));
    return { css: css + extra, html, js: js.join("\n") };
  },
};
