# Issue Writing Guide

This project uses small, focused GitHub Issues to drive implementation.

The goal of each issue is to define a single behavior change clearly enough that it can be implemented safely and reviewed easily.

---

## Core Rules

- One issue should represent one logical feature, fix, or improvement.
- Keep scope narrow.
- Avoid combining unrelated behaviors in one issue.
- Prefer incremental progress over large, sweeping changes.
- Every issue should be testable manually.

---

## Recommended Issue Structure

### 1. Title

Use a concise title in Conventional Commit style.

Examples:

- `feat: allow reordering of component instances in template editor`
- `fix: escape text placeholder values in renderer`
- `chore: add AGENTS.md repository instructions`

---

### 2. Goal

Explain what capability should exist after the issue is complete.

The Goal should describe the user-facing or system-facing outcome, not implementation details.

Good example:

> Allow users to reorder component instances within a template.

Bad example:

> Add a sort function and two buttons in the editor.

---

### 3. Acceptance Criteria

Acceptance Criteria define what must be true for the issue to be considered complete.

Use grouped checklists where possible.

Recommended groups:

- Feature Behavior
- UI
- Persistence
- Renderer
- Build & Runtime

Example:

```md
### Feature Behavior
- [ ] Components can be reordered
- [ ] Reordering updates preview immediately

### UI
- [ ] Each instance has Move Up and Move Down controls
- [ ] First item cannot move up
- [ ] Last item cannot move down

### Persistence
- [ ] Saving preserves the new order
- [ ] Reloading restores the correct order