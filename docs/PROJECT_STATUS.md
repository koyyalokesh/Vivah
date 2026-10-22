# Vivah Project Status

**Last updated:** 22 October 2026
**Current state:** Vercel deployment configuration prepared; production deployment is next
**Current branch:** `dev`

## Purpose

This file records major Vivah implementation milestones. It summarizes what is actually working, how it was verified, and what major work remains.

The approved product and technical requirements remain in:

- `PRD.md`
- `SYSTEM_ARCHITECTURE.md`
- `DATABASE_DESIGN.md`
- `API_DESIGN.md`

Planned features must not be treated as implemented until they are recorded as completed below.

## Completed milestones

### 1. Initial monorepo scaffold

**Status:** Completed  
**Completed:** 13 October 2026  
**Commit:** `2de869d` — `chore: initialize Vivah monorepo scaffold`

Delivered:

- npm-workspaces monorepo with `apps/web` and `apps/api`.
- React, TypeScript, and Vite frontend.
- Node.js, Express, and TypeScript backend.
- Express application exported from `src/app.ts` and local listener kept in `src/server.ts`.
- `GET /api/health` health endpoint.
- Vite development proxy forwarding `/api/*` to Express without removing the `/api` prefix.
- Root development, lint, formatting, type-check, and build scripts.
- Safe environment examples and Git ignore rules.
- Independent frontend and backend development commands.
- Initial README with local setup and verification instructions.

Verified:

- Formatting, ESLint, frontend and backend TypeScript checks, and production builds passed.
- The API health endpoint worked directly through Express and through the Vite proxy.
- React and Express ran independently and together.

### 2. Public marketing homepage

**Status:** Completed
**Completed:** 14 October 2026
**Commit:** `099c65e` — `feat: add Vivah marketing homepage`

Delivered:

- Responsive Vivah marketing homepage at `/`, based on the approved Stitch visual direction.
- Homepage content corrected to describe only approved V1 capabilities.
- Reusable header, dashboard preview, feature cards, guest experience, privacy, FAQ, call-to-action, and footer components.
- Client-side `/login` and `/signup` placeholder routes for the next milestone.
- Self-hosted Manrope and Inter fonts.
- Accessible headings, navigation, focus states, and native FAQ controls.
- Updated page metadata and README documentation.

Verified:

- Formatting, ESLint, frontend and backend TypeScript checks, and production builds passed.
- Homepage and placeholder routes returned successfully during local testing.
- Desktop and mobile layouts were visually reviewed.
- `/api/health` continued to work directly and through the Vite proxy.

Current limitation:

- Login and signup are placeholders. Authentication and wedding business features are not implemented yet.

### 3. Authentication foundation

**Status:** Completed  
**Completed:** 14 October 2026  
**Commit:** `0ec1253` — `feat: add Vivah authentication foundation`

Delivered:

- MongoDB connection handling and validated server configuration.
- User persistence with normalized unique email addresses and Argon2id password hashes.
- Custom MongoDB-backed sessions using random browser tokens and SHA-256 token hashes at rest.
- Seven-day `HttpOnly`, `SameSite=Lax` session cookie named `vivah_session`; production cookies are `Secure`.
- Signup, login, logout and current-user REST endpoints under `/api/auth`.
- Zod request validation, generic login failures, shared MongoDB-backed authentication rate limits and request-origin checks.
- Responsive signup and login screens, browser session restoration, protected routing and logout.
- Authenticated `/app` account-ready screen for users who do not yet have a wedding.
- Focused API and service tests for validation, hashing, sessions, cookie behavior, expiry, logout and origin rejection.

Verified:

- Formatting, ESLint, frontend and backend TypeScript checks, production builds and 13 authentication tests passed.
- Signup, session restoration, logout and post-logout rejection worked against a temporary local MongoDB database through the Vite `/api` proxy.
- Stored passwords used Argon2id and stored session credentials were SHA-256 hashes rather than raw browser tokens.
- Rate-limit counts were shared across store instances, client identifiers were HMAC-hashed, and verification records were removed after testing.
- Direct and proxied health endpoints remained operational.
- Desktop authentication rendering was visually reviewed.

Current limitation:

- Users can create and use an account, but cannot create or join a wedding yet.
- Password reset is deferred until the email integration milestone. V1 does not require signup email verification.

### 4. Wedding workspace creation

**Status:** Completed
**Completed:** 15 October 2026
**Commit:** `50fe564` — `feat: add Vivah wedding workspace creation`

Delivered:

- Wedding and WeddingMembership persistence with V1 uniqueness and role indexes.
- Authenticated `POST /api/wedding` and `GET /api/wedding` endpoints.
- Wedding creation derives the creator from the authenticated session and never accepts client-controlled ownership.
- Initial `ADMIN` membership creation with compensating wedding rollback if membership creation fails.
- Stable wedding website slug generation with collision retries.
- `/api/auth/login` and `/api/auth/me` now restore the current wedding and membership context.
- Responsive wedding setup UI at `/app`, based on the approved Vivah desktop and mobile Stitch designs.
- Required wedding details, optional manual location and description, inline validation, loading state, logout and post-creation workspace state.

