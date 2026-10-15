import React, { useState } from 'react';
import { X, Copy, Check, Cloud, Terminal, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { ThemeMode } from '../types/json';

interface CloudRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
}

export const CloudRunModal: React.FC<CloudRunModalProps> = ({ isOpen, onClose, theme }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 1500);
  };

  const gcloudDeployCommand =
    'gcloud run deploy dad-json-viewer \\\n  --source . \\\n  --port 8080 \\\n  --allow-unauthenticated \\\n  --region asia-east1 \\\n  --min-instances 0 \\\n  --max-instances 10 \\\n  --memory 512Mi';

  const dockerBuildCommand =
    'docker build -t dad-json-viewer:latest . && \\\ndocker run -p 8080:8080 -e PORT=8080 dad-json-viewer:latest';

  const modalBg =
    theme === 'light'
      ? 'bg-white border-slate-200 text-slate-900 shadow-2xl'
      : 'bg-slate-900 border-slate-700 text-slate-100 shadow-2xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`w-full max-w-2xl rounded-xl border overflow-hidden flex flex-col max-h-[90vh] ${modalBg}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Google Cloud Run Deployment Blueprint</h2>
              <p className="text-xs text-slate-400">Ready for direct source deployment or containerized build</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Readiness confirmation */}
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-emerald-200">Cloud Run Compliant Architecture:</span>
              <p className="text-emerald-300/90 text-[11px]">
                The application includes a production-ready multi-stage Dockerfile and Express server supporting dynamic <code className="font-mono bg-emerald-900/40 px-1 py-0.5 rounded">PORT=8080</code>, container concurrency, and an active <code className="font-mono bg-emerald-900/40 px-1 py-0.5 rounded">/healthz</code> probe.
              </p>
            </div>
          </div>

          {/* Option 1: Direct gcloud source deploy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" /> Option 1: One-Command Source Deployment (Fastest)
              </span>
              <button
                type="button"
                onClick={() => copyText(gcloudDeployCommand, 'gcloud')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 font-mono text-[11px]"
              >
                {copiedCmd === 'gcloud' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedCmd === 'gcloud' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-sky-300 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
              {gcloudDeployCommand}
            </pre>
            <p className="text-slate-400 text-[11px]">
              Builds using Google Cloud Buildpacks and deploys to Cloud Run with automatic HTTPS and scale-to-zero.
            </p>
          </div>

          {/* Option 2: Dockerfile local build */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" /> Option 2: Local Docker Container Build & Test
              </span>
              <button
                type="button"
                onClick={() => copyText(dockerBuildCommand, 'docker')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 font-mono text-[11px]"
              >
                {copiedCmd === 'docker' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedCmd === 'docker' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-purple-300 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
              {dockerBuildCommand}
            </pre>
          </div>

          {/* Key Specifications Table */}
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-1.5 px-3">Parameter</th>
                  <th className="py-1.5 px-3">Configuration</th>
                  <th className="py-1.5 px-3">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                <tr>
                  <td className="py-1.5 px-3 text-sky-400">PORT</td>
                  <td className="py-1.5 px-3">8080 (or process.env.PORT)</td>
                  <td className="py-1.5 px-3 text-slate-400">Cloud Run ingress port</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-sky-400">Startup Probe</td>
                  <td className="py-1.5 px-3">GET /healthz</td>
                  <td className="py-1.5 px-3 text-slate-400">Zero-downtime healthcheck</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-sky-400">Memory / CPU</td>
                  <td className="py-1.5 px-3">512Mi / 1 vCPU</td>
                  <td className="py-1.5 px-3 text-slate-400">Fast cold starts &lt; 800ms</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-sky-400">Concurrency</td>
                  <td className="py-1.5 px-3">80 requests/container</td>
                  <td className="py-1.5 px-3 text-slate-400">High efficiency throughput</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
