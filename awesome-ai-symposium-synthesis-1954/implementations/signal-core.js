/**
 * Pure computational core for the public symposium demos.
 * No network, no eval, no API keys. Browser and Node (ESM).
 *
 * CTC language in the surrounding notes means computational feedback
 * and fixed points. This file does not model physical time travel.
 * Solomonoff's universal mixture is not computed here; only a finite toy.
 */

export const LIMITS = {
  maxInteractive: 64,
  maxBenchN: 1024,
  maxBenchQueries: 20000,
  maxAbs: 1e6,
  maxRail: 1e9,
  maxPayloadChars: 100000,
  maxPrograms: 64,
  maxBits: 16,
  maxOutput: 32,
  maxSteps: 5000,
};

const FORBIDDEN_KEYS = new Set([
  "eval",
  "function",
  "script",
  "code",
  "constructor",
  "prototype",
  "__proto__",
]);

const NODE_KINDS = new Set([
  "cv-source",
  "vca",
  "summer",
  "waveshaper",
  "constant",
  "feedback-attenuator",
  "clamp",
]);

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function mad(values) {
  const med = median(values);
  if (med == null) return null;
  return median(values.map((v) => Math.abs(v - med)));
}

export function nowMs() {
  if (typeof performance !== "undefined" && performance.now) return performance.now();
  return Date.now();
}

export function runtimeContext() {
  const nav = typeof navigator !== "undefined" ? navigator : null;
  const proc = typeof process !== "undefined" ? process : null;
  return {
    engine: proc?.versions?.node ? "node" : "browser",
    node: proc?.versions?.node ?? null,
    platform: proc?.platform ?? nav?.platform ?? null,
    arch: proc?.arch ?? null,
    hardwareConcurrency: nav?.hardwareConcurrency ?? null,
    userAgent: nav?.userAgent ?? null,
    language: "javascript",
  };
}

