# فهّمني بيزنس — Content Production System

موسوعة بيزنس مبسّطة بالمصري في شكل Reels (Instagram, Facebook, YouTube Shorts)، بصوتك، و5 سلاسل:
**قاموس المستثمر** · **فكّر زي المستثمر** · **إزاي تكسب ثقة الشاركس؟** · **فك شفرة البيزنس** · **من فكرة لشركة**

| ابدأ من هنا | |
|---|---|
| الاستراتيجية | `docs/strategy/CONTENT_BIBLE.md` · `docs/strategy/CONCEPT_MAP.md` |
| المنهج (100 حلقة) | `docs/roadmap/ROADMAP.md` · `RATINGS.md` · `TOP10.md` · `PUBLISHING_ORDER.md` |
| الـ 5 Pilots | `episodes/{001,203,307,402,502}-*/` + `docs/pilots/*/LEARNING.md` |
| المكتبة المالية | `docs/library/README.md` (19 مفهوم) |
| البحث والأسئلة | `docs/research/WORKFLOW.md` · `RESEARCH_SOURCES.md` · `docs/quiz/QUIZ_FRAMEWORK.md` |
| المحرك | `docs/ENGINE.md` (الأوامر، والـ 18 مشهد، والـ QC، وإعدادات السلاسل) |
| الحالة | `OVERNIGHT_REPORT.md` · `NEXT_STEPS.md` · `CONTENT_QUALITY_AUDIT.md` · `PROGRESS.md` |

ده مش "Video Generator" بيطلّع فيديوهات شبه بعض. ده pipeline بيقوم بأربع أدوار:

| الدور | مين بيعمله | فين في الكود |
|---|---|---|
| **Content Creator** | السكريبت والـ storyboard في `episode.json` | `episodes/NNN-slug/episode.json` |
| **Motion Designer** | مكتبة مشاهد، كل نوع فكرة بصرية مختلفة | `src/scenes/` + `src/runtime/fx.js` |
| **Video Editor** | التوقيت على صوتك، الكابشن، الـ SFX، الإيقاع | `src/lib/timing.mjs`, `compose.mjs`, `captions.mjs` |
| **Art Director** | الهوية ثابتة، وQC بيرفض اللي يكسرها | `src/lib/brand.mjs`, `src/lib/qc.mjs`, `docs/IDENTITY.md` |

كله مجاني ومحلي على جهازك: [HyperFrames](https://github.com/heygen-com/hyperframes) (Apache 2.0)، GSAP، FFmpeg، Whisper، وخطوط OFL، وأصوات Pixabay.

## التشغيل لأول مرة

محتاج **Node.js 22+** و **FFmpeg** و **Google Chrome**.

```bash
npm install
```

```bash
npm run setup
```

`setup` بيجهز مكتبة الـ SFX ويقيس لحظة الذروة في كل صوت عشان يتزامن مع الصورة.

## الشغل على حلقة (كل مرة)

1. **السكريبت:** بكتبلك `episode.json` (السكريبت والـ storyboard)، وبيطلع منه `script.md`، وده اللي بتقراه وانت بتسجل.
2. **التسجيل:** سجّل `voice.wav` (أو mp3/m4a) وحطه جوه فولدر الحلقة.
3. **البناء:**

```bash
npm run build:episode -- 001
```

4. **المراجعة:** افتح `output/001-valuation/`:
   - `001-valuation.mp4`: الفيديو النهائي
   - `cover.png`: الـ Cover
   - `caption.txt`: الكابشن والهاشتاجات وأول كومنت
   - `QC.md`: تقرير الجودة
   - `review/`: فريمات من كل مشهد عشان تراجع بعينك

### أوامر تانية (التفاصيل في `docs/ENGINE.md`)

| الأمر | بيعمل إيه |
|---|---|
| `npm run preview:episode -- 001` | كل حاجة ما عدا الريندر، أسرع للمراجعة |
| `npm run build:episode -- 001 --draft` | ريندر بجودة أقل، أسرع |
| `npm run script -- 001` | يطلّع `script.md` بس |
| `npm run studio -- 001` | يفتح المشروع في HyperFrames Studio في المتصفح عشان تعدّل بإيدك |
| `npm run build:episode -- 001 203 402` / `--all` | Batch |
| `npm run build:episode -- 001 --silent` | preview صامت حتى لو فيه `voice.wav` |
| `npm run edu-check -- --all` | البوابة التعليمية |
| `npm run roadmap` | يبني ملفات الـ roadmap من الـ JSON |
| `npm test` | الاختبارات |

من غير `voice.wav`، النظام بيقدّر التوقيت وبيطلع preview، وده بينفع عشان تشوف الشكل قبل ما تسجل.

## الـ Pipeline

```
episode.json ──► script.md ──► (انت بتسجل) voice.wav
                                     │
                     ffmpeg: تنظيف ونزع noise وتقصير السكتات الطويلة و loudness
                                     │
                     Whisper (عربي) ──► محاذاة مع السكريبت = توقيت كل كلمة
                                     │
        storyboard ──► مشاهد HyperFrames + كابشن + SFX متزامنين مع الكلام
                                     │
                     QC: layout و contrast و وقت القراية و التنوع بين الحلقات و الصوت
                                     │
                     MP4 + Cover + Caption
```

## ملفات مهمة

- `docs/IDENTITY.md`: قواعد الهوية (الألوان والخطوط والـ hierarchy والحركة)
- `docs/STORYBOARD.md`: إزاي تكتب حلقة (`episode.json` + بلوك `edu`)
- `series.json` (البراند) + `series/<slug>.json` (إعدادات كل سلسلة: الحركة، والكابشن، والـ SFX، والـ transitions، والمدة)

## التراخيص

- الخطوط: Readex Pro و Inter، الاتنين تحت [SIL Open Font License](brand/fonts/)
- الأصوات: مكتبة HyperFrames، من Pixabay تحت Pixabay Content License (تجاري ومن غير ذكر المصدر). ملفات الصوت مش مرفوعة على الريبو، و`npm run setup` بينزّلها.
- ممنوع نستخدم لوجو البرنامج أو لقطاته أو موسيقاه.
