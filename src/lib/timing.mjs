// "الصوت هو الساعة": كل كلمة في السكريبت ليها وقت بداية ونهاية.
// لو فيه alignment حقيقي من تسجيلك بنستخدمه، غير كده بنقدّر التوقيت عشان نعمل preview.
import fs from "node:fs";
import { tokenize, normalize, pauseAfter } from "./text.mjs";

export const VOICE_START = 0.3;   // الصوت يبدأ بعد 0.3 ثانية (الفريم 0 = الـ Hook ظاهر)
export const SEGMENT_GAP = 0.5;   // سكتة طبيعية بين الأجزاء
export const TAIL_HOLD = 2.2;     // آخر سطر يفضل على الشاشة

function estimateWord(w) {
  const len = normalize(w).length;
  return Math.min(0.7, Math.max(0.2, 0.1 + 0.045 * len));
}

export function buildTimeline(episode, alignmentPath) {
  const aligned = alignmentPath && fs.existsSync(alignmentPath)
    ? JSON.parse(fs.readFileSync(alignmentPath, "utf8"))
    : null;
  let t = VOICE_START;
  const segments = episode.segments.map((seg, si) => {
    const tokens = tokenize(seg.say);
    let words;
    if (aligned) {
      words = aligned.segments[si].words.map((w) => ({ ...w }));
    } else {
      words = tokens.map((text) => {
        const d = estimateWord(text);
        const w = { text, start: t, end: t + d };
        t += d + pauseAfter(text);
        return w;
      });
      t += SEGMENT_GAP;
    }
    return { id: seg.id, index: si, words, start: words[0].start, end: words.at(-1).end };
  });
  const voiceEnd = segments.at(-1).end;
  const total = round(voiceEnd + TAIL_HOLD);
  return { source: aligned ? "voice" : "estimate", alignScore: aligned?.score ?? null, segments, total, voiceEnd };
}

// يدوّر على عبارة (anchor) جوه الجزء ويرجع وقت أول كلمة فيها. "#2" = تاني مرة تتقال.
export function findAnchor(segTiming, anchor) {
  if (anchor == null) return null;
  if (typeof anchor === "number") return segTiming.start + anchor;
  let [phrase, occ] = String(anchor).split("#");
  occ = Number(occ || 1);
  const target = tokenize(phrase).map(normalize);
  const words = segTiming.words.map((w) => normalize(w.text));
  let seen = 0;
  for (let i = 0; i <= words.length - target.length; i++) {
    if (target.every((tw, k) => words[i + k] === tw || words[i + k].startsWith(tw))) {
      seen++;
      if (seen === occ) return segTiming.words[i].start;
    }
  }
  throw new Error(`anchor "${anchor}" مش موجود في الجزء "${segTiming.id}"`);
}

export const round = (x) => Math.round(x * 1000) / 1000;
