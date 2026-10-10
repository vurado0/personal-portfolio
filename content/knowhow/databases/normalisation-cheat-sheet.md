---
title: Database normalisation cheat sheet
category: databases
tags: [sql, normalisation, erm]
skills: [sql]
summary: Functional dependencies, attribute closures, candidate keys and the path from 1NF to BCNF — the steps I use for exam problems and that my study app checks automatically.
updated: 2026-10-09
difficulty: intermediate
---

From *Databases* (Universidad de Alcalá, fall 2026). I also built a small study app for the course: you paste in a relation and its FDs, and it computes every step below.

## Attribute closure X⁺

Start with X. While some FD `A → B` has `A ⊆ X⁺`, add B. When nothing changes any more, you're done.

**Candidate key**: a minimal X with X⁺ = all attributes. Attributes that never appear on a right-hand side **must** be part of every key, so start from them.

## Normal forms

| Form | Condition |
|---|---|
| 1NF | atomic values, no repeating groups |
| 2NF | 1NF, and no non-key attribute depends on only *part* of a key |
| 3NF | for every FD `X → A`: X is a superkey **or** A is part of a key |
| BCNF | for every FD `X → A`: X is a superkey |

## Decomposition

- **3NF synthesis**: compute a minimal cover, make one table per left-hand side, and add a key table if no table contains a key. This is always lossless and keeps all dependencies.
- **BCNF**: split on a violating FD `X → A` into `(X ∪ A)` and `(R − A)`, and repeat. It is always lossless but may lose dependencies.
- **Lossless check for two tables**: the shared attributes must be a key of at least one of them.

## SQL habits

- Turn on foreign keys (in SQLite: `PRAGMA foreign_keys = ON;`).
- Model with an ER diagram first (entities, relationships, cardinalities, weak entities), then translate it to tables.
