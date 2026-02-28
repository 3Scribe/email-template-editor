You are implementing a GitHub Issue in an existing repository.

Execution Rules:
- Implement ONLY what is described in the Acceptance Criteria.
- Do NOT introduce backend, API routes, databases, or external services.
- Do NOT refactor unrelated files.
- Prefer simple and readable implementations over abstraction.
- Keep changes localized to new folders where possible.
- Ensure the project builds and runs with `npm run dev`.
- If assumptions are required, choose the simplest option.
- After completion:
  1. Summarize files created or modified
  2. List manual testing steps
  3. Identify any follow-up work

## Commit message format (required)

- Use Conventional Commits: <type>: <short summary>
- Always include the GitHub issue number in parentheses at the end of the subject.

Examples:
- feat: add localStorage template store (#2)
- fix: escape text placeholders in renderer (#12)
- chore: add issue form guidance (#5)

If multiple issues are involved, reference the main one in the subject and list others in the body as:
Refs #3, #4

Work incrementally and safely.