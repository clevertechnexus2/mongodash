import LegalLayout from '../components/LegalLayout';

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-slate-100 mt-10 mb-3 first:mt-0">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-400 text-sm leading-relaxed mb-4">{children}</p>;
}
function Highlight({ children }: { children: React.ReactNode }) {
  return <strong className="text-slate-200 font-semibold">{children}</strong>;
}

const licenseText = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

const dependencies: { name: string; license: string; url: string }[] = [
  { name: 'MongoDB Community Server', license: 'SSPL v1', url: 'https://www.mongodb.com/licensing/server-side-public-license' },
  { name: 'Express.js', license: 'MIT', url: 'https://expressjs.com' },
  { name: 'React', license: 'MIT', url: 'https://react.dev' },
  { name: 'Vite', license: 'MIT', url: 'https://vitejs.dev' },
  { name: 'Tailwind CSS', license: 'MIT', url: 'https://tailwindcss.com' },
  { name: 'Axios', license: 'MIT', url: 'https://axios-http.com' },
  { name: 'sharp', license: 'Apache-2.0', url: 'https://sharp.pixelplumbing.com' },
  { name: 'connect-mongo', license: 'MIT', url: 'https://github.com/jdesboeufs/connect-mongo' },
  { name: 'lucide-react', license: 'ISC', url: 'https://lucide.dev' },
  { name: 'react-router-dom', license: 'MIT', url: 'https://reactrouter.com' },
  { name: 'express-session', license: 'MIT', url: 'https://github.com/expressjs/session' },
];

export default function LicensePage() {
  const year = new Date().getFullYear();

  return (
    <LegalLayout
      title="License"
      subtitle="MongoDash is open-source software released under the MIT License."
      lastUpdated="January 2025"
    >
      <H2>MIT License</H2>
      <P>
        Copyright &copy; {year} <Highlight>Clever Tech Nexus · CleverX Hosting &amp; CleverX Tech Devs</Highlight>
        <br />TZ, Dar es salaam
      </P>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 mb-8">
        <pre className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap font-mono">
          {licenseText}
        </pre>
      </div>

      <H2>What the MIT License Means</H2>
      <P>
        In plain language, the MIT License grants you the right to:
      </P>
      <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-sm leading-relaxed mb-6 pl-2">
        <li><Highlight>Use</Highlight> MongoDash freely, for personal or commercial purposes</li>
        <li><Highlight>Modify</Highlight> the source code to suit your needs</li>
        <li><Highlight>Distribute</Highlight> original or modified copies</li>
        <li><Highlight>Include</Highlight> it in proprietary products</li>
      </ul>
      <P>
        The only requirement is that you include the original copyright notice and the MIT License text in any
        substantial copy or distribution of the software.
      </P>

      <H2>Third-Party Licenses</H2>
      <P>
        MongoDash bundles and depends on the following open-source packages. Each retains its own licence:
      </P>

      <div className="card divide-y divide-slate-800 mb-8">
        {dependencies.map(({ name, license, url }) => (
          <div key={name} className="flex items-center justify-between px-5 py-3.5 gap-4">
            <div className="flex-1 min-w-0">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-200 text-sm font-medium hover:text-emerald-400 transition-colors"
              >
                {name}
              </a>
            </div>
            <span className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${
              license === 'MIT' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' :
              license === 'Apache-2.0' ? 'bg-blue-950/60 text-blue-400 border border-blue-800/50' :
              license === 'ISC' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
              'bg-amber-950/60 text-amber-400 border border-amber-800/50'
            }`}>
              {license}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-4">
        <p className="text-amber-300 font-semibold text-sm mb-2">MongoDB Community Server — SSPL v1 Notice</p>
        <p className="text-slate-400 text-sm leading-relaxed">
          MongoDash starts and manages a local MongoDB Community Server process. MongoDB Community Server is
          licensed under the <Highlight>Server Side Public License (SSPL) v1</Highlight>. Your use of MongoDB is
          subject to the terms of that license. If you offer MongoDash (or the MongoDB component within it) as a
          service to third parties, you may be required to release your service-layer source code under SSPL.
          Review the{' '}
          <a
            href="https://www.mongodb.com/licensing/server-side-public-license"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline"
          >
            full SSPL v1 text
          </a>{' '}
          to understand your obligations.
        </p>
      </div>
    </LegalLayout>
  );
}
