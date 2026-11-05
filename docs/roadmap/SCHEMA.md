# Roadmap episode schema (docs/roadmap/data/S<n>.json)

A JSON array of 20 objects, in the order of CONCEPT_MAP.md §3:

```json
{
  "id": "S1-02",
  "folder": "102",
  "series": "dictionary",
  "title": "عنوان مصري قصير",
  "title_en": "Short English working title",
  "domains": ["Finance"],
  "level": 1,
  "hook": "أول جملة في الحلقة (عامية مصرية، من غير clickbait)",
  "objective": "الهدف التعليمي الواحد: المشاهد بعد الحلقة هيقدر …",
  "supporting_insights": ["…", "…"],
  "key_concepts": ["Revenue", "Net profit", "Operating cash flow"],
  "case": "حالة عملية بأرقام وافتراضات معلنة (أو مصدر أولي مطلوب لو شركة حقيقية — من غير أرقام غير متحقق منها)",
  "non_obvious_insight": "الفكرة اللي أغلب الناس فاهمينها غلط",
  "prerequisites": ["S1-01"],
  "format": ["hook", "case", "breakdown", "scenario", "quiz", "takeaway"],
  "closing_question": "سؤال حكم/سيناريو (مش آلة حاسبة)",
  "research": "إيه اللي لازم يتحقق منه، ونوع المصدر الأولي المطلوب",
  "ratings": { "educational": 4, "practical": 5, "originality": 3, "research_difficulty": 2, "visual": 4 },
  "pilot": false
}
```

Allowed `format` scene types: hook, term, ratio, compare, myth, quiz, next, breakdown, case, timeline, decision, process, proscons, beforeafter, chart, scenario, takeaway, source.
Ratings are integers 1–5 (research_difficulty: 5 = hardest).
