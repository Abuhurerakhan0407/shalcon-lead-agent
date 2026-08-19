import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticatedDb } from '@/lib/server-session';
import { decryptCredential,encryptCredential } from '@/lib/integration-crypto';

const Input=z.object({code:z.string().min(1),state:z.string().min(1)});

export async function POST(req:NextRequest){
  try{
    const {code,state}=Input.parse(await req.json());
    const expected=req.cookies.get('shalcon_google_state')?.value;
    if(!expected||expected!==state) return Response.json({error:'OAuth state mismatch'},{status:401});
    const clientId=process.env.GOOGLE_CLIENT_ID,clientSecret=process.env.GOOGLE_CLIENT_SECRET;
    if(!clientId||!clientSecret) return Response.json({error:'Google OAuth credentials are not configured'},{status:503});
    const base=(process.env.APP_URL||req.nextUrl.origin).replace(/\/$/,'');
    const redirectUri=`${base}/api/oauth/google/callback`;
    const tokenRes=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:clientId,client_secret:clientSecret,redirect_uri:redirectUri,grant_type:'authorization_code'})});
    const tokens:any=await tokenRes.json(); if(!tokenRes.ok) return Response.json({error:tokens.error_description||tokens.error||'Google token exchange failed'},{status:400});
    const {db,organizationId}=await authenticatedDb(req);
    let existing:any=null;
    const old=await db.rpc('get_integration_credential',{p_organization_id:organizationId,p_provider:'google'});
    if(old.data){try{existing=decryptCredential(old.data)}catch{existing=null}}
    const stored={...existing,...tokens,refresh_token:tokens.refresh_token||existing?.refresh_token||null,obtained_at:new Date().toISOString()};
    const put=await db.rpc('put_integration_credential',{p_organization_id:organizationId,p_provider:'google',p_ciphertext:encryptCredential(stored)});
    if(put.error) throw put.error;
    let email:string|null=null;
    if(tokens.access_token){const u=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{authorization:`Bearer ${tokens.access_token}`}});if(u.ok){const j:any=await u.json();email=j.email||null}}
    const metadata={scope:tokens.scope||stored.scope||'',token_type:tokens.token_type||'Bearer'};
    for(const provider of ['gmail','google_calendar']){
      const r=await db.from('integrations').update({status:'connected',external_account_id:email,metadata,connected_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('organization_id',organizationId).eq('provider',provider);
      if(r.error) throw r.error;
    }
    const res=NextResponse.json({ok:true,email}); res.cookies.delete('shalcon_google_state'); return res;
  }catch(e){return Response.json({error:e instanceof Error?e.message:'Google OAuth finalize failed'},{status:500})}
}
