import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://puzuizdhjeohgvbcnxkh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_UTSFJ_SIx5JfzP4LsXP0Bw_anWgHiiv';

export async function authenticatedDb(req:NextRequest){
  const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
  if(!token) throw new Error('Unauthorized');
  const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false}}) as any;
  const {data:userData,error:userError}=await db.auth.getUser(token);
  if(userError||!userData?.user) throw new Error('Unauthorized');
  const {data:membership,error:membershipError}=await db.from('organization_members').select('organization_id,role').eq('user_id',userData.user.id).limit(1).maybeSingle();
  if(membershipError||!membership?.organization_id) throw new Error('Workspace not found');
  return {db,user:userData.user,organizationId:membership.organization_id as string,role:membership.role as string,token};
}
