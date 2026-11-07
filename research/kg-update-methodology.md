# Knowledge-graph updates — generic method only

This note keeps the engineering pattern and drops project-specific ledger names, article numbers, and private paths.

## Pattern

Store an append-only event log. Build the graph as a projection.

1. Each event has an id, a time, an actor, a type, a payload, the previous event’s hash, and its own hash.
2. Hash with SHA-256 over a canonical encoding of the event without its own hash field, bound to the previous hash.
3. Do not delete. Correct or retract with a new event that points at the old id.
4. Fold events into nodes and edges that have a validity interval if you need time.
5. Keep an inventory: path, content hash, commit SHA, event id.
6. Recompute the chain head and compare “done” claims with files that exist.
7. A language model may propose an event. A deterministic checker accepts it. The model is not the record.

A hash chain shows tampering with the log after the fact if an outside copy of the head exists. It does not make the prose true.

## What not to do

- Silent overwrite of a memory file with no event.
- Treating weights as an auditable graph.
- Treating a hash as a proof of meaning.
- Storing analogies in the same edge type as asserted measurements. Mark analogies as analogies.

## This repository

`results/claims-verdicts.json` is a test artifact, not a hash-chained ledger. The older `knowledge-graph-2026-11-06.json` at the repo root is a prior note and was not rewritten.
