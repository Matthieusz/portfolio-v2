---
title: 260 tests on Labsync — what I covered, and what I deliberately skipped
description: Labsync runs over 260 automated tests. A breakdown of where that coverage actually pays off, the bits I don't bother testing, and why the number is a side effect, not a target.
date: 2026-04-18
tags:
  - testing
  - vitest
  - labsync
---

Labsync's repo has over 260 automated tests, and recruiters latch onto the number — so it's worth being honest about what it means. It's a side effect of the architecture, not a target I aimed at.

What I actually cover, and why:

- **RBAC paths.** Owners, Administrators, and Members see different things, and the difference is enforced in Convex queries, not just hidden in the UI. Permutation tests here catch the one bug you really can't ship: a Member acting as an Owner. This is where coverage earns its keep.
- **Convex mutations.** State-changing transactions are isolated and asserted — invite codes, team creation, role escalation. When the data is reactive and updates the UI live, a wrong mutation surfaces as a wrong screen for every connected client at once, so I test the mutation hard.
- **File upload categorization.** The MIME-based bucketing that splits code from docs from media is pure logic, so it's cheap to unit-test exhaustively, and regressions here would scatter files into the wrong folders silently.

What I **deliberately** don't cover:

- **The React component tree, mostly.** A button that opens a dialog doesn't need a test; Visual regressions there are caught by looking. Testing-library is in the suite, but pointed at the integration seams, not every rendered node.
- **Convex's reactive plumbing itself.** That's Convex's job to guarantee, not mine to re-assert.

Stack is **Vitest** + **Testing Library** across unit, integration, and acceptance. The takeaway I keep repeating to myself: 260 isn't a virtue. Coverage concentrated where a miss costs the most, and aggressively skipped where it doesn't, is what actually kept the app reliable while it moved fast.