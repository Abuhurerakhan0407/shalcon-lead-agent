import { decryptCredential,encryptCredential } from '@/lib/integration-crypto';

type StoredGoogle={access_token?:string;refresh_token?:string;expires_in?:number;obtained_at?:string;scope?:string;token_type?:string};

export async function getGoogleAccessToken(db:any,organizationId:string){
  const current=await db.rpc('get_integration_credential',{p_organization_id:organizationId,p_provider:'google'});
  if(current.error||!current.data) throw new Error('Google is not connected');
  const stored=decryptCredential<StoredGoogle>(current.data);
  const obtained=stored.obtained_at?Date.parse(stored.obtained_at):0;
  const expires=(stored.expires_in||0)*1000;
  if(stored.access_token&&obtained&&Date.now()<obtained+expires-60000) return stored.access_token;
  if(!stored.refresh_token) throw new Error('Google refresh token missing; reconnect Google');
  const clientId=process.env.GOOGLE_CLIENT_ID,clientSecret=process.env.GOOGLE_CLIENT_SECRET;
  if(!clientId||!clientSecret) throw new Error('Google OAuth credentials are not configured');
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,refresh_token:stored.refresh_token,grant_type:'refresh_token'})});
  const fresh:any=await r.json(); if(!r.ok) throw new Error(fresh.error_description||fresh.error||'Google refresh failed');
  const next={...stored,...fresh,refresh_token:stored.refresh_token,obtained_at:new Date().toISOString()};
  const put=await db.rpc('put_integration_credential',{p_organization_id:organizationId,p_provider:'google',p_ciphertext:encryptCredential(next)});
  if(put.error) throw put.error;
  return next.access_token as string;
}
