import { createCipheriv,createDecipheriv,randomBytes } from 'node:crypto';

function key(){
  const raw=process.env.INTEGRATION_ENCRYPTION_KEY||'';
  if(!raw) throw new Error('INTEGRATION_ENCRYPTION_KEY is not configured');
  const b=/^[a-f0-9]{64}$/i.test(raw)?Buffer.from(raw,'hex'):Buffer.from(raw,'base64');
  if(b.length!==32) throw new Error('INTEGRATION_ENCRYPTION_KEY must decode to 32 bytes');
  return b;
}

export function encryptCredential(value:unknown){
  const iv=randomBytes(12); const cipher=createCipheriv('aes-256-gcm',key(),iv);
  const ciphertext=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
  const tag=cipher.getAuthTag();
  return ['v1',iv.toString('base64url'),tag.toString('base64url'),ciphertext.toString('base64url')].join('.');
}

export function decryptCredential<T=any>(payload:string):T{
  const [version,iv,tag,data]=payload.split('.'); if(version!=='v1'||!iv||!tag||!data) throw new Error('Invalid credential payload');
  const decipher=createDecipheriv('aes-256-gcm',key(),Buffer.from(iv,'base64url')); decipher.setAuthTag(Buffer.from(tag,'base64url'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]).toString('utf8')) as T;
}
