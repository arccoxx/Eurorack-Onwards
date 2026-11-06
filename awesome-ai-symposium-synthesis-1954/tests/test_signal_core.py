#!/usr/bin/env python3
"""Property checks for the Python core. Numeric expectations are analytic, not copied timings."""

import json
import math
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "implementations"))
from signal_core import (  # noqa: E402
    adapt_online,
    closed_form_affine,
    finite_mixture,
    iterate_map,
    mix_pair,
    mulberry32,
    steps_to_eps,
    validate_experiment,
    validate_patch_graph,
)


class CoreTests(unittest.TestCase):
    def test_rng_matches_javascript_mulberry32(self):
        expected = [
            0.6270739405881613,
            0.002735721180215478,
            0.5274470399599522,
            0.9810509674716741,
            0.9683778982143849,
        ]
        rng = mulberry32(1)
        for value in expected:
            self.assertEqual(rng(), value)

    def test_ideal_and_quantized_mixer(self):
        ideal = mix_pair({"x": [0.5, -0.2, 0.8], "w": [1, 0.5, -0.3], "bias": 0, "quantStep": 0, "voltsPerUnit": 1, "railVolts": 1e6})
        self.assertLessEqual(ideal["residual"], 1e-12)
        quant = mix_pair({"x": [0.5, -0.2, 0.8], "w": [1, 0.5, -0.33], "bias": 0, "quantStep": 0.1, "voltsPerUnit": 5, "railVolts": 10})
        self.assertGreater(quant["residual"], 1e-4)

    def test_contraction_and_closed_form(self):
        plan = steps_to_eps(0.5, 1, -1.5, 1e-6)
        self.assertTrue(plan["applicable"])
        iterated = iterate_map({"alpha": 0.5, "c": 1, "x0": -1.5, "steps": plan["steps"], "eps": None})
        closed = closed_form_affine(0.5, 1, -1.5, plan["steps"])
        self.assertLessEqual(abs(iterated["x"] - closed), 1e-9)
        unstable = iterate_map({"alpha": 1.2, "c": 0, "x0": 0.5, "steps": 8, "eps": None})
        self.assertGreater(abs(unstable["x"]), 0.5)

    def test_mixture_and_rejection(self):
        programs = [
            {"bits": "0", "output": "0"},
            {"bits": "10", "output": "10"},
            {"bits": "110", "output": "11"},
            {"bits": "111", "output": "1110"},
        ]
        mix = finite_mixture(programs, "1")
        self.assertTrue(mix["ok"])
        self.assertFalse(mix["universal"])
        self.assertAlmostEqual(mix["nextBit"]["0"], 0.5)
        rejected = finite_mixture(programs + [{"bits": "11", "output": "110"}], "")
        self.assertFalse(rejected["ok"])

    def test_adapt_improves_and_fails(self):
        learn = adapt_online({
            "xs": [[0.6, -0.2], [-0.4, 0.8], [0.2, 0.2]],
            "targetW": [0.8, -0.4],
            "initW": [0, 0],
            "bias": 0,
            "lr": 0.35,
            "steps": 40,
        })
        self.assertLess(learn["hist"][-1]["squaredError"], learn["hist"][0]["squaredError"])
        fail = adapt_online({"xs": [[1]], "targetW": [0.2], "initW": [0], "bias": 0, "lr": 8, "steps": 6})
        self.assertGreater(fail["hist"][-1]["squaredError"], fail["hist"][0]["squaredError"])

    def test_invalid_inputs_rejected(self):
        self.assertFalse(validate_experiment({"kind": "mixer", "mixer": {"x": [1], "w": ["no"], "bias": 0}})["ok"])
        self.assertFalse(validate_experiment({"kind": "mixer", "eval": "1", "mixer": {"x": [1], "w": [1], "bias": 0}})["ok"])
        self.assertFalse(validate_experiment({"kind": "nope"})["ok"])
        self.assertFalse(validate_patch_graph({"version": 1, "nodes": [{"id": "a", "kind": "eval-box"}], "cables": []})["ok"])
        raw = json.loads((ROOT / "examples" / "mixer-ideal.json").read_text())
        self.assertTrue(validate_experiment(raw)["ok"])
        self.assertTrue(math.isfinite(mix_pair(raw["mixer"])["reference"]["y"]))


if __name__ == "__main__":
    unittest.main()
