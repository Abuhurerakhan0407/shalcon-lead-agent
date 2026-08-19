# Architecture

## Runtime
Next.js App Router on Vercel. Supabase handles Auth and PostgreSQL. Browser uses publishable key; RLS remains authorization boundary.

## Agent pipeline
Stored lead -> public company website research -> deterministic score -> offer mapping -> message draft -> human approval.

## Guardrails
- No LinkedIn scraping.
- No automated LinkedIn connection requests or DMs.
- Research rejects LinkedIn hosts, private IPs and local networks.
- Website content is treated as untrusted data only.
- Outbound action requires approval record.
- Tenant isolation is enforced in live Supabase with RLS plus same-organization foreign-key constraints.

## Integrations
Google Gmail/Calendar and LinkedIn Posts API remain adapters that activate only after OAuth credentials/scopes are configured.
