import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "../..");

// البراند (series.json) + إعدادات السلسلة (series/<slug>.json). السلسلة بتغلب.
export function loadSeries(episode) {
  const brand = JSON.parse(fs.readFileSync(path.join(ROOT, "series.json"), "utf8"));
  const slug = episode?.series ?? "dictionary";
  const f = path.join(ROOT, "series", `${slug}.json`);
  if (!fs.existsSync(f)) throw new Error(`series "${slug}" مش موجودة في series/`);
  const s = JSON.parse(fs.readFileSync(f, "utf8"));
  return { ...brand, ...s, mix: { ...brand.mix, ...s.mix }, hashtags: [...(s.hashtags ?? []), ...(brand.hashtags ?? [])] };
}

export function findEpisodeDir(idArg) {
  const id = String(idArg ?? "").padStart(3, "0");
  const dir = fs.readdirSync(path.join(ROOT, "episodes")).find((d) => d.startsWith(id + "-"));
  if (!dir) throw new Error(`مفيش حلقة رقم ${id} في episodes/`);
  return path.join(ROOT, "episodes", dir);
}

export function loadEpisode(dir) {
  const ep = JSON.parse(fs.readFileSync(path.join(dir, "episode.json"), "utf8"));
  for (const k of ["id", "number", "term", "segments", "cover"]) if (!ep[k]) throw new Error(`episode.json ناقصه "${k}"`);
  ep.segments.forEach((s, i) => {
    if (!s.say || !s.scene?.type) throw new Error(`الجزء ${i + 1} محتاج "say" و "scene.type"`);
  });
  return ep;
}

export function findVoice(dir) {
  for (const f of ["voice.wav", "voice.mp3", "voice.m4a"]) if (fs.existsSync(path.join(dir, f))) return path.join(dir, f);
  return null;
}

export function listEpisodeDirs() {
  const dir = path.join(ROOT, "episodes");
  return fs.readdirSync(dir).filter((d) => /^\d{3}-/.test(d) && fs.existsSync(path.join(dir, d, "episode.json"))).sort().map((d) => path.join(dir, d));
}
