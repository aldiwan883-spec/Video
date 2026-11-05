// Motion system — كل حركة ليها دور. بتتنادى من جوه المشاهد: FB.blurWords(tl, "#id", t)
(function () {
  const M = { arrive: "expo.out", soft: "power4.out", move: "power2.inOut", leave: "power3.in" };
  const all = (sel, child) => {
    const root = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (!root) throw new Error("FB: missing " + sel);
    return child ? Array.from(root.querySelectorAll(child)) : [root];
  };
  const FB = {
    // كلمة كلمة: blur → واضح (للـ Hooks والجمل)
    blurWords(tl, sel, t, o = {}) {
      tl.fromTo(all(sel, ".w"), { opacity: 0, filter: "blur(8px)" },
        { opacity: 1, filter: "blur(0px)", duration: o.dur ?? 0.22, ease: M.soft, stagger: o.stagger ?? 0.08 }, t);
    },
    // كلمة كلمة من رمادي لأسود، من غير حركة (للتعريفات الهادية)
    inkWords(tl, sel, t, o = {}) {
      tl.fromTo(all(sel, ".w"), { color: o.from ?? "#B5AC9C" },
        { color: (i, el) => (el.classList.contains("hl") ? o.hl ?? "#EC4E2A" : o.to ?? "#141414"),
          duration: 0.25, ease: "none", stagger: o.stagger ?? 0.1 }, t);
    },
    // السطر كله يدخل بـ blur
    blurLine(tl, sel, t, o = {}) {
      tl.fromTo(all(sel), { opacity: 0, filter: `blur(${o.blur ?? 10}px)` },
        { opacity: 1, filter: "blur(0px)", duration: o.dur ?? 0.2, ease: M.soft }, t);
    },
    // حرف حرف (لاتيني بس — العربي متوصّل ومينفعش يتقطع)
    letters(tl, sel, t, o = {}) {
      tl.fromTo(all(sel, ".l"), { opacity: 0.15, filter: "blur(6px)", y: 18 },
        { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.35, ease: M.arrive, stagger: o.stagger ?? 0.05 }, t);
    },
    rise(tl, sel, t, o = {}) {
      tl.fromTo(all(sel), { opacity: 0, y: o.y ?? 50 },
        { opacity: 1, y: 0, duration: o.dur ?? 0.6, ease: M.arrive }, t);
    },
    pop(tl, sel, t, o = {}) {
      tl.fromTo(all(sel, o.child), { opacity: 0, scale: o.from ?? 0.6 },
        { opacity: 1, scale: 1, duration: o.dur ?? 0.45, ease: "back.out(1.5)", stagger: o.stagger ?? 0 }, t);
    },
    stamp(tl, sel, t, o = {}) {
      tl.fromTo(all(sel), { opacity: 0, scale: 1.45, rotation: (o.rot ?? -2) - 5 },
        { opacity: 1, scale: 1, rotation: o.rot ?? -2, duration: 0.32, ease: M.soft }, t);
    },
    drawX(tl, sel, t, o = {}) {
      tl.fromTo(all(sel), { scaleX: 0, transformOrigin: o.origin ?? "right center" },
        { scaleX: 1, duration: o.dur ?? 0.35, ease: o.ease ?? M.move }, t);
    },
    growY(tl, sel, t, o = {}) {
      tl.fromTo(all(sel), { scaleY: 0, transformOrigin: "center bottom" },
        { scaleY: 1, duration: o.dur ?? 0.9, ease: o.ease ?? M.move }, t);
    },
    fill(tl, sel, t, o = {}) {
      tl.fromTo(all(sel, o.child), { backgroundColor: o.from, color: o.inkFrom ?? null },
        { backgroundColor: o.to, color: o.inkTo ?? null, duration: o.dur ?? 0.18, ease: "none", stagger: o.stagger ?? 0 }, t);
    },
    // عدّاد أرقام — tabular nums عشان ميرعشش
    count(tl, sel, from, to, t, o = {}) {
      const el = all(sel)[0];
      const fmt = (v) => Math.round(v).toLocaleString("en-US") + (o.suffix ?? "");
      const st = { v: from };
      tl.fromTo(st, { v: from }, { v: to, duration: o.dur ?? 1.4, ease: o.ease ?? "power3.out",
        onUpdate: () => { el.textContent = fmt(st.v); } }, t);
    },
    // الأرضية بتتغير بدايرة من نص الشاشة
    flood(tl, sel, t, o = {}) {
      tl.fromTo(all(sel), { clipPath: `circle(0% at 50% ${o.y ?? 45}%)` },
        { clipPath: `circle(150% at 50% ${o.y ?? 45}%)`, duration: o.dur ?? 0.55, ease: M.move }, t);
    },
    exit(tl, sel, t, o = {}) {
      tl.to(all(sel), { opacity: 0, filter: "blur(8px)", duration: o.dur ?? 0.2, ease: M.leave }, t);
    },
  };
  window.FB = FB;
})();
