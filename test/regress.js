// Regression check: runs the app's own course-config and geometry code (lifted out of
// index.html) over the bundled course.json and compares every hole's numbers with
// test/golden.txt.   node test/regress.js          check
//                    node test/regress.js --update  rewrite the golden file on purpose
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < i) throw new Error("marker missing: " + a); return src.slice(i, j); };
const code = cut("const COURSE = {", "const OVERPASS") + "const YD = 1.09361;\n" + cut("/*GEO-START*/", "/*GEO-END*/") + `
const course = processCourse(normOverpass(JSON.parse(raw)), COURSE.match);
const lines = [course.name + " " + JSON.stringify(course.counts)];
for (const h of course.holes) {
  const par = h.par || COURSE.par[h.n - 1] || null, g = greenNums(h.teePt, h);
  const hz = hazardsAhead(h.teePt, h, 0, g.mid).map(z => z.label + " " + Math.round(z.reach) + "/" + (z.carry == null ? "-" : Math.round(z.carry)));
  lines.push(["hole " + h.n, "par " + par, "len " + Math.round(h.len), "front " + Math.round(g.front), "mid " + Math.round(g.mid), "back " + Math.round(g.back),
    "tees " + h.tees.length, "bunkers " + h.bunkers.length, "water " + h.water.length, "hazards [" + hz.join("; ") + "]"].join(" | "));
}
out = lines.join("\\n") + "\\n";`;
const box = { raw: fs.readFileSync(path.join(root, "course.json"), "utf8"), out: "" };
vm.runInNewContext(code, box);
const gold = path.join(__dirname, "golden.txt");
if (process.argv.includes("--update")) { fs.writeFileSync(gold, box.out); console.log("golden.txt rewritten (" + box.out.split("\n").length + " lines)"); process.exit(0); }
const want = fs.readFileSync(gold, "utf8");
if (want === box.out) { console.log("PASS: " + (box.out.split("\n").length - 2) + " holes match golden.txt"); process.exit(0); }
const a = want.split("\n"), b = box.out.split("\n");
for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) console.log("line " + (i + 1) + "\n  golden: " + a[i] + "\n  now:    " + b[i]);
console.log("FAIL"); process.exit(1);
