# PetTrace AI Productization Design

Date: 2026-07-03
Status: Draft for review

## Context

PetTrace AI is currently a polished demo rather than an incomplete prototype. It already has a Vite + React + TypeScript frontend, route-level code splitting, Tailwind-based UI, Leaflet map, mock city data, a mock AI planner, OpenAI-compatible AI calls, LocalStorage persistence, a PWA service worker, GitHub Pages deployment, and a custom regression script.

The next iteration should not add many unrelated screens. The project needs a productization pass that turns the existing demo loop into a maintainable MVP foundation: reliable quality gates, clearer state boundaries, safer AI integration, and a real user feedback loop.

## Goals

1. Make the current demo reliable enough to iterate on without regressions.
2. Split demo-era global state into clearer domains with stable persistence contracts.
3. Move AI and data assumptions toward a real MVP architecture without losing the offline demo path.
4. Strengthen the core product loop: plan a pet-friendly trip, inspect places, verify place rules, contribute community feedback, and optionally authorize pet profile context for AI planning.

## Non-Goals

1. Do not build a full marketplace, merchant backend, payment system, or membership system in this iteration.
2. Do not replace the whole frontend stack.
3. Do not remove the offline mock demo path; it remains useful for demos and resilience.
4. Do not expand to many cities before the data model, verification model, and content workflow are credible.

## Recommended Roadmap

### Phase 1: Engineering Baseline

Purpose: make the current codebase safe to change.

Scope:
- Add CI quality gates for pull requests and main branch pushes: install, lint, test, and build.
- Fix current lint warnings so future warnings are meaningful.
- Promote the existing custom regression script into an explicit quality command, then decide whether to keep it as smoke coverage or migrate parts into a standard test runner.
- Add browser-level smoke tests for the critical path: AI planning, map navigation, place verification, community feedback, settings persistence, and pet profile privacy.
- Record build output size and set initial bundle budgets.

Acceptance:
- `npm run lint`, `npm test`, and `npm run build` pass locally and in CI.
- CI blocks merges when quality checks fail.
- At least one end-to-end smoke path covers the product's main loop.
- Known warnings are either fixed or documented as intentional.

### Phase 2: Architecture Split

Purpose: reduce coupling and make future features easier to reason about.

Scope:
- Split the current global store into domain slices: settings, pets, places, community, chat, and UI.
- Move seed data and generated mock feed creation out of the runtime store module.
- Add explicit LocalStorage schema versioning and migration functions.
- Keep selectors narrow so components subscribe only to the state they need.
- Move business actions such as `verifyPlace` into domain action modules where they can be tested without rendering pages.
- Review bundle output after the split, with special attention to the current large shared store chunk.

Acceptance:
- Hydration and persistence remain backward compatible with existing LocalStorage data.
- Existing regression tests still pass.
- Store modules are small enough to understand independently.
- Feature pages no longer import unrelated demo data through the global store.

### Phase 3: AI And Data Productization

Purpose: make AI planning and place data credible for real users.

Scope:
- Introduce an AI gateway boundary. In local demo mode, the app can still use mock AI or user-supplied keys. In product mode, AI calls should go through a backend or edge proxy instead of exposing provider details directly in the browser.
- Validate AI responses with a strict itinerary schema before rendering.
- Separate AI prompt construction from network transport.
- Add better error taxonomy: missing key, auth failure, rate limit, timeout, invalid JSON, unavailable provider, and fallback used.
- Extend place data with source, last confirmed date, confidence, contributor count, and review status.
- Define verification events as first-class records rather than only mutating place counters.

Acceptance:
- The UI can explain whether a plan came from real AI or mock fallback.
- Invalid AI responses do not break chat rendering.
- Place verification history can be audited from records, not only inferred from counters.
- Pet profile data is included in AI context only after explicit user action.

### Phase 4: Real User Loop

Purpose: focus product work on the strongest loop instead of broad feature expansion.

Scope:
- Optimize the journey from AI plan to place detail to verification.
- Add saved places or saved plans if they directly support repeat usage.
- Make community posts tied to place verification more structured: visited, rule changed, pet-size compatibility, indoor access, fee, and free-form note.
- Improve desktop layout from phone simulator to a real responsive web layout, while keeping the simulator available if it is still useful for demos.
- Add basic analytics hooks that are privacy-conscious and can be disabled. If analytics is not acceptable yet, add local event logging for development only.
- Prepare a seed-user checklist for manual feedback: planning success, place trust, verification clarity, pet profile privacy, and return intent.

Acceptance:
- A new user can complete the main loop without explanation.
- Verification actions create useful community content and update place trust signals.
- The app has a credible desktop experience, not only a mobile demo in a frame.
- The team can evaluate whether users understand and trust the product.

## Data Boundaries

The project should keep three data modes distinct:

1. Demo data: built-in places, built-in community posts, and mock AI behavior.
2. Local user data: pet profile, settings, chat history, saved plans, and local verification drafts.
3. Product data: shared places, verification events, community posts, and moderated updates.

Phase 1 and Phase 2 can stay fully local. Phase 3 should introduce the boundary where product data and AI gateway responsibilities can live, even if the first implementation is still a lightweight service.

## Architecture Direction

Frontend:
- Keep Vite, React, TypeScript, Tailwind, React Router, Zustand, Leaflet, and Lucide.
- Prefer incremental refactors over a rewrite.
- Keep the existing UI components, but separate design-system primitives from feature-specific components.

State:
- Replace one large store file with domain slices and narrow selectors.
- Keep persistence explicit and test migrations.
- Treat mock seed data as fixtures, not runtime store logic.

AI:
- Keep `mockAiEngine` as a deterministic fallback.
- Split prompt building, provider transport, response normalization, and UI rendering.
- Add schema validation before writing structured AI output into chat state.

Testing:
- Keep the current regression script until better tests cover the same risks.
- Add standard test structure gradually rather than replacing all coverage at once.
- Browser smoke tests should cover real workflows, not only file-content assertions.

## Risks

1. Backend scope creep: adding accounts, moderation, and sync too early could overwhelm the MVP.
2. Data credibility: pet-friendly place rules become stale quickly, so verification records and confidence scoring matter more than raw place count.
3. Privacy trust: pet profile data must stay visibly opt-in for AI context.
4. Bundle growth: maps, images, mock data, and global imports can quietly increase startup cost.
5. Demo compatibility: productization must not break the offline demo path used for presentations.

## First Implementation Plan To Write Next

After this spec is approved, the first implementation plan should target Phase 1 only:

1. Add CI quality gates.
2. Fix current lint warnings.
3. Add a single workflow-level smoke test or script for the core user journey.
4. Add bundle-size observation.
5. Update docs with the new development and release commands.

Phase 2 should start only after Phase 1 is passing locally and in CI.

