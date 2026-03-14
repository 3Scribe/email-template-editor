# Issue Template

All development work must follow this issue structure.

---

## Title

feat: <short feature description>

Example:
feat: allow reordering of component instances in template editor

---

## Goal

Describe the purpose of the feature or change.

Explain what capability will exist after the issue is implemented.

---

## Acceptance Criteria

Define the required behavior of the feature.

Example structure:

### Feature Behavior
- [ ] Feature behaves as expected
- [ ] Changes update the UI immediately
- [ ] Application state updates correctly

### UI
- [ ] UI controls are present
- [ ] Disabled states are correct

### Persistence
- [ ] Changes persist after saving
- [ ] Reloading restores correct state

### Build & Runtime
- [ ] `npm run dev` runs successfully
- [ ] No console errors occur
- [ ] No backend changes introduced

---

## Scope

Define what this issue should and should NOT change.

Example:

Frontend-only change.
No backend work.
No database changes.
No new dependencies unless required.

---

## How to Test

Provide clear manual testing steps.

Example:

1. Start the development server

npm install
npm run dev

2. Open the application

http://localhost:3000

3. Perform actions related to the feature

4. Verify expected results

---

## Notes

Optional implementation notes or constraints.

Example:

Keep the implementation localized to the editor UI.
Avoid introducing new libraries.