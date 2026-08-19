export type LeadStatus = 'discovered'|'qualified'|'ready_to_connect'|'connection_sent'|'accepted'|'messaging'|'interested'|'meeting'|'proposal'|'won'|'lost';

export type Lead = {
  id: string; organization_id: string; full_name: string; job_title: string | null;
  email: string | null; phone: string | null; linkedin_url: string | null; location: string | null;
  company_id: string | null; score: number; status: LeadStatus; opportunity: string | null;
  recommended_offer: string | null; source: string; tags: string[]; buying_signals: unknown;
  score_breakdown: unknown; created_at: string; updated_at: string;
};

export type Company = { id:string; organization_id:string; name:string; website:string|null; linkedin_url:string|null; industry:string|null; employee_range:string|null; location:string|null; summary:string|null };
export type Campaign = { id:string; organization_id:string; name:string; objective:string; offer:string|null; status:string; channels:string[]; icp:Record<string,unknown>; created_at:string };
export type Approval = { id:string; action:string; status:string; payload:Record<string,unknown>; lead_id:string|null; campaign_id:string|null; created_at:string };
export type AgentRun = { id:string; goal:string; state:string; plan:unknown; result:unknown; created_at:string; error:unknown };
