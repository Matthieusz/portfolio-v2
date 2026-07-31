---
title: Labsync
description: One shared space for lab groups to chat, plan deadlines, and keep files in order.
date: 2025-10-02
tags:
  - convex
  - typescript
  - tanstack-start
  - react
  - SPA
  - RBAC
  - tailwindcss
  - docker
featured: true
repoLink: https://github.com/Matthieusz/labsync
demoLink: https://labsync.informati.dev
---

Labsync puts the moving parts of a university lab group in one place: messages, dates, files, and people.

## Why

Lab work usually ends up scattered across Discord, Drive, a calendar, and someone else's Notion board. Each tool works, but the group still has to remember where everything lives. I built Labsync to cut out that shuffle.

## What it does

- Splits a lab group into organizations and smaller project teams.
- Keeps chat, exams, colloquiums, and deadlines together.
- Sorts uploaded files by type and gives owners, admins, and members the right level of access.

Groups can stay private with invite codes and passwords, so setup is quick without giving up control.

## How it's built

The frontend uses **React**, **TanStack Start**, and **Tailwind CSS**. **Convex** handles the data and live updates, which means chats and calendars react instantly without a hand-rolled WebSocket layer. **Better Auth** takes care of sessions, while the shared TypeScript stack keeps the UI and backend speaking the same language.
