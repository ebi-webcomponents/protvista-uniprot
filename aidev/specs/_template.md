# Feature: [Name]

## Context
[Why this feature exists. What problem it solves. Link to any relevant
research, design, or prior discussion.]

## Scope Check
[Answer these questions honestly before writing the rest of the spec.
If any answer suggests this is too large, split into multiple specs first.]
- How many new screens or views? [aim for 1-2 per spec]
- How many new components? [aim for 3-5 per spec]
- How many new API endpoints consumed? [aim for 1-2 per spec]
- How many existing files modified? [aim for under 10 per spec]
- Could any part of this feature ship independently? [if yes, split it out]

## Dependencies
[List any features or specs that must be completed before this one.
If none, write "None — this feature is self-contained."]
- [spec-name] — [what this feature needs from it]

## User Story
As a [type of user], I want to [action], so that [benefit].

## Acceptance Criteria
- [ ] [Specific, testable criterion]
- [ ] [Another criterion]
- [ ] [Include error states explicitly]
- [ ] [Include accessibility requirements explicitly]
- [ ] [Include responsive/viewport requirements explicitly]

## UI Behaviour
[Step-by-step description of what the user sees and does.]

1. User navigates to [route/screen]
2. They see [initial state]
3. When they [action], [result]
4. If [error condition], [what happens]

## Data Model
[TypeScript interfaces for all data involved.]

## API / State
[API endpoints consumed, state stores affected, storage mechanisms used.]

## Out of Scope
[Explicitly list what this feature does NOT include. Prevents AI from
over-building.]

## Technical Constraints
[Performance budgets, browser support, accessibility level (WCAG AA),
minimum viewport width, etc.]

## Pipeline Phases
[All phases are enabled by default. To skip a phase, add `skip` after the
dash. This is useful when a phase doesn't fit your task — for example,
skip "Test Generation" for a test-migration task, or skip "Spec Review"
for a well-established spec.]

- Phase 0: Spec Review
- Phase 1: Planning
- Phase 2: Test Generation
- Phase 3: Implementation
- Phase 4: Documentation

## Review Log
<!-- Auto-populated by the pipeline as reviewers analyze this spec and plan.
     Each round records what was flagged, what was changed, and what was declined. -->
