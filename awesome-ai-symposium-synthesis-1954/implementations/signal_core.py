#!/usr/bin/env python3
"""Pure computational core. Mirrors signal-core.js numeric contracts.

No network, no eval, no API keys. CTC means feedback fixed points, not
physical time travel. The Solomonoff routine is a finite toy only.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
import time
from typing import Any

LIMITS = {
    "maxInteractive": 64,
    "maxBenchN": 1024,
    "maxBenchQueries": 20000,
    "maxAbs": 1e6,
    "maxRail": 1e9,
    "maxPayloadChars": 100000,
    "maxPrograms": 64,
    "maxBits": 16,
    "maxOutput": 32,
    "maxSteps": 5000,
}

FORBIDDEN_KEYS = {
    "eval",
    "function",
    "script",
    "code",
    "constructor",
    "prototype",
    "__proto__",
}
NODE_KINDS = {
    "cv-source",
    "vca",
    "summer",
    "waveshaper",
    "constant",
    "feedback-attenuator",
    "clamp",
}


def u32(value: int) -> int:
    return value & 0xFFFFFFFF


def s32(value: int) -> int:
    value = u32(value)
    return value - 0x100000000 if value >= 0x80000000 else value


def imul(left: int, right: int) -> int:
    return s32(s32(left) * s32(right))


def mulberry32(seed: int):
    state = u32(seed)

    def rand() -> float:
        nonlocal state
        state = u32(s32(state) + 0x6D2B79F5)
        a = s32(state)
        t = imul(a ^ (u32(a) >> 15), s32(1 | a))
        t = s32(t + imul(s32(t) ^ (u32(t) >> 7), s32(61 | t))) ^ s32(t)
        t = s32(t)
        return (u32(t) ^ (u32(t) >> 14)) / 4294967296

    return rand


def median(values: list[float]) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    mid = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[mid]
    return (ordered[mid - 1] + ordered[mid]) / 2


def mad(values: list[float]) -> float | None:
    center = median(values)
    if center is None:
        return None
    return median([abs(value - center) for value in values])


def runtime_context() -> dict[str, Any]:
    return {
        "engine": "cpython",
        "python": sys.version.split()[0],
        "platform": sys.platform,
        "language": "python",
    }


def quantize(value: float, step: float) -> float:
    if not step > 0:
        return value
    return math.floor(value / step + 0.5) * step


def dot(weights: list[float], inputs: list[float]) -> float:
    return sum(w * x for w, x in zip(weights, inputs))


def mix_reference(inputs: list[float], weights: list[float], bias: float = 0.0) -> dict[str, float]:
    total = bias + dot(weights, inputs)
    return {"sum": total, "y": math.tanh(total)}


def mix_patch(inputs, weights, bias=0.0, quant_step=0.0, volts_per_unit=1.0, rail_volts=1e9, shaper="tanh"):
    wq = [quantize(value, quant_step) for value in weights]
    bq = quantize(bias, quant_step)
    sum_volts = bq * volts_per_unit
    for gain, sample in zip(wq, inputs):
        sum_volts += gain * (sample * volts_per_unit)
    saturated = abs(sum_volts) > rail_volts
    clipped = max(-rail_volts, min(rail_volts, sum_volts))
    norm = 0.0 if volts_per_unit == 0 else clipped / volts_per_unit
    y = norm if shaper == "linear" else math.tanh(norm)
    return {
        "y": y,
        "sumVolts": sum_volts,
        "clippedVolts": clipped,
        "saturated": saturated,
        "norm": norm,
        "wq": wq,
        "bq": bq,
        "shaper": shaper,
    }


def mix_pair(spec: dict[str, Any]) -> dict[str, Any]:
    ref = mix_reference(spec["x"], spec["w"], spec.get("bias", 0.0))
    patch = mix_patch(
        spec["x"],
        spec["w"],
        spec.get("bias", 0.0),
        spec.get("quantStep", 0.0),
        spec.get("voltsPerUnit", 1.0),
        spec.get("railVolts", 1e9),
        spec.get("shaper", "tanh"),
    )
    return {"reference": ref, "patch": patch, "residual": abs(ref["y"] - patch["y"]), "equalProblem": True}


def step_map(x: float, spec: dict[str, Any]) -> dict[str, Any]:
    alpha = spec["alpha"] * (1 + spec.get("tolerance", 0.0))
    nxt = (1 - alpha) * spec["c"] + alpha * x
    clamped = False
    if spec.get("lo") is not None and nxt < spec["lo"]:
        nxt = spec["lo"]
        clamped = True
    if spec.get("hi") is not None and nxt > spec["hi"]:
        nxt = spec["hi"]
        clamped = True
    return {"x": nxt, "clamped": clamped, "alpha": alpha}


def iterate_map(spec: dict[str, Any]) -> dict[str, Any]:
    steps = spec.get("steps", spec.get("maxSteps", 64))
    x = spec["x0"]
    hist = [x]
    clamped_any = False
    for i in range(steps):
        nxt = step_map(x, spec)
        x = nxt["x"]
        clamped_any = clamped_any or nxt["clamped"]
        hist.append(x)
        if spec.get("eps") is not None and abs(hist[-1] - hist[-2]) < spec["eps"]:
            return {"x": x, "hist": hist, "steps": i + 1, "stopped": "residual", "clampedAny": clamped_any}
    return {"x": x, "hist": hist, "steps": steps, "stopped": "maxSteps", "clampedAny": clamped_any}


def closed_form_affine(alpha: float, c: float, x0: float, n: int) -> float:
    if alpha == 1:
        return x0
    return c + (alpha**n) * (x0 - c)


def steps_to_eps(alpha: float, c: float, x0: float, eps: float) -> dict[str, Any]:
    distance = abs(x0 - c)
    if not abs(alpha) < 1:
        return {"applicable": False, "reason": "not a strict contraction", "steps": None}
    if not eps > 0:
        return {"applicable": False, "reason": "eps must be positive", "steps": None}
    if distance <= eps:
        return {"applicable": True, "steps": 0, "reason": "already inside budget"}
    ratio = math.log(eps / distance) / math.log(abs(alpha))
    if not math.isfinite(ratio):
        return {"applicable": False, "reason": "log failed", "steps": None}
    return {"applicable": True, "steps": math.ceil(ratio), "reason": "affine contraction"}


def is_prefix_free(bitstrings: list[str]) -> bool:
    ordered = sorted(bitstrings)
    for i, left in enumerate(ordered):
        for right in ordered[i + 1 :]:
            if right.startswith(left):
                return False
    return True


def kraft_sum(bitstrings: list[str]) -> float:
    return sum(2 ** -len(bits) for bits in bitstrings)


def finite_mixture(programs: list[dict[str, str]], observation: str = "") -> dict[str, Any]:
    bits = [program["bits"] for program in programs]
    if not is_prefix_free(bits):
        return {"ok": False, "reason": "program set is not prefix-free", "universal": False}
    for program in programs:
        if not set(program["bits"]) <= {"0", "1"} or not set(program["output"]) <= {"0", "1"}:
            return {"ok": False, "reason": "bits and outputs must be 0/1 strings", "universal": False}
        if program["bits"] == "" or program["output"] == "":
            return {"ok": False, "reason": "empty strings rejected", "universal": False}
    consistent = []
    for program in programs:
        output = program["output"]
        if output.startswith(observation) or observation.startswith(output):
            consistent.append({**program, "weight": 2 ** -len(program["bits"])})
    mass = sum(program["weight"] for program in consistent)
    nxt = {"0": 0.0, "1": 0.0}
    if mass > 0:
        for program in consistent:
            output = program["output"]
            if len(output) > len(observation) and output.startswith(observation):
                nxt[output[len(observation)]] += program["weight"] / mass
    return {
        "ok": True,
        "universal": False,
        "label": "finite_prefix_free_toy_not_solomonoff_Pm",
        "kraft": kraft_sum(bits),
        "massOnObservation": mass,
        "consistent": [{"bits": p["bits"], "output": p["output"], "weight": p["weight"]} for p in consistent],
        "nextBit": nxt,
        "droppedBecauseInconsistent": len(programs) - len(consistent),
    }


def adapt_online(spec: dict[str, Any]) -> dict[str, Any]:
    weights = list(spec["initW"])
    initial = list(spec["initW"])
    hist = []
    bias = spec.get("bias", 0.0)
    for t in range(spec["steps"]):
        if spec.get("resetAt") is not None and t == spec["resetAt"]:
            weights = list(initial)
        sample = spec["xs"][t % len(spec["xs"])]
        target_sum = bias + dot(spec["targetW"], sample)
        current_sum = bias + dot(weights, sample)
        y_star = math.tanh(target_sum)
        y = math.tanh(current_sum)
        err = y - y_star
        sech2 = 1 - y * y
        frozen = spec.get("freezeAt") is not None and t >= spec["freezeAt"]
        before = list(weights)
        if not frozen:
            for i, sample_i in enumerate(sample):
                weights[i] -= spec["lr"] * err * sech2 * sample_i
                if not math.isfinite(weights[i]) or abs(weights[i]) > LIMITS["maxAbs"]:
                    hist.append(
                        {"t": t, "squaredError": err * err, "y": y, "yStar": y_star, "frozen": frozen, "w": before, "diverged": True}
                    )
                    return {"ok": False, "reason": "weight left the safe bound", "hist": hist, "finalW": before}
        hist.append({"t": t, "squaredError": err * err, "y": y, "yStar": y_star, "frozen": frozen, "w": before, "diverged": False})
    return {"ok": True, "hist": hist, "finalW": weights}


def _is_object(value: Any) -> bool:
    return isinstance(value, dict)


def _walk_forbidden(value: Any, path: str, errors: list[str]) -> None:
    if isinstance(value, list):
        if len(value) > 20000:
            errors.append(f"{path} exceeds length cap")
        for index, item in enumerate(value):
            _walk_forbidden(item, f"{path}[{index}]", errors)
        return
    if not isinstance(value, dict):
        return
    for key, item in value.items():
        if key in FORBIDDEN_KEYS:
            errors.append(f"forbidden key {path}.{key}")
        _walk_forbidden(item, f"{path}.{key}", errors)


def _finite(value: Any, name: str, errors: list[str], max_abs: float = 1e6, integer: bool = False) -> bool:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(float(value)):
        errors.append(f"{name} must be a finite number")
        return False
    if abs(float(value)) > max_abs:
        errors.append(f"{name} exceeds ±{max_abs}")
        return False
    if integer and int(value) != value:
        errors.append(f"{name} must be an integer")
        return False
    return True


def _vector(value: Any, name: str, errors: list[str], max_len: int = 64) -> bool:
    if not isinstance(value, list) or not 1 <= len(value) <= max_len:
        errors.append(f"{name} must be an array of length 1..{max_len}")
        return False
    return all(_finite(item, f"{name}[{i}]", errors) for i, item in enumerate(value))


def validate_experiment(raw: Any) -> dict[str, Any]:
    errors: list[str] = []
    if not _is_object(raw):
        return {"ok": False, "errors": ["root must be a JSON object"]}
    if len(json.dumps(raw)) > LIMITS["maxPayloadChars"]:
        errors.append("payload too large")
    _walk_forbidden(raw, "$", errors)
    kind = raw.get("kind")
    if not isinstance(kind, str) or kind not in {"mixer", "lattice", "solomonoff", "adapt", "bench", "frontier"}:
        errors.append("unknown kind")
    if raw.get("seed") is not None:
        _finite(raw.get("seed"), "seed", errors, max_abs=1e9, integer=True)
    if kind == "mixer" and not errors:
        mixer = raw.get("mixer")
        if not _is_object(mixer):
            errors.append("mixer object required")
        else:
            _vector(mixer.get("x"), "mixer.x", errors)
            _vector(mixer.get("w"), "mixer.w", errors)
            if isinstance(mixer.get("x"), list) and isinstance(mixer.get("w"), list) and len(mixer["x"]) != len(mixer["w"]):
                errors.append("mixer.x and mixer.w length mismatch")
            if mixer.get("bias") is not None:
                _finite(mixer.get("bias"), "mixer.bias", errors)
            if mixer.get("quantStep") is not None:
                _finite(mixer.get("quantStep"), "mixer.quantStep", errors, max_abs=10)
                if mixer["quantStep"] < 0:
                    errors.append("quantStep must be >= 0")
            if mixer.get("voltsPerUnit") is not None:
                _finite(mixer.get("voltsPerUnit"), "mixer.voltsPerUnit", errors, max_abs=100)
                if isinstance(mixer.get("voltsPerUnit"), (int, float)) and mixer["voltsPerUnit"] <= 0:
                    errors.append("voltsPerUnit must be > 0")
            if mixer.get("railVolts") is not None:
                _finite(mixer.get("railVolts"), "mixer.railVolts", errors, max_abs=LIMITS["maxRail"])
            if mixer.get("shaper") not in (None, "tanh", "linear"):
                errors.append("shaper must be tanh or linear")
    if kind == "lattice" and not errors:
        lattice = raw.get("lattice")
        if not _is_object(lattice):
            errors.append("lattice object required")
        else:
            _finite(lattice.get("alpha"), "lattice.alpha", errors, max_abs=4)
            _finite(lattice.get("c"), "lattice.c", errors)
            _finite(lattice.get("x0"), "lattice.x0", errors)
            if lattice.get("lo") is not None and lattice.get("hi") is not None and lattice["lo"] > lattice["hi"]:
                errors.append("lattice.lo > lattice.hi")
    if kind == "solomonoff" and not errors:
        block = raw.get("solomonoff")
        programs = block.get("programs") if _is_object(block) else None
        if not isinstance(programs, list) or not 1 <= len(programs) <= LIMITS["maxPrograms"]:
            errors.append("solomonoff.programs required")
        else:
            for i, program in enumerate(programs):
                if not _is_object(program):
                    errors.append(f"program {i} must be an object")
                    continue
                bits = program.get("bits")
                output = program.get("output")
                if not isinstance(bits, str) or not 1 <= len(bits) <= LIMITS["maxBits"]:
                    errors.append(f"program {i} bits length")
                if not isinstance(output, str) or not 1 <= len(output) <= LIMITS["maxOutput"]:
                    errors.append(f"program {i} output length")
    if kind == "adapt" and not errors:
        block = raw.get("adapt")
        if not _is_object(block):
            errors.append("adapt object required")
        else:
            _vector(block.get("targetW"), "adapt.targetW", errors)
            _vector(block.get("initW"), "adapt.initW", errors)
            _finite(block.get("lr"), "adapt.lr", errors, max_abs=1000)
            _finite(block.get("steps"), "adapt.steps", errors, integer=True, max_abs=LIMITS["maxSteps"])
            xs = block.get("xs")
            if not isinstance(xs, list) or not xs:
                errors.append("adapt.xs required")
    if errors:
        return {"ok": False, "errors": errors}
    return {"ok": True, "errors": [], "value": raw}


def validate_patch_graph(raw: Any) -> dict[str, Any]:
    errors: list[str] = []
    if not _is_object(raw):
        return {"ok": False, "errors": ["patch graph must be an object"]}
    if len(json.dumps(raw)) > LIMITS["maxPayloadChars"]:
        errors.append("payload too large")
    _walk_forbidden(raw, "$", errors)
    nodes = raw.get("nodes")
    cables = raw.get("cables")
    if not isinstance(nodes, list) or not 1 <= len(nodes) <= 128:
        errors.append("nodes length")
        nodes = []
    if not isinstance(cables, list) or len(cables) > 256:
        errors.append("cables length")
        cables = []
    ids = set()
    for node in nodes:
        if not _is_object(node) or not isinstance(node.get("id"), str) or not isinstance(node.get("kind"), str):
            errors.append("node needs id and kind")
            continue
        if node["kind"] not in NODE_KINDS:
            errors.append(f"unknown module kind {node['kind']}")
        if node["id"] in ids:
            errors.append(f"duplicate id {node['id']}")
        ids.add(node["id"])
    for cable in cables:
        if not _is_object(cable) or cable.get("from") not in ids or cable.get("to") not in ids:
            errors.append("cable endpoints must exist")
    return {"ok": not errors, "errors": errors, "value": raw if not errors else None}


def run_experiment(raw: Any) -> dict[str, Any]:
    checked = validate_experiment(raw)
    if not checked["ok"]:
        return {"ok": False, "errors": checked["errors"], "verdict": "rejected"}
    kind = raw["kind"]
    if kind == "mixer":
        result = mix_pair(raw["mixer"])
        result["verdict"] = "match" if result["residual"] <= 1e-9 else "residual"
    elif kind == "lattice":
        lattice = raw["lattice"]
        steps = lattice.get("steps", lattice.get("maxSteps", 64))
        reference = iterate_map({**lattice, "tolerance": 0, "steps": steps})
        patch = iterate_map({**lattice, "steps": steps})
        residual = abs(reference["hist"][-1] - patch["hist"][-1])
        result = {"reference": reference, "patch": patch, "residual": residual, "verdict": "match" if residual <= 1e-9 else "residual"}
    elif kind == "solomonoff":
        result = finite_mixture(raw["solomonoff"]["programs"], raw["solomonoff"].get("observation", ""))
        result["verdict"] = "finite-toy" if result["ok"] else "rejected"
    elif kind == "adapt":
        result = adapt_online(raw["adapt"])
        initial = result["hist"][0]["squaredError"] if result["hist"] else None
        final = result["hist"][-1]["squaredError"] if result["hist"] else None
        result["initialSquaredError"] = initial
        result["finalSquaredError"] = final
        result["improved"] = bool(result["ok"] and final is not None and initial is not None and final < initial)
        result["worsened"] = bool(final is not None and initial is not None and final > initial * 1.05)
        if not result["ok"]:
            result["verdict"] = "diverged"
        elif result["worsened"]:
            result["verdict"] = "worsened"
        elif result["improved"]:
            result["verdict"] = "improved"
        else:
            result["verdict"] = "flat"
    elif kind == "bench":
        block = raw.get("bench", raw)
        result = {"verdict": "measured-in-js-primary", "note": "Python checks the same recurrence; archived wall-clock is the Node run."}
        # Correctness spot-check with the shared PRNG.
        rng = mulberry32(int(raw.get("seed", block.get("seed", 1))))
        n = int(block["n"])
        queries = int(block["queries"])
        xs = [rng() * 2 - 1 for _ in range(n)]
        weights = [rng() * 2 - 1 for _ in range(n)]
        updates = [{"i": int(rng() * n), "value": rng() * 2 - 1} for _ in range(queries)]
        w_full = list(weights)
        y_full = 0.0
        for update in updates:
            w_full[update["i"]] = update["value"]
            y_full = dot(w_full, xs)
        w_inc = list(weights)
        y_inc = dot(w_inc, xs)
        for update in updates:
            y_inc += (update["value"] - w_inc[update["i"]]) * xs[update["i"]]
            w_inc[update["i"]] = update["value"]
        result["absError"] = abs(y_full - y_inc)
        result["withinBudget"] = result["absError"] <= 1e-6
        result["verdict"] = "measured" if result["withinBudget"] else "error-budget-miss"
    else:
        result = {"verdict": "skipped", "note": "Frontier wall-clock is archived from the JavaScript runner."}
    return {"ok": True, "kind": kind, "context": runtime_context(), "result": result, "verdict": result.get("verdict")}


def main() -> int:
    parser = argparse.ArgumentParser(description="Run or validate a symposium experiment JSON file.")
    parser.add_argument("command", choices=["validate", "run", "validate-patch"])
    parser.add_argument("file")
    args = parser.parse_args()
    raw = json.loads(open(args.file, encoding="utf-8").read())
    if args.command == "validate":
        out = validate_experiment(raw)
    elif args.command == "validate-patch":
        out = validate_patch_graph(raw)
    else:
        started = time.perf_counter()
        out = run_experiment(raw)
        out["elapsedMs"] = (time.perf_counter() - started) * 1000
    json.dump(out, sys.stdout)
    sys.stdout.write("\n")
    return 0 if out.get("ok") else 2


if __name__ == "__main__":
    raise SystemExit(main())
