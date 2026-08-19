# Shalcon Lead Agent

Free-first AI-assisted LinkedIn sales operating system for Shalcon Intelligence.

## V1
- Supabase Auth + tenant-safe CRM
- Leads and companies
- Public company-website research with SSRF protection
- Deterministic ICP scoring (free baseline)
- Personalized outreach drafts
- Human approval queue
- Campaigns
- Content approval workflow
- Pipeline analytics
- Google/LinkedIn integration placeholders

## Safety boundary
This project does not scrape LinkedIn profiles, auto-send connection requests, or auto-send LinkedIn DMs. Restricted actions remain human-approved/manual unless approved LinkedIn APIs explicitly permit them.

## Setup
1. Copy `.env.example` to `.env.local`.
2. Add Supabase publishable key.
3. `npm install`
4. `npm run dev`

AI model, Google OAuth and LinkedIn OAuth are optional integration steps after core deployment.
