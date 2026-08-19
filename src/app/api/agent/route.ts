import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { scoreLead } from '@/lib/scoring';
import { researchWebsite } from '@/lib/safe-research';

const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://puzuizdhjeohgvbcnxkh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_UTSFJ_SIx5JfzP4LsXP0Bw_anWgHiiv';
const Input=z.object({ action:z.enum(['research_score_draft','plan_goal']), leadId:z.string().uuid().optional(), goal:z.string().max(800).optional() });

function serverClient(req:NextRequest): any{
  const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
  if(!token) throw new Error('Unauthorized');
  return createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false}}) as any;
}

function extractSignals(text:string){
  const out:string[]=[];
  const patterns=[['WhatsApp','whatsapp'],['appointments','appointment'],['hiring','hiring'],['multiple branches','branch'],['admissions','admission'],['support','support']];
  for(const [label,p] of patterns) if(text.toLowerCase().includes(p)) out.push(label);
  return out.slice(0,5);
}

function inferOpportunity(text:string,industry:string|null){
  const s=(text+' '+(industry||'')).toLowerCase();
  if(/clinic|health|appointment/.test(s)) return 'Automate enquiry qualification, appointment booking and follow-ups.';
  if(/school|education|admission/.test(s)) return 'Automate admissions, parent communication and lead follow-ups.';
  if(/insurance|renewal/.test(s)) return 'Automate renewal reminders and lead qualification.';
  if(/e.?commerce|shopify|cart/.test(s)) return 'Automate cart recovery, support and lifecycle follow-ups.';
  if(/recruit|staffing|hiring|\bhr\b/.test(s)) return 'Automate candidate screening and recruitment follow-ups.';
  return 'Audit repetitive lead, support and follow-up workflows for automation.';
}

function offerFor(industry:string|null){
  const i=(industry||'').toLowerCase();
  if(/clinic|health/.test(i)) return 'ClinicBot';
  if(/school|education|edtech/.test(i)) return 'EduFlow';
  if(/insurance/.test(i)) return 'RenewBot';
  if(/e.?commerce|retail/.test(i)) return 'CartSave';
  if(/recruit|staffing|\bhr\b/.test(i)) return 'HireFlow';
  return 'Custom Automation';
}

function stepError(step:string,error:any){
  const detail=error?.message||error?.details||String(error||'Unknown error');
  throw new Error(`${step}: ${detail}`);
}

export async function POST(req:NextRequest){
  try{
    const input=Input.parse(await req.json());
    const db=serverClient(req);

    if(input.action==='plan_goal'){
      const goal=input.goal||'';
      const plan=[
        {step:'select_leads',detail:'Select stored leads matching target ICP.'},
        {step:'research',detail:'Research company websites only.'},
        {step:'score',detail:'Score ICP, problem fit, signals and data quality.'},
        {step:'draft',detail:'Prepare personalized outreach.'},
        {step:'approval',detail:'Require human approval for outbound actions.'}
      ];
      return Response.json({goal,plan});
    }

    if(!input.leadId) return Response.json({error:'leadId required'},{status:400});

    // Fetch separately. Nested PostgREST embeds become ambiguous once same-org composite FKs are added.
    const leadResult=await db.from('leads').select('*').eq('id',input.leadId).maybeSingle();
    if(leadResult.error) stepError('Load lead',leadResult.error);
    const lead=leadResult.data;
    if(!lead) return Response.json({error:'Lead not found'},{status:404});

    let company:any=null;
    if(lead.company_id){
      const companyResult=await db.from('companies').select('*').eq('id',lead.company_id).eq('organization_id',lead.organization_id).maybeSingle();
      if(companyResult.error) stepError('Load company',companyResult.error);
      company=companyResult.data;
    }

    let researchText='';
    let evidence:any[]=[];
    if(company?.website){
      try{
        const r=await researchWebsite(company.website);
        researchText=r.text;
        evidence=[{url:r.url,kind:'company_website'}];
      }catch(e){
        evidence=[{url:company.website,kind:'research_error',note:e instanceof Error?e.message:'Research failed'}];
      }
    }

    const signals=extractSignals(researchText);
    const opportunity=inferOpportunity(researchText,company?.industry||null);
    const offer=offerFor(company?.industry||null);
    const score=scoreLead({title:lead.job_title,industry:company?.industry,location:lead.location||company?.location,website:company?.website,signals,opportunity});
    const firstName=(lead.full_name||'there').trim().split(/\s+/)[0]||'there';
    const body=`Hi ${firstName}, noticed ${company?.name||'your team'} could potentially improve ${opportunity.toLowerCase()} We build ${offer} at Shalcon Intelligence. Worth comparing notes?`;

    const updateResult=await db.from('leads').update({
      score:score.total,
      score_breakdown:score.breakdown,
      buying_signals:signals,
      opportunity,
      recommended_offer:offer,
      status:score.total>=50?'qualified':'discovered'
    }).eq('id',lead.id).eq('organization_id',lead.organization_id);
    if(updateResult.error) stepError('Update lead score',updateResult.error);

    const researchResult=await db.from('lead_research').insert({
      organization_id:lead.organization_id,
      lead_id:lead.id,
      company_id:lead.company_id,
      summary:researchText.slice(0,1200)||'No public company website text available.',
      buying_signals:signals,
      pain_points:[opportunity],
      automation_opportunities:[opportunity],
      evidence,
      confidence:researchText?0.72:0.35
    });
    if(researchResult.error) stepError('Save research',researchResult.error);

    const draftResult=await db.from('message_drafts').insert({
      organization_id:lead.organization_id,
      lead_id:lead.id,
      channel:'linkedin',
      stage:'connection',
      body,
      personalization:{offer,opportunity},
      status:'draft'
    }).select('id').single();
    if(draftResult.error) stepError('Save message draft',draftResult.error);

    if(score.total>=50){
      const approvalResult=await db.from('approvals').insert({
        organization_id:lead.organization_id,
        lead_id:lead.id,
        action:'linkedin_connection_message',
        payload:{draft_id:draftResult.data?.id,body,linkedin_url:lead.linkedin_url}
      });
      if(approvalResult.error) stepError('Create approval',approvalResult.error);
    }

    return Response.json({score,signals,opportunity,offer,body,evidence});
  }catch(e){
    const message=e instanceof Error?e.message:'Agent failed';
    console.error('agent route failed',message);
    return Response.json({error:message},{status:message==='Unauthorized'?401:500});
  }
}
