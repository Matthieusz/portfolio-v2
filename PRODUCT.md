# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Employers evaluating Mateusz's software development work.
- Potential collaborators considering getting in touch.
- Fellow developers exploring his projects and writing.

All three audiences matter; no priority between them has been established.

## Product Purpose

informati.dev is Mateusz Irski's personal developer portfolio. It helps visitors explore his work, learn about him, and connect through his professional profiles or email.

## Operating Context

Visitors can browse selected projects and project details, read the blog, learn about Mateusz on the about page, and follow links to repositories, live projects, GitHub, LinkedIn, or email.

## Capabilities and Constraints

- Existing implementation uses Astro, TypeScript, Tailwind CSS, and SolidJS interactive widgets, with Bun for local development and a standalone Node server build.
- The site includes Spotify now-playing, recent GitHub commits, a location map, clocks, and tic-tac-toe alongside portfolio content.
- Local development runs with `bun dev` at `http://localhost:4321`.
- No primary audience or single conversion goal has been prioritized.

## Brand Commitments

- Preserve the current vibe: the owner explicitly likes it. Future work should treat the incumbent implementation as the reference rather than assume a redesign is wanted.
- The public identity is Mateusz Irski / informati.dev.
- Existing copy mixes a professional software-development focus with personal interests and playful details.

## Evidence on Hand

- `README.md`: project overview, selected work, project links, and contact links.
- `src/content/`: existing project and blog content and image assets.
- `src/pages/about.astro`: biography, portrait reference, and contact information.
- `src/components/Hero.astro`: existing introduction and professional profile links.
- Existing selected work includes Labsync, Tepirek Revamped, and Squad Builder, with repository and live-demo links documented in the README.
- Future work must use existing evidence or owner-provided facts rather than invent testimonials, impact metrics, or professional claims.

## Product Principles

- Serve employers, collaborators, and fellow developers without assuming one audience is primary.
- Let real projects and writing support evaluation of the work.
- Keep routes to professional connection easy to find.
- Preserve the site's established personality and playful details while improving it.
