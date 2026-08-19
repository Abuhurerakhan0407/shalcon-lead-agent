export type ScoreInput = { title?:string|null; industry?:string|null; location?:string|null; website?:string|null; signals?:string[]; opportunity?:string|null };
export function scoreLead(input: ScoreInput) {
  let icp=0, problem=0, signal=0, data=0;
  const t=(input.title||'').toLowerCase(), i=(input.industry||'').toLowerCase(), l=(input.location||'').toLowerCase();
  if (/owner|founder|director|principal|head|manager|ceo|chief/.test(t)) icp += 18;
  if (/clinic|health|school|education|insurance|e.?commerce|recruit|staffing|hr/.test(i)) icp += 12;
  if (/mumbai|maharashtra|india/.test(l)) icp += 5;
  if (input.opportunity) problem += 25;
  const signals=input.signals||[]; signal=Math.min(20, signals.length*5);
  if (input.website) data += 10;
  if (input.title) data += 5;
  const total=Math.min(100, icp+problem+signal+data);
  return { total, breakdown:{ icp, problem, signal, data }, band: total>=75?'hot':total>=50?'warm':'cold' };
}
