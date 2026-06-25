---
title: End-to-end type safety in Tepirek with Hono and oRPC
description: How Tepirek's clan dashboard keeps the client and server in lockstep without generating code, by routing every call through an oRPC router on a Hono server.
date: 2026-05-22
tags:
  - typescript
  - orpc
  - hono
  - tepirek
---

Tepirek Revamped is a clan-management dashboard for the MMORPG *Margonem*, and its whole pitch hangs on one thing: the UI and the API can never drift. A squad member added to the clan on the server has to show up in the list with the exact shape the UI expects — every time, no manual types, no codegen step.

It runs on **Hono** on Node, with **oRPC** wiring the endpoints together. The trick is that the router is one typed object: procedures are registered with input validators, and the same router type is imported on the client. The call `client.squads.list()` is type-checked against the server's actual handler, end to end. There is no separate OpenAPI artefact to keep in sync.

What I keep learning on this project: end-to-end type safety is a runtime decision, not a build-time one. oRPC's contract is the router itself, so refactoring a procedure updates the client contract the moment you save the file — there's no "regenerate the SDK" step to forget. That's the whole reason a clan tool that parses real game data hasn't needed a single runtime shape bug fix since I wired oRPC in.

The stack around it is deliberately boring: **Drizzle ORM** over **PostgreSQL** for the data, **Better Auth** for sessions. oRPC doesn't care which of those you pick — it just guarantees the wire in between is lossless.