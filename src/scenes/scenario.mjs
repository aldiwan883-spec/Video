// Scenario simulation: "لو غيّرنا متغير واحد… القرار بيتغيّر إزاي؟"
// مؤشر بيتحرك على شريط، والنتايج بتتحسب من جديد قدامك.
import { frame, groundIn, exitAll, camera, rich, esc, color } from "./common.mjs";

export default {
  type: "scenario", family: "numbers",
  build(ctx) {
    const { id, p } = ctx;
    const ink = ctx.ground === "ink" ? color.paper : color.ink;
    const s0 = p.states[0];
    const inner = `
      ${p.title ? `<div id="${id}-title" class="sz-h2">${rich(p.title, { words: true })}</div>` : ""}
      <div id="${id}-var"><div class="${id}-vl">${rich(p.variable.label)}</div>
        <div id="${id}-track"><i id="${id}-fill"></i><div id="${id}-knob"><span id="${id}-kv" class="num">${esc(s0.value)}</span></div></div>
        <div class="${id}-ends num"><span>${esc(p.variable.min ?? "")}</span><span>${esc(p.variable.max ?? "")}</span></div>
      </div>
      <div id="${id}-outs">${p.outputs.map((o, i) => `<div class="${id}-o" id="${id}-o${i}"${o.hl ? " data-accent" : ""}><div class="${id}-ol">${rich(o.label)}</div><div class="${id}-ov num" id="${id}-ov${i}">${esc((o.prefix ?? "") + s0.outputs[i] + (o.suffix ?? ""))}</div></div>`).join("")}</div>
      ${p.verdict ? `<div id="${id}-verdict" class="sz-body">${rich(p.verdict, { words: true })}</div>` : ""}`;
    const { css, html } = frame(ctx, inner, { stageCss: "gap:44px" });
    const extra = `
#${id}-var{width:100%;text-align:right}
.${id}-vl{font-size:40px;font-weight:600;margin-bottom:104px}
#${id}-track{position:relative;height:14px;border-radius:7px;background:${ctx.ground === "ink" ? "#FFFFFF22" : color.ghost};direction:ltr}
#${id}-fill{position:absolute;left:0;top:0;bottom:0;width:100%;background:${ink};border-radius:7px;transform-origin:left center}
#${id}-knob{position:absolute;top:50%;width:0;height:0}
#${id}-knob::before{content:"";position:absolute;left:-22px;top:-22px;width:44px;height:44px;border-radius:50%;background:${color.accent}}
#${id}-kv{position:absolute;left:-90px;width:180px;bottom:34px;text-align:center;font-size:44px;font-weight:800}
.${id}-ends{display:flex;justify-content:space-between;margin-top:14px;font-size:28px;color:${color.muted};direction:ltr}
#${id}-outs{display:grid;grid-template-columns:repeat(${p.outputs.length},1fr);gap:24px;width:100%}
.${id}-o{border:4px solid ${ink};border-radius:22px;padding:24px 14px}
.${id}-o[data-accent]{border-color:${color.accent}}
.${id}-ol{font-size:32px;font-weight:600;color:${color.muted}}
.${id}-ov{font-size:58px;font-weight:800;margin-top:6px}
.${id}-o[data-accent] .${id}-ov{color:${color.accent}}`;
    const js = [groundIn(ctx), p.title ? `FB.blurWords(tl, "#${id}-title", 0.05);` : "",
      `FB.blurLine(tl, "#${id}-var", 0.2);`,
      `FB.knob(tl, "#${id}-knob", 0, ${s0.pos}, ${s0.pos}, { dur: 0.01, first: true });`,
      `tl.fromTo("#${id}-fill", { scaleX: ${s0.pos / 100} }, { scaleX: ${s0.pos / 100}, duration: 0.01 }, 0);`,
      `FB.rise(tl, "#${id}-outs", 0.5, { y: 30 });`];
    p.states.slice(1).forEach((s, k) => {
      const prev = p.states[k];
      const t = ctx.at(s.at);
      js.push(`FB.knob(tl, "#${id}-knob", ${t}, ${prev.pos}, ${s.pos});`);
      js.push(`tl.to("#${id}-fill", { scaleX: ${s.pos / 100}, duration: 0.8, ease: "power2.inOut" }, ${t});`);
      js.push(`tl.set("#${id}-kv", { textContent: ${JSON.stringify(String(s.value))} }, ${t + 0.4});`);
      p.outputs.forEach((o, i) => {
        const a = Number(prev.raw?.[i] ?? NaN), b = Number(s.raw?.[i] ?? NaN);
        if (!Number.isNaN(a) && !Number.isNaN(b)) js.push(`FB.countFmt(tl, "#${id}-ov${i}", ${a}, ${b}, ${t + 0.1}, { style: ${JSON.stringify(o.style ?? "full")}, dp: ${o.dp ?? 1}, prefix: ${JSON.stringify(o.prefix ?? "")}, suffix: ${JSON.stringify(o.suffix ?? "")} });`);
        else js.push(`tl.set("#${id}-ov${i}", { textContent: ${JSON.stringify((o.prefix ?? "") + s.outputs[i] + (o.suffix ?? ""))} }, ${t + 0.45});`);
      });
      ctx.cue("click-soft", t + 0.05, { volume: 0.2 });
      ctx.cue("pop", t + 0.9, { volume: 0.22 });
      js.push(camera(ctx, t + 0.9));
    });
    if (p.verdict) js.push(`FB.blurWords(tl, "#${id}-verdict", ${ctx.at(p.at?.verdict ?? 4)});`);
    js.push(exitAll(ctx));
    return { css: css + extra, html, js: js.join("\n") };
  },
};
