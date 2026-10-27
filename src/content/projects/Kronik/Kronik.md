---
title: Kronik
description: Public GitHub activity, turned into portfolio-friendly summaries.
date: 2026-08-05
tags:
  - typescript
  - effect
  - bun
  - cloudflare-workers
featured: false
siteLink: https://kronik.informati.dev/
repoLink: https://github.com/Matthieusz/kronik
---

Kronik is an API for turning a GitHub user's public development activity into a clear summary that can be used in a portfolio.

## Why

A portfolio can show finished projects, but it doesn't always show the work happening between releases. Kronik makes public GitHub activity easier to present without building a GitHub integration into every site.

## What it does

- Lists public default-branch commits attributed to a GitHub user.
- Summarizes changes and repository language composition over an activity window.
- Reports current and longest contribution streaks.

The recent commits card on this site uses Kronik to show what I've been working on. The [API documentation](https://kronik.informati.dev) covers the available endpoints.

## How it's built

Kronik is built with **TypeScript**, **Effect**, **Bun**, and **Cloudflare Workers**. Its documentation includes an API reference generated from the project's OpenAPI contract.
