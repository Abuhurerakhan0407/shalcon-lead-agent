# Shalcon Lead Agent

Free-first AI-assisted LinkedIn sales operating system for Shalcon Intelligence.

## V1
- Supabase Auth + tenant-safe CRM
- Leads and companies
- Public company-website research with SSRF protection
- Deterministic ICP scoring baseline
- Personalized outreach drafts
- Human approval queue
- Campaigns
- Content approval workflow
- Pipeline analytics
- Google/LinkedIn integration adapters

## Safety boundary
No LinkedIn profile scraping, auto-connection requests, or automated LinkedIn DMs. Restricted actions stay human-approved/manual unless approved LinkedIn APIs explicitly permit them.

## Deployment
Vercel build bootstraps the full app from `source.tar.gz.b64`, then runs `next build`. This is temporary until source is flattened into normal repository files after deployment validation.

Core environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

See `.env.example` for optional AI/Google/LinkedIn variables.
