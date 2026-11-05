// Creative variation: نفس الهوية، إخراج مختلف. كل اختيار deterministic (نفس الحلقة = نفس النتيجة)
// ومبني على seed من رقم الحلقة + رقم المشهد، ومقيّد بإعدادات السلسلة.

export function rng(seedStr) {
  let h = 2166136261;
  for (const c of String(seedStr)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}

const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];

export const LAYOUTS = ["center", "start", "low"];
export const DENSITY = { low: 1.08, medium: 1, high: 0.9 };

// يخطط الإخراج للحلقة كلها: layout + transition + camera لكل مشهد، من غير تكرار ورا بعض.
export function planVariation(episode, series) {
  const c = series.creative ?? {};
  const prefs = c.transitions?.length ? c.transitions : ["blur", "whip", "flood"];
  const plan = [];
  episode.segments.forEach((seg, i) => {
    const r = rng(`${episode.id}:${i}:${seg.scene.type}`);
    const prev = plan[i - 1];
    const ground = seg.scene.ground ?? "paper";
    const prevGround = i > 0 ? episode.segments[i - 1].scene.ground ?? "paper" : null;
    let layout = seg.scene.layout ?? pick(r, LAYOUTS);
    if (prev && layout === prev.layout && !seg.scene.layout) layout = LAYOUTS[(LAYOUTS.indexOf(layout) + 1) % LAYOUTS.length];
    let tIn = seg.scene.transition ?? null;
    if (!tIn) {
      if (i === 0) tIn = "none";
      else if (prevGround !== ground) tIn = "flood";
      else {
        const pool = prefs.filter((t) => t !== "flood" && t !== prev?.tIn);
        tIn = pool.length ? pool[Math.floor(r() * pool.length)] : "blur";
      }
    }
    const camera = seg.scene.camera ?? (r() < 0.35 ? "punch" : "still");
    plan.push({ layout, tIn, camera, ground, prevGround });
  });
  plan.forEach((p, i) => { p.tOut = plan[i + 1]?.tIn ?? "none"; });
  return plan;
}

// "بصمة" التكوين: تتكرر كتير = الفيديو شكله template
export function signature(type, v) {
  return `${type}/${v.layout}/${v.tIn}`;
}
