// Art Director: هوية "فهّمني بيزنس" — كل القيم هنا، والمشاهد ممنوع تخترع ألوان أو أحجام من عندها.
export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const color = {
  paper: "#F4EEE3",   // الأرضية الأساسية
  ink: "#141414",     // النص والعناصر
  accent: "#EC4E2A",  // عنصر "بطل" واحد بس في كل فريم
  muted: "#8A8172",   // نص ثانوي
  line: "#1414141F",  // خطوط وفواصل
  card: "#FFFFFF",
  ghost: "#14141414", // خانات فاضية
};

// السلّم الطباعي (px على كانفس 1080×1920). مفيش نص يتقري أقل من 32.
export const type = {
  hero: 190,   // الرقم أو الكلمة البطل
  h1: 104,
  h2: 72,
  body: 52,
  quiet: 40,
  caption: 50,
  label: 34,
};

export const font = {
  ar: "'FB Readex', sans-serif",
  num: "'FB Inter', sans-serif",
};

// Safe zones لإنستجرام/تيك توك/شورتس على 1080×1920
export const safe = {
  top: 230,          // تحت شريط الحالة والبحث (168) + نفس
  contentBottom: 1150, // آخر حد للمحتوى الأساسي
  captionTop: 1170,  // باند الكابشن
  captionBottom: 1320,
  side: 96,          // هامش يمين وشمال
  railLeft: 930,     // عمود أزرار التطبيق على اليمين (تحت y=900)
};

// Motion system: الحركة بتتغير حسب الدور، مش نفس الـ ease على كل حاجة.
export const motion = {
  arrive: "expo.out",
  arriveSoft: "power4.out",
  move: "power2.inOut",
  leave: "power3.in",
  arriveDur: 0.55,
  leaveDur: 0.25,
  wordStagger: 0.08,
  letterStagger: 0.045,
  countUp: 1.4,
};

export function fontFaces(prefix = "assets/fonts") {
  return `
@font-face{font-family:'FB Readex';src:url('${prefix}/ReadexPro-Variable.ttf') format('truetype');font-weight:160 700;font-display:block}
@font-face{font-family:'FB Inter';src:url('${prefix}/Inter-Variable.ttf') format('truetype');font-weight:100 900;font-display:block}`;
}

export function baseCss() {
  return `
${fontFaces()}
#root{position:absolute;inset:0;font-family:${font.ar};color:${color.ink};direction:rtl}
#root .num{font-family:${font.num};direction:ltr;unicode-bidi:isolate;font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
#root .en{font-family:${font.num};direction:ltr;unicode-bidi:isolate}
#root .hl{color:${color.accent}}
#root .muted{color:${color.muted}}`;
}
