import { randomBytes } from 'node:crypto';
import { NextRequest,NextResponse } from 'next/server';

export async function GET(req:NextRequest){
  const clientId=process.env.GOOGLE_CLIENT_ID;
  if(!clientId) return Response.json({error:'GOOGLE_CLIENT_ID is not configured'},{status:503});
  const base=(process.env.APP_URL||req.nextUrl.origin).replace(/\/$/,'');
  const redirectUri=`${base}/api/oauth/google/callback`;
  const state=randomBytes(24).toString('base64url');
  const scopes=['openid','email','profile','https://www.googleapis.com/auth/gmail.send','https://www.googleapis.com/auth/calendar.events'];
  const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search=new URLSearchParams({client_id:clientId,redirect_uri:redirectUri,response_type:'code',scope:scopes.join(' '),access_type:'offline',include_granted_scopes:'true',prompt:'consent',state}).toString();
  const res=NextResponse.redirect(url);
  res.cookies.set('shalcon_google_state',state,{httpOnly:true,secure:true,sameSite:'lax',maxAge:600,path:'/'});
  return res;
}
