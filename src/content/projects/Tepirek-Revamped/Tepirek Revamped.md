---
title: Tepirek Revamped
description: "Clan ops for Margonem: squads, events, auctions, bets, and everything in between."
date: 2025-08-04
tags:
  - typescript
  - react
  - tanstack-start
  - drizzle-orm
  - pnpm
  - docker
  - postgresql
  - hono
featured: true
repoLink: https://github.com/Matthieusz/tepirek-revamped
demoLink: https://gz.informati.dev
---

Tepirek Revamped is the control room for a Margonem clan. It replaces the spreadsheet-and-chat-thread combo with tools shaped around how the game is actually played.

## Why

Clan logistics get messy fast. Events, shared accounts, auctions, hero bets, and player data all follow different rules, yet they need to stay in sync. This project brings that work into one purpose-built app.

## What it does

- Imports Margonem characters, professions, and levels from official profiles.
- Handles squads, account access, events, auctions, loot, and gold distribution.
- Tracks hero bets, rankings, announcements, skills, and player verification.

It is less of a generic dashboard and more of a custom toolkit for the jobs a clan repeats every week.

## How it's built

The frontend runs on **React** and **TanStack Start**. A **Bun** and **Hono** server talks to **PostgreSQL** through **Drizzle**, with shared **Effect** contracts keeping the API typed end to end. **Better Auth** covers password and Discord sign-in, including admin approval for new members.
