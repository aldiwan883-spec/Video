// Educational quality gate: بيرفض السكريبت الضعيف قبل الريندر، ويقترح تحسينات محددة.
// المعلومات بتيجي من بلوك "edu" في episode.json (اللي كاتب الحلقة لازم يملاه) + فحص للسكريبت نفسه.
import { tokenize } from "./text.mjs";

const APPLIED = new Set(["scenario", "breakdown", "case", "decision", "compare", "chart", "proscons", "beforeafter", "ratio", "timeline", "process"]);
const JUDGMENT = new Set(["judgment", "missing-info", "tradeoff", "interpretation", "prioritization", "risk"]);
const BANNED = ["هتصدمك", "محدش هيقولك", "سر محدش", "عائد مضمون", "مكسب مضمون", "ربح مضمون", "اشتري سهم", "هتكسب أكيد", "فلوس سهلة", "ثراء سريع"];

// تقييم آمن لمعادلة أرقام بس
export function evalCalc(expr) {
  if (!/^[\d\s.+\-*/()%e]+$/i.test(expr)) throw new Error(`معادلة فيها رموز مش مسموحة: ${expr}`);
  // eslint-disable-next-line no-new-func
  return Function(`"use strict";return (${expr.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)")});`)();
}

export function eduReview(episode, series = {}) {
  const e = episode.edu ?? {};
  const checks = [];
  const add = (key, title, ok, critical, fix) => checks.push({ key, title, ok: !!ok, critical, fix });
  const script = episode.segments.map((s) => s.say).join(" ");
  const types = episode.segments.map((s) => s.scene.type);
  const words = tokenize(script).length;

  add("objective", "فيه هدف تعليمي واحد واضح", e.objective && e.objective.length > 20, true,
    "اكتب في edu.objective: \"المشاهد بعد الحلقة هيقدر …\" (فعل قابل للقياس، مش \"يعرف يعني إيه\").");
  add("beyond", "بيعلّم حاجة أبعد من التعريف (ليه/إمتى/إزاي يأثر على قرار)", (e.insights?.length ?? 0) >= 2 && types.some((t) => APPLIED.has(t)), true,
    "ضيف 2–3 أفكار داعمة في edu.insights، ومشهد تطبيق (scenario/breakdown/case/decision) مش بس term.");
  add("application", "فيه تطبيق عملي بأرقام وافتراضات معلنة", e.case && (e.assumptions?.length ?? 0) >= 2, true,
    "اعرض حالة واحدة واقعية في edu.case واكتب افتراضاتها (الفترة، العملة، نوع الصفقة) في edu.assumptions.");
  add("insight", "فيه فكرة مش واضحة من أول نظرة (non-obvious insight)", e.nonObvious && e.nonObvious.length > 20, true,
    "إيه اللي أغلب المشاهدين فاهمينه غلط عن الموضوع ده؟ اكتبه في edu.nonObvious وخليه يتقال صراحة في السكريبت.");
  add("limits", "بيقول إيه اللي **مينفعش** نستنتجه", e.limits && e.limits.length > 15, true,
    "ضيف edu.limits: الرقم/المعادلة دي مش بتقول إيه؟ (مثلاً: التقييم الضمني ≠ القيمة العادلة).");
  const quizIdx = types.indexOf("quiz");
  const quiz = quizIdx >= 0 ? episode.segments[quizIdx].scene : null;
  const calcQuiz = quiz && !quiz.options && /بكام|كام\b|احسب/.test(`${quiz.ask ?? ""} ${quiz.question ?? ""}`);
  add("quiz", "السؤال بيختبر فهم مش آلة حاسبة", quiz && !calcQuiz && JUDGMENT.has(e.quiz?.type), true,
    "حوّل السؤال لسيناريو فيه trade-off أو معلومة ناقصة، وحدد edu.quiz.type (judgment / missing-info / tradeoff / interpretation).");
  add("answer", "الإجابة مشروحة + ليه البدائل المغرية ناقصة", e.quiz?.answer && (e.quiz?.whyNot?.length ?? 0) >= 1 && episode.post?.first_comment, true,
    "اكتب edu.quiz.answer و edu.quiz.whyNot (ليه كل اختيار تاني ناقص) وحط الشرح المختصر في post.first_comment.");
  let calcOk = true, calcMsgs = [];
  for (const c of e.calcs ?? []) {
    try {
      const v = evalCalc(c.expr);
      const ok = Math.abs(v - c.expect) <= Math.max(1e-9, Math.abs(c.expect) * 0.005);
      if (!ok) { calcOk = false; calcMsgs.push(`${c.label}: ${c.expr} = ${v} مش ${c.expect}`); }
    } catch (err) { calcOk = false; calcMsgs.push(`${c.label}: ${err.message}`); }
  }
  add("calcs", `الحسابات صح (${(e.calcs ?? []).length} معادلة اتراجعت آلياً)`, calcOk && (e.calcs?.length ?? 0) > 0, true,
    calcMsgs.length ? `صحّح: ${calcMsgs.join(" · ")}` : "ضيف edu.calcs: كل رقم في الحلقة كمعادلة {label, expr, expect} عشان تتراجع آلياً.");
  const sources = (e.sources ?? []).length > 0 || e.hypothetical === true;
  add("sources", "المصادر موجودة (أو الحالة معلنة إنها افتراضية)", sources, true,
    "لو فيه شركة/رقم حقيقي: edu.sources [{claim, source, url, date}]. لو افتراضية: edu.hypothetical = true وقولها على الشاشة.");
  const banned = BANNED.filter((b) => script.includes(b));
  add("tone", "مناسب للجمهور (من غير clickbait أو نصيحة استثمار)", banned.length === 0, true,
    `شيل: ${banned.join("، ")}`);
  const latin = [...new Set(script.match(/[A-Za-z][A-Za-z-]+/g) ?? [])];
  const undefinedTerms = latin.filter((w) => !(e.terms ?? []).some((t) => t.toLowerCase().includes(w.toLowerCase())) && !["Sharks", "Shark"].includes(w));
  add("terms", "كل مصطلح إنجليزي متعرّف", undefinedTerms.length === 0, false,
    `ضيف للـ edu.terms (ومعناها في السكريبت أول مرة): ${undefinedTerms.join(", ")}`);
  const [tmin, tmax] = series.targetDuration ?? [60, 75];
  const est = words / 2.4 + episode.segments.length * 0.5;
  add("length", `الطول مناسب (${words} كلمة ≈ ${Math.round(est)}s، المستهدف ${tmin}–${tmax}s)`, est >= tmin - 10 && est <= tmax + 20, false,
    est < tmin - 10 ? "الحلقة قصيرة: فيه فكرة داعمة ناقصة؟ (مش حشو)" : "الحلقة طويلة: فيه فكرة ممكن تتشال أو تتأجل لحلقة تانية؟");
  const REAL_PEOPLE = /(أحمد طارق|محمد فاروق|أيمن عباس|أحمد أبو هشيمة|أحمد عز|ماجد شاكر)\s+(قال|بيقول|بيحب|بيفضّل|بيفضل|عمل|شايف|رأيه)/;
  add("attribution", "مفيش رأي أو قرار منسوب لشخص حقيقي من غير مصدر", !REAL_PEOPLE.test(script) || (e.sources ?? []).some((s) => s.quote), true,
    "شيل أي نسبة لرأي أو تصرف لشخص حقيقي، أو حط كلامه المنشور بنصه في edu.sources[].quote.");

  const passed = checks.filter((c) => c.critical).every((c) => c.ok);
  const score = checks.filter((c) => c.ok).length;
  const L = [`# Educational QC — ${episode.id} ${episode.term?.en ?? ""}`, "", `**${passed ? "✅ عدّى" : "❌ مرفوض"} — ${score}/${checks.length}**`, "",
    "| | المعيار | |", "|---|---|---|",
    ...checks.map((c) => `| ${c.ok ? "✅" : c.critical ? "❌" : "⚠️"} | ${c.title} | ${c.ok ? "" : c.fix} |`), ""];
  if (e.objective) L.push(`**الهدف:** ${e.objective}`, "");
  if (e.nonObvious) L.push(`**الفكرة غير الواضحة:** ${e.nonObvious}`, "");
  if (e.limits) L.push(`**حدود الاستنتاج:** ${e.limits}`, "");
  if (e.verify?.length) L.push("**⚠️ راجع قبل التسجيل:**", ...e.verify.map((v) => `- ${v}`), "");
  return { passed, score, max: checks.length, checks, issues: checks.filter((c) => !c.ok), markdown: L.join("\n") + "\n" };
}
