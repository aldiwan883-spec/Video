# Writer Brief — إزاي تكتب حلقة جاهزة للتسجيل

كل حلقة = `episodes/<folder>-<slug>/episode.json` واحد. السيستم بيطلّع منه السكريبت والفيديو بعد ما الصوت يتضاف. **الحلقة لازم تعدّي `npm run validate -- <folder>` ثم `node src/cli/build.mjs <folder> --no-render` بـ 0 errors.**

## اقرا الأول
1. `docs/strategy/CONTENT_BIBLE.md`: النبرة، والمعيار، واللي ممنوع.
2. `docs/strategy/CONCEPT_MAP.md` + `docs/roadmap/data/S<n>.json`: الحلقة بتاعتك فيها الهدف والحالة والـ insight والسؤال المقترح. ده **نقطة البداية مش النص النهائي**: صحّح أي حساب غلط، وحسّن الزاوية لو `CONTENT_QUALITY_AUDIT.md §3` فيه ملاحظة عليها.
3. `docs/strategy/CAST.md`: البيزنسات المصرية الثابتة. استخدمهم لما يناسبوا.
4. `docs/ENGINE.md`: كل أنواع المشاهد والـ params.
5. `docs/quiz/QUIZ_FRAMEWORK.md`: أنواع الأسئلة.
6. أمثلة كاملة: `episodes/001-valuation`، و`112-working-capital` (فيها `illustrated`)، و`203-hurdle-rate`، و`307-due-diligence`، و`402-costco-membership`، و`502-validation`.
7. المكتبة: `docs/library/*.md` للتعريفات الدقيقة.

## الهيكل
```json
{
  "id": "<folder>", "roadmap": "S1-02", "series": "<slug>", "number": 2, "slug": "<kebab-case>",
  "term": { "en": "…", "ar": "…" },
  "cover": { "hook": "سطرين بالكتير\nبكلمة *accent* واحدة", "sub": "…", "motif": false },
  "edu": { …كل الخانات زي الأمثلة…, "verify": ["رقم بيتغير لازم يتراجع يوم التسجيل + المصدر"] },
  "segments": [ { "id": "…", "say": "…", "scene": { "type": "…", … } } ],
  "post": { "caption": "…", "first_comment": "الإجابة + ليه البدائل ناقصة", "hashtags": ["#…"] }
}
```
- `folder` و`id` = اللي في الـ roadmap (مثلاً `"102"`). `series` = `dictionary` / `investor-mind` / `trust` / `decode` / `idea-to-company`. `number` = رقم الحلقة جوه السلسلة.
- **من 6 لـ 8 segments، ومن 150 لـ 185 كلمة** (حوالي 60–75 ثانية). أول segment = hook، وآخر segment = quiz.
- كل segment = **جملة أو جملتين** + مشهد واحد.

## السكريبت (`say`)
- عامية مصرية طبيعية، زي صاحبك الفاهم. جمل قصيرة. مفيش "يا جماعة الخير" ولا clickbait.
- الأرقام بتتكتب digits ("2 مليون"، "30%")، وانت بتقولها زي ما بتتقال.
- **لو الحلقة ليها prerequisite:** سطر callback قصير ("فاكر الـ Gross margin؟ …").
- المصطلح الإنجليزي بيتقال زي ما بيتقال في السوق، ومعناه مرة واحدة. **كل كلمة لاتيني في `say` لازم تبقى موجودة في `edu.terms`** (البوابة بتفحص كده).
- سطر واحد على الأقل بيقول **إيه اللي مينفعش نستنتجه**.

