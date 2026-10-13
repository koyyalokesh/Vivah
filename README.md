# Vivah

Vivah is a wedding planning application. The initial scaffold contains React + TypeScript + Vite and a Node.js + Express + TypeScript API in one npm-workspaces repository.

## Local setup

Use Node.js 22.19.0 or a compatible supported LTS release and npm. `.node-version` records the tested version; it does not install Node. From the repository root:

```powershell
npm install
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
npm run dev
```

Environment files are optional with default settings. React: http://localhost:5173. Express: http://localhost:3001. The public Vivah homepage is available at `/`; `/login` and `/signup` currently display placeholders for the next development milestone. Vite forwards `/api/*` requests to the local Express server without removing the `/api` prefix.

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
| `npm run lint`         | Check code with ESLint             |
| `npm run format:check` | Check formatting                   |
| `npm run format`       | Format scaffold; docs are excluded |
| `npm run build`        | Build web and API                  |

Use `npm ci` for subsequent reproducible installs. After building, stop development listeners and run `npm run start --workspace=@vivah/api`. Run `npm run preview --workspace=@vivah/web` for frontend preview on http://localhost:4173, also with a local API proxy.

```powershell
Invoke-RestMethod http://localhost:3001/api/health
Invoke-RestMethod http://localhost:5173/api/health
```

Both return `{ "data": { "status": "ok" } }`. These commands verify API liveness and the frontend development proxy. Unknown API routes return JSON 404; malformed JSON returns 400; oversized JSON returns 413; unexpected errors return generic 500 without stack traces. Ports are fixed; if changing the API port, update the proxy target too.

## Structure and boundaries

- `apps/web`: React homepage, client-side routes and future browser API clients.
- `apps/api/src/app.ts`: creates and default-exports Express; importing it does not open a port.
- `apps/api/src/server.ts`: local listener using validated configuration.
- `docs/PRD.md`, `docs/SYSTEM_ARCHITECTURE.md`, `docs/DATABASE_DESIGN.md`, `docs/API_DESIGN.md`: existing design baseline, preserved.

Future features use domain routers, controllers, services, and wedding-scoped persistence. Protected operations must derive wedding identity from membership and scope queries and referenced resources. This scaffold does not implement authentication or tenant isolation. Shared packages wait until real shared contracts exist.

## Configuration and hosting direction

Actual `.env` files are ignored; commit examples only. Backend validates PORT and NODE_ENV using Zod. API_PROXY_TARGET configures the local Vite server and is not bundled into browser code. Never put server credentials in VITE_* variables.

The intended hosting uses separate Vercel web and API projects. Vercel can import the default-exported Express app at src/app.ts. Production API rewrites and SPA fallback must be configured and tested in a deployment milestone; Vite's proxy is local only. No external infrastructure is provisioned here.

## Scope and next task

The public marketing homepage and placeholder login/signup routes are implemented. The dashboard shown on the homepage is an illustrative preview rather than a working application feature. The API currently exposes only its health endpoint. Authentication, MongoDB, wedding features, R2, email, Places and jobs are not implemented. Existing historical implementation notes are not proof of implemented features here.

Next: resolve the documented session-storage/hash choice, then implement authentication. Recoverable gallery tokens, RSVP scope, dates, media verification, email throughput, and public sharing remain decisions for their respective milestones. No business contracts are changed by this scaffold.
