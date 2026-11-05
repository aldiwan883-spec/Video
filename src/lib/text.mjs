// أدوات النص العربي: تطبيع للمقارنة، تقسيم لكلمات، وتحويل الـ markup البسيط لـ HTML.
const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

// الأرقام المنطوقة بالعامية/الفصحى → أرقام، عشان "اتنين مليون" تتطابق مع "2 مليون" في المحاذاة
const NUM_WORDS = {
  واحد: "1", اتنين: "2", اثنين: "2", اثنان: "2", تلاته: "3", ثلاثه: "3", اربعه: "4", خمسه: "5", سته: "6",
  سبعه: "7", تمانيه: "8", ثمانيه: "8", تسعه: "9", عشره: "10", عشر: "10", عشرين: "20", عشرون: "20", تلاتين: "30",
  ثلاثين: "30", ثلاثون: "30", اربعين: "40", اربعون: "40", خمسين: "50", خمسون: "50", ستين: "60", سبعين: "70",
  تمانين: "80", ثمانين: "80", تسعين: "90", ميه: "100", مايه: "100", مئه: "100", الف: "1000",
};
export function normalize(s) {
  const base = normalizeText(s);
  if (NUM_WORDS[base]) return NUM_WORDS[base];
  if (/^[وب]/.test(base) && NUM_WORDS[base.slice(1)]) return NUM_WORDS[base.slice(1)];
  return base;
}
function normalizeText(s) {
  return String(s)
    .replace(DIACRITICS, "")
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[*_]/g, "")
    .replace(/[^\p{L}\p{N}%]/gu, "")
    .toLowerCase();
}

// الكلمات زي ما هتتقال (من غير علامات الـ markup)
export function tokenize(text) {
  return String(text).replace(/[*]/g, "").split(/\s+/).filter((w) => normalize(w).length > 0);
}

export function pauseAfter(word) {
  if (/(\.\.\.|…)$/.test(word)) return 0.45;
  if (/[.؟?!:]$/.test(word)) return 0.4;
  if (/[،,؛;]$/.test(word)) return 0.22;
  return 0;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// أرقام ونِسَب وعلامات حسابية تتعزل LTR عشان متتقلبش جوه جملة عربي
const NUM_RE = /([≈~]?[$€£]?[+\-−]?\d[\d,.]*(?:[%MKBx](?![A-Za-z]))?|[×÷=])/g;
function isolateNumbers(html) {
  return html.replace(NUM_RE, (m) => `<span class="num">${m}</span>`);
}

// "*كلمة*" = accent. لو words=true كل كلمة بتبقى span لوحدها عشان الأنيميشن.
export function rich(text, { words = false, wordClass = "w" } = {}) {
  const parts = String(text).split(/(\*[^*]+\*)/g).filter(Boolean);
  const out = [];
  for (const p of parts) {
    const hl = p.startsWith("*") && p.endsWith("*");
    const body = hl ? p.slice(1, -1) : p;
    if (!words) {
      out.push(hl ? `<span class="hl">${isolateNumbers(esc(body))}</span>` : isolateNumbers(esc(body)));
      continue;
    }
    for (const w of body.split(/(\s+)/)) {
      if (!w) continue;
      if (/^\s+$/.test(w)) { out.push(w.includes("\n") ? "<br>" : " "); continue; }
      out.push(`<span class="${wordClass}${hl ? " hl" : ""}">${isolateNumbers(esc(w))}</span>`);
    }
  }
  return out.join("").replace(/\n/g, "<br>");
}

export function formatNumber(n) {
  return Math.round(n).toLocaleString("en-US");
}

export { esc };
