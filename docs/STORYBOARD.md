# كتابة حلقة: `episode.json`

كل حلقة = أجزاء (`segments`). كل جزء فيه:
- `say`: الكلام اللي هتقوله (بيطلع في `script.md`)
- `scene`: المشهد اللي هيظهر وانت بتقوله

### `at`: إمتى العنصر يظهر

`at` بيتكتب **كلمة أو عبارة من `say`**، والعنصر بيظهر لحظة ما انت بتقولها.
- `"2 مليون"`: أول مرة العبارة دي تتقال
- `"التقييم#2"`: تاني مرة الكلمة تتقال

النص اللي بين `*نجمتين*` بياخد اللون البرتقالي. استخدمه مرة واحدة في المشهد.

## أنواع المشاهد

| type | العيلة | امتى تستخدمه | أهم الـ params |
|---|---|---|---|
| `hook` | Typography | أول 3 ثواني. أول سطر ظاهر من الفريم 0 | `lines[]: {text, size: hero/h1/h2/quiet, at?, punch?}` |
| `term` | Typography | ظهور المصطلح | `en, ar, def, at:{en, ar, def}` |
| `ratio` | Numbers + Diagram | نسبة من كل (حصة من شركة، Equity، Dilution) | `cells, take, partValue, totalValue, formula, legend, at:{formula, take, total}` |
| `compare` | Diagram | مقارنة رقمين بنفس المقياس | `a:{label,value,display}, b:{…}, badge, question, at:{question, a, b}` |
| `myth` | Typography | غلطة شائعة بتتشطب، والصح بيتختم | `wrong[], right, rightLabel, at:{wrong[], strike, right}`، وعادة `ground: "ink"` |
| `quiz` | Quiz | سؤال للمشاهد وعدّاد | `question, ask, cta, countdown, at:{question, ask, cta}` |
| `next` | Typography | الحلقة الجاية | `en, ar, at:{en}` |

أي مشهد يقبل `"ground": "ink"` (أرضية سودا). الانتقال بين أرضيتين مختلفتين بيبقى دايرة بتفرش اللون ومعاها whoosh.

## قواعد الإخراج (الـ QC بيراجعها)

- مفيش مشهدين **ورا بعض** من نفس النوع.
- ترتيب المشاهد ميبقاش **نفس ترتيب** أي حلقة من آخر 3 حلقات (ERROR لو متطابق، WARN لو التشابه أكتر من 75%).
- كل حلقة فيها مثال واحد حقيقي بأرقام بيمشي لحد الإجابة.
- المدة المثالية من 30 لـ 50 ثانية، وحوالي 100 لـ 120 كلمة.

## أنواع جاية (Phase 4)

`steps` (خطوات بالترتيب)، و`timeline` (Burn rate / Runway)، و`split` (Pre-money / Post-money)، و`chart` (Revenue vs Profit)، و`footage` (بعدين، لما نقرر مصدر اللقطات).
