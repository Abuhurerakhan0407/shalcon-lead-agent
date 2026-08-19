import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticatedDb } from '@/lib/server-session';
import { getGoogleAccessToken } from '@/lib/google-auth';

const Input=z.object({approvalId:z.string().uuid()});
function b64url(s:string){return Buffer.from(s,'utf8').toString('base64url')}

export async function POST(req:NextRequest){
  try{
    const {approvalId}=Input.parse(await req.json()); const {db,organizationId}=await authenticatedDb(req);
    const a=await db.from('approvals').select('*').eq('id',approvalId).eq('organization_id',organizationId).maybeSingle();
    if(a.error||!a.data) return Response.json({error:'Approval not found'},{status:404});
    if(a.data.status!=='approved'||!['send_email','gmail_send'].includes(a.data.action)) return Response.json({error:'Approved Gmail action required'},{status:409});
    const p=a.data.payload||{}; if(!p.to||!p.subject||!p.body) return Response.json({error:'Email payload requires to, subject and body'},{status:400});
    const token=await getGoogleAccessToken(db,organizationId);
    const headers=[`To: ${p.to}`,p.cc?`Cc: ${p.cc}`:'',`Subject: ${p.subject}`,'MIME-Version: 1.0','Content-Type: text/plain; charset="UTF-8"','',''+p.body].filter(Boolean).join('\r\n');
    const r=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({raw:b64url(headers)})});
    const j:any=await r.json(); if(!r.ok) return Response.json({error:j.error?.message||'Gmail send failed'},{status:r.status});
    const draftId=typeof p.draft_id==='string'?p.draft_id:null; if(draftId) await db.from('message_drafts').update({status:'used',updated_at:new Date().toISOString()}).eq('id',draftId).eq('organization_id',organizationId);
    return Response.json({ok:true,messageId:j.id,threadId:j.threadId});
  }catch(e){return Response.json({error:e instanceof Error?e.message:'Gmail send failed'},{status:500})}
}
