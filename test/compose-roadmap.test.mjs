import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { listEpisodeDirs, loadEpisode, loadSeries } from "../src/lib/episode.mjs";
import { buildTimeline } from "../src/lib/timing.mjs";
import { composeEpisode } from "../src/lib/compose.mjs";
import { planVariation } from "../src/lib/variation.mjs";
import { assetReport, captionReport } from "../src/lib/qc.mjs";
import { SCENES } from "../src/scenes/index.mjs";

const haveSounds = fs.existsSync("public/sounds/manifest.json");

test("every episode composes (scene types, anchors, assets, captions)", { skip: !haveSounds && "run npm run setup" }, () => {
  for (const dir of listEpisodeDirs()) {
    const ep = loadEpisode(dir);
    const series = loadSeries(ep);
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "fb-"));
    const c = composeEpisode({ episode: ep, series, timeline: buildTimeline(ep, null), outDir: out });
    assert.equal(c.scenes.length, ep.segments.length);
    assert.deepEqual(assetReport(c.proj).filter((f) => f.level === "error"), [], `${ep.id} assets`);
    assert.deepEqual(captionReport(c).filter((f) => f.level === "error"), [], `${ep.id} captions`);
    for (const s of c.scenes) assert.ok(s.accents <= 2, `${ep.id} ${s.id} accents ${s.accents}`);
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test("variation plan is deterministic and never repeats a layout back-to-back", () => {
  for (const dir of listEpisodeDirs()) {
    const ep = loadEpisode(dir), s = loadSeries(ep);
    const a = planVariation(ep, s), b = planVariation(ep, s);
    assert.deepEqual(a, b);
    for (let i = 1; i < a.length; i++) if (!ep.segments[i].scene.layout) assert.notEqual(a[i].layout, a[i - 1].layout);
    a.forEach((p, i) => { if (i && p.ground !== p.prevGround) assert.equal(p.tIn, "flood"); });
  }
});

test("roadmap: 100 episodes, valid schema, prerequisites exist, 5 pilots", () => {
  const all = [1, 2, 3, 4, 5].flatMap((n) => JSON.parse(fs.readFileSync(`docs/roadmap/data/S${n}.json`, "utf8")));
  assert.equal(all.length, 100);
  const ids = new Set(all.map((e) => e.id));
  assert.equal(ids.size, 100);
  for (const e of all) {
    for (const k of ["title", "hook", "objective", "key_concepts", "case", "non_obvious_insight", "prerequisites", "format", "closing_question", "research", "ratings"]) assert.ok(e[k] != null && e[k] !== "", `${e.id} missing ${k}`);
    for (const p of e.prerequisites) assert.ok(ids.has(p), `${e.id} prereq ${p} unknown`);
    for (const f of e.format) assert.ok(SCENES[f], `${e.id} format ${f} not a scene type`);
    for (const r of Object.values(e.ratings)) assert.ok(Number.isInteger(r) && r >= 1 && r <= 5);
  }
  assert.deepEqual(all.filter((e) => e.pilot).map((e) => e.id).sort(), ["S1-01", "S2-03", "S3-07", "S4-02", "S5-02"]);
});
