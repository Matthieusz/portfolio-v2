---
title: Squad Builder
description: Plan and share Margonem squads without accounts, servers, or spreadsheets.
date: 2026-03-16
tags:
  - svelte
  - svelte-kit
  - local-first
  - SPA
  - typescript
  - tailwindcss
  - bun
  - monorepo

featured: false
repoLink: https://github.com/Matthieusz/squad-builder
demoLink: https://squad-builder.informati.dev
---

Squad Builder is a quick way to plan Margonem teams and pass them around. No account, no backend, no spreadsheet gymnastics.

## Why

Planning one squad from memory is fine. Planning several across different accounts is not. I wanted a tool made for that exact job, without turning it into another service players have to sign up for.

## What it does

- Imports characters straight from Margonem profile pages.
- Groups squads for PvP, raids, dungeons, or whatever else you are planning.
- Exports the whole setup so another player can import it in a few clicks.

Everything stays in the browser. That keeps the app fast, private, and usable without an internet-backed account.

## How it's built

The UI is built with **SvelteKit**, **TypeScript**, and **Tailwind CSS**. Browser storage holds the data, while import and export turn a local setup into something shareable. The repo uses **Bun** and **Turborepo**, but the product itself stays deliberately small: open it, build a squad, send it.
