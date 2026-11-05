# Production Engine — المرجع التقني

`episode.json` → (Edu QC) → voice → timing → مشاهد HyperFrames → (Visual QC) → MP4 + cover + caption + storyboard

## الأوامر

| الأمر | بيعمل إيه |
|---|---|
| `npm run setup` | ينزّل مكتبة الـ SFX (Pixabay) ويقيس لحظة الذروة في كل صوت |
| `npm run build:episode -- 001` | الحلقة كاملة. لو `voice.wav` موجود بيستخدمه، وإلا preview صامت |
| `npm run build:episode -- 001 203 402` | Batch: أكتر من حلقة، وفي الآخر ملخص |
| `npm run build:episode -- --all` | كل الحلقات اللي في `episodes/` |
| `… --silent` | يتجاهل `voice.wav`: preview صامت بتوقيت تقديري |
| `… --no-render` | كل حاجة ما عدا الـ MP4 (QC + cover + storyboard + caption) |
| `… --draft` | ريندر أسرع بجودة أقل |
| `… --force` | يكمّل الريندر رغم errors الـ QC (مش منصوح بيه) |
| `npm run edu-check -- 001` أو `--all` | البوابة التعليمية بس |
| `npm run script -- 001` | يطلّع `script.md` للتسجيل |
| `npm run studio -- 001` | يفتح المشروع المتولّد في HyperFrames Studio |
| `npm run roadmap` | يبني ملفات الـ roadmap من الـ JSON ويتأكد من المتطلبات |
| `npm test` | الاختبارات (12) |

**استبدال الصوت:** حط `voice.wav` الجديد مكان القديم وشغّل نفس الأمر. الـ stamp بيتغير مع الـ hash بتاع الصوت والسكريبت، فالتنظيف والـ Whisper والـ alignment بيتعادوا لوحدهم.

## مخرجات `output/<id>-<slug>/`

`<id>-<slug>.mp4` · `cover.png` · `caption.txt` (الكابشن + الهاشتاجات + أول كومنت) · `storyboard.md` + `storyboard.jpg` (فريم لكل مشهد وهو مكتمل) · `QC.md` · `EDU_QC.md` · `build.log` · `review/` (فريمات من HyperFrames) · `project/` (مشروع HyperFrames قابل للتعديل)

## مكتبة المشاهد (18)

| type | العيلة | الغرض التعليمي | params أساسية |
|---|---|---|---|
| `hook` | typography | سؤال أو مفارقة من الفريم 0 | `lines[{text,size,at?,punch?}]` |
| `term` | typography | المصطلح ومعناه | `en, ar, def?, kicker?` |
| `ratio` | numbers | جزء من كل (حصة، نسبة) | `cells, take, partValue, totalValue, formula, legend` |
| `compare` | diagram | رقمين بنفس المقياس | `a, b {label,value,display}, badge, question` |
| `myth` | typography | فكرة غلط بتتشطب والصح بيتختم | `wrong[], right, rightLabel, at.strike` |
| `quiz` | quiz | سؤال حكم باختيارات (أو سؤال مفتوح) | `question, options[{key,text,at}], ask, cta` |
| `next` | typography | الحلقة الجاية | `en, ar` |
| `breakdown` | numbers | Waterfall: من الإيراد للربح، ومن post لـ pre | `rows[{label,value,display,op:+/-/=,hl}]` |
| `case` | case | كارت حالة بأرقامها وافتراضاتها | `label, title, facts[{k,v,hl,at}]` |
| `timeline` | diagram | مراحل في الزمن | `items[{when,text,hl,at}]` |
| `decision` | diagram | سؤال بيتفرع لنتايج | `root, branches[{cond,outcome,hl,at}], at.choose` |
| `process` | diagram | خطوات أو قايمة بالترتيب | `steps[{title,detail,hl,at}], keepAll?` |
| `proscons` | diagram | trade-off وحكم | `pros[], cons[], labels?, verdict` |
| `beforeafter` | compare | نفس الحالة قبل/بعد تغيير | `before{label,lines}, after{…}` |
| `chart` | numbers | أعمدة أو خط بتعليق واحد | `kind: bar/line, data[{label,value,display,hl}], annotation` |
| `scenario` | numbers | "لو غيّرنا متغير واحد؟" مؤشر + نتايج بتتحسب | `variable, outputs[], states[{pos,value,outputs,raw,at}]` |
| `takeaway` | typography | الفكرة الواحدة + 2–3 نقط | `line, points[]` |
| `source` | reference | المصادر والافتراضات | `items[{text, kind: source/assumption}]` |

**أي مشهد** يقبل: `ground: "ink"` (أرضية سودا)، و`layout: center/start/low`، و`transition`، و`camera: punch/still`، و`source: "…"` (سطر مصدر صغير تحت المحتوى).

`at` = كلمة أو عبارة من `say` (العنصر بيظهر لحظة ما بتتقال)، أو `"كلمة#2"` (تاني مرة)، أو رقم (ثواني من بداية الجملة). والـ matching بيتجاهل التشكيل وبادئات و/ف/ب/ل.

