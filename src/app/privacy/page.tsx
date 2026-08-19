export default function PrivacyPage(){
  return <main style={{maxWidth:820,margin:'0 auto',padding:'64px 24px',fontFamily:'Arial,sans-serif',lineHeight:1.7,color:'#e8fff4',background:'#020806',minHeight:'100vh'}}>
    <h1>Shalcon Lead Agent Privacy Policy</h1>
    <p>Last updated: August 19, 2026.</p>
    <p>Shalcon Lead Agent is an internal sales and content operations tool operated by Shalcon Intelligence. It stores lead, campaign, approval, and integration data needed to operate the service.</p>
    <h2>Connected accounts</h2>
    <p>When an operator connects Google or LinkedIn, the service requests only permissions needed for enabled features. OAuth credentials and refresh tokens are encrypted before storage. We do not sell connected-account data.</p>
    <h2>Google data</h2>
    <p>Google account access is used only for operator-authorized Gmail sending and Google Calendar event creation. Google user data is not used for advertising or sold to third parties.</p>
    <h2>LinkedIn data</h2>
    <p>LinkedIn access is used only for features authorized by the operator and permitted by LinkedIn APIs, including approved content publishing where available. Connection requests and direct messages are not automatically sent by this service.</p>
    <h2>Data retention and deletion</h2>
    <p>Operational records are retained while the workspace is active. Connected-account credentials can be revoked by disconnecting the integration or revoking access with the provider. Workspace data can be deleted on request.</p>
    <h2>Security</h2>
    <p>Workspace data is isolated using database row-level security. Integration credentials are encrypted at rest in a private database schema and are not exposed through the public data API.</p>
    <h2>Contact</h2>
    <p>For privacy or deletion requests, contact Shalcon Intelligence through its official business contact channel.</p>
  </main>
}
