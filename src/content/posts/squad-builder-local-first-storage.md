---
title: Shipping Squad Builder with no backend at all
description: Squad Builder stores every squad and character in the browser and never talks to a server. Notes on why local-first was the right call, and the trade-offs it buys you.
date: 2026-06-14
tags:
  - svelte
  - local-first
  - squad-builder
---

Squad Builder is a tool for *Margonem* players to assemble and share team compositions. The surprising design decision is that it has no backend. There is no database, no account, no server rent — squads live entirely in the browser.

That's a deliberate choice, not a hack. The job is *planning* squads, not collaborating on them live — so the thing a cloud backend would buy me (shared mutable state) is a feature nobody is asking for, while the thing it costs (sign-up friction, a server I have to keep alive, a privacy surface) is real. Local-first collapses both: you open the app, your squads are already there, instant.

The cost is honesty about what local storage can and can't do. Browser storage is per-device and per-origin, so "share with a teammate" can't be a database join — it's an explicit export/import of the squad configuration, plain text the user moves around themselves. I keep that primitive honest rather than pretending local storage is a cloud sync it isn't.

Built with **SvelteKit** and **Svelte stores** holding the local state; **TypeScript** across the monorepo with **Bun** and **Turborepo**. The lesson I keep coming back to: picking local-first forced every feature to answer "does this need a server?" — and nearly every answer was no.