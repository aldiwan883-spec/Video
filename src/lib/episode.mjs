import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "../..");

export function loadSeries() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "series.json"), "utf8"));
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
