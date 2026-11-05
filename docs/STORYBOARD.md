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

**المرجع الكامل للـ 18 نوع وكل الـ params في [`docs/ENGINE.md`](ENGINE.md#مكتبة-المشاهد-18).**

| العيلة | الأنواع | استخدمها لما… |
|---|---|---|
| Typography | hook, term, myth, takeaway, next | فكرة أو جملة لازم تتقري وتستقر |
| Numbers | ratio, breakdown, chart, scenario | الرقم بيتحسب أو بيتغير قدامك |
| Diagram | compare, decision, process, timeline, proscons | علاقة أو ترتيب أو trade-off |
| Case | case, beforeafter | حالة واحدة بأرقامها وافتراضاتها |
| Interaction / Reference | quiz, source | سؤال حكم، مصادر وافتراضات |

أي مشهد يقبل `"ground": "ink"`، و`"layout"`، و`"transition"`، و`"camera"`، و`"source"`. لو محددتهمش، خطة الإخراج (`src/lib/variation.mjs`) بتختارهم.

## بلوك `edu` (إجباري): البوابة التعليمية بتقراه

```json
"edu": {
  "objective": "المشاهد بعد الحلقة هيقدر …",
  "insights": ["…", "…"],
  "case": "…", "assumptions": ["…", "…"],
  "nonObvious": "…", "limits": "الرقم ده مش بيقول …",
  "quiz": { "type": "judgment|missing-info|tradeoff|prioritization|interpretation|risk", "answer": "…", "whyNot": ["…"] },
  "calcs": [{ "label": "Post-money", "expr": "2000000 / 10%", "expect": 20000000 }],
  "terms": ["Post-money: …"],
  "hypothetical": true,
  "sources": [{ "claim": "…", "source": "…", "url": "…", "date": "…" }]
}
```

## قواعد الإخراج

- مفيش مشهدين ورا بعض من نفس النوع **ونفس التكوين**. الـ QC بيحكم على التكوين البصري، مش على ترتيب الأنواع.
- كل حلقة فيها مثال واحد حقيقي (أو افتراضي معلن) بيمشي لحد الإجابة، ومتغير واحد بيتغير (scenario) لو ينفع.
- المدة المستهدفة من إعدادات السلسلة (`targetDuration`)، عادة 60–75 ثانية (حوالي 150–180 كلمة).
- السؤال من `docs/quiz/QUIZ_FRAMEWORK.md`، ومفيش أسئلة آلة حاسبة.
