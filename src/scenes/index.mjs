import hook from "./hook.mjs";
import term from "./term.mjs";
import ratio from "./ratio.mjs";
import compare from "./compare.mjs";
import myth from "./myth.mjs";
import quiz from "./quiz.mjs";
import next from "./next.mjs";

export const SCENES = Object.fromEntries([hook, term, ratio, compare, myth, quiz, next].map((s) => [s.type, s]));
