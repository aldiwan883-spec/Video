import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { align } from "../src/lib/voice.mjs";
import { eduReview, evalCalc } from "../src/lib/edu-qc.mjs";

test("align: script words get times from heard words, numbers spoken as words match", () => {
  const ep = { segments: [{ say: "عايز 2 مليون مقابل 10%" }, { say: "يبقى الشركة بـ 20 مليون" }] };
  const heard = ["عايز", "اثنان", "مليون", "مقابل", "عشرة", "في", "المئة", "يبقى", "الشركه", "بعشرون", "مليون"]
    .map((text, i) => ({ text, start: i * 0.5, end: i * 0.5 + 0.4 }));
  const a = align(ep, heard);
  assert.equal(a.segments[0].words.length, 5);
  assert.equal(a.segments[0].words[1].start, 0.5); // "2" ← "اثنان"
  assert.ok(a.score >= 0.7, `score ${a.score}`);
  const w = a.segments.flatMap((s) => s.words);
  for (let i = 1; i < w.length; i++) assert.ok(w[i].start >= w[i - 1].start);
});

test("align: unmatched words are interpolated, never missing", () => {
  const ep = { segments: [{ say: "كلمة غريبة جداً هنا" }] };
  const a = align(ep, [{ text: "كلمة", start: 0, end: 0.3 }, { text: "هنا", start: 2, end: 2.3 }]);
  assert.ok(a.segments[0].words.every((x) => Number.isFinite(x.start) && x.end > x.start));
});

test("evalCalc: percentages and refuses code", () => {
  assert.equal(evalCalc("2000000 / 10%"), 20000000);
  assert.throws(() => evalCalc("process.exit()"));
});

test("edu gate: every pilot passes, a definition-only script is rejected", () => {
  for (const d of ["001-valuation", "203-hurdle-rate", "307-due-diligence", "402-costco-membership", "502-validation"]) {
    const ep = JSON.parse(fs.readFileSync(`episodes/${d}/episode.json`, "utf8"));
    const r = eduReview(ep, { targetDuration: [60, 75] });
    assert.ok(r.passed, `${d}: ${r.issues.map((i) => i.key).join(",")}`);
  }
  const weak = { id: "x", segments: [{ say: "ده اسمه Valuation يعني التقييم", scene: { type: "term" } }, { say: "لو حد طلب مليون مقابل 25% قيّم شركته بكام؟", scene: { type: "quiz", question: "1,000,000 مقابل 25%", ask: "قيّم شركته بكام؟" } }] };
  const r = eduReview(weak, {});
  assert.equal(r.passed, false);
  assert.ok(r.issues.some((i) => i.key === "quiz"), "calculator quiz must be flagged");
});

test("edu gate catches a wrong calculation", () => {
  const ep = JSON.parse(fs.readFileSync("episodes/001-valuation/episode.json", "utf8"));
  ep.edu.calcs.push({ label: "wrong", expr: "18000000 / 4000000", expect: 5 });
  assert.equal(eduReview(ep, {}).checks.find((c) => c.key === "calcs").ok, false);
});
