import dns from 'node:dns/promises';
import net from 'node:net';

function privateIp(ip:string){
  if(net.isIP(ip)===4){ const p=ip.split('.').map(Number); return p[0]===10||p[0]===127||p[0]===0||(p[0]===169&&p[1]===254)||(p[0]===172&&p[1]>=16&&p[1]<=31)||(p[0]===192&&p[1]===168); }
  return ip==='::1'||ip.startsWith('fc')||ip.startsWith('fd')||ip.startsWith('fe80:');
}
export async function assertSafePublicUrl(raw:string){
  const u=new URL(raw); if(!['http:','https:'].includes(u.protocol)) throw new Error('Only HTTP(S) websites allowed.');
  if(/(^|\.)linkedin\.com$/i.test(u.hostname)) throw new Error('LinkedIn profile scraping is disabled.');
  const addrs=await dns.lookup(u.hostname,{all:true}); if(!addrs.length||addrs.some((a:{address:string})=>privateIp(a.address))) throw new Error('Private or local network targets are blocked.');
  return u;
}
function textFromHtml(html:string){ return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,18000); }
export async function researchWebsite(raw:string){
  const u=await assertSafePublicUrl(raw); const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),8000);
  try { const r=await fetch(u,{signal:controller.signal,headers:{'user-agent':'ShalconResearchBot/1.0'}}); if(!r.ok) throw new Error(`Website returned ${r.status}`); const html=(await r.text()).slice(0,350000); return {url:u.toString(),text:textFromHtml(html)}; } finally { clearTimeout(timer); }
}
