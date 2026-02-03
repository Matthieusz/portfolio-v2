---
title: Labsync
description: Labsync is a web application supporting organization and communication in laboratory groups
date: 2025-10-02
image: ../images/labsync.png
imageAlt: Dashboard of Labsync app
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

**Labsync** is a comprehensive web application designed to help students organize their work and communication within university laboratory groups. It bridges the gap between casual social platforms and rigid educational management systems, offering a solution tailored specifically for student self-organization.

## The Problem

Managing laboratory coursework requires constant coordination: scheduling exams, sharing experimental data, and communicating progress. Students typically resort to a fragmented set of tools to handle this:

- **Discord/Slack** for chat, which lacks academic context or structured calendars.
- **Google Drive/Classroom** for files, which can be disconnected from daily communication.
- **Trello/Notion** for tasks, which often requires significant manual setup.

This fragmentation leads to missed deadlines and disorganized resources. Labsync solves this by centralizing these functions into one "set-and-forget" platform.

## The Solution

Labsync is a dedicated platform where users can create **Organizations** (representing entire lab groups) and **Teams** (smaller project subgroups). It provides a unified interface for:

- **Real-Time Communication:** A built-in chat system that supports instant messaging across groups and subgroups.
- **Academic Calendar:** A specialized calendar to track exams, colloquiums, and project deadlines.
- **File Management:** A drag-and-drop file repository that automatically categorizes uploads by MIME type (e.g., separating code, documentation, and media).
- **Hierarchical Structure:** A robust system of Organizations and Teams, secured by invite codes and passwords.
- **Role-Based Access Control (RBAC):** Granular permissions for Owners, Administrators, and Members to manage content and users effectively.

## Tech Stack & Architecture

The application is built on a modern, type-safe stack designed for performance, scalability, and developer experience.

### Backend-as-a-Service (Convex)

Labsync utilizes **Convex** as its backend platform, which provides:

- **Reactive Data:** The UI updates automatically in real-time without the need for manual WebSocket implementation.
- **Serverless Functions:** Logic is separated into _Queries_ (read-only) and _Mutations_ (transactional updates).
- **End-to-End Type Safety:** Data schemas are strictly typed, ensuring consistency between the database and the frontend.

### Frontend Ecosystem

The user interface is constructed using **React 19** and the **TanStack** suite:

- **TanStack Start & Nitro:** Handles Server-Side Rendering (SSR) to ensure fast initial load times.
- **TanStack Query:** Manages asynchronous state and integrates seamlessly with Convex.
- **TanStack Router:** Provides type-safe routing across the application.
- **Styling:** Built with **TailwindCSS** and **ShadCN UI**, featuring a responsive dark-mode design.

### Security & Quality

- **Authentication:** Integrated via **Better Auth**, supporting secure sessions and password hashing.
- **Testing:** The codebase is covered by over 260 automated tests (Unit, Integration, and Acceptance) using **Vitest** and **Testing Library**, achieving high reliability.
