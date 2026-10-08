# AI Optimization Report

## 1. Tools and prompting

AI assistance was used for repository inspection, implementation scaffolding, defensive review, and test-case drafting. The implementation was checked against the assessment requirements and the existing Express, Supabase, and React conventions before changes were applied.

The project stack and engineering tools were:

- VS Code with GitHub Copilot/AI assistance
- React and Vite for the frontend
- Node.js and Express for the backend API
- Supabase PostgreSQL for persistent relational storage
- Git and GitHub for version control
- Vercel for deployment
- Node's built-in test runner for automated tests

AI was used as an implementation and review aid, not as a replacement for testing or architectural decisions. Generated suggestions were inspected against the assessment's server-side security requirements and the existing repository before being accepted.

## 2. Flawed or broken AI code

Two issues in the initial implementation required correction:

1. The UI kept created orders in a React-only `orders` state. A reload silently erased the supervisor's history even though the orders were persisted in Supabase.
2. The initial verification validation only checked the number of submitted items. It did not explicitly reject duplicate component IDs, so a malformed payload could attempt to represent the same component more than once.

The database seed also contained a stale `role::user_role` cast even though the schema defines `users.role` as text. That prevented a clean first-time seed.

## 3. Human refactoring

The API now provides a role-scoped order history endpoint and the client hydrates it whenever the cutting supervisor view is opened. Verification validation rejects duplicate IDs, non-integer counts, missing components, and shortages on approval. The sewing queue response includes immutable verification items and audit information so the assembly view can inspect the handoff. Demo identities now receive signed, expiring bearer tokens from the login endpoint instead of sending an untrusted role header.

## 4. Defensive architecture

RBAC is enforced in Express middleware rather than relying on hidden client controls. The approval hard stop is re-evaluated on the server from recipe components and the persisted order quantity. The queue query contains an explicit `status = 'VERIFIED'` predicate, and sewing start uses a conditional `VERIFIED` update. Supabase client roles are denied update/delete access to verification records, making the audit trail insert-only for the publishable database roles. Pure workflow rules and the queue predicate are covered by the server's Node test suite.

## 5. Validation evidence

The following checks were run before submission:

```text
cd server
npm test
```

Result: 6 backend tests passed with 0 failures.

```text
cd client
npm run build
npm run lint
```

Result: the production frontend build passed and Oxlint reported no errors.

The deployed application was also checked at:

https://apparel-flow-2q3o.vercel.app/
