# Deployment gates

Required core variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Optional model/integration variables are listed in `.env.example`.

After deploy:
1. Create operator account.
2. Confirm organization bootstrap.
3. Add a test company + lead.
4. Run research + scoring.
5. Confirm draft and approval creation.
6. Verify RLS using a second test account before multi-user rollout.
