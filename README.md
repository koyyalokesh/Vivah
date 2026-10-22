# Vivah

Vivah is a wedding planning application. It uses React + TypeScript + Vite and a Node.js + Express + TypeScript API in one npm-workspaces repository. The current application includes the public homepage, authentication, wedding workspace creation, wedding-details editing and Wedding Member management.

## Local setup

Use Node.js 22.19.0 or a compatible supported LTS release and npm. `.node-version` records the tested version; it does not install Node. From the repository root:

```powershell
npm install
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
npm run dev
```

Set `MONGODB_URI` in `apps/api/.env` to a development-only MongoDB database. To send Wedding Member invitations, also set a server-only `RESEND_API_KEY`, a verified `EMAIL_FROM` address, and a unique `MEMBER_INVITATION_HMAC_SECRET`. React runs at http://localhost:5173 and Express runs at http://localhost:3001. Vite forwards `/api/*` requests to Express without removing the `/api` prefix.

Invitation acceptance, Admin role changes, and member removal use MongoDB transactions to preserve membership integrity. Use MongoDB Atlas or a replica-set deployment when testing those mutations.

Available application routes:

- `/`: public Vivah homepage.
- `/signup`: account creation.
- `/login`: account login.
- `/app`: authenticated wedding setup for users without a wedding, followed by the initial workspace screen.
- `/app/wedding/edit`: authenticated Admin and Manager form for updating the current wedding's details.
- `/app/members`: authenticated member directory with Admin-only management controls.
- `/member-invitations/:token`: secure member-invitation preview and acceptance flow.

Run independently in two terminals:

```powershell
npm run dev:web
npm run dev:api
```

## Scripts and verification

| Script                 | Purpose                            |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start both apps                    |
| `npm run dev:web`      | Start frontend                     |
| `npm run dev:api`      | Start API                          |
| `npm run typecheck`    | Check both TypeScript projects     |
| `npm test`             | Run frontend and API tests         |
| `npm run lint`         | Check code with ESLint             |
| `npm run format:check` | Check formatting                   |
| `npm run format`       | Format scaffold; docs are excluded |
| `npm run build`        | Build web and API                  |

Use `npm ci` for subsequent reproducible installs. After building, stop development listeners and run `npm run start --workspace=@vivah/api`. Run `npm run preview --workspace=@vivah/web` for frontend preview on http://localhost:4173, also with a local API proxy.

```powershell
Invoke-RestMethod http://localhost:3001/api/health
Invoke-RestMethod http://localhost:5173/api/health
```

Both return `{ "data": { "status": "ok" } }`. These commands verify API liveness and the frontend development proxy. The API also exposes signup, login, logout and current-user routes under `/api/auth`, plus authenticated `GET /api/wedding`, `POST /api/wedding`, and `PATCH /api/wedding` routes. Unknown API routes return JSON 404; malformed JSON returns 400; oversized JSON returns 413; unexpected errors return generic 500 without stack traces. Ports are fixed; if changing the API port, update the proxy target too.

## Vercel deployment

Deploy the monorepo as two Vercel projects connected to the same GitHub repository:

| Vercel project | Root directory | Framework |
| -------------- | -------------- | --------- |
| Vivah API      | `apps/api`     | Express   |
| Vivah Web      | `apps/web`     | Vite      |

Both projects use Node.js 22. The API project detects the default Express export in `src/app.ts`; `src/server.ts` remains the local listener and is not the Vercel entry point. Each project explicitly installs its development dependencies during the Vercel build because TypeScript and Vite are build tools, while `NODE_ENV=production` is needed by the deployed API at runtime. The web project's `vercel.json` sends `/api/*` to the API project without changing the browser URL, prevents API responses from being cached and falls back to `index.html` for React routes.

Configure these environment variables in the **API project**. Use separate values for Preview and Production when both environments are enabled:

```text
NODE_ENV=production
MONGODB_URI=<MongoDB Atlas connection string including the database name>
APP_ORIGIN=https://<public Vivah web domain>
SESSION_DURATION_DAYS=7
RATE_LIMIT_HMAC_SECRET=<unique random value of at least 32 characters>
MEMBER_INVITATION_HMAC_SECRET=<different unique random value of at least 32 characters>
MEMBER_INVITATION_DURATION_DAYS=7
RESEND_API_KEY=<server-only Resend API key>
EMAIL_FROM=Vivah <invites@verified-mail-domain.example>
```

Generate the two HMAC secrets independently and store them only in Vercel:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Configure this non-secret deployment-routing variable in the **web project**:

```text
VIVAH_API_ORIGIN=https://<public Vivah API domain>
```

