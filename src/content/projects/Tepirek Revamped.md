---
title: Tepirek Revamped
description: Tepirek Revamped is an app designed for Margonem as a clan management tool
date: 2025-08-04
image: ../images/tepirek.png
imageAlt: Dashboard View of Tepirek Revamped
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

# Tepirek Revamped

**Tepirek Revamped** is a comprehensive clan management dashboard designed for the MMORPG _Margonem_. Built as a modern web application, it streamlines coordination for clan members by providing tools for squad organization, character tracking, and event management.

## Key Features

- **Margonem Integration**: Automatically parses and imports game account data (characters, professions, levels) from official profiles.
- **Squad Builder**: Advanced tools for organizing team compositions and managing shared account access for clan activities.
- **Event & Auction Management**: Systems for scheduling clan events, managing auction signups, and distributing loot or gold.
- **Hero Betting System**: A specialized module for tracking and betting on in-game "Hero" (boss) entities tied to events.
- **Hub Functionality**: Centralized announcements, ranking lists, and player directories to keep the clan connected.

## Tech Stack

- **Frontend**: React, TanStack Start, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend**: Hono (Node.js), oRPC (for end-to-end type safety)
- **Database**: PostgreSQL with Drizzle ORM
- **Architecture**: Monorepo (pnpm + Turborepo), Dockerized deployment
- **Authentication**: Better Auth with secure session management
