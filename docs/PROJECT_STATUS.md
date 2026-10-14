# Vivah Project Status

**Last updated:** 15 October 2026
**Current state:** Wedding workspace creation completed
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
**Commit:** Not committed yet

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
- A fresh manual browser QA pass for the final wedding form and responsive states is still pending.

## Current working capabilities

- Public Vivah marketing homepage.
- Responsive frontend routing for the homepage and authentication pages.
- Signup, login, logout and browser session restoration.
- MongoDB-backed User and Session persistence.
- MongoDB-backed Wedding and WeddingMembership persistence.
- Protected `/app` route with wedding setup and restored wedding context.
- Wedding creation with automatic Admin membership.
- Express API health endpoint.
- Local frontend-to-backend API proxy.
- Shared repository tooling for development, formatting, linting, type checking, and builds.

## Not implemented yet

- Password reset.
- Wedding Member management.
- Dashboard business data.
- Events, tasks, guests, invitations, RSVPs, expenses, or vendors.
- Wedding website publishing or livestream configuration.
- Cloudflare R2 galleries and photo uploads.
- Resend email delivery and email jobs.
- Google Places vendor discovery.
- Production deployment configuration.

## Next recommended milestone

Build Wedding Member management incrementally:

1. Define the Admin-only invitation creation and acceptance contract.
2. Add wedding-scoped membership reads and Admin permission checks.
3. Add the first member-management UI without expanding into events or dashboard modules.
4. Verify last-Admin protection, duplicate invitations and cross-wedding isolation.

This milestone is planned and has not started.

## Update rule

Update this file when a major feature or milestone is completed. Add the completion date, delivered scope, verification results, commit hash when available, and any important remaining limitation or next step. Keep small fixes inside the relevant milestone instead of creating a new milestone entry.
