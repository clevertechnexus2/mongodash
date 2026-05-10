import LegalLayout from '../components/LegalLayout';
import { Link } from 'react-router-dom';

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

export default function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Please read these terms carefully before using MongoDash."
      lastUpdated="January 2025"
    >
      <H2>1. Acceptance of Terms</H2>
      <P>
        By installing, accessing, or using MongoDash ("the Software"), you agree to be bound by these Terms of Service.
        If you do not agree to these terms, do not install or use the Software.
      </P>
      <P>
        These terms apply to all users of MongoDash, including the <Highlight>admin</Highlight> account and any
        additional accounts created within the dashboard.
      </P>

      <H2>2. Description of Service</H2>
      <P>
        MongoDash is a <Highlight>self-hosted</Highlight> MongoDB management dashboard. It is provided as open-source
        software for installation and operation on your own server or VPS infrastructure. CleverX Hosting &amp; CleverX
        Tech Devs does not host, operate, or manage any MongoDash instance on your behalf.
      </P>

      <H2>3. Permitted Use</H2>
      <P>You may use MongoDash to:</P>
      <Ul>
        <Li>Manage MongoDB databases on servers you own or control</Li>
        <Li>Provide database management services to clients under your own agreements</Li>
        <Li>Integrate with applications via the HTTP API</Li>
        <Li>Modify the software for your own internal use in accordance with the MIT Licence</Li>
      </Ul>

      <H2>4. Prohibited Use</H2>
      <P>You must not use MongoDash to:</P>
      <Ul>
        <Li>Store or process data in violation of applicable law</Li>
        <Li>Provide unauthorised access to databases or systems</Li>
        <Li>Circumvent authentication or security controls</Li>
        <Li>Engage in any activity that could harm the integrity of the software or third-party systems</Li>
        <Li>Resell or sublicence the software in violation of the MIT Licence terms</Li>
      </Ul>

      <H2>5. Security Responsibility</H2>
      <P>
        Because MongoDash is self-hosted, <Highlight>you are entirely responsible</Highlight> for the security of your
        deployment. This includes:
      </P>
      <Ul>
        <Li>Securing your server and firewall</Li>
        <Li>Using strong, unique passwords for all accounts</Li>
        <Li>Keeping the software and its dependencies up to date</Li>
        <Li>Backing up your data regularly</Li>
        <Li>Enabling HTTPS for any publicly accessible deployments</Li>
      </Ul>
      <P>
        We strongly recommend reviewing the{' '}
        <Link to="/security-policy" className="text-emerald-400 hover:underline">Security Policy</Link> before deploying
        in a production environment.
      </P>

      <H2>6. Data Ownership</H2>
      <P>
        All data stored in your MongoDash instance remains <Highlight>entirely yours</Highlight>. CleverX Hosting &amp;
        CleverX Tech Devs has no access to your data, your server, or your MongoDB databases. We do not collect any
        telemetry, analytics, or usage data from self-hosted installations.
      </P>

      <H2>7. No Warranty</H2>
      <P>
        MongoDash is provided <Highlight>"as is"</Highlight> without warranty of any kind, express or implied,
        including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.
        Use of the software is entirely at your own risk.
      </P>

      <H2>8. Limitation of Liability</H2>
      <P>
        To the fullest extent permitted by law, CleverX Hosting &amp; Casper Tech Devs and Clever Tech Nexus shall not be
        liable for any direct, indirect, incidental, special, consequential, or exemplary damages arising from your use
        of, or inability to use, MongoDash — including but not limited to data loss, data breach, service interruption,
        or loss of revenue.
      </P>

      <H2>9. Third-Party Software</H2>
      <P>
        MongoDash bundles and depends on third-party open-source packages, including MongoDB Community Server (licensed
        under SSPL v1). Your use of these components is subject to their respective licences. See our{' '}
        <Link to="/license" className="text-emerald-400 hover:underline">Licence page</Link> for details.
      </P>

      <H2>10. Changes to Terms</H2>
      <P>
        We reserve the right to update these Terms of Service. Updated terms will be published in the repository and
        reflected in the "Last updated" date on this page. Continued use of the software after changes constitutes
        acceptance of the revised terms.
      </P>

      <H2>11. Governing Law</H2>
      <P>
        These terms are governed by the laws of the Republic of Kenya. Any disputes arising from the use of this
        software shall be subject to the jurisdiction of the courts of Nairobi, Kenya.
      </P>

      <H2>12. Contact</H2>
      <P>
        Questions about these terms may be directed to:{' '}
        <a href="mailto:legal@clevertechnexus.qzz.io" className="text-emerald-400 hover:underline">legal@clevertechnexus.qzz.io</a>
      </P>
    </LegalLayout>
  );
}