Use origins only: include `https://`, omit trailing paths and query strings, and do not include a trailing slash in either origin variable. Add `VIVAH_API_ORIGIN` as a readable Config value rather than a secret because Vercel's routing layer must substitute it into the API route. No server credential belongs in the web project or in a `VITE_*` variable.

Leave the Vercel Install Command on its repository-configured value, `npm install --production=false`, for both projects. This keeps build-only packages available even though the API deployment sets `NODE_ENV=production`; Vercel still bundles only the runtime code required by each deployment.

Use a transaction-capable MongoDB Atlas cluster because invitation acceptance and final-Admin protection use transactions. Configure Atlas network access for Vercel's outbound connections and keep the database user limited to the Vivah production database. Verify a Resend sending domain before using invitations with real recipients.

After deploying both projects, verify:

```text
https://<api-domain>/api/health
https://<web-domain>/api/health
https://<web-domain>/login
https://<web-domain>/signup
https://<web-domain>/app
```

Both health URLs must return `{ "data": { "status": "ok" } }`. Then test signup, secure session restoration after refresh, wedding creation and editing, logout, invitation delivery and acceptance, Admin-only member changes, and direct refreshes of React routes. Check that the `vivah_session` cookie is `HttpOnly`, `Secure`, `SameSite=Lax` and stored for the web domain.

Use `main` as the Vercel Production Branch after reviewing and merging `dev`. The current backend trusts one exact `APP_ORIGIN`; arbitrary Vercel preview URLs therefore cannot perform protected mutations until preview-origin support is designed explicitly.

## Structure and boundaries

- `apps/web`: React homepage, client-side routes and future browser API clients.
- `apps/api/src/app.ts`: creates and default-exports Express; importing it does not open a port.
- `apps/api/src/server.ts`: local listener using validated configuration.
- `apps/api/src/modules/auth`: authentication routes, controller, service, repositories, validation and Mongoose models.
- `apps/api/src/modules/wedding`: wedding creation and editing plus the core membership model.
- `apps/api/src/modules/members`: wedding-scoped member listing, invitations, role changes and removals.
- `apps/web/src/auth`: browser session state and protected-route handling.
- `docs/PRD.md`, `docs/SYSTEM_ARCHITECTURE.md`, `docs/DATABASE_DESIGN.md`, `docs/API_DESIGN.md`: existing design baseline, preserved.
- `docs/PROJECT_STATUS.md`: living record of completed implementation milestones and the next planned step.

Future features use domain routers, controllers, services, and wedding-scoped persistence. Protected wedding operations derive wedding identity from membership and scope queries and referenced resources. Shared packages wait until real shared contracts exist.

## Configuration and hosting direction

Actual `.env` files and Vercel's local `.vercel/` metadata are ignored; commit examples only. The backend validates its port, environment, MongoDB URI, application origin and session duration. `API_PROXY_TARGET` configures the local Vite server. `VIVAH_API_ORIGIN` configures Vercel's server-side web route. Neither value is bundled into browser code. Never put server credentials in `VITE_*` variables.

Passwords are hashed with Argon2id. A custom server-side session stores only a SHA-256 token hash in MongoDB; the browser receives the raw random token in the `HttpOnly` `vivah_session` cookie. Sessions expire after seven days by default. Production cookies are also `Secure`, and state-changing auth requests validate their browser origin.

Signup and login limits are stored in MongoDB so every Vercel instance shares the same counters. Client identifiers are protected with HMAC-SHA-256 and expired counters are removed through a TTL index. Set a unique random `RATE_LIMIT_HMAC_SECRET` of at least 32 characters in production; the example development value must never be used for deployment.

The intended hosting uses separate Vercel web and API projects. Vercel can import the default-exported Express app at `src/app.ts`. The web project includes a production API route, no-store API headers and the SPA fallback; Vite's proxy remains local only. MongoDB Atlas, Vercel projects, domains and secrets must still be provisioned outside the repository.

## Scope and next task

The public marketing homepage, authentication foundation, wedding workspace creation, wedding-details editing, and Wedding Member management are implemented. The dashboard shown on the homepage is an illustrative preview rather than a working application feature. MongoDB currently stores users, sessions, shared authentication rate-limit counters, weddings, wedding memberships and member invitations. Password reset, dashboard business modules, R2, guest email jobs and Places are not implemented. Existing historical implementation notes are not proof of implemented features here.

Next: implement wedding Events before Tasks so each task can later reference a real ceremony. Gallery tokens remain deferred until the gallery milestone because the approved database document leaves stable raw-token recovery unresolved. RSVP scope, media verification, email throughput, and public sharing remain decisions for their respective milestones.
