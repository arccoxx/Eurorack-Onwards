import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  adaptOnline,
  closedFormAffine,
  contractionFrontier,
  finiteMixture,
  incrementalVsRecompute,
  iterateMap,
  mixPair,
  patchGraphFromMixer,
  roundtripExperiment,
  runExperiment,
  stepsToEps,
  validateExperiment,
  validatePatchGraph,
} from "../implementations/signal-core.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const resultsDir = join(root, "results");
mkdirSync(resultsDir, { recursive: true });
const claimsDoc = JSON.parse(readFileSync(join(root, "claims/preregistered-claims.json"), "utf8"));
const log = [];
const verdicts = [];

function check(id, pass, detail) {
  verdicts.push({ id, pass: !!pass, detail });
  log.push({ id, pass: !!pass, detail });
  if (!pass) console.error("FAIL", id, detail);
}

const ideal = mixPair({ x: [0.5, -0.2, 0.8], w: [1, 0.5, -0.3], bias: 0, quantStep: 0, voltsPerUnit: 1, railVolts: 1e6, shaper: "tanh" });
check("mixer.ideal-residual", ideal.residual <= 1e-12, { residual: ideal.residual, y: ideal.reference.y });

const quant = mixPair({ x: [0.5, -0.2, 0.8], w: [1, 0.5, -0.33], bias: 0, quantStep: 0.1, voltsPerUnit: 5, railVolts: 10, shaper: "tanh" });
check("mixer.quant-residual", quant.residual > 1e-4, { residual: quant.residual, wq: quant.patch.wq });

const scaled = mixPair({ x: [0.5, -0.2, 0.8], w: [1, 0.5, -0.3], bias: 0.1, quantStep: 0, voltsPerUnit: 5, railVolts: 10, shaper: "tanh" });
check("mixer.scale-unitary", scaled.residual <= 1e-12 && scaled.patch.saturated === false, { residual: scaled.residual });

const rail = mixPair({ x: [1, 1, 1], w: [3, 3, 3], bias: 0, quantStep: 0, voltsPerUnit: 5, railVolts: 8, shaper: "tanh" });
check("mixer.rail-saturates", rail.patch.saturated && rail.residual > 1e-3 && Math.abs(rail.patch.y) < 1, {
  residual: rail.residual,
  yPatch: rail.patch.y,
  yRef: rail.reference.y,
});

const stable = runExperiment({
  kind: "lattice",
  lattice: { alpha: 0.5, c: 1, x0: -1.5, eps: 1e-6, maxSteps: 80, tolerance: 0 },
});
check("lattice.stable", stable.result.mode === "stable-contraction" && stable.result.distanceToTarget < 1e-6, {
  mode: stable.result.mode,
  distance: stable.result.distanceToTarget,
  steps: stable.result.reference.steps,
});

const unstable = runExperiment({
  kind: "lattice",
  lattice: { alpha: 1.2, c: 0, x0: 0.5, steps: 8, tolerance: 0 },
});
const grew = Math.abs(unstable.result.reference.hist.at(-1)) > Math.abs(0.5);
check("lattice.unstable", unstable.result.mode === "unstable" && grew, {
  mode: unstable.result.mode,
  end: unstable.result.reference.hist.at(-1),
});

const plan = stepsToEps(0.5, 1, -1.5, 1e-6);
const xIter = iterateMap({ alpha: 0.5, c: 1, x0: -1.5, steps: plan.steps, eps: null }).x;
const xClosed = closedFormAffine(0.5, 1, -1.5, plan.steps);
check("lattice.closed-form-agreement", Math.abs(xIter - xClosed) <= 1e-9 && Math.abs(xIter - 1) <= 1e-6, {
  agreement: Math.abs(xIter - xClosed),
  steps: plan.steps,
});

const clamped = runExperiment({
  kind: "lattice",
  lattice: { alpha: 0.5, c: 1, x0: 0, steps: 30, lo: -0.4, hi: 0.4, tolerance: 0 },
});
check(
  "lattice.clamp-blocks-closed-form",
  clamped.result.mode === "lattice-clamp" &&
    Math.abs(clamped.result.reference.x - 0.4) < 1e-9 &&
    clamped.result.closedFormApplicable === false,
  { end: clamped.result.reference.x, applicable: clamped.result.closedFormApplicable },
);

