import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticatedDb } from '@/lib/server-session';
import { getGoogleAccessToken } from '@/lib/google-auth';

const Input=z.object({approvalId:z.string().uuid()});

export async function POST(req:NextRequest){
  try{
    const {approvalId}=Input.parse(await req.json()); const {db,organizationId}=await authenticatedDb(req);
    const a=await db.from('approvals').select('*').eq('id',approvalId).eq('organization_id',organizationId).maybeSingle();
    if(a.error||!a.data) return Response.json({error:'Approval not found'},{status:404});
    if(a.data.status!=='approved'||a.data.action!=='create_calendar_event') return Response.json({error:'Approved calendar action required'},{status:409});
    const p=a.data.payload||{}; if(!p.summary||!p.start||!p.end) return Response.json({error:'Calendar payload requires summary, start and end'},{status:400});
    const token=await getGoogleAccessToken(db,organizationId);
    const body={summary:p.summary,description:p.description||'',start:{dateTime:p.start,timeZone:p.timeZone||'Asia/Kolkata'},end:{dateTime:p.end,timeZone:p.timeZone||'Asia/Kolkata'},attendees:Array.isArray(p.attendees)?p.attendees.map((email:string)=>({email})):undefined};
    const r=await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(body)});
    const j:any=await r.json(); if(!r.ok) return Response.json({error:j.error?.message||'Calendar event creation failed'},{status:r.status});
    if(a.data.lead_id) await db.from('leads').update({status:'meeting',last_activity_at:new Date().toISOString()}).eq('id',a.data.lead_id).eq('organization_id',organizationId);
    return Response.json({ok:true,eventId:j.id,htmlLink:j.htmlLink});
  }catch(e){return Response.json({error:e instanceof Error?e.message:'Calendar event creation failed'},{status:500})}
}
