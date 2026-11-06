import { readFileSync } from "node:fs";
import { runExperiment, validateExperiment, validatePatchGraph } from "./signal-core.js";

const [cmd, file] = process.argv.slice(2);
if (!cmd || !file) {
  console.error("usage: node cli.mjs <validate|run|validate-patch> <file.json>");
  process.exit(1);
}
const raw = JSON.parse(readFileSync(file, "utf8"));
let out;
if (cmd === "validate") out = validateExperiment(raw);
else if (cmd === "validate-patch") out = validatePatchGraph(raw);
else if (cmd === "run") out = runExperiment(raw);
else {
  console.error("unknown command");
  process.exit(1);
}
process.stdout.write(`${JSON.stringify(out)}\n`);
process.exit(out.ok ? 0 : 2);
