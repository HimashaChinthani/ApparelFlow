# AI Optimization Report

## 1. Tools and prompting

AI assistance was used for repository inspection, implementation scaffolding, defensive review, and test-case drafting. The implementation was checked against the assessment requirements and the existing Express, Supabase, and React conventions before changes were applied.

## 2. Flawed or broken AI code

Two issues in the initial implementation required correction:

1. The UI kept created orders in a React-only `orders` state. A reload silently erased the supervisor's history even though the orders were persisted in Supabase.
2. The initial verification validation only checked the number of submitted items. It did not explicitly reject duplicate component IDs, so a malformed payload could attempt to represent the same component more than once.

The database seed also contained a stale `role::user_role` cast even though the schema defines `users.role` as text. That prevented a clean first-time seed.

## 3. Human refactoring

The API now provides a role-scoped order history endpoint and the client hydrates it whenever the cutting supervisor view is opened. Verification validation rejects duplicate IDs, non-integer counts, missing components, and shortages on approval. The sewing queue response includes immutable verification items and audit information so the assembly view can inspect the handoff.

## 4. Defensive architecture

RBAC is enforced in Express middleware rather than relying on hidden client controls. The approval hard stop is re-evaluated on the server from recipe components and the persisted order quantity. The queue query contains an explicit `status = 'VERIFIED'` predicate, and sewing start uses a conditional `VERIFIED` update. Pure workflow rules and the queue predicate are covered by the server's Node test suite.
