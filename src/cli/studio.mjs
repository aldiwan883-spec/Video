// npm run studio -- 001 → يفتح المشروع المتولّد في HyperFrames Studio (تعديل بإيدك في المتصفح)
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { ROOT, findEpisodeDir, loadEpisode } from "../lib/episode.mjs";

const ep = loadEpisode(findEpisodeDir(process.argv[2]));
const proj = path.join(ROOT, "output", `${ep.id}-${ep.slug}`, "project");
if (!fs.existsSync(proj)) { console.error("شغّل npm run preview:episode -- " + ep.id + " الأول."); process.exit(1); }
console.log("⚠️ أي تعديل في Studio بيتمسح لما تعمل build تاني. التعديلات الدايمة مكانها episode.json أو src/scenes.");
spawn("npx", ["hyperframes", "preview"], { cwd: proj, stdio: "inherit" });
