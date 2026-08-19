import Link from 'next/link';
import { V11App } from '@/components/v11-app';
import { OAuthFinalizer } from '@/components/oauth-finalizer';

export default function Home() {
  return <><OAuthFinalizer/><Link href="/connect" style={{position:'fixed',right:18,top:18,zIndex:40,border:'1px solid #294435',background:'#0b1610',color:'#00ff94',padding:'8px 11px',borderRadius:9,textDecoration:'none',fontSize:12}}>Connect integrations</Link><V11App/></>;
}
