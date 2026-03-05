# Architecture

## Core Concepts

The application consists of four primary layers:

1. Component Definitions
2. Templates
3. Renderer
4. Editor UI

---

## Component Definitions

A Component represents reusable email HTML.

Each component contains:

- Email-safe HTML snippet
- Editable settings definition
- Default values

Components act as the building blocks for templates.

---

## Templates

A Template is an ordered collection of component instances.

Each instance references:

- a component definition
- overridden settings

Templates are the source of truth for rendering.

---

## Renderer

The renderer converts:

Template + Components → Final HTML

Process:

1. Load component definition
2. Merge defaults with overrides
3. Replace placeholders
4. Concatenate HTML output
5. Wrap in email document structure

---

## Editor Flow

Editor responsibilities:

- Load template
- Add component instances
- Edit settings
- Preview rendered output
- Persist template state
- Export HTML

---

## Persistence

Current implementation:

- LocalStorage-based TemplateStore
- Hardcoded ComponentStore

Future phases may introduce APIs and databases without changing the core model.