Verified:

- Formatting, ESLint, frontend and backend TypeScript checks, production builds and 21 API/service tests passed.
- An isolated local MongoDB end-to-end run verified signup, empty initial wedding context, wedding creation, automatic `ADMIN` membership, session restoration and `GET /api/wedding` through the Vite `/api` proxy.
- The returned wedding ID remained consistent across creation, `/api/auth/me` and `GET /api/wedding`.

Current limitation:

- The post-creation workspace remains a simple welcome state; dashboard business modules are not implemented.
- Gallery token creation is deferred until the gallery milestone because stable raw-token recovery is unresolved in the database design.
- Wedding cover upload is deferred until the Cloudflare R2 milestone.

### 5. Wedding details editing

**Status:** Completed

**Completed:** 17 October 2026

**Commit:** `4c059da` — `feat: add wedding details editing`

Delivered:

- Authenticated `PATCH /api/wedding` endpoint for Admin and Manager roles.
- Wedding ownership is derived from the authenticated membership; client-supplied wedding IDs are ignored.
- Partial updates preserve omitted fields, while `null` clears the optional description or location.
- Wedding names, optional title, date, time zone, location and description are validated before persistence.
- The optional wedding title can be cleared; the workspace overview then falls back to the couple names.
- The existing public wedding slug remains stable when names or the wedding date change.
- Responsive wedding-details editor at `/app/wedding/edit`, based on the approved desktop and mobile Stitch designs.
- Prefilled values, changed-field updates, save/cancel actions, inline validation, success and failure feedback, and unsaved-change warnings.
- Session-scoped draft persistence keyed by user and wedding, with baseline-aware recovery that preserves unrelated newer server updates and reports same-field conflicts, plus a login recovery path when a save discovers that the session has expired.
- Updated wedding context after saving so the overview immediately shows the latest title.

Verified:

- Formatting, ESLint, frontend and backend TypeScript checks, production builds, 30 API/service tests and 4 frontend draft-recovery tests passed.
- Tests cover authenticated updates, Admin and Manager permissions, membership-derived wedding scope, invalid and empty payloads, optional clearing, request-origin protection and stable slugs.
- An isolated local MongoDB run through the Vite `/api` proxy verified signup, wedding creation, update, refresh, optional-field clearing, stable slug behavior, invalid-date rejection and cross-origin rejection.
- Local Chrome verified the prefilled edit screen and live save flow; the desktop implementation was visually compared with the approved Stitch screen.
- Isolated headless Chrome QA verified generated-title updates, custom-title preservation, optional-title clearing, save completion, browser Back protection, preserved dirty values and the authenticated homepage navigation.

Current limitation:

- Wedding cover editing remains deferred until the Cloudflare R2 milestone.
- A final human-driven mobile pass for the discard dialog and forced session-expiry recovery remains recommended because the dedicated browser automation runtime was unavailable during this milestone.

### 6. Wedding Member management

**Status:** Completed

**Completed:** 18 October 2026

**Commit:** `8c34ccf` — `feat: add wedding member management`

Delivered:

- Wedding-scoped member directory available to Admins and Managers.
- Admin-only invitation creation, pending-invitation listing and revocation.
- Seven-day invitation tokens generated with cryptographic randomness and stored only as HMAC-SHA-256 hashes.
- Public invitation preview plus login and signup return paths that preserve the invitation URL.
- Atomic invitation acceptance that verifies the signed-in email and prevents an account from joining two weddings.
- Admin-only role changes and member removal with race-safe final-Admin protection.
- Immediate member-invitation delivery through an internal email abstraction and timeout-protected Resend adapter.
- Responsive member-management and invitation-acceptance screens using the existing Vivah design language.
- Compact authentication and wedding forms, custom destructive-action dialogs, role-aware controls and invitation-page token privacy metadata.

Verified:

- Formatting, ESLint, frontend and backend TypeScript checks and production builds passed.
- 39 API tests and 12 frontend tests passed, including permission, origin, validation, token secrecy, authentication return-path, duplicate-member and final-Admin cases.
- Live local smoke checks verified API health, authentication protection, invalid-token handling, and Vite history fallback for the member and invitation routes.
- Manual browser testing confirmed email delivery, invitation-link opening, authentication return, acceptance, member visibility, Admin-only mutations and customized revocation confirmation.
- Final review fixes verified that rejected member mutations roll back, successful self-role changes recover from session-refresh failures, and invitation pages suppress referrer leakage and indexing.

Current limitation:

