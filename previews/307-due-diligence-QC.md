# QC — 307 Due Diligence (إزاي تكسب ثقة الشاركس؟)

- المدة: **71.9s** (المستهدف 60–75) ✅
- التوقيت: ℹ️ تقديري — preview صامت
- المراجعة التعليمية: ✅ 12/12 (التفاصيل في EDU_QC.md)

## المشاهد
| # | النوع | layout | دخول | المدة | الأرضية | accent |
|---|---|---|---|---|---|---|
| s1 | hook | start | none | 7.6s | paper | 1 |
| s2 | process | low | blur | 8.7s | paper | 0 |
| s3 | case | center | cut | 8.8s | paper | 1 |
| s4 | process | low | whip | 13.6s | paper | 1 |
| s5 | breakdown | center | blur | 10.1s | paper | 0 |
| s6 | myth | start | flood | 7.2s | ink | 1 |
| s7 | takeaway | low | flood | 7.6s | paper | 1 |
| s8 | quiz | center | cut | 8.3s | paper | 0 |

## Layout: safe zones / overflow / تداخل النص
- ✅ مفيش ملاحظات

## HyperFrames check (lint / runtime / contrast / وقت القراية)
- ⚠️ `line_unread` @49.3s "الخطر الأكبر = الرقم الأكبر" (4 words) is on screen 0.41 s (±0.01 s), under its 1.27 s floor: hold it about 0.5 s + 0.3 s a word (1.70 s here) before it leaves or changes; see references/motion.md.

## تنوّع التكوين
- ✅ مفيش ملاحظات

## التوقيت والكابشن والـ SFX والملفات
- ℹ️ 5 SFX في 10 ثواني (من 23.6s) — فوق الحد 3 بشوية
- ⚠️ كابشن "سعر،" ظاهر 0.41s بس

## الصوت النهائي (متقاس، مش متسمع)
- ℹ️ preview صامت (SFX بس) — الـ loudness هيتظبط لما صوتك يتضاف
- True peak: -18.5 dBFS ✅

**النتيجة: ✅ مفيش errors · 2 warnings**
