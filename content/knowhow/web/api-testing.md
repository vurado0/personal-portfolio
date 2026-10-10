---
title: "Testing web APIs: pyramid, Bruno, node:test, load tests"
category: web
tags: [testing, rest, nodejs, bruno]
skills: [typescript]
summary: "How I test REST and WebSocket APIs — the test pyramid, the four phases of a test, Bruno collections with variables, supertest/node:test in code, and reading p50/p99 from a load test."
updated: 2026-05-25
difficulty: intermediate
---

From *Web Service Development* (FH JOANNEUM, summer 2026). I tested a team REST API with Bruno and in code.

## The test pyramid

| Level | Tests | Speed |
|---|---|---|
| Unit | one function or class, isolated | ms, many of them |
| Integration | modules together (route + DB) | medium |
| End-to-end | the whole flow as a user | slow and fragile, only a few |

Functional tests ask "does it work?"; non-functional ones (load, stress, security) ask "how well?"

## The four phases of a test

1. **Setup**: start the service and create test data (`POST /posts`).
2. **Exercise**: make the call you're testing (`GET /posts/:id`).
3. **Verify**: check the status, headers and body.
4. **Teardown**: delete what you created, so the tests stay independent.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('unknown id returns 404', async () => {
  const res = await request(app).get('/posts/does-not-exist');
  assert.equal(res.status, 404);
});
```

## Bruno

- A **collection** runs a whole CRUD flow in order. You can run it in the terminal or in CI (`bru run --env local`).
- **Variables** carry values between requests: save the `id` from the create response and reuse it. Nothing is hard-coded.
- Bruno collections are plain files in the repo, so they get versioned and reviewed like code.

## Lessons from real bugs

- Our API returned **500 instead of 404** for unknown ids. That's a backend bug: report it and don't let the test hide it.
- Also test methods you **don't** support: `DELETE /users` should return `405`, not `500` or, worse, actually delete something.
- WebSocket tests are different: connect, wait for an event with a timeout, and check the order of the messages.

## Reading a load test

p50 = 12 ms and p99 = 840 ms means most requests are fast, but 1 in 100 is very slow. Look for locks, garbage-collection pauses, a cold cache or missing DB indexes. Averages hide this, so always look at the percentiles.
