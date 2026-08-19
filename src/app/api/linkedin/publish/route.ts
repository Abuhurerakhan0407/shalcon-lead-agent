import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticatedDb } from '@/lib/server-session';
import { decryptCredential } from '@/lib/integration-crypto';

const Input=z.object({approvalId:z.string().uuid()});

export async function POST(req:NextRequest){
  try{
    const {approvalId}=Input.parse(await req.json()); const {db,organizationId}=await authenticatedDb(req);
    const a=await db.from('approvals').select('*').eq('id',approvalId).eq('organization_id',organizationId).maybeSingle();
    if(a.error||!a.data) return Response.json({error:'Approval not found'},{status:404});
    if(a.data.status!=='approved'||a.data.action!=='linkedin_publish_post') return Response.json({error:'Approved LinkedIn publish action required'},{status:409});
    const body=typeof a.data.payload?.body==='string'?a.data.payload.body.trim():''; if(!body) return Response.json({error:'Post body missing'},{status:400});
    const cred=await db.rpc('get_integration_credential',{p_organization_id:organizationId,p_provider:'linkedin'}); if(cred.error||!cred.data) return Response.json({error:'LinkedIn is not connected'},{status:409});
    const tokens=decryptCredential<any>(cred.data); if(!tokens.access_token) return Response.json({error:'LinkedIn access token missing'},{status:409});
    const ir=await db.from('integrations').select('metadata').eq('organization_id',organizationId).eq('provider','linkedin').maybeSingle();
    const author=process.env.LINKEDIN_AUTHOR_URN||ir.data?.metadata?.author_urn; if(!author) return Response.json({error:'LINKEDIN_AUTHOR_URN is not configured'},{status:503});
    const payload={author,commentary:body,visibility:'PUBLIC',distribution:{feedDistribution:'MAIN_FEED',targetEntities:[],thirdPartyDistributionChannels:[]},lifecycleState:'PUBLISHED',isReshareDisabledByAuthor:false};
    const r=await fetch('https://api.linkedin.com/rest/posts',{method:'POST',headers:{authorization:`Bearer ${tokens.access_token}`,'content-type':'application/json','X-Restli-Protocol-Version':'2.0.0','Linkedin-Version':process.env.LINKEDIN_VERSION||'202606'},body:JSON.stringify(payload)});
    if(!r.ok){const text=await r.text();return Response.json({error:`LinkedIn publish failed (${r.status}): ${text.slice(0,500)}`},{status:r.status})}
    const postId=r.headers.get('x-restli-id'); const contentId=typeof a.data.payload?.content_id==='string'?a.data.payload.content_id:null;
    if(contentId){
      const update=await db.from('content_items').update({status:'published',published_at:new Date().toISOString(),linkedin_post_urn:postId,updated_at:new Date().toISOString()}).eq('id',contentId).eq('organization_id',organizationId);
      if(update.error) throw update.error;
    }
    return Response.json({ok:true,postId});
  }catch(e){return Response.json({error:e instanceof Error?e.message:'LinkedIn publish failed'},{status:500})}
}
