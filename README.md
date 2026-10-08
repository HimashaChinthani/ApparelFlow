# ApparelFlow

ApparelFlow is a full-stack production checkpoint for garment cutting and sewing operations. It prevents unverified or short cutting batches from entering the sewing queue.

## Live deployment

- **Frontend:** [https://apparel-flow-2q3o.vercel.app/](https://apparel-flow-2q3o.vercel.app/)
- **Backend API:** Deploy the `server` project on Vercel using `server/vercel.json`
- **Frontend API URL:** Configure the deployed API URL as the frontend `VITE_API_URL` environment variable

Live URL:

```text
https://apparel-flow-2q3o.vercel.app/
```

## Features

- Three authenticated factory roles:
  - `cutting_supervisor`
  - `cutting_verifier`
  - `sewing_supervisor`
- Pre-seeded production recipes for Casual Blouse and Crop Top
- Dynamic component quantity calculation from recipe bill of materials
- Cutting order creation with fabric usage tracking
- Real-time GREEN, YELLOW, and RED verification status
- Server-enforced approval hard stop for shortages, missing counts, and invalid counts
- Mandatory rejection reason for failed batches
- Verified-only sewing queue
- Sewing start transition guarded by the backend
- Persistent Supabase relational database
- Signed, expiring demo bearer tokens
- Immutable verification items and audit log records

## Architecture

```text
client/  React + Vite frontend
server/  Node.js + Express API
         Supabase client and domain services
database Supabase PostgreSQL
```

The frontend never decides whether a batch is safe to approve. The API recalculates expected component quantities from the stored recipe and order quantity, validates every submitted component, and only changes an order to `VERIFIED` when no component is short.

The production state flow is:

```text
PENDING_VERIFICATION
        |
        +-- rejected --> REJECTED
        |
        +-- approved --> VERIFIED --> SEWING_IN_PROGRESS
```

Only orders with `status = 'VERIFIED'` are returned by the sewing queue endpoint.

## Demo credentials

All demo roles use the password `demo`.

| Role | Demo identity | Responsibility |
|---|---|---|
| Cutting Supervisor | Maya Fernando | Create and review cutting orders |
| Cutting Verifier | Nadia Perera | Count components and approve or reject batches |
| Sewing Supervisor | Ravi Silva | View verified batches and start sewing |

The UI role switcher is only a convenience for the demo. API routes independently authenticate the bearer token and enforce the required role:

- `/api/orders` requires `cutting_supervisor`
- `/api/verification` requires `cutting_verifier`
- `/api/sewing` requires `sewing_supervisor`

## Database setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run [server/supabase-day2.sql](./server/supabase-day2.sql).
4. Confirm that the recipes, recipe components, and three demo users were seeded.

The schema contains:

- `users`
- `recipes`
- `recipe_components`
- `cutting_orders`
- `verification_items`
- `verification_logs`

The verification records are insert-only for the publishable database roles. The API uses the server-side Supabase key for protected workflow operations.

## Local development

### Start the API

```powershell
cd server
npm install
Copy-Item .env.example .env
npm start
```

Set the following values in `server/.env`:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
AUTH_SECRET=use-a-long-random-secret
CLIENT_URL=http://localhost:5173
PORT=5000
```

### Start the frontend

```powershell
cd client
npm install
npm run dev
```

For local development, the Vite proxy forwards `/api` requests to `http://localhost:5000`. For a separately deployed API, set `client/.env`:

```text
VITE_API_URL=https://<your-api>.vercel.app
```

## Vercel deployment

Deploy the frontend and API as separate Vercel projects, or use the API project with the included server configuration.

### API project

- Project root: `server`
- Configuration: [server/vercel.json](./server/vercel.json)
- Build/runtime entry point: `server/api/index.js`
- Required environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `AUTH_SECRET`
  - `CLIENT_URL`

### Frontend project

- Project root: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Required environment variable:
  - `VITE_API_URL=https://<your-api>.vercel.app`

After changing `VITE_API_URL`, redeploy the frontend because Vite injects environment variables during the build.

## API overview

| Method | Endpoint | Required role | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public login | Issue a signed demo token |
| `GET` | `/api/recipes` | Public read | Load production recipes |
| `GET` | `/api/orders` | Cutting Supervisor | Load supervisor order history |
| `POST` | `/api/orders` | Cutting Supervisor | Create a cutting order |
| `GET` | `/api/verification/pending` | Cutting Verifier | Load pending batches |
| `POST` | `/api/verification/:id/decision` | Cutting Verifier | Approve or reject a batch |
| `GET` | `/api/sewing/queue` | Sewing Supervisor | Load verified batches only |
| `GET` | `/api/sewing/active` | Sewing Supervisor | Load batches already in sewing |
| `POST` | `/api/sewing/:id/start` | Sewing Supervisor | Start sewing for a verified batch |

## Validation and security rules

- Target quantity must be a positive whole number.
- Fabric usage must be positive.
- Every recipe component must be counted exactly once.
- Counts must be non-negative whole numbers.
- A shortage produces `RED` and blocks approval with HTTP `422`.
- Rejection without a reason is rejected by the API.
- Non-verifier approval requests receive HTTP `403`.
- Audit user identity comes from the authenticated server token, not the request body.
- Sewing queue queries filter by `status = 'VERIFIED'` at the database query level.

## Tests and quality checks

Run the backend tests:

```powershell
cd server
npm test
```

Run the frontend build and lint checks:

```powershell
cd client
npm run build
npm run lint
```

The backend test suite covers successful verifier approval, shortage blocking, mandatory rejection notes, role isolation, token validation, and verified-only sewing queue filtering.

## Assessment documentation

- [AI_OPTIMIZATION_REPORT.md](./AI_OPTIMIZATION_REPORT.md) documents AI assistance, defects found, human refactoring, and defensive architecture.
- [server/supabase-day2.sql](./server/supabase-day2.sql) contains the relational schema and seed data.
- [server/test/verification.test.js](./server/test/verification.test.js) contains the automated domain tests.