const dirty = runExperiment({
  kind: "lattice",
  lattice: { alpha: 0.5, c: 1, x0: -1.5, steps: 6, tolerance: 0.01 },
});
check("lattice.tolerance-residual", dirty.result.residual > 1e-4, { residual: dirty.result.residual });
check("lattice.zero-tolerance-match", stable.result.residual <= 1e-12, { residual: stable.result.residual });

const programs = [
  { bits: "0", output: "0" },
  { bits: "10", output: "10" },
  { bits: "110", output: "11" },
  { bits: "111", output: "1110" },
];
const mix = finiteMixture(programs, "1");
check(
  "solomonoff.hand-calc",
  mix.ok && Math.abs(mix.kraft - 1) < 1e-12 && Math.abs(mix.nextBit["0"] - 0.5) < 1e-12 && Math.abs(mix.nextBit["1"] - 0.5) < 1e-12,
  mix,
);
const bad = finiteMixture(programs.concat([{ bits: "11", output: "110" }]), "1");
check("solomonoff.reject-prefix", bad.ok === false, bad);
check("solomonoff.not-universal", mix.universal === false && mix.label === "finite_prefix_free_toy_not_solomonoff_Pm", { label: mix.label });

const learn = adaptOnline({
  xs: [[0.6, -0.2], [-0.4, 0.8], [0.2, 0.2]],
  targetW: [0.8, -0.4],
  initW: [0, 0],
  bias: 0,
  lr: 0.35,
  steps: 40,
});
check("adapt.learn", learn.hist.at(-1).squaredError < learn.hist[0].squaredError, {
  initial: learn.hist[0].squaredError,
  final: learn.hist.at(-1).squaredError,
});
const fail = adaptOnline({ xs: [[1]], targetW: [0.2], initW: [0], bias: 0, lr: 8, steps: 6 });
check("adapt.fail", fail.hist.at(-1).squaredError > fail.hist[0].squaredError, {
  initial: fail.hist[0].squaredError,
  final: fail.hist.at(-1).squaredError,
  finalW: fail.finalW,
});
const freeze = adaptOnline({
  xs: [[0.5, 0.25]],
  targetW: [0.3, -0.2],
  initW: [0.1, 0.1],
  bias: 0,
  lr: 0.2,
  steps: 12,
  freezeAt: 4,
});
const frozenSame = freeze.hist.slice(4).every((row) => row.w.every((value, i) => value === freeze.hist[4].w[i]));
check("adapt.freeze", frozenSame, { w: freeze.hist[4].w });
const reset = adaptOnline({ xs: [[1, 0]], targetW: [0.5, 0.1], initW: [0, 0], bias: 0, lr: 0.5, steps: 8, resetAt: 5 });
check("adapt.reset", reset.hist[5].w[0] === 0 && reset.hist[5].w[1] === 0, { w: reset.hist[5].w });

const bench = incrementalVsRecompute({ n: 256, queries: 2000, seed: 7, warmup: 2, repeats: 7 });
const benchQ1 = incrementalVsRecompute({ n: 256, queries: 1, seed: 7, warmup: 2, repeats: 7 });
check("bench.error-match", bench.withinBudget && bench.stateBytes === (256 + 1) * 8, {
  absError: bench.absError,
  stateBytes: bench.stateBytes,
  preprocessFlops: bench.preprocessFlops,
});
check(
  "bench.flops",
  bench.flopsIncremental < bench.flopsRecompute && benchQ1.flopsIncremental > benchQ1.flopsRecompute,
  {
    q2000: { inc: bench.flopsIncremental, full: bench.flopsRecompute },
    q1: { inc: benchQ1.flopsIncremental, full: benchQ1.flopsRecompute },
  },
);
check("bench.wallclock-measured", bench.timeIncremental.medianMs != null && bench.timeRecompute.medianMs != null, {
  incrementalMedianMs: bench.timeIncremental.medianMs,
  incrementalMadMs: bench.timeIncremental.madMs,
  recomputeMedianMs: bench.timeRecompute.medianMs,
  recomputeMadMs: bench.timeRecompute.madMs,
  ratio: bench.medianRatioIncrementalOverRecompute,
  fasterOnThisRun: bench.fasterOnThisRun,
  q1ratio: benchQ1.medianRatioIncrementalOverRecompute,
  context: bench.note,
});

