import { NextRequest,NextResponse } from 'next/server';

export async function GET(req:NextRequest){
  const base=(process.env.APP_URL||req.nextUrl.origin).replace(/\/$/,'');
  const code=req.nextUrl.searchParams.get('code');
  const state=req.nextUrl.searchParams.get('state');
  const error=req.nextUrl.searchParams.get('error');
  if(error) return NextResponse.redirect(`${base}/?oauth_error=${encodeURIComponent(error)}`);
  if(!code||!state) return NextResponse.redirect(`${base}/?oauth_error=missing_linkedin_code`);
  return NextResponse.redirect(`${base}/?oauth_provider=linkedin&code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);
}
