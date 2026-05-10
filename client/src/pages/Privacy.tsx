import LegalLayout from '../components/LegalLayout';

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-slate-100 mt-10 mb-3 first:mt-0">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-400 text-sm leading-relaxed mb-4">{children}</p>;
}
function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-sm leading-relaxed mb-4 pl-2">{children}</ul>;
}
function Li({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}
function Highlight({ children }: { children: React.ReactNode }) {
  return <strong className="text-slate-200 font-semibold">{children}</strong>;
}
function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-4 mb-6">
      <p className="text-emerald-300 font-semibold text-sm mb-2">{title}</p>
      <div className="text-slate-400 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How MongoDash handles data — yours, your users', and ours."
      lastUpdated="January 2025"
    >
      <InfoBox title="The short version">
        MongoDash is fully self-hosted. We (CleverX Hosting &amp; CleverX Tech Devs) have{' '}
        <strong>zero access to your server, your databases, or your users' data</strong>. We collect no telemetry,
        no analytics, and no usage statistics from self-hosted installations.
      </InfoBox>

      <H2>1. Who We Are</H2>
      <P>
        MongoDash is developed and maintained by <Highlight>Clever Tech Nexus · CleverX Hosting &amp; CleverX Tech Devs</Highlight>,
        based in Nairobi, Kenya. We can be reached at{' '}
        <a href="mailto:privacy@clevertechnexus.qzz.io" className="text-emerald-400 hover:underline">privacy@clevertechnexus.qzz.io</a>.
      </P>

      <H2>2. Data We Do Not Collect</H2>
      <P>Because MongoDash is self-hosted software, we do <Highlight>not</Highlight> collect:</P>
      <Ul>
        <Li>Any data stored in your MongoDB databases</Li>
        <Li>Dashboard login credentials or session tokens</Li>
        <Li>IP addresses or server information</Li>
        <Li>Usage statistics, page views, or feature analytics</Li>
        <Li>Crash reports or error logs</Li>
        <Li>Any form of telemetry</Li>
      </Ul>
      <P>
        Your MongoDash instance runs entirely on your own infrastructure. All data flows between your browser and your
        server — never through our systems.
      </P>

      <H2>3. Data Stored Locally on Your Server</H2>
      <P>MongoDash stores the following data on your server only:</P>
      <Ul>
        <Li><Highlight>Dashboard user accounts</Highlight> — usernames, salted password hashes. Stored in the <code className="text-emerald-300 font-mono text-xs">_mongodash.users</code> MongoDB collection.</Li>
        <Li><Highlight>App metadata</Highlight> — app names, descriptions, colours, statuses, owner usernames, and MongoDB credentials. Stored in <code className="text-emerald-300 font-mono text-xs">_mongodash.apps</code>.</Li>
        <Li><Highlight>Session cookies</Highlight> — authenticated sessions are stored server-side in MongoDB and in an <code className="text-emerald-300 font-mono text-xs">httpOnly</code> cookie in your browser.</Li>
        <Li><Highlight>MongoDB credentials</Highlight> — the internal admin password and HTTP API key are stored in <code className="text-emerald-300 font-mono text-xs">data/</code> on your server's filesystem.</Li>
      </Ul>
      <P>
        This data never leaves your server unless you export it yourself.
      </P>

      <H2>4. Session Cookies</H2>
      <P>
        MongoDash sets one session cookie when you log in. This cookie:
      </P>
      <Ul>
        <Li>Is <Highlight>httpOnly</Highlight> — not accessible to JavaScript</Li>
        <Li>Uses <Highlight>sameSite: strict</Highlight> — not sent on cross-site requests</Li>
        <Li>Is marked <Highlight>secure</Highlight> when served over HTTPS</Li>
        <Li>Expires when you sign out or the session times out</Li>
      </Ul>
      <P>No third-party cookies are set. No advertising or tracking cookies are used.</P>

      <H2>5. Your Users' Data</H2>
      <P>
        If you use MongoDash to store data about your own users or customers, you are the <Highlight>data controller</Highlight>
        {' '}for that information. You are responsible for:
      </P>
      <Ul>
        <Li>Complying with applicable data protection laws (e.g. GDPR, Kenya's Data Protection Act)</Li>
        <Li>Informing your users how their data is collected and used</Li>
        <Li>Securing access to the databases containing their data</Li>
        <Li>Handling deletion and access requests as required by law</Li>
      </Ul>

      <H2>6. Third-Party Services</H2>
      <P>
        MongoDash does not integrate with any third-party analytics, advertising, or tracking services. The software
        makes no outbound network requests except to MongoDB (running on your own server).
      </P>
      <P>
        If you configure a reverse proxy (e.g. Nginx) or load balancer, that service may log request data according to
        its own policies.
      </P>

      <H2>7. Open Source Repository</H2>
      <P>
        The MongoDash source code is publicly available. If you contribute code, issues, or comments to the repository,
        that information is subject to GitHub's{' '}
        <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
          Privacy Statement
        </a>.
      </P>

      <H2>8. Data Retention</H2>
      <P>
        We retain no data on our systems. On your server, data is retained until you delete it — either by removing
        apps via the dashboard, dropping databases, or deleting the <code className="text-emerald-300 font-mono text-xs">data/</code> directory.
      </P>

      <H2>9. Children's Privacy</H2>
      <P>
        MongoDash is intended for use by adults operating server infrastructure. It is not designed for, or directed at,
        children under the age of 18.
      </P>

      <H2>10. Changes to This Policy</H2>
      <P>
        We may update this Privacy Policy from time to time. Changes will be reflected in the "Last updated" date above
        and committed to the repository. We recommend reviewing this page periodically.
      </P>

      <H2>11. Contact</H2>
      <P>
        For privacy-related questions or concerns, contact us at:{' '}
        <a href="mailto:privacy@clevertechnexus.qzz.io" className="text-emerald-400 hover:underline">privacy@clevertechnexus.qzz.io</a>
      </P>
    </LegalLayout>
  );
}
