// Illustrated scene: حاجة من الحياة اليومية مرسومة (محل، مصنع، عربية، كاشير…) وأجزاءها بتتحرك
// مع الكلام. بيدّي الحلقة "روح": المشاهد شايف حاجة يعرفها، مش نص على الشاشة بس.
import { frame, groundIn, exitAll, camera, rich, esc, color } from "./common.mjs";
import { PROPS, roomSvg } from "../props/library.mjs";

export default {
  type: "illustrated", family: "illustration",
  build(ctx) {
    const { id, p } = ctx;
    const props = (p.props ?? []).map((pr, i) => {
      const pid = `${id}-p${i}`;
      const def = PROPS[pr.type];
      if (!def) throw new Error(`prop مش معروف: ${pr.type} (المتاح: ${Object.keys(PROPS).join(", ")})`);
      const d = def(pid, pr.opts ?? {});
      const sc = pr.scale ?? 1;
      const w = Math.round(d.w * sc), h = Math.round(d.h * sc);
      return { ...pr, pid, d, w, h, left: Math.round((pr.x ?? 540) - w / 2), top: Math.round((pr.y ?? 1200) - h) };
    });
    const propsHtml = props.map((q) => `
      <div id="${q.pid}" class="${id}-prop" style="left:${q.left}px;top:${q.top}px;width:${q.w}px;height:${q.h}px" data-layout-ignore>
        <div class="${id}-shadow" style="width:${Math.round(q.w * 0.8)}px"></div>
        <svg width="${q.w}" height="${q.h}" viewBox="0 0 ${q.d.w} ${q.d.h}" direction="ltr" style="overflow:visible;direction:ltr">${q.d.svg}</svg>
      </div>`).join("");
    const calls = (p.callouts ?? []).map((c, i) => `<div class="${id}-call${c.hl ? ` ${id}-hl` : ""}" id="${id}-c${i}" style="left:${c.x - 230}px;top:${c.y}px"${c.hl ? " data-accent" : ""}>${rich(c.text)}</div>`).join("");
    const inner = p.title ? `<div id="${id}-title" class="sz-h2">${rich(p.title, { words: true })}</div>` : "";
    const { css, html } = frame(ctx, inner, { stageCss: "justify-content:flex-start", layout: "start" });
    const extra = `
.${id}-prop{position:absolute}
.${id}-shadow{position:absolute;left:10%;bottom:-14px;height:28px;border-radius:50%;background:#14141418}
.${id}-call{position:absolute;width:460px;text-align:center;font-size:40px;font-weight:700;line-height:1.3;background:${color.card};border:4px solid ${color.ink};border-radius:20px;padding:14px 18px;box-shadow:6px 6px 0 ${color.ink}}
.${id}-hl{background:${color.accent};color:${color.paper}}`;
    const room = p.set === "plain" ? "" : roomSvg(id);
    const js = [groundIn(ctx)];
    if (p.title) js.push(`FB.blurWords(tl, "#${id}-title", 0.1);`);
    for (const q of props) {
      const t = ctx.at(q.at ?? 0.2);
      const sel = `#${q.pid}`;
      if (q.enter === "drive") {
        js.push(`tl.fromTo("${sel}", { x: -1100 }, { x: 0, duration: 1.1, ease: "power3.out" }, ${t});`);
        js.push(`tl.fromTo(["#${q.pid}-w0","#${q.pid}-w1"], { rotation: -720 }, { rotation: 0, duration: 1.1, ease: "power3.out" }, ${t});`);
        ctx.cue("whoosh", t + 0.25, { volume: 0.22 });
      } else if (q.enter === "drop") {
        js.push(`tl.fromTo("${sel}", { y: -260, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "bounce.out" }, ${t});`);
        ctx.cue("pop", t + 0.35, { volume: 0.22 });
      } else if (q.enter !== "none") {
        js.push(`tl.fromTo("${sel}", { y: 60, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" }, ${t});`);
      }
      for (const a of q.anim ?? []) {
        const ta = ctx.at(a.at ?? q.at ?? 0.4) + (a.at == null ? 0.6 : 0);
        if (a.type === "smoke") js.push(`tl.fromTo(".${q.pid}-puff", { y: 0, opacity: 1, scale: 1 }, { y: -60, opacity: 0.25, scale: 1.25, duration: 1.6, ease: "none", stagger: 0.5, repeat: ${Math.max(1, Math.floor(ctx.dur / 1.6))} }, ${ta});`);
        if (a.type === "drawer") { js.push(`tl.fromTo("#${q.pid}-drawer", { y: 0 }, { y: 34, duration: 0.3, ease: "back.out(2)" }, ${ta});`); ctx.cue("click", ta + 0.05, { volume: 0.25 }); }
        if (a.type === "display" && a.to != null) js.push(`FB.countFmt(tl, "#${q.pid}-display", ${a.from ?? 0}, ${a.to}, ${ta}, { style: ${JSON.stringify(a.style ?? "full")}, dur: ${a.dur ?? 1} });`);
        if (a.type === "notes") (q.opts?.notes ?? [0, 1, 2]).forEach((_, k) => { js.push(`FB.pop(tl, "#${q.pid}-n${k}", ${ta + k * 0.45}, { from: 0.7, dur: 0.35 });`); ctx.cue("pop", ta + k * 0.45 + 0.05, { volume: 0.16 }); });
        if (a.type === "glow") js.push(`tl.fromTo("#${q.pid}-glow", { opacity: 0.15 }, { opacity: 0.75, duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: ${Math.max(1, Math.floor(ctx.dur / 0.8) - 1)} }, ${ta});`);
        if (a.type === "stamp") { js.push(`FB.stamp(tl, "#${q.pid}-stamp", ${ta}, { rot: 0 });`); ctx.cue("pop", ta + 0.05, { volume: 0.28 }); }
        if (a.type === "boxes-out") js.push(`tl.to(".${q.pid}-box", { y: -40, opacity: 0, duration: 0.35, ease: "power3.in", stagger: 0.12 }, ${ta});`);
        if (a.type === "boxes-in") js.push(`tl.fromTo(".${q.pid}-box", { y: -200, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "bounce.out", stagger: 0.15 }, ${ta});`);
        if (a.type === "coins") js.push(`tl.fromTo(["#${q.pid}-coin0","#${q.pid}-coin1","#${q.pid}-coin2"], { y: -300, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "bounce.out", stagger: 0.18 }, ${ta});`);
        if (a.type === "drive-out") { js.push(`tl.to("${sel}", { x: 1200, duration: 1.0, ease: "power3.in" }, ${ta});`, `tl.to(["#${q.pid}-w0","#${q.pid}-w1"], { rotation: 720, duration: 1.0, ease: "power3.in" }, ${ta});`); ctx.cue("whoosh-short", ta + 0.5, { volume: 0.2 }); }
        if (a.type === "shake") js.push(`tl.fromTo("${sel}", { rotation: 0 }, { rotation: 2, duration: 0.08, yoyo: true, repeat: 5, ease: "sine.inOut", immediateRender: false }, ${ta});`);
      }
    }
    (p.callouts ?? []).forEach((c, i) => {
      const t = ctx.at(c.at ?? 1);
      js.push(`FB.pop(tl, "#${id}-c${i}", ${t}, { from: 0.75, dur: 0.4 });`);
      ctx.cue(c.hl ? "pop" : "click-soft", t + 0.05, { volume: 0.2 });
      if (c.hl) js.push(camera(ctx, t));
    });
    js.push(exitAll(ctx));
    const gEnd = html.indexOf("</div>") + 6; // بعد الـ ground
    return { css: css + extra, html: html.slice(0, gEnd) + room + propsHtml + html.slice(gEnd) + calls, js: js.join("\n") };
  },
};
