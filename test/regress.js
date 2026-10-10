// Regression check: runs the app's own course-config and geometry code (lifted out of
// index.html) over the bundled course.json and compares every hole's numbers with
// test/golden.txt.   node test/regress.js          check
//                    node test/regress.js --update  rewrite the golden file on purpose
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < i) throw new Error("marker missing: " + a); return src.slice(i, j); };
const code = cut("const COURSE = {", "const OVERPASS") + "const YD = 1.09361;\n" + cut("/*GEO-START*/", "/*GEO-END*/") + cut("/*SUG-START*/", "/*SUG-END*/") + `
const course = processCourse(normOverpass(JSON.parse(raw)), COURSE.match);
const lines = [course.name + " " + JSON.stringify(course.counts)];
for (const h of course.holes) {
  const par = h.par || COURSE.par[h.n - 1] || null, g = greenNums(h.teePt, h);
  const hz = hazardsAhead(h.teePt, h, 0, g.mid).map(z => z.label + " " + Math.round(z.reach) + "/" + (z.carry == null ? "-" : Math.round(z.carry)));
  lines.push(["hole " + h.n, "par " + par, "len " + Math.round(h.len), "front " + Math.round(g.front), "mid " + Math.round(g.mid), "back " + Math.round(g.back),
    "tees " + h.tees.length, "bunkers " + h.bunkers.length, "water " + h.water.length, "hazards [" + hz.join("; ") + "]"].join(" | "));
}
// club suggestions from each tee for a fixed bag (metres, longest first)
const bag = [["Driver",220],["3 Wood",200],["5 Wood",185],["Hybrid",175],["4 Iron",165],["5 Iron",155],["6 Iron",145],["7 Iron",135],["8 Iron",125],["9 Iron",115],["PW",105],["GW",90],["SW",75],["LW",60]].map(([club, d]) => ({ club, d, n: 0 }));
for (const h of course.holes) {
  const g = greenNums(h.teePt, h), s = suggestClub(g.mid, bag);
  const hz = hazardsAhead(h.teePt, h, 0, g.mid).filter(z => z.carry != null).map(z => Math.round(z.carry) + "=" + (carryClub(z.carry, bag) || "none"));
  lines.push(["club hole " + h.n, s.club + " " + s.d, "leaves " + Math.round(s.leaves), "part " + s.part, "carry [" + hz.join("; ") + "]"].join(" | "));
}
for (const m of [0, 30, 44, 46, 60, 67, 68, 110, 205, 235, 236]) { const s = suggestClub(m, bag); lines.push("suggest " + m + " | " + (s ? s.club + " leaves " + Math.round(s.leaves) + " part " + s.part : "none")); }
// typed and logged numbers mixed: Driver typed 200 but logging 181, fairway wood still on its typed 190
const mixed = [{ club: "15° Wood", d: 190, n: 0, typed: 190 }, { club: "Driver", d: 181, n: 3, typed: 200 }, { club: "7 Iron", d: 140, n: 0, typed: 140 }];
for (const m of [329, 206, 205, 188, 183, 150]) { const s = suggestClub(m, mixed); lines.push("mixed " + m + " | " + s.club + " " + s.d + " leaves " + Math.round(s.leaves) + " part " + s.part); }
lines.push("suggest 150 with empty bag | " + suggestClub(150, []) + " | carry 150 with empty bag | " + carryClub(150, []));
out = lines.join("\\n") + "\\n";`;
const box = { raw: fs.readFileSync(path.join(root, "course.json"), "utf8"), out: "" };
vm.runInNewContext(code, box);
const gold = path.join(__dirname, "golden.txt");
if (process.argv.includes("--update")) { fs.writeFileSync(gold, box.out); console.log("golden.txt rewritten (" + box.out.split("\n").length + " lines)"); process.exit(0); }
const want = fs.readFileSync(gold, "utf8");
if (want === box.out) { console.log("PASS: " + (box.out.split("\n").length - 1) + " lines match golden.txt"); process.exit(0); }
const a = want.split("\n"), b = box.out.split("\n");
for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) console.log("line " + (i + 1) + "\n  golden: " + a[i] + "\n  now:    " + b[i]);
console.log("FAIL"); process.exit(1);
