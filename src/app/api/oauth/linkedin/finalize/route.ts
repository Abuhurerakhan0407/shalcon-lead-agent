import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticatedDb } from '@/lib/server-session';
import { encryptCredential } from '@/lib/integration-crypto';

const Input=z.object({code:z.string().min(1),state:z.string().min(1)});

export async function POST(req:NextRequest){
  try{
    const {code,state}=Input.parse(await req.json());
    const expected=req.cookies.get('shalcon_linkedin_state')?.value;
    if(!expected||expected!==state) return Response.json({error:'OAuth state mismatch'},{status:401});
    const clientId=process.env.LINKEDIN_CLIENT_ID,clientSecret=process.env.LINKEDIN_CLIENT_SECRET;
    if(!clientId||!clientSecret) return Response.json({error:'LinkedIn OAuth credentials are not configured'},{status:503});
    const base=(process.env.APP_URL||req.nextUrl.origin).replace(/\/$/,'');
    const redirectUri=`${base}/api/oauth/linkedin/callback`;
    const tokenRes=await fetch('https://www.linkedin.com/oauth/v2/accessToken',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',code,client_id:clientId,client_secret:clientSecret,redirect_uri:redirectUri})});
    const tokens:any=await tokenRes.json(); if(!tokenRes.ok) return Response.json({error:tokens.error_description||tokens.error||'LinkedIn token exchange failed'},{status:400});
    const {db,organizationId}=await authenticatedDb(req);
    const stored={...tokens,scope:process.env.LINKEDIN_SCOPES||'',obtained_at:new Date().toISOString()};
    const put=await db.rpc('put_integration_credential',{p_organization_id:organizationId,p_provider:'linkedin',p_ciphertext:encryptCredential(stored)});
    if(put.error) throw put.error;
    let subject:string|null=null,email:string|null=null,name:string|null=null;
    if((process.env.LINKEDIN_SCOPES||'').split(/\s+/).includes('openid')&&tokens.access_token){
      const u=await fetch('https://api.linkedin.com/v2/userinfo',{headers:{authorization:`Bearer ${tokens.access_token}`}});
      if(u.ok){const j:any=await u.json();subject=j.sub||null;email=j.email||null;name=j.name||null;}
    }
    const metadata={scope:process.env.LINKEDIN_SCOPES||'',subject,name,email,author_urn:process.env.LINKEDIN_AUTHOR_URN||null};
    const r=await db.from('integrations').update({status:'connected',external_account_id:email||subject,metadata,connected_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('organization_id',organizationId).eq('provider','linkedin');
    if(r.error) throw r.error;
    const res=NextResponse.json({ok:true,subject,email,name});res.cookies.delete('shalcon_linkedin_state');return res;
  }catch(e){return Response.json({error:e instanceof Error?e.message:'LinkedIn OAuth finalize failed'},{status:500})}
}
