# AGENTS.md

## Project
Open Email Builder is a frontend-first email template builder built with Next.js, React, TypeScript, and Tailwind.

## Source of truth
Read these files before making changes:
- `.docs/project-overview.md`
- `.docs/architecture.md`
- `.docs/data-model.md`
- `.docs/workflow.md`
- `.docs/codex-instructions.md`

## Working rules
- Implement only the GitHub Issue acceptance criteria.
- Keep changes incremental and localized.
- Do not refactor unrelated files.
- Do not introduce backend code, API routes, databases, or external services unless the issue explicitly asks for them.
- Prefer simple, readable code over abstraction.
- Keep the application functional after each stage of work.

## Commands
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

## Commit and PR rules
- Use Conventional Commit format.
- Include the issue number in commit subjects, for example:
  - `feat: allow reordering of template instances (#4)`
- PR descriptions must include:
  - `Closes #<issue-number>`

## Validation before finishing
Before considering work complete:
1. Run `npm run lint` if available
2. Run `npm run build` if available
3. Confirm there are no obvious TypeScript/runtime errors
4. Summarize changed files
5. Provide manual test steps

## Issue Authoring

New issues should follow:

.docs/issue-template.md
.docs/issue-writing-guide.md

## Issue Format

All issues follow the structure defined in:

.docs/issue-template.md

When implementing an issue:
- Respect the Acceptance Criteria
- Do not expand scope beyond what is defined

## Pull Requests

All pull requests must follow the template:

.github/PULL_REQUEST_TEMPLATE.md

PR descriptions must include:
Closes #<issue-number>