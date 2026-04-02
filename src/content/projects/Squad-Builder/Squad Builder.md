---
title: Squad Builder
description: A local-first team builder tool for Margonem MMORPG players to create, manage, and share squad compositions
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

**Squad Builder** is a web application designed for players of the MMORPG Margonem to create, organize, and share team compositions. It provides a streamlined interface for importing character data, grouping squads, and exporting configurations for easy sharing with other players.

## The Problem

Margonem players who engage in group content need to coordinate team compositions, but there's no dedicated tool for planning and sharing squad setups. Players typically rely on:

- **Manual notes** or spreadsheets, which are cumbersome to maintain and share.
- **Memory**, which is unreliable for complex multi-character team planning.

This makes it difficult to experiment with different team compositions or share builds with teammates.

## The Solution

Squad Builder is a dedicated platform where players can:

- **Import Characters:** Add character accounts by importing data from Margonem profile pages.
- **Create Squad Groups:** Organize multiple squads into logical groups for different purposes (e.g., PvP, raids, dungeons).
- **Export & Import:** Share squad configurations with others through export/import functionality.
- **Local-First Storage:** All data is stored locally in the browser, ensuring privacy and instant access without requiring account registration.

## Tech Stack & Architecture

The application is built as a modern monorepo with a focus on developer experience and performance.

### Monorepo Structure

- **Turborepo:** Manages the monorepo build system for optimized development and builds.
- **Bun:** Used as the package manager and runtime for fast dependency management.

### Frontend

The UI is built with **SvelteKit** and modern tooling:

- **SvelteKit:** Provides the framework for the web application with file-based routing and SSR capabilities.
- **TypeScript:** Ensures type safety across the entire codebase.
- **TailwindCSS:** Utility-first CSS framework for rapid, consistent UI development.
- **Svelte Stores:** Local state management for a responsive, local-first user experience.
