import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, tokenize, rich } from "../src/lib/text.mjs";
import { buildTimeline, findAnchor } from "../src/lib/timing.mjs";

test("normalize: diacritics, alef forms, spoken numbers", () => {
  assert.equal(normalize("التَّقييم"), normalize("التقييم"));
  assert.equal(normalize("إيه"), normalize("ايه"));
  assert.equal(normalize("اثنان"), "2");
  assert.equal(normalize("بعشرون"), "20");
  assert.equal(normalize("10%"), "10%");
});

test("rich: numbers isolated LTR incl. currency and suffix; accent markup", () => {
  assert.match(rich("$297B"), /<span class="num">\$297B<\/span>/);
  assert.match(rich("مقابل 10% من"), /مقابل <span class="num">10%<\/span> من/);
  assert.match(rich("*بكام؟*"), /class="hl"/);
  assert.equal((rich("كلمة تانية", { words: true }).match(/class="w"/g) || []).length, 2);
});

test("anchors: prefix و/ب, occurrence, missing anchor throws", () => {
  const ep = { segments: [{ say: "الفلوس وفاضل منها كام؟ وفاضل تاني" }] };
  const tl = buildTimeline(ep, null);
  const s = tl.segments[0];
  assert.equal(findAnchor(s, "فاضل"), s.words[1].start);
  assert.equal(findAnchor(s, "فاضل#2"), s.words[4].start);
  assert.throws(() => findAnchor(s, "مش موجودة"));
});

test("estimated timeline is monotonic and has a tail hold", () => {
  const ep = { segments: [{ say: "جملة أولى قصيرة." }, { say: "وجملة تانية، فيها وقفة… وكلام." }] };
  const tl = buildTimeline(ep, null);
  const all = tl.segments.flatMap((s) => s.words);
  for (let i = 1; i < all.length; i++) assert.ok(all[i].start >= all[i - 1].end);
  assert.ok(tl.total > tl.voiceEnd + 1.5);
  assert.equal(tokenize("2 مليون، مقابل 10%…").length, 4);
});