function isObject(v) {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function forbiddenKey(key) {
  return FORBIDDEN_KEYS.has(String(key));
}

function walkForbidden(value, path, errors) {
  if (Array.isArray(value)) {
    if (value.length > 20000) errors.push(`${path} exceeds length cap`);
    value.forEach((item, i) => walkForbidden(item, `${path}[${i}]`, errors));
    return;
  }
  if (!isObject(value)) return;
  for (const key of Object.keys(value)) {
    if (forbiddenKey(key)) errors.push(`forbidden key ${path}.${key}`);
    walkForbidden(value[key], `${path}.${key}`, errors);
  }
}

function finiteIn(value, name, errors, { maxAbs = LIMITS.maxAbs, integer = false } = {}) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${name} must be a finite number`);
    return false;
  }
  if (Math.abs(value) > maxAbs) {
    errors.push(`${name} exceeds ±${maxAbs}`);
    return false;
  }
  if (integer && !Number.isInteger(value)) {
    errors.push(`${name} must be an integer`);
    return false;
  }
  return true;
}

function vector(value, name, errors, maxLen = LIMITS.maxInteractive) {
  if (!Array.isArray(value) || value.length < 1 || value.length > maxLen) {
    errors.push(`${name} must be an array of length 1..${maxLen}`);
    return false;
  }
  return value.every((v, i) => finiteIn(v, `${name}[${i}]`, errors));
}

export function quantize(value, step) {
  if (!(step > 0)) return value;
  const q = value / step;
  const n = Math.floor(q + 0.5);
  return n * step;
}

export function dot(w, x) {
  let s = 0;
  const n = Math.min(w.length, x.length);
  for (let i = 0; i < n; i++) s += w[i] * x[i];
  return s;
}

/**
 * Reference neuron: y = tanh(w·x + bias). Float64, no rail, no knob quant.
 */
export function mixReference(x, w, bias = 0) {
  const sum = bias + dot(w, x);
  return { sum, y: Math.tanh(sum) };
}

/**
 * Patch metaphor.
 * input volts = x * voltsPerUnit
 * gain = quantized w (dimensionless)
 * sum volts = bias*voltsPerUnit + Σ gain_i * input_volts_i
 * clip to ±railVolts, divide by voltsPerUnit, optional tanh.
 * Unitary scaling (voltsPerUnit != 1) matches the reference until a rail is hit
 * or a quantizer moves a coefficient.
 */
export function mixPatch(x, w, bias = 0, opts = {}) {
  const voltsPerUnit = opts.voltsPerUnit ?? 1;
  const quantStep = opts.quantStep ?? 0;
  const railVolts = opts.railVolts ?? 1e9;
  const shaper = opts.shaper ?? "tanh";
  const wq = w.map((v) => quantize(v, quantStep));
  const bq = quantize(bias, quantStep);
  let sumVolts = bq * voltsPerUnit;
  for (let i = 0; i < x.length; i++) sumVolts += wq[i] * (x[i] * voltsPerUnit);
  const saturated = Math.abs(sumVolts) > railVolts;
  const clippedVolts = Math.max(-railVolts, Math.min(railVolts, sumVolts));
  const norm = voltsPerUnit === 0 ? 0 : clippedVolts / voltsPerUnit;
  const y = shaper === "linear" ? norm : Math.tanh(norm);
  return { y, sumVolts, clippedVolts, saturated, norm, wq, bq, shaper };
}

export function mixPair(spec) {
  const ref = mixReference(spec.x, spec.w, spec.bias ?? 0);
  const patch = mixPatch(spec.x, spec.w, spec.bias ?? 0, spec);
  return {
    reference: ref,
    patch,
    residual: Math.abs(ref.y - patch.y),
    equalProblem: true,
  };
}

export function stepMap(x, spec) {
  const alpha = spec.alpha * (1 + (spec.tolerance ?? 0));
  let nx = (1 - alpha) * spec.c + alpha * x;
  let clamped = false;
  if (spec.lo != null && nx < spec.lo) {
    nx = spec.lo;
    clamped = true;
  }
  if (spec.hi != null && nx > spec.hi) {
    nx = spec.hi;
    clamped = true;
  }
  return { x: nx, clamped, alpha };
}

export function iterateMap(spec) {
  const steps = spec.steps ?? spec.maxSteps ?? 64;
  let x = spec.x0;
  const hist = [x];
  let clampedAny = false;
  for (let i = 0; i < steps; i++) {
    const next = stepMap(x, spec);
    x = next.x;
    clampedAny = clampedAny || next.clamped;
    hist.push(x);
    if (spec.eps != null && Math.abs(hist[hist.length - 1] - hist[hist.length - 2]) < spec.eps) {
      return { x, hist, steps: i + 1, stopped: "residual", clampedAny };
    }
  }
  return { x, hist, steps, stopped: "maxSteps", clampedAny };
}

/** Affine closed form. Not valid once a clamp binds. Distance multiplies by |alpha| each step. */
export function closedFormAffine(alpha, c, x0, n) {
  if (alpha === 1) return x0;
  return c + Math.pow(alpha, n) * (x0 - c);
}

export function stepsToEps(alpha, c, x0, eps) {
  const distance = Math.abs(x0 - c);
  if (!(Math.abs(alpha) < 1)) {
    return { applicable: false, reason: "not a strict contraction", steps: null };
  }
  if (!(eps > 0)) return { applicable: false, reason: "eps must be positive", steps: null };
  if (distance <= eps) return { applicable: true, steps: 0, reason: "already inside budget" };
  const ratio = Math.log(eps / distance) / Math.log(Math.abs(alpha));
  if (!Number.isFinite(ratio)) return { applicable: false, reason: "log failed", steps: null };
  return { applicable: true, steps: Math.ceil(ratio), reason: "affine contraction" };
}

export function isPrefixFree(bitstrings) {
  const sorted = [...bitstrings].sort();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].startsWith(sorted[i])) return false;
    }
  }
  return true;
}

export function kraftSum(bitstrings) {
  return bitstrings.reduce((sum, bits) => sum + 2 ** -bits.length, 0);
}

/**
 * Finite prefix-free mixture. This is not Solomonoff's universal P_M.
 * Programs are hand-listed (bits, output). Weight is 2^{-|bits|}.
 * Observation is a prefix filter on output strings.
 */
export function finiteMixture(programs, observation = "") {
  const bits = programs.map((p) => p.bits);
  if (!isPrefixFree(bits)) {
    return { ok: false, reason: "program set is not prefix-free", universal: false };
  }
  for (const program of programs) {
    if (!/^[01]+$/.test(program.bits) || !/^[01]+$/.test(program.output)) {
      return { ok: false, reason: "bits and outputs must be 0/1 strings", universal: false };
    }
  }
  const kraft = kraftSum(bits);
  const consistent = [];
  for (const program of programs) {
    if (program.output.startsWith(observation) || observation.startsWith(program.output)) {
      consistent.push({ ...program, weight: 2 ** -program.bits.length });
    }
  }
  const mass = consistent.reduce((s, p) => s + p.weight, 0);
  const next = { "0": 0, "1": 0 };
  if (mass > 0) {
    for (const program of consistent) {
      if (program.output.length > observation.length && program.output.startsWith(observation)) {
        const bit = program.output[observation.length];
        next[bit] += program.weight / mass;
      } else if (observation.startsWith(program.output) && observation.length >= program.output.length) {
        // Program ended before the next query bit: no continuation in this toy.
      }
    }
  }
  return {
    ok: true,
    universal: false,
    label: "finite_prefix_free_toy_not_solomonoff_Pm",
    kraft,
    massOnObservation: mass,
    consistent: consistent.map(({ bits: b, output, weight }) => ({ bits: b, output, weight })),
    nextBit: next,
    droppedBecauseInconsistent: programs.length - consistent.length,
  };
}

export function adaptOnline(spec) {
  const xs = spec.xs;
  const targetW = spec.targetW;
  const initW = spec.initW;
  let w = initW.slice();
  const wInit = initW.slice();
  const hist = [];
  const bias = spec.bias ?? 0;
  const lr = spec.lr;
  const steps = spec.steps;
  for (let t = 0; t < steps; t++) {
    if (spec.resetAt != null && t === spec.resetAt) w = wInit.slice();
    const x = xs[t % xs.length];
    let sT = bias;
    let s = bias;
    for (let i = 0; i < w.length; i++) {
      sT += targetW[i] * x[i];
      s += w[i] * x[i];
    }
    const yStar = Math.tanh(sT);
    const y = Math.tanh(s);
    const err = y - yStar;
    const sech2 = 1 - y * y;
    const frozen = spec.freezeAt != null && t >= spec.freezeAt;
    const wBefore = w.slice();
    if (!frozen) {
      for (let i = 0; i < w.length; i++) {
        w[i] -= lr * err * sech2 * x[i];
        if (!Number.isFinite(w[i]) || Math.abs(w[i]) > LIMITS.maxAbs) {
          hist.push({ t, squaredError: err * err, y, yStar, frozen, w: wBefore, diverged: true });
          return { ok: false, reason: "weight left the safe bound", hist, finalW: wBefore };
        }
      }
    }
    hist.push({ t, squaredError: err * err, y, yStar, frozen, w: wBefore, diverged: false });
  }
  return { ok: true, hist, finalW: w };
}

export function incrementalVsRecompute(spec) {
  const rng = mulberry32(spec.seed >>> 0);
  const n = spec.n;
  const queries = spec.queries;
  const x = Array.from({ length: n }, () => rng() * 2 - 1);
  const w0 = Array.from({ length: n }, () => rng() * 2 - 1);
  const updates = Array.from({ length: queries }, () => ({
    i: Math.floor(rng() * n),
    value: rng() * 2 - 1,
  }));

  function recompute() {
    const w = w0.slice();
    let flops = 0;
    let y = 0;
    for (const u of updates) {
      w[u.i] = u.value;
      y = 0;
      for (let k = 0; k < n; k++) {
        y += w[k] * x[k];
        flops += 2;
      }
    }
    return { y, flops };
  }

  function incremental() {
    const w = w0.slice();
    let y = 0;
    let flops = 0;
    for (let k = 0; k < n; k++) {
      y += w[k] * x[k];
      flops += 2;
    }
    const preprocessFlops = flops;
    for (const u of updates) {
      const delta = u.value - w[u.i];
      y += delta * x[u.i];
      w[u.i] = u.value;
      flops += 3;
    }
    return { y, flops, preprocessFlops };
  }

  const full = recompute();
  const inc = incremental();
  const absError = Math.abs(full.y - inc.y);

  function time(fn) {
    const warmup = spec.warmup ?? 2;
    const repeats = spec.repeats ?? 7;
    for (let i = 0; i < warmup; i++) fn();
    const samples = [];
    for (let i = 0; i < repeats; i++) {
      const t0 = nowMs();
      fn();
      samples.push(nowMs() - t0);
    }
    return { samplesMs: samples, medianMs: median(samples), madMs: mad(samples) };
  }

  const timeRecompute = time(recompute);
  const timeIncremental = time(incremental);
  const ratio = timeRecompute.medianMs > 0 ? timeIncremental.medianMs / timeRecompute.medianMs : null;
  return {
    n,
    queries,
    seed: spec.seed >>> 0,
    absError,
    matchedErrorBudget: 1e-6,
    withinBudget: absError <= 1e-6,
    flopsRecompute: full.flops,
    flopsIncremental: inc.flops,
    preprocessFlops: inc.preprocessFlops,
    stateBytes: (n + 1) * 8,
    timeRecompute,
    timeIncremental,
    medianRatioIncrementalOverRecompute: ratio,
    fasterOnThisRun: ratio != null && ratio < 1,
    note: "Browser/Node CPU software. Not a Eurorack, FPGA, or asymptotic-optimality result. Preprocess cost is included in the incremental flop count and timer.",
  };
}

export function contractionFrontier(spec) {
  const alpha = spec.alpha ?? 0.5;
  const c = spec.c ?? 1;
  const x0 = spec.x0 ?? -1.5;
  const budgets = spec.budgets ?? [1e-2, 1e-3, 1e-4, 1e-6, 1e-8, 1e-18];
  const batch = spec.batch ?? 2000;
  const repeats = spec.repeats ?? 5;
  const warmup = spec.warmup ?? 1;
  const rows = [];
  for (const eps of budgets) {
    const plan = stepsToEps(alpha, c, x0, eps);
    const steps = plan.applicable ? plan.steps : 0;
    const iterOnce = () => {
      let acc = 0;
      for (let b = 0; b < batch; b++) acc += iterateMap({ alpha, c, x0, steps, eps: null }).x;
      return acc;
    };
    const closedOnce = () => {
      let acc = 0;
      for (let b = 0; b < batch; b++) acc += closedFormAffine(alpha, c, x0, steps);
      return acc;
    };
    const time = (fn) => {
      for (let i = 0; i < warmup; i++) fn();
      const samples = [];
      for (let i = 0; i < repeats; i++) {
        const t0 = nowMs();
        fn();
        samples.push(nowMs() - t0);
      }
      return { samplesMs: samples, medianMs: median(samples), madMs: mad(samples) };
    };
    const xIter = iterateMap({ alpha, c, x0, steps, eps: null }).x;
    const xClosed = plan.applicable ? closedFormAffine(alpha, c, x0, steps) : null;
    const errIter = Math.abs(xIter - c);
    const errClosed = xClosed == null ? null : Math.abs(xClosed - c);
    const floatFloor = Math.abs(c) * Number.EPSILON * 8 + 1e-15;
    rows.push({
      eps,
      steps: plan.applicable ? steps : null,
      applicable: plan.applicable,
      iterationError: errIter,
      closedFormError: errClosed,
      iterationMeetsBudget: errIter <= Math.max(eps, floatFloor),
      closedFormMeetsBudget: errClosed != null && errClosed <= Math.max(eps, floatFloor),
      agreement: xClosed == null ? null : Math.abs(xIter - xClosed),
      timeIteration: time(iterOnce),
      timeClosedForm: time(closedOnce),
      impossibleInFloat64: eps < 1e-15,
    });
  }
  return {
    alpha,
    c,
    x0,
    batch,
    rows,
    baseline: "naive iteration of the affine recurrence",
    structuredMethod: "closed form x_n = c + alpha^n (x0-c), only for the unclamped affine map",
    notUniversal: true,
  };
}

export function validateExperiment(raw) {
  const errors = [];
  if (!isObject(raw)) return { ok: false, errors: ["root must be a JSON object"] };
  const text = JSON.stringify(raw);
  if (text.length > LIMITS.maxPayloadChars) errors.push("payload too large");
  walkForbidden(raw, "$", errors);
  if (typeof raw.kind !== "string") errors.push("kind must be a string");
  const kind = raw.kind;
  const allowed = new Set(["mixer", "lattice", "solomonoff", "adapt", "bench", "frontier"]);
  if (!allowed.has(kind)) errors.push("unknown kind");
  if (raw.seed != null) finiteIn(raw.seed, "seed", errors, { integer: true, maxAbs: 1e9 });

  if (kind === "mixer" && errors.length === 0) {
    const m = raw.mixer;
    if (!isObject(m)) errors.push("mixer object required");
    else {
      vector(m.x, "mixer.x", errors);
      vector(m.w, "mixer.w", errors);
      if (Array.isArray(m.x) && Array.isArray(m.w) && m.x.length !== m.w.length) {
        errors.push("mixer.x and mixer.w length mismatch");
      }
      if (m.bias != null) finiteIn(m.bias, "mixer.bias", errors);
      if (m.quantStep != null) finiteIn(m.quantStep, "mixer.quantStep", errors, { maxAbs: 10 });
      if (m.voltsPerUnit != null) finiteIn(m.voltsPerUnit, "mixer.voltsPerUnit", errors, { maxAbs: 100 });
      if (m.railVolts != null) finiteIn(m.railVolts, "mixer.railVolts", errors, { maxAbs: LIMITS.maxRail });
      if (m.shaper != null && m.shaper !== "tanh" && m.shaper !== "linear") errors.push("shaper must be tanh or linear");
      if (m.quantStep != null && m.quantStep < 0) errors.push("quantStep must be >= 0");
      if (m.voltsPerUnit != null && m.voltsPerUnit <= 0) errors.push("voltsPerUnit must be > 0");
      if (m.railVolts != null && m.railVolts <= 0) errors.push("railVolts must be > 0");
    }
  }
  if (kind === "lattice" && errors.length === 0) {
    const L = raw.lattice;
    if (!isObject(L)) errors.push("lattice object required");
    else {
      finiteIn(L.alpha, "lattice.alpha", errors, { maxAbs: 4 });
      finiteIn(L.c, "lattice.c", errors);
      finiteIn(L.x0, "lattice.x0", errors);
      if (L.eps != null) finiteIn(L.eps, "lattice.eps", errors, { maxAbs: 10 });
      if (L.steps != null) finiteIn(L.steps, "lattice.steps", errors, { integer: true, maxAbs: LIMITS.maxSteps });
      if (L.maxSteps != null) finiteIn(L.maxSteps, "lattice.maxSteps", errors, { integer: true, maxAbs: LIMITS.maxSteps });
      if (L.tolerance != null) finiteIn(L.tolerance, "lattice.tolerance", errors, { maxAbs: 2 });
      if (L.lo != null) finiteIn(L.lo, "lattice.lo", errors);
      if (L.hi != null) finiteIn(L.hi, "lattice.hi", errors);
      if (L.lo != null && L.hi != null && L.lo > L.hi) errors.push("lattice.lo > lattice.hi");
    }
  }
  if (kind === "solomonoff" && errors.length === 0) {
    const s = raw.solomonoff;
    if (!isObject(s) || !Array.isArray(s.programs)) errors.push("solomonoff.programs required");
    else {
      if (s.programs.length < 1 || s.programs.length > LIMITS.maxPrograms) errors.push("program count out of range");
      for (const [i, program] of s.programs.entries()) {
        if (!isObject(program)) errors.push(`program ${i} must be an object`);
        else {
          if (typeof program.bits !== "string" || program.bits.length < 1 || program.bits.length > LIMITS.maxBits) {
            errors.push(`program ${i} bits length`);
          }
          if (typeof program.output !== "string" || program.output.length < 1 || program.output.length > LIMITS.maxOutput) {
            errors.push(`program ${i} output length`);
          }
        }
      }
      if (s.observation != null && (typeof s.observation !== "string" || s.observation.length > LIMITS.maxOutput)) {
        errors.push("observation must be a short string");
      }
    }
  }
  if (kind === "adapt" && errors.length === 0) {
    const a = raw.adapt;
    if (!isObject(a)) errors.push("adapt object required");
    else {
      vector(a.targetW, "adapt.targetW", errors);
      vector(a.initW, "adapt.initW", errors);
      if (!Array.isArray(a.xs) || a.xs.length < 1 || a.xs.length > LIMITS.maxInteractive) errors.push("adapt.xs required");
      else a.xs.forEach((row, i) => vector(row, `adapt.xs[${i}]`, errors));
      finiteIn(a.lr, "adapt.lr", errors, { maxAbs: 1000 });
      finiteIn(a.steps, "adapt.steps", errors, { integer: true, maxAbs: LIMITS.maxSteps });
      if (a.bias != null) finiteIn(a.bias, "adapt.bias", errors);
      if (a.freezeAt != null) finiteIn(a.freezeAt, "adapt.freezeAt", errors, { integer: true, maxAbs: LIMITS.maxSteps });
      if (a.resetAt != null) finiteIn(a.resetAt, "adapt.resetAt", errors, { integer: true, maxAbs: LIMITS.maxSteps });
      if (Array.isArray(a.targetW) && Array.isArray(a.initW) && a.targetW.length !== a.initW.length) {
        errors.push("targetW/initW length mismatch");
      }
      if (Array.isArray(a.xs) && Array.isArray(a.targetW)) {
        a.xs.forEach((row, i) => {
          if (Array.isArray(row) && row.length !== a.targetW.length) errors.push(`xs[${i}] width mismatch`);
        });
      }
    }
  }
  if ((kind === "bench" || kind === "frontier") && errors.length === 0) {
    const b = raw.bench ?? {};
    if (kind === "bench") {
      finiteIn(b.n ?? raw.n, "bench.n", errors, { integer: true, maxAbs: LIMITS.maxBenchN });
      finiteIn(b.queries ?? raw.queries, "bench.queries", errors, { integer: true, maxAbs: LIMITS.maxBenchQueries });
      const n = b.n ?? raw.n;
      const q = b.queries ?? raw.queries;
      if (typeof n === "number" && n < 1) errors.push("bench.n >= 1");
      if (typeof q === "number" && q < 1) errors.push("bench.queries >= 1");
    }
    if (b.repeats != null) finiteIn(b.repeats, "bench.repeats", errors, { integer: true, maxAbs: 21 });
    if (b.warmup != null) finiteIn(b.warmup, "bench.warmup", errors, { integer: true, maxAbs: 10 });
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, errors: [], value: raw };
}

export function validatePatchGraph(raw) {
  const errors = [];
  if (!isObject(raw)) return { ok: false, errors: ["patch graph must be an object"] };
  if (JSON.stringify(raw).length > LIMITS.maxPayloadChars) errors.push("payload too large");
  walkForbidden(raw, "$", errors);
  if (!Array.isArray(raw.nodes) || raw.nodes.length < 1 || raw.nodes.length > 128) errors.push("nodes length");
  if (!Array.isArray(raw.cables) || raw.cables.length > 256) errors.push("cables length");
  const ids = new Set();
  if (Array.isArray(raw.nodes)) {
    for (const node of raw.nodes) {
      if (!isObject(node) || typeof node.id !== "string" || typeof node.kind !== "string") {
        errors.push("node needs id and kind");
        continue;
      }
      if (!NODE_KINDS.has(node.kind)) errors.push(`unknown module kind ${node.kind}`);
      if (ids.has(node.id)) errors.push(`duplicate id ${node.id}`);
      ids.add(node.id);
      if (node.params != null && !isObject(node.params)) errors.push(`${node.id} params must be an object`);
    }
  }
  if (Array.isArray(raw.cables)) {
    for (const cable of raw.cables) {
      if (!isObject(cable) || !ids.has(cable.from) || !ids.has(cable.to)) errors.push("cable endpoints must exist");
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true, errors: [], value: raw };
}

export function patchGraphFromMixer(mixer) {
  const nodes = [{ id: "bias", kind: "constant", params: { value: mixer.bias ?? 0 } }];
  const cables = [{ from: "bias", to: "summer", label: "bias" }];
  mixer.x.forEach((value, i) => {
    nodes.push({ id: `in${i}`, kind: "cv-source", params: { value } });
    nodes.push({ id: `vca${i}`, kind: "vca", params: { gain: mixer.w[i] } });
    cables.push({ from: `in${i}`, to: `vca${i}`, label: "cv" });
    cables.push({ from: `vca${i}`, to: "summer", label: "weighted" });
  });
  nodes.push({ id: "summer", kind: "summer", params: {} });
  nodes.push({
    id: "shaper",
    kind: "waveshaper",
    params: { curve: mixer.shaper ?? "tanh", railVolts: mixer.railVolts ?? 1e9, voltsPerUnit: mixer.voltsPerUnit ?? 1, quantStep: mixer.quantStep ?? 0 },
  });
  cables.push({ from: "summer", to: "shaper", label: "sum" });
  return { version: 1, label: "matrix-mixer-neuron", analogy: true, nodes, cables };
}

export function patchGraphFromLattice(lattice) {
  return {
    version: 1,
    label: "feedback-fixed-point",
    analogy: true,
    notPhysicalTimeTravel: true,
    nodes: [
      { id: "target", kind: "constant", params: { value: lattice.c } },
      { id: "state", kind: "cv-source", params: { value: lattice.x0 } },
      { id: "feedback", kind: "feedback-attenuator", params: { alpha: lattice.alpha, tolerance: lattice.tolerance ?? 0 } },
      { id: "summer", kind: "summer", params: {} },
      { id: "clamp", kind: "clamp", params: { lo: lattice.lo ?? null, hi: lattice.hi ?? null } },
    ],
    cables: [
      { from: "target", to: "summer", label: "toward-c" },
      { from: "state", to: "feedback", label: "recirculating" },
      { from: "feedback", to: "summer", label: "alpha" },
      { from: "summer", to: "clamp", label: "candidate" },
    ],
  };
}

function runMixer(mixer) {
  const pair = mixPair({
    x: mixer.x,
    w: mixer.w,
    bias: mixer.bias ?? 0,
    quantStep: mixer.quantStep ?? 0,
    voltsPerUnit: mixer.voltsPerUnit ?? 1,
    railVolts: mixer.railVolts ?? 1e9,
    shaper: mixer.shaper ?? "tanh",
  });
  return {
    ...pair,
    patchGraph: patchGraphFromMixer(mixer),
    verdict: pair.residual <= 1e-9 ? "match" : "residual",
  };
}

function runLattice(lattice) {
  const steps = lattice.steps ?? lattice.maxSteps ?? 64;
  const reference = iterateMap({ ...lattice, tolerance: 0, steps, eps: lattice.eps ?? null });
  const patch = iterateMap({ ...lattice, steps, eps: lattice.eps ?? null });
  const plan = stepsToEps(lattice.alpha, lattice.c, lattice.x0, lattice.eps ?? 1e-6);
  const clampUsed = lattice.lo != null || lattice.hi != null;
  const closed = !clampUsed && plan.applicable ? closedFormAffine(lattice.alpha, lattice.c, lattice.x0, reference.steps) : null;
  const lastRef = reference.hist[reference.hist.length - 1];
  const lastPatch = patch.hist[patch.hist.length - 1];
  const residual = Math.abs(lastRef - lastPatch);
  const distance = Math.abs(lastRef - lattice.c);
  let mode = "iterated";
  if (Math.abs(lattice.alpha) < 1 && !clampUsed) mode = "stable-contraction";
  if (Math.abs(lattice.alpha) > 1) mode = "unstable";
  if (Math.abs(lattice.alpha) === 1) mode = "marginal";
  if (clampUsed) mode = "lattice-clamp";
  return {
    reference,
    patch,
    residual,
    distanceToTarget: distance,
    closedForm: closed,
    closedFormApplicable: !clampUsed && plan.applicable,
    closedFormAgreement: closed == null ? null : Math.abs(closed - lastRef),
    mode,
    plan,
    patchGraph: patchGraphFromLattice(lattice),
    verdict: residual <= 1e-9 ? "match" : "residual",
    disclaimer: "Computational feedback fixed point. Not a physical closed timelike curve and not a complexity-class result.",
  };
}

export function runExperiment(raw) {
  const checked = validateExperiment(raw);
  if (!checked.ok) return { ok: false, errors: checked.errors, verdict: "rejected" };
  const input = checked.value;
  let result;
  if (input.kind === "mixer") result = runMixer(input.mixer);
  else if (input.kind === "lattice") result = runLattice(input.lattice);
  else if (input.kind === "solomonoff") {
    result = finiteMixture(input.solomonoff.programs, input.solomonoff.observation ?? "");
    result.verdict = result.ok ? "finite-toy" : "rejected";
  } else if (input.kind === "adapt") {
    result = adaptOnline(input.adapt);
    const hist = result.hist;
    const initial = hist[0]?.squaredError ?? null;
    const final = hist[hist.length - 1]?.squaredError ?? null;
    const peak = hist.reduce((m, row) => Math.max(m, row.squaredError), 0);
    result.initialSquaredError = initial;
    result.finalSquaredError = final;
    result.peakSquaredError = peak;
    result.improved = result.ok && final != null && initial != null && final < initial;
    result.worsened = final != null && initial != null && final > initial * 1.05;
    result.verdict = !result.ok ? "diverged" : result.worsened ? "worsened" : result.improved ? "improved" : "flat";
  } else if (input.kind === "bench") {
    const b = input.bench ?? input;
    result = incrementalVsRecompute({
      n: b.n,
      queries: b.queries,
      seed: input.seed ?? b.seed ?? 1,
      warmup: b.warmup ?? 2,
      repeats: b.repeats ?? 7,
    });
    result.verdict = result.withinBudget ? "measured" : "error-budget-miss";
  } else if (input.kind === "frontier") {
    const b = input.bench ?? {};
    result = contractionFrontier({
      alpha: b.alpha ?? 0.5,
      c: b.c ?? 1,
      x0: b.x0 ?? -1.5,
      batch: b.batch ?? 2000,
      repeats: b.repeats ?? 5,
      warmup: b.warmup ?? 1,
      budgets: b.budgets,
    });
    result.verdict = "measured";
  }
  return {
    ok: true,
    kind: input.kind,
    context: runtimeContext(),
    result,
    verdict: result.verdict,
  };
}

export function roundtripExperiment(raw) {
  const checked = validateExperiment(raw);
  if (!checked.ok) return checked;
  const again = JSON.parse(JSON.stringify(checked.value));
  const second = validateExperiment(again);
  return {
    ok: second.ok,
    errors: second.errors,
    equal: JSON.stringify(checked.value) === JSON.stringify(second.value),
  };
}