## Creative variation (`src/lib/variation.mjs`)
- لكل مشهد بيتحدد **layout** و**transition** و**camera** بـ seed من رقم الحلقة والمشهد. نفس الحلقة دايماً بتطلع نفس النتيجة.
- مفيش layout بيتكرر ورا بعض، ومفيش transition بيتكرر ورا بعض. لما الأرضية تتغير، الـ transition دايماً `flood`.
- الـ transitions: `blur` (blur swap)، و`whip` (حركة أفقية مع blur)، و`flood` (دايرة بتفرش اللون)، و`iris` (فتحة دايرية)، و`cut`.
- Camera: `punch` = تكبير خفيف 4.5% على لحظة الـ payoff. Zoom بطيء مستمر ممنوع، لأنه من علامات الـ templates.
- Density (من السلسلة): `low` = خط أكبر بـ 8%، و`high` = أصغر بـ 10% عشان معلومات أكتر.

## إعدادات السلسلة (`series/<slug>.json`)

```json
{
  "creative": {
    "animationIntensity": 1.0,
    "visualDensity": "medium",
    "captionStyle": "karaoke",
    "transitions": ["blur", "whip", "flood"],
    "darkSceneShare": 0.15
  },
  "mix": { "sfx": 0.45, "maxSfxPer10s": 3, "voiceLufs": -16, "keepPause": 0.45 },
  "targetDuration": [60, 75]
}
```
- `animationIntensity`: بتأثر على مدة الحركة (÷√intensity) ومسافتها (×intensity).
- `captionStyle`: `karaoke` (الكلمة اللي بتتقال بتنوّر)، أو `phrase` (الجملة كلها)، أو `off`.
- `mix.sfx`: مستوى كل الـ SFX. الافتراضي هادي تحت الصوت، و0 بيقفلهم.
- `keepPause`: طول السكتة اللي بتفضل لما التنظيف يقصّر السكتات الطويلة.
- `series.json` (البراند) فيه الإعدادات العامة، وكل سلسلة بتغيّر اللي محتاجاه.

## Voice engine (`src/lib/voice.mjs`)
1. **تشخيص الخام:** sample rate، و clipping (peak وعدد مرات الوصول لـ 0 dBFS)، و noise floor، و LUFS. الـ clipping = **error** (لازم تعيد التسجيل).
2. **تنظيف:** highpass 80Hz + afftdn + تقصير السكتات اللي أطول من `keepPause + 0.25` لـ `keepPause` بس. **مفيش تسريع.**
3. **Loudness على مرحلتين** (قياس ثم ضبط linear) لـ `voiceLufs` و true peak −1.5.
4. **Whisper** (`medium` افتراضي، وبيتغير بـ `FB_WHISPER_MODEL`) من whisper.cpp مباشرة، بـ **prompt فيه المصطلحات الإنجليزي وأول السكريبت** عشان يكتبها صح. لو مش موجود، بيرجع لـ `hyperframes transcribe`.
5. **Alignment** (Needleman–Wunsch): كل كلمة في السكريبت بتاخد وقت أقرب كلمة اتسمعت، والأرقام المنطوقة ("اتنين"، "عشرين") بتتطابق مع "2" و"20". الكلمات اللي متسمعتش بتتوزع بين جيرانها.
6. **القطع بين المشاهد** في نص السكتة الطبيعية بين الجملتين.
7. التقرير بيطلع فيه إيقاع الكلام (كلمة/ثانية) كمعلومة مش كحكم، لأن الأسرع مش أحسن.

## QC

### Visual QC (`QC.md`): error بيوقف الريندر، و warning لازم حد يبص عليه
| الفحص | المصدر | المستوى |
|---|---|---|
| نص فوق y=168 أو تحت y=1330 أو قريب من حرف الشاشة | `layout-qc.mjs` (Chrome، seek لـ 4 لحظات في كل مشهد) | error |
| نص طالع برّه مساحة المحتوى (stage) أو برّه الصندوق بتاعه | `layout-qc.mjs` | error |
| تداخل نصين (مش في نفس الفقرة) | `layout-qc.mjs` | error |
| نص تحت عمود أزرار التطبيق | `layout-qc.mjs` | warn |
| خط أصغر من 28px | `layout-qc.mjs` | warn |
| JS errors، ملفات ناقصة، contrast، وقت القراية، dead stretch | `hyperframes check` | حسب الـ severity |
| ملف asset ناقص | `assetReport` | error |
| كابشن متداخل / أقصر من 0.45s / مش مغطي الكلام | `captionReport` | error / warn |
| عنصر بيظهر في آخر 0.4s من المشهد | compose | warn |
| أكتر من 3 SFX في 10 ثواني، أو صوت واحد أكتر من 45% | `sfxReport` | warn |
| نفس النوع ونفس الـ layout ورا بعض، أو تكوين متكرر أكتر من مرتين | `compositionReport` | warn |
| clipping في الصوت الخام أو النهائي | voice diag / ebur128 | error |
| Loudness برّه −17…−12 LUFS | ebur128 | warn |

> **ترتيب المشاهد مش بيتفرض عليه uniqueness**: التكرار بيتحكم عليه بالتكوين البصري، مش بقايمة الأنواع.

### Educational QC (`EDU_QC.md`)
`src/lib/edu-qc.mjs` بيقرا بلوك `edu` في `episode.json` وبيفحص: هدف واحد، أبعد من التعريف، تطبيق بافتراضات، insight، حدود الاستنتاج، سؤال حكم (وبيرفض أسئلة الآلة الحاسبة آلياً)، شرح الإجابة والبدائل، **إعادة حساب كل معادلة في `edu.calcs`**، مصادر أو إعلان إن الحالة افتراضية، كلمات clickbait، المصطلحات الإنجليزي، الطول، ومفيش نسبة لآراء أشخاص حقيقيين (في S2).
