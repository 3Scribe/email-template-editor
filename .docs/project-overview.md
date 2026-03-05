# Open Email Builder

## Overview

Open Email Builder is an open-source visual email template builder built using modern React tooling.

The project allows users to construct email templates from reusable components containing email-compliant HTML and configurable settings.

Templates are composed by arranging component instances and overriding component settings.

The application renders templates into final HTML suitable for email delivery systems.

---

## Goals

- Provide a visual email template editing experience
- Support reusable component-based email design
- Generate clean, email-safe HTML output
- Develop incrementally using AI-assisted workflows
- Maintain a simple and understandable architecture

---

## Non-Goals (Current Phase)

- Backend services
- Authentication
- Multi-user collaboration
- Cloud persistence
- Drag-and-drop editor frameworks

---

## Current Phase

Frontend-only implementation:

- LocalStorage persistence
- Component registry
- Template renderer
- Manual editor UI

Backend/API integration will be introduced later.

---

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- LocalStorage persistence
- GitHub Issues driven development