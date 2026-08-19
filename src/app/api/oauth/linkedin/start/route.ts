import { randomBytes } from 'node:crypto';
import { NextRequest,NextResponse } from 'next/server';

export async function GET(req:NextRequest){
  const clientId=process.env.LINKEDIN_CLIENT_ID;
  const scopes=(process.env.LINKEDIN_SCOPES||'').trim();
  if(!clientId||!scopes) return Response.json({error:'LINKEDIN_CLIENT_ID and LINKEDIN_SCOPES are required'},{status:503});
  const base=(process.env.APP_URL||req.nextUrl.origin).replace(/\/$/,'');
  const redirectUri=`${base}/api/oauth/linkedin/callback`;
  const state=randomBytes(24).toString('base64url');
  const url=new URL('https://www.linkedin.com/oauth/v2/authorization');
  url.search=new URLSearchParams({response_type:'code',client_id:clientId,redirect_uri:redirectUri,state,scope:scopes}).toString();
  const res=NextResponse.redirect(url);
  res.cookies.set('shalcon_linkedin_state',state,{httpOnly:true,secure:true,sameSite:'lax',maxAge:600,path:'/'});
  return res;
}
