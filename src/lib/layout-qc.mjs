// Layout QC: بيفتح كل مشهد في Chrome، يعمل seek لأوقات مختلفة، ويقيس كل نص ظاهر:
// safe zones، خروج النص برّه الصندوق (overflow)، تداخل نصين، وأصغر حجم خط.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { W, H, safe } from "./brand.mjs";

const LIMITS = {
  uiTop: 168,          // شريط الحالة والبحث
  uiBottom: 1330,      // كابشن التطبيق واسم الحساب
  sideMin: 60,         // أقل هامش جانبي مسموح للنص
  rail: { x: 1000, y: 950 }, // عمود أزرار التطبيق على اليمين
  minFont: 28,
};

function chromePath() {
  if (process.env.FB_CHROME) return process.env.FB_CHROME;
  const r = spawnSync("npx", ["hyperframes", "browser", "path"], { encoding: "utf8" });
  const p = (r.stdout || "").trim().split("\n").pop();
  if (p && fs.existsSync(p)) return p;
  for (const c of ["/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"])
    if (fs.existsSync(c)) return c;
  return null;
}

function harness(proj, file, id) {
  const src = fs.readFileSync(path.join(proj, "compositions", file), "utf8");
  const inner = src.replace(/^[\s\S]*?<template>/, "").replace(/<\/template>[\s\S]*$/, "");
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<script src="../assets/vendor/gsap.min.js"></script><script src="../assets/vendor/fx.js"></script>
<script>window.__timelines = {}; window.FB_INTENSITY = 1;</script>
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px;overflow:hidden;background:#F4EEE3}
#host{position:relative;width:${W}px;height:${H}px}</style></head>
<body><div id="host">${inner.replace(/url\('assets\//g, "url('../assets/")}</div></body></html>`;
}

const MEASURE = (L) => {
  const out = [];
  const vis = (el) => {
    let o = 1;
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden") return 0;
      o *= Number(cs.opacity);
    }
    return o;
  };
  const texts = [...document.querySelectorAll("#host *")].filter((el) =>
    [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !el.closest("svg"));
  const boxes = [];
  for (const el of texts) {
    const o = vis(el);
    if (o < 0.6) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const label = el.textContent.trim().slice(0, 40);
    const fs = parseFloat(getComputedStyle(el).fontSize);
    boxes.push({ el, r, label });
    if (r.top < L.uiTop) out.push(["error", `"${label}" فوق y=${L.uiTop} (تحت شريط التطبيق)`]);
    if (r.bottom > L.uiBottom) out.push(["error", `"${label}" تحت y=${L.uiBottom} (تحت كابشن التطبيق) — bottom=${Math.round(r.bottom)}`]);
    if (r.left < L.sideMin || r.right > 1080 - L.sideMin) out.push(["error", `"${label}" قريب من حرف الشاشة (x ${Math.round(r.left)}–${Math.round(r.right)})`]);
    else if (r.right > L.rail.x && r.bottom > L.rail.y) out.push(["warn", `"${label}" تحت عمود أزرار التطبيق (right=${Math.round(r.right)}, bottom=${Math.round(r.bottom)})`]);
    if (fs < L.minFont) out.push(["warn", `"${label}" خطه ${fs}px — أصغر من ${L.minFont}`]);
    if (el.scrollWidth > el.clientWidth + 3 && getComputedStyle(el).overflow !== "visible") out.push(["error", `"${label}" النص خارج من الصندوق بتاعه`]);
  }
  // النص خارج من الـ stage
  for (const stage of document.querySelectorAll("[id$='-stage']")) {
    const s = stage.getBoundingClientRect();
    for (const b of boxes) if (stage.contains(b.el) && (b.r.top < s.top - 4 || b.r.bottom > s.bottom + 4))
      out.push(["error", `"${b.label}" طالع برّه مساحة المحتوى (stage) — top=${Math.round(b.r.top)} bottom=${Math.round(b.r.bottom)}`]);
  }
  // تداخل نصين
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    if (a.el.closest("[data-layout-allow-overlap]") && a.el.closest("[data-layout-allow-overlap]") === b.el.closest("[data-layout-allow-overlap]")) continue;
    const ix = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
    const iy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (ix > 4 && iy > 4) {
      const area = ix * iy, small = Math.min(a.r.width * a.r.height, b.r.width * b.r.height);
      if (area / small > 0.12) out.push(["error", `تداخل: "${a.label}" فوق "${b.label}"`]);
    }
  }
  return out;
};

export async function measureLayout(proj, composed) {
  const exe = chromePath();
  if (!exe) return { findings: [{ level: "warn", msg: "Layout QC اتعمل skip: مش لاقي Chrome (حط المسار في FB_CHROME)" }] };
  let puppeteer;
  try { puppeteer = (await import("puppeteer-core")).default; }
  catch { return { findings: [{ level: "warn", msg: "Layout QC اتعمل skip: puppeteer-core مش متسطب" }] }; }
  const qcDir = path.join(proj, ".qc");
  fs.mkdirSync(qcDir, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ["--no-sandbox", "--allow-file-access-from-files", "--font-render-hinting=none"] });
  const findings = [];
  const seen = new Set();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H });
    const targets = [...composed.scenes.map((s) => ({ id: s.id, file: `${s.id}.html`, times: [0.25, 0.5, 0.75].map((f) => s.dur * f).concat([Math.max(0, s.dur - 0.35)]) })),
      { id: "captions", file: "captions.html", times: composed.captions.map((g) => g.end - 0.12) },
      { id: "chrome", file: "chrome.html", times: [1] }];
    for (const tg of targets) {
      const hp = path.join(qcDir, `${tg.id}.html`);
      fs.writeFileSync(hp, harness(proj, tg.file, tg.id));
      await page.goto("file://" + hp, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      for (const t of tg.times) {
        const res = await page.evaluate((id, t, L, M) => {
          const tl = window.__timelines[id];
          if (!tl) return [["error", `timeline "${id}" مش متسجل`]];
          tl.seek(t, false);
          // eslint-disable-next-line no-new-func
          return new Function("L", `return (${M})(L)`)(L);
        }, tg.id, t, LIMITS, MEASURE.toString());
        for (const [level, msg] of res) {
          const key = `${tg.id}|${msg.replace(/\d+/g, "#")}`;
          if (seen.has(key)) continue;
          seen.add(key);
          findings.push({ level, msg: `${tg.id} @${t.toFixed(1)}s: ${msg}` });
        }
      }
    }
  } finally { await browser.close(); }
  return { findings };
}
