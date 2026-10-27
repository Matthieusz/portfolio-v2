---
title: Tepirek Revamped
description: "Clan ops for Margonem: squads, events, auctions, bets, and everything in between."
date: 2025-08-04
tags:
  - typescript
  - react
  - tanstack-start
  - effect
  - drizzle-orm
  - pnpm
  - docker
  - postgresql
  - hono
featured: true
siteLink: https://gz.informati.dev
repoLink: https://github.com/Matthieusz/tepirek-revamped
---

Tepirek Revamped is the control room for a Margonem clan. It replaces the spreadsheet-and-chat-thread combo with tools shaped around how the game is actually played.

## Why

Clan logistics get messy fast. Events, shared accounts, auctions, hero bets, and player data all follow different rules, yet they need to stay in sync. This project brings that work into one purpose-built app.

## What it does

- Imports Margonem accounts and plans squads in shared squad groups.
- Coordinates events, hero records, bets, rankings, and guild vault payouts.
- Runs auctions, tracks skills, verifies players, and manages announcements and tasks.
- Includes calculators for ODW, item upgrades, and bounties.

It is less of a generic dashboard and more of a custom toolkit for the jobs a clan repeats every week.

## How it's built

The frontend runs on **React** and **TanStack Start**. A **Node.js** and **Hono** server talks to **PostgreSQL** through **Drizzle**, with shared **Effect** HTTP contracts connecting the server and typed web client. **Better Auth** handles email/password and Discord sign-in. The pnpm monorepo separates API contracts, application services, and adapters for external dependencies.
