import hook from "./hook.mjs";
import term from "./term.mjs";
import ratio from "./ratio.mjs";
import compare from "./compare.mjs";
import myth from "./myth.mjs";
import quiz from "./quiz.mjs";
import next from "./next.mjs";
import breakdown from "./breakdown.mjs";
import caseScene from "./case.mjs";
import timeline from "./timeline.mjs";
import decision from "./decision.mjs";
import process from "./process.mjs";
import proscons from "./proscons.mjs";
import beforeafter from "./beforeafter.mjs";
import chart from "./chart.mjs";
import scenario from "./scenario.mjs";
import takeaway from "./takeaway.mjs";
import source from "./source.mjs";
import illustrated from "./illustrated.mjs";

export const SCENES = Object.fromEntries(
  [hook, term, ratio, compare, myth, quiz, next, breakdown, caseScene, timeline, decision, process, proscons, beforeafter, chart, scenario, takeaway, source, illustrated].map((s) => [s.type, s]),
);
