import React, { useState } from 'react';
import { X, Globe, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { ThemeMode } from '../types/json';

interface UrlFetchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadJSON: (jsonString: string) => void;
  theme: ThemeMode;
}

export const UrlFetchModal: React.FC<UrlFetchModalProps> = ({ isOpen, onClose, onLoadJSON, theme }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // First try direct fetch
      let response: Response;
      try {
        response = await fetch(url.trim());
      } catch (directErr) {
        // Fallback to proxy route /api/proxy-json if running on server, or error
        try {
          response = await fetch(`/api/proxy-json?url=${encodeURIComponent(url.trim())}`);
        } catch {
          throw new Error('CORS or network block prevented loading. Make sure the endpoint allows cross-origin requests or run with server proxy.');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      // Test if valid JSON
      JSON.parse(text);
      onLoadJSON(text);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to fetch valid JSON from URL');
    } finally {
      setLoading(false);
    }
  };

  const sampleUrls = [
    { label: 'GitHub API Meta', url: 'https://api.github.com/meta' },
    { label: 'Cloudflare Trace', url: 'https://1.1.1.1/cdn-cgi/trace' },
    { label: 'HTTPBin JSON Sample', url: 'https://httpbin.org/json' },
  ];

  const modalBg =
    theme === 'light'
      ? 'bg-white border-slate-200 text-slate-900 shadow-2xl'
      : 'bg-slate-900 border-slate-700 text-slate-100 shadow-2xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`w-full max-w-lg rounded-xl border overflow-hidden flex flex-col ${modalBg}`}>
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold tracking-tight">Fetch JSON from URL</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleFetch} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Target JSON API / Webhook / Raw File URL
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/v1/data.json"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 placeholder:text-slate-600 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick presets */}
          <div>
            <div className="text-[11px] text-slate-500 mb-1">Quick Sample Endpoints:</div>
            <div className="flex flex-wrap gap-1.5">
              {sampleUrls.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setUrl(s.url)}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
              {loading ? 'Fetching...' : 'Load JSON'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
