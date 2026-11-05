// الـ Cover: Hook كبير + المصطلح + هوية السلسلة. الكلام المهم في النص عشان قص الـ grid (1:1 و 3:4 و 4:5).
import fs from "node:fs";
import path from "node:path";
import { W, H, color, baseCss } from "./brand.mjs";
import { rich, esc } from "./text.mjs";
import { fitLatin } from "../scenes/common.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");

export function composeCover({ episode, series, outDir }) {
  const proj = path.join(outDir, "cover-project");
  fs.rmSync(proj, { recursive: true, force: true });
  fs.mkdirSync(path.join(proj, "assets/fonts"), { recursive: true });
  for (const f of ["ReadexPro-Variable.ttf", "Inter-Variable.ttf"])
    fs.copyFileSync(path.join(ROOT, "brand/fonts", f), path.join(proj, "assets/fonts", f));
  const c = episode.cover;
  const hook = c.hook.split("\n").map((l) => `<div>${rich(l).replace(/<span class="hl">/g, '<span class="mark">')}</div>`).join("");
  const en = episode.term.en.toUpperCase();
  const motif = c.motif ?? { cells: 10, take: 1 };
  const tiles = Array.from({ length: motif.cells }, (_, i) => `<i class="${i < motif.take ? "on" : ""}"></i>`).join("");
  const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=${W}, height=${H}">
<style>
${baseCss().replace(/#root/g, "#cover")}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${color.paper}}
#cover{position:absolute;inset:0;background:${color.paper};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;text-align:center}
#cover .ep{display:flex;gap:16px;align-items:center;font-size:36px;font-weight:700}
#cover .ep b{background:${color.ink};color:${color.paper};padding:8px 26px;border-radius:40px;font-weight:700}
#cover .hook{margin-top:70px;font-size:122px;font-weight:700;line-height:1.3;color:${color.ink}}
#cover .mark{background:${color.accent};color:${color.paper};padding:0 18px;border-radius:14px}
#cover .band{margin-top:80px;background:${color.ink};padding:34px 70px 40px;transform:rotate(-2deg);border-radius:6px}
#cover .band .en{font-size:${fitLatin(en, 760, 120)}px;font-weight:900;color:${color.paper};line-height:1}
#cover .band .ar{font-size:44px;font-weight:600;color:${color.paper};margin-top:10px}
#cover .tiles{margin-top:80px;display:grid;grid-template-columns:repeat(5,64px);gap:12px}
#cover .tiles i{display:block;width:64px;height:64px;border:4px solid ${color.ink};border-radius:12px}
#cover .tiles i.on{background:${color.accent};border-color:${color.accent}}
#cover .series{position:absolute;bottom:330px;font-size:40px;font-weight:700}
#cover .series .dot{display:inline-block;width:16px;height:16px;border-radius:50%;background:${color.accent};margin-inline-start:12px}
</style></head>
<body><div id="cover" data-composition-id="cover" data-width="${W}" data-height="${H}" data-start="0" data-duration="1" data-no-timeline>
  <div class="ep"><b>الحلقة <span class="num">${String(episode.number).padStart(2, "0")}</span></b></div>
  <div class="hook">${hook}</div>
  <div class="band"><div class="en">${esc(en)}</div><div class="ar">${rich(c.sub ?? episode.term.ar)}</div></div>
  <div class="tiles">${tiles}</div>
  <div class="series">${esc(series.name)}<span class="dot"></span></div>
</div></body></html>`;
  fs.writeFileSync(path.join(proj, "index.html"), html);
  fs.writeFileSync(path.join(proj, "meta.json"), JSON.stringify({ id: `fb-cover-${episode.id}`, name: "cover" }));
  return proj;
}
