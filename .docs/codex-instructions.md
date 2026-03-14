You are implementing a GitHub Issue in an existing repository.

Important: The project uses Tailwind CSS. Do not generate inline React style objects for layout or spacing.

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

## UI Styling Rules (Tailwind)

The application UI uses **Tailwind CSS as the primary styling system**.

### Required Rules

- Prefer **Tailwind utility classes** for all UI styling.
- Do **not introduce inline React style objects** such as:

  style={{ padding: "2rem" }}

- Inline styles should only be used when:
  - Tailwind cannot reasonably express the style
  - A dynamic computed value is required that Tailwind cannot support
  - The issue explicitly requires inline styling

### Correct Example (Preferred)

<div className="p-8 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold mb-4">Template Editor</h2>
</div>

### Incorrect Example (Avoid)

<div style={{ padding: "2rem", backgroundColor: "white" }}>
  <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Template Editor</h2>
</div>

### Additional Guidance

Use Tailwind utilities for common styling tasks:

| Purpose | Tailwind Examples |
|--------|-------------------|
| Padding | `p-4`, `p-6`, `px-4`, `py-2` |
| Margin | `m-4`, `mt-6`, `mb-2` |
| Layout | `flex`, `grid`, `items-center`, `justify-between` |
| Width | `w-full`, `max-w-3xl` |
| Typography | `text-sm`, `text-lg`, `font-medium`, `font-semibold` |
| Borders | `border`, `rounded`, `rounded-lg` |
| Shadows | `shadow`, `shadow-md` |

### Scope Clarification

These rules apply to:

- Application UI
- Editor interface
- Admin panels
- Dashboard components

These rules **do not apply to rendered email HTML**, which may still require inline styling for email client compatibility.