const frontier = contractionFrontier({ alpha: 0.5, c: 1, x0: -1.5, batch: 800, repeats: 5, warmup: 1 });
const ordinary = frontier.rows.filter((row) => !row.impossibleInFloat64);
const tight = ordinary.every((row) => row.iterationMeetsBudget && row.closedFormMeetsBudget && row.agreement <= 1e-9);
check("frontier.budgets", tight, ordinary.map((row) => ({
  eps: row.eps,
  steps: row.steps,
  agreement: row.agreement,
  iterationMedianMs: row.timeIteration.medianMs,
  closedMedianMs: row.timeClosedForm.medianMs,
})));
const under = frontier.rows.find((row) => row.eps === 1e-18);
check("frontier.underflow-row", under != null && Number.isFinite(under.iterationError), {
  iterationError: under?.iterationError,
  closedFormError: under?.closedFormError,
  note: "If the error is 0, float64 underflowed the correction onto the representable target. That is not extra precision.",
});
check("frontier.no-universal-claim", frontier.notUniversal === true && clamped.result.closedFormApplicable === false, {
  baseline: frontier.baseline,
  structuredMethod: frontier.structuredMethod,
});

const rejected = [
  validateExperiment({ kind: "mixer", mixer: { x: [0.2], w: ["fast"], bias: 0 } }),
  validateExperiment({ kind: "mixer", mixer: { x: [Number.NaN], w: [0.2], bias: 0 } }),
  validateExperiment({ kind: "mixer", eval: "1", mixer: { x: [0.2], w: [0.2], bias: 0 } }),
  validateExperiment({ kind: "mixer", mixer: { x: Array(1000).fill(0.1), w: Array(1000).fill(0.1), bias: 0 } }),
];
check("invalid.types", rejected.every((item) => item.ok === false), { errors: rejected.map((item) => item.errors) });

const round = roundtripExperiment(JSON.parse(readFileSync(join(root, "examples/mixer-ideal.json"), "utf8")));
check("roundtrip.export", round.ok && round.equal, round);

const schemaNames = ["experiment-input.schema.json", "experiment-result.schema.json", "patch-graph.schema.json"];
const schemasOk = schemaNames.every((name) => {
  const doc = JSON.parse(readFileSync(join(root, "schemas", name), "utf8"));
  return typeof doc.title === "string" && doc.$schema.includes("2020-12");
});
const graph = patchGraphFromMixer({ x: [0.5, -0.2], w: [1, 0.5], bias: 0 });
const graphCheck = validatePatchGraph(graph);
const badGraph = validatePatchGraph({ version: 1, nodes: [{ id: "a", kind: "eval-box" }], cables: [] });
check("schema.present", schemasOk && graphCheck.ok && badGraph.ok === false, { graphErrors: badGraph.errors });

const cli = spawnSync(process.execPath, ["implementations/cli.mjs", "run", "examples/mixer-ideal.json"], { cwd: root, encoding: "utf8" });
const py = spawnSync("python3", ["implementations/signal_core.py", "run", "examples/mixer-ideal.json"], { cwd: root, encoding: "utf8" });
const cliJson = JSON.parse(cli.stdout);
const pyJson = JSON.parse(py.stdout);
check("cli.smoke", cli.status === 0 && py.status === 0 && Math.abs(cliJson.result.reference.y - pyJson.result.reference.y) < 1e-12, {
  cliStatus: cli.status,
  pyStatus: py.status,
  js: cliJson.result.reference.y,
  py: pyJson.result.reference.y,
});

const expectedIds = new Set(claimsDoc.claims.map((claim) => claim.id));
for (const id of expectedIds) {
  if (!verdicts.some((row) => row.id === id)) check(id, false, { missing: true });
}

