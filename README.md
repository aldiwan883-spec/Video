# فهّمني بيزنس — Content Production System

سلسلة Reels تعليمية (Instagram, Facebook, YouTube Shorts) بتشرح مصطلحات البيزنس اللي بتتقال في شارك تانك مصر، بالعامية المصرية وبصوتك.

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

### أوامر تانية

| الأمر | بيعمل إيه |
|---|---|
| `npm run preview:episode -- 001` | كل حاجة ما عدا الريندر، أسرع للمراجعة |
| `npm run build:episode -- 001 --draft` | ريندر بجودة أقل، أسرع |
| `npm run script -- 001` | يطلّع `script.md` بس |
| `npm run studio -- 001` | يفتح المشروع في HyperFrames Studio في المتصفح عشان تعدّل بإيدك |

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
- `docs/STORYBOARD.md`: أنواع المشاهد وإزاي تتكتب في `episode.json`
- `series.json`: اسم السلسلة والهاشتاجات الثابتة

## التراخيص

- الخطوط: Readex Pro و Inter، الاتنين تحت [SIL Open Font License](brand/fonts/)
- الأصوات: مكتبة HyperFrames، من Pixabay تحت Pixabay Content License (تجاري ومن غير ذكر المصدر). ملفات الصوت مش مرفوعة على الريبو، و`npm run setup` بينزّلها.
- ممنوع نستخدم لوجو البرنامج أو لقطاته أو موسيقاه.