- Each deployed environment must provide server-only `RESEND_API_KEY`, verified `EMAIL_FROM` and unique `MEMBER_INVITATION_HMAC_SECRET` values; no real values are committed.
- Atomic invitation acceptance and final-Admin protection require MongoDB Atlas or another transaction-capable replica set.
- A wider physical-device and production-deployment pass remains for the eventual release milestone.

### 7. Frontend Stitch redesign and theming

**Status:** Completed

**Completed:** 18 October 2026

**Commit:** `d243b0f` — `feat: refresh Vivah frontend design system`

Delivered:

- Semantic Light and Deep Navy Dark color tokens shared across the existing frontend.
- Accessible Light, Dark and System appearance selector with local persistence, live operating-system preference updates and pre-render theme initialization.
- Latest Stitch visual treatment for the marketing homepage, centered login experience, wedding onboarding and wedding-details editor.
- A compact authenticated workspace landing page that links only to implemented wedding-details and member-management features.
- Shared password visibility and theme-selector controls, plus consistent theming for signup, member management and invitation acceptance.
- Responsive and reduced-motion styles without adding a UI or state-management dependency.

Verified:

- Formatting, ESLint, frontend and backend TypeScript checks and production builds passed.
- 39 API tests and 15 frontend tests passed, including focused theme preference and resolution tests.
- Public homepage, login and signup routes returned successfully; API health worked through the Vite proxy.
- Headless Chrome renders verified the homepage in Light and Dark modes and the centered login screen at desktop size.

Current limitation:

- The latest Stitch project has no dedicated signup or Wedding Member management reference, so those screens use the shared approved Vivah design system rather than a screen-specific replica.
- The wedding dashboard remains deferred until its business modules and data are implemented.
- Password reset remains unimplemented, so no nonfunctional forgot-password route was added during the visual redesign.
- Final hands-on checks at 390px on a physical or interactive browser remain recommended because the browser automation runtime was unavailable.

### 8. Vercel deployment preparation

**Status:** Configuration completed; deployment pending

**Completed:** 22 October 2026

**Commit:** `fd35de3` (`chore: prepare Vivah Vercel deployment`)

Delivered:

- Node.js 22 pinned consistently for the monorepo, web project and API project.
- Vercel install commands retain TypeScript and other build-only dependencies when the API uses `NODE_ENV=production`.
- Vercel web routing that resolves the API origin from deployment settings rather than committing an account-specific hostname.
- Same-origin `/api/*` forwarding to the Express project without removing the `/api` prefix.
- Explicit no-store handling for proxied API responses and an SPA fallback for direct React route navigation.
- Safe web environment example and complete two-project Vercel setup instructions in the README.
- Production environment checklist covering MongoDB Atlas, request-origin protection, session cookies, invitation secrets and Resend.

Verified:

- Formatting, ESLint, frontend and backend TypeScript checks and production builds passed on Node.js 22.19.0.
- 39 API tests and 15 frontend tests passed.
- The deployment configuration defines the expected API route, no-store response header and filesystem-aware SPA fallback.

Current limitation:

- The Vercel web and API projects, Atlas production database, public domains and production secrets must be created in their respective dashboards.
- A live production smoke test is still required after deployment.
- The backend currently trusts one exact `APP_ORIGIN`; arbitrary Vercel preview URLs cannot perform protected mutations.

## Current working capabilities

- Public Vivah marketing homepage.
- Responsive frontend routing for the homepage and authentication pages.
- Signup, login, logout and browser session restoration.
- MongoDB-backed User and Session persistence.
- MongoDB-backed Wedding and WeddingMembership persistence.
- Protected `/app` route with wedding setup and restored wedding context.
- Wedding creation with automatic Admin membership.
- Wedding details editing for Admin and Manager roles.
- Unsaved wedding-edit draft recovery within the current browser session.
- Wedding Member listing, secure invitations, acceptance, role changes and removal.
- Consistent Light, Dark and System appearance across existing screens.
- Authenticated workspace landing page for implemented wedding and member tools.
- Express API health endpoint.
- Local frontend-to-backend API proxy.
- Shared repository tooling for development, formatting, linting, type checking, and builds.

## Not implemented yet

- Password reset.
- Dashboard business data.
- Events, tasks, guests, invitations, RSVPs, expenses, or vendors.
- Wedding website publishing or livestream configuration.
- Cloudflare R2 galleries and photo uploads.
- Background and bulk guest email jobs.
- Google Places vendor discovery.
- Live production deployment and post-deployment verification.

## Next recommended milestone

Create the Vercel web and API projects, configure their production environment variables and complete the live deployment smoke test.

After deployment is verified, build wedding Events incrementally, starting with event listing and creation before edit, archive and cover-image work.

## Update rule

Update this file when a major feature or milestone is completed. Add the completion date, delivered scope, verification results, commit hash when available, and any important remaining limitation or next step. Keep small fixes inside the relevant milestone instead of creating a new milestone entry.
