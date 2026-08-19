'use client';

import { useEffect,useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export function OAuthFinalizer(){
  const [message,setMessage]=useState('');
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const oauthError=params.get('oauth_error');
    if(oauthError){setMessage(`OAuth failed: ${oauthError}`);history.replaceState({},'',window.location.pathname);return;}
    const provider=params.get('oauth_provider'); const code=params.get('code'); const state=params.get('state');
    if(!provider||!code||!state||!['google','linkedin'].includes(provider)) return;
    (async()=>{
      setMessage(`Finishing ${provider} connection…`);
      const db=supabaseBrowser(); const {data}=await db.auth.getSession(); const token=data.session?.access_token;
      if(!token){setMessage('Sign in again, then reconnect integration.');return;}
      const r=await fetch(`/api/oauth/${provider}/finalize`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({code,state})});
      const j=await r.json(); history.replaceState({},'',window.location.pathname);
      if(!r.ok){setMessage(j.error||'OAuth connection failed');return;}
      setMessage(`${provider==='google'?'Google':'LinkedIn'} connected.`);
      window.setTimeout(()=>window.location.reload(),650);
    })().catch(e=>setMessage(e instanceof Error?e.message:'OAuth connection failed'));
  },[]);
  if(!message)return null;
  return <div style={{position:'fixed',right:18,bottom:18,zIndex:100,background:'#0b1610',border:'1px solid #294435',padding:'12px 14px',borderRadius:10,color:'#dff7e8',maxWidth:420}}>{message}</div>;
}
