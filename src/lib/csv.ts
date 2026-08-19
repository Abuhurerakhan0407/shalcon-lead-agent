export type CsvLead = {
  full_name:string; job_title?:string; company?:string; website?:string; industry?:string;
  location?:string; email?:string; linkedin_url?:string; phone?:string;
};

function splitLine(line:string){
  const out:string[]=[]; let cur=''; let quoted=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){
      if(quoted&&line[i+1]==='"'){cur+='"';i++;} else quoted=!quoted;
    } else if(ch===','&&!quoted){out.push(cur.trim());cur='';} else cur+=ch;
  }
  out.push(cur.trim()); return out;
}

function key(v:string){return v.trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');}
function pick(row:Record<string,string>,...keys:string[]){for(const k of keys){const v=row[k];if(v?.trim())return v.trim();}return '';}

export function parseLeadCsv(text:string):CsvLead[]{
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim());
  if(lines.length<2) return [];
  const headers=splitLine(lines[0]).map(key);
  const rows:CsvLead[]=[];
  for(const line of lines.slice(1)){
    const cells=splitLine(line); const row:Record<string,string>={};
    headers.forEach((h,i)=>row[h]=cells[i]||'');
    const full_name=pick(row,'full_name','name','lead_name','contact_name');
    if(!full_name) continue;
    rows.push({
      full_name,
      job_title:pick(row,'job_title','title','role'),
      company:pick(row,'company','company_name','organization'),
      website:pick(row,'website','company_website','domain'),
      industry:pick(row,'industry','sector'),
      location:pick(row,'location','city','city_location'),
      email:pick(row,'email','work_email'),
      linkedin_url:pick(row,'linkedin_url','linkedin','profile_url'),
      phone:pick(row,'phone','mobile','phone_number')
    });
  }
  return rows;
}

export function normalizeWebsite(value:string){
  const v=value.trim(); if(!v) return '';
  return /^https?:\/\//i.test(v)?v:`https://${v}`;
}