function png(width, height, rows) {
  const raw = Buffer.concat(rows.map((row) => Buffer.concat([Buffer.from([0]), row])));
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (tag, data) => {
    const body = Buffer.concat([Buffer.from(tag), data]);
    const head = Buffer.alloc(4);
    head.writeUInt32BE(data.length);
    const tail = Buffer.alloc(4);
    tail.writeUInt32BE(crc32(body));
    return Buffer.concat([head, body, tail]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function paintFrontier() {
  const width = 960;
  const height = 540;
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(width * 3);
    for (let x = 0; x < width; x++) {
      const o = x * 3;
      row[o] = 16;
      row[o + 1] = 22;
      row[o + 2] = 32;
    }
    rows.push(row);
  }
  const put = (x, y, rgb) => {
    if (x < 40 || y < 30 || x >= width - 20 || y >= height - 30) return;
    const o = x * 3;
    const row = rows[y];
    row[o] = rgb[0];
    row[o + 1] = rgb[1];
    row[o + 2] = rgb[2];
  };
  const series = ordinary.map((row) => ({
    eps: row.eps,
    iter: row.timeIteration.medianMs,
    closed: row.timeClosedForm.medianMs,
  }));
  const maxT = Math.max(...series.flatMap((row) => [row.iter, row.closed, 0.01]));
  series.forEach((row, index) => {
    const x = 80 + index * 150;
    const hIter = Math.max(2, (row.iter / maxT) * 360);
    const hClosed = Math.max(2, (row.closed / maxT) * 360);
    for (let dy = 0; dy < hIter; dy++) put(x, height - 50 - dy, [94, 224, 208]);
    for (let dy = 0; dy < hClosed; dy++) put(x + 36, height - 50 - dy, [255, 176, 32]);
  });
  const file = join(root, "assets/residual-frontier.png");
  writeFileSync(file, png(width, height, rows));
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" role="img" aria-labelledby="title desc">
<title id="title">Measured error-budget timing</title>
<desc id="desc">Median milliseconds for naive iteration versus the affine closed form at matched error budgets. This run only.</desc>
<rect width="960" height="540" fill="#101620"/>
<text x="40" y="42" fill="#f2f6ff" font-family="Georgia, serif" font-size="28">Matched error budget, measured time</text>
<text x="40" y="74" fill="#c5d0e0" font-family="ui-sans-serif, sans-serif" font-size="16">Cyan: iterate. Amber: closed form. Batch ${frontier.batch}. Not a universal bound.</text>
${series.map((row, index) => {
  const x = 80 + index * 150;
  const hIter = Math.max(2, (row.iter / maxT) * 360);
  const hClosed = Math.max(2, (row.closed / maxT) * 360);
  return `<rect x="${x}" y="${height - 50 - hIter}" width="28" height="${hIter}" fill="#5ee0d0"/>
<rect x="${x + 36}" y="${height - 50 - hClosed}" width="28" height="${hClosed}" fill="#ffb020"/>
<text x="${x}" y="510" fill="#e8eef7" font-size="14" font-family="ui-sans-serif, sans-serif">eps ${row.eps}</text>`;
}).join("\n")}
</svg>`;
  writeFileSync(join(root, "assets/residual-frontier.svg"), svg);
}

paintFrontier();

const summary = {
  generatedBy: "tests/run-all.mjs",
  allPass: verdicts.every((row) => row.pass),
  passCount: verdicts.filter((row) => row.pass).length,
  failCount: verdicts.filter((row) => !row.pass).length,
  context: {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
  },
  bench: {
    n: bench.n,
    queries: bench.queries,
    absError: bench.absError,
    flopsIncremental: bench.flopsIncremental,
    flopsRecompute: bench.flopsRecompute,
    preprocessFlops: bench.preprocessFlops,
    stateBytes: bench.stateBytes,
    medianRatio: bench.medianRatioIncrementalOverRecompute,
    incrementalMedianMs: bench.timeIncremental.medianMs,
    incrementalMadMs: bench.timeIncremental.madMs,
    recomputeMedianMs: bench.timeRecompute.medianMs,
    recomputeMadMs: bench.timeRecompute.madMs,
    samplesIncremental: bench.timeIncremental.samplesMs,
    samplesRecompute: bench.timeRecompute.samplesMs,
    q1: {
      flopsIncremental: benchQ1.flopsIncremental,
      flopsRecompute: benchQ1.flopsRecompute,
      medianRatio: benchQ1.medianRatioIncrementalOverRecompute,
      incrementalMedianMs: benchQ1.timeIncremental.medianMs,
      recomputeMedianMs: benchQ1.timeRecompute.medianMs,
    },
  },
  frontier,
  learn: { initial: learn.hist[0].squaredError, final: learn.hist.at(-1).squaredError },
  failAdapt: { initial: fail.hist[0].squaredError, final: fail.hist.at(-1).squaredError },
  quantResidual: quant.residual,
  idealResidual: ideal.residual,
};
writeFileSync(join(resultsDir, "test-log.json"), JSON.stringify({ summary, log }, null, 2));
writeFileSync(join(resultsDir, "claims-verdicts.json"), JSON.stringify({
  sourceClaims: "claims/preregistered-claims.json",
  allPass: summary.allPass,
  verdicts,
}, null, 2));
writeFileSync(join(resultsDir, "node-bench.json"), JSON.stringify(summary.bench, null, 2));
console.log(JSON.stringify({ allPass: summary.allPass, pass: summary.passCount, fail: summary.failCount, ratio: bench.medianRatioIncrementalOverRecompute }));
process.exit(summary.allPass ? 0 : 1);
