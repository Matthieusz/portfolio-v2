<div align="center">
  <h1>Mateusz Irski · portfolio-v2</h1>
  <p>
    A small corner of the internet for my projects, notes, and the occasional
    unnecessary interface detail.
  </p>
  <p>
    <a href="https://informati.dev">
      <img src="https://shieldcn.dev/badge/visit-informati.dev-green.svg?logo=globe&variant=secondary" alt="Visit informati.dev" />
    </a>
    <a href="https://github.com/Matthieusz/portfolio-v2">
      <img src="https://shieldcn.dev/github/stars/Matthieusz/portfolio-v2.svg?variant=secondary" alt="GitHub stars" />
    </a>
  </p>
</div>

## What lives here

This is the source for [informati.dev](https://informati.dev), my personal portfolio as a software developer based in Poznań, Poland.

It has the usual portfolio ingredients — projects, an about page, and a small blog — plus a few things that are there because they make the site more fun to visit:

- a Spotify now-playing card;
- recent GitHub commits;
- a map and a tiny game of tic-tac-toe.

> The site is mostly serious about software, less serious about tic-tac-toe.

## Selected work

| Project | What it does | Links |
| --- | --- | --- |
| **[Labsync](https://labsync.informati.dev)** | Keeps lab-group chat, deadlines, files, and access in one place. | [repo](https://github.com/Matthieusz/labsync) · [demo](https://labsync.informati.dev) |
| **[Tepirek Revamped](https://gz.informati.dev)** | A purpose-built control room for running a Margonem clan. | [repo](https://github.com/Matthieusz/tepirek-revamped) · [demo](https://gz.informati.dev) |
| **[Squad Builder](https://squad-builder.informati.dev)** | Builds and shares Margonem squads without accounts or a backend. | [repo](https://github.com/Matthieusz/squad-builder) · [demo](https://squad-builder.informati.dev) |

More detail, screenshots, and the full project list are available on the [website](https://informati.dev/projects).

## Built with

<p>
  <a href="https://astro.build">
    <img src="https://shieldcn.dev/badge/stack-Astro-blue.svg?logo=astro&variant=secondary" alt="Astro" />
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://shieldcn.dev/badge/stack-TypeScript-blue.svg?logo=typescript&variant=secondary" alt="TypeScript" />
  </a>
  <a href="https://tailwindcss.com">
    <img src="https://shieldcn.dev/badge/stack-Tailwind-blue.svg?logo=tailwindcss&variant=secondary" alt="Tailwind CSS" />
  </a>
  <a href="https://www.solidjs.com">
    <img src="https://shieldcn.dev/badge/stack-SolidJS-blue.svg?logo=solid&variant=secondary" alt="SolidJS" />
  </a>
  <a href="https://bun.sh">
    <img src="https://shieldcn.dev/badge/stack-Bun-blue.svg?logo=bun&variant=secondary" alt="Bun" />
  </a>
</p>

Astro handles the pages and content collections. SolidJS powers the interactive widgets, while Tailwind CSS handles the styling. The site runs as a standalone Node server and uses Bun for local development.

## Run it locally

```bash
bun install
cp .env.example .env # optional: needed for the Spotify card
bun dev
```

The dev server runs at `http://localhost:4321`.

To make a production build:

```bash
bun build
bun preview
```

## Say hello

- [GitHub](https://github.com/Matthieusz)
- [LinkedIn](https://www.linkedin.com/in/mateusz-irski-61a593248/)
- [Email](mailto:mateusz.irski@gmail.com)

_Badges by [shieldcn](https://shieldcn.dev)._