## المشاهد: قواعد اتعلمناها بالطريقة الصعبة
- **`at`** = كلمة أو عبارة **موجودة فعلاً في `say` بتاع نفس الـ segment** (التشكيل وبادئات و/ف/ب/ل بيتجاهلوا). ممكن `"كلمة#2"` للمرة التانية، أو رقم بالثواني من بداية الجملة (`0.1`). anchor مش موجود = الـ build بيقع.
- متربطش عنصر بكلمة في **آخر** الجملة لو محتاج يتقري: هيظهر 0.3 ثانية وبعدين المشهد يخلص (warning `line_unread`).
- **النص قصير:** المساحة 880 × 780 بكسل. ممنوع فقرات. الـ quiz options من 3 لـ 4 بالكتير، كل واحدة أقل من 45 حرف. قيم الـ breakdown قصيرة ("2.4M"، "30.9%").
- **العربي مع الأرقام:** متكتبش "2% = 30" جوه جملة عربي، لأنها بتتقلب. اكتب "المعيار 2% (يعني 30 حجز)". وممنوع "Pre-money" في نص جملة طويلة بتلف على سطرين. اكسر الجملة.
- `hook` بـ `size: "hero"`: النص أرقام بس (`"2,000,000"`، `"$297B"`، `"20%"`). أول سطرين بيبانوا من الفريم 0 (من غير `at`)، وده الـ thumbnail.
- كلمة `*accent*` واحدة بس في المشهد (البرتقالي = البطل).
- `ground: "ink"` لمشهد أو اتنين بالكتير في الحلقة، وعادة myth أو takeaway أو hook.
- **التنوّع إجباري:** على الأقل 5 أنواع مشاهد مختلفة في الحلقة، ومتبدأش كل الحلقات بنفس الترتيب. استخدم `illustrated` في حوالي **ثلث الحلقات** (خصوصاً اللي فيها بيزنس مصري ملموس).
- `illustrated` props المتاحة **بس**: `shop` (opts: sign, door)، و`factory`، و`truck` (opts: label)، و`register` (opts: display)، و`phone` (opts: notes [3 نصوص قصيرة])، و`boxes` (opts: count)، و`cash`، و`oven`، و`invoice` (opts: amount, stamp). وكل prop ليه `x` (المركز)، و`y` (القاعدة، بين 1080 و1160)، و`scale` (من 0.9 لـ 1.5)، و`enter` (`none`/`drive`/`drop`/أو الافتراضي)، و`anim`: `smoke`، `drawer`، `display {from,to}`، `notes`، `glow`، `stamp`، `boxes-in`، `boxes-out`، `coins`، `drive-out`، `shake`. والـ callouts: `{text, x, y (330–700), at, hl}`. نص الـ callout أقل من 30 حرف. **متضيفش props جديدة.**
- `scenario`: `states[].pos` من 0 لـ 100، و`raw` أرقام أو `null`، و`outputs` نصوص للعرض.
- `quiz`: بـ `options` (`{key: "أ"/"ب"/"ج"/"د", text, at}`)، ومفيش أسئلة آلة حاسبة.

## بلوك `edu` (البوابة بترفض الناقص)
`objective` (فعل قابل للقياس)، `insights` (2–3)، `case`، `assumptions` (2 على الأقل)، `nonObvious`، `limits`، `quiz {type, answer, whyNot[]}`، `calcs` (**كل رقم مشتق في الحلقة**، بـ `expr` أرقام وعمليات و% بس)، `terms`، و`hypothetical: true` **أو** `sources [{claim, source, url, date}]`، و`verify` (اختياري).

## الأرقام والمصادر
- **حالة افتراضية؟** قولها على الشاشة (`label: "حالة افتراضية"` في `case`، أو في الـ callout أو الـ unit)، و`hypothetical: true`.
- **شركة حقيقية؟** كل رقم لازم يكون **إنت شايفه بعينك في المصدر الأصلي** (10-K على sec.gov، أو annual report على موقع الشركة، أو إفصاح EGX). اكتب `sources` بالـ URL وتاريخ الملف، والمصدر على الشاشة بـ `"source": "Netflix 10-K · FY2025"`. **مقدرتش تتحقق؟** متكتبش الرقم: استخدم حالة افتراضية بنفس الموديل وقول إنها افتراضية، وحط في `verify` الأرقام اللي محتاجة تتجمع.
- **أرقام بتتغير** (فايدة، تضخم، سعر صرف، أسعار): `verify` إجباري.
- **ممنوع:** إحصائيات من غير مصدر، ونسبة آراء لأشخاص حقيقيين (خصوصاً مستثمري البرنامج)، ونصيحة استثمار، وتفاصيل قانونية مصرية كحقيقة (قول "اسأل محامي" وحطها في `verify`).

## التحقق قبل ما تعتبر الحلقة خلصت
```bash
node src/cli/validate.mjs <folder>
```
```bash
node src/cli/build.mjs <folder> --no-render
```
بعد الـ build افتح `output/<folder>-<slug>/QC.md`: **0 errors**. والـ warnings اقراها وصلّح اللي يتصلّح (`line_unread`، تحت عمود الأزرار…). شغّل الـ builds **واحد ورا التاني** (الجهاز مشترك).
