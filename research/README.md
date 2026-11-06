# Research notes for the public symposium release

These notes are the safely releasable part of the 2026-11-06 t472 research pass, rewritten so another reader does not need the private transfer. The mapping of what was left out is `SOURCE-INVENTORY.md`.

Chronology used everywhere: the folder `awesome-ai-symposium-synthesis-1954` is a brand label. The proposal PDF prints August 31, 1955. The workshop was summer 1956.

## Files

| Topic | File | Executable status |
|---|---|---|
| Solomonoff formula, catalogue, finite toy versus the universal mixture | `solomonoff.md`, `publications-catalogue.json`, `planned-simulations.json` | One finite toy is implemented. Per-paper sims are planned. |
| Dartmouth seven figures | `dartmouth-1955-1956.md` | Analogies. Most rows are not code. |
| Strong-AI evaluation problems | `strong-ai-open-problems.md` | Notes only. No benchmark was run. |
| Synth science and history | `synthesizer-science.md` | Notes only. Parallel-history program is planned. |
| Art-theory grid, 42 records | `art-theory-synthesis-grid.md`, `art-theory-synthesis-grid.json` | Metadata. No full text. |
| Knowledge-graph method | `kg-update-methodology.md` | Generic pattern only. |
| RISC-V / ESP32 | `risc-v-esp32.md` | Notes only. |
| Zynq SKUs | `citations/amd-zynq-ultrascale-plus-mpsoc.md` | Datasheet transcription plus an UNMEASURED arithmetic example. |
| ConceptNet | `citations/conceptnet-not-fetched.md`, `synthetic-knowledge-graph.json` | Synthetic graph. |
| Hashes of files not shipped | `SNAPSHOT-HASHES.md` | Provenance only. |

Demos and tests live in `../awesome-ai-symposium-synthesis-1954/`.

## Result that is actually measured

On the Node run archived in `awesome-ai-symposium-synthesis-1954/results/node-bench.json`, a length-256 dot product with 2,000 single-weight edits matched the full recompute within about 2×10⁻¹⁵. Incremental flops were 6,512 including the initial dot. Recompute flops were 1,024,000. Median time was about 0.129 ms versus 1.004 ms (ratio about 0.128) on that process. One edit (Q=1) costs slightly more incremental flops than one full dot, because the preprocess is included. That speedup is this structured update on this CPU. It is not an optimality proof and not a synthesizer.

See `META-HANDOFF.md` at the repository root for provenance, tests, and gaps.
