import React, { useState } from 'react';
import { X, Copy, Check, BarChart2, Code2, Layers, HardDrive } from 'lucide-react';
import { JSONValue, JSONStats, ThemeMode } from '../types/json';
import { computeJSONStats, generateTypeScriptInterface } from '../utils/jsonUtils';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: JSONValue;
  rawText: string;
  theme: ThemeMode;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, data, rawText, theme }) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'typescript'>('metrics');
  const [copiedTS, setCopiedTS] = useState(false);

  if (!isOpen) return null;

  const stats: JSONStats = computeJSONStats(data, rawText);
  const tsCode = generateTypeScriptInterface(data, 'PayloadSchema');

  const copyTypeScript = () => {
    navigator.clipboard.writeText(tsCode);
    setCopiedTS(true);
    setTimeout(() => setCopiedTS(false), 1500);
  };

  const modalBg =
    theme === 'light'
      ? 'bg-white border-slate-200 text-slate-900 shadow-2xl'
      : 'bg-slate-900 border-slate-700 text-slate-100 shadow-2xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`w-full max-w-2xl rounded-xl border overflow-hidden flex flex-col max-h-[85vh] ${modalBg}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-bold tracking-tight">Payload Metrics & TypeScript Export</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-3 border-b border-slate-800 flex items-center gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'metrics'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Schema Breakdown
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('typescript')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'typescript'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> Generate TypeScript Interfaces
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'metrics' ? (
            <div className="space-y-6">
              {/* Primary metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Payload Size</div>
                  <div className="text-lg font-bold font-mono text-sky-400 mt-1">
                    {(stats.sizeBytes / 1024).toFixed(2)} <span className="text-xs text-slate-400 font-normal">KB</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Total Keys</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                    {stats.totalKeys}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Max Tree Depth</div>
                  <div className="text-lg font-bold font-mono text-purple-400 mt-1">
                    {stats.maxDepth}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-sans">Data Nodes</div>
                  <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                    {stats.stringsCount + stats.numbersCount + stats.booleansCount + stats.nullsCount}
                  </div>
                </div>
              </div>

              {/* Data types breakdown table */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2">Type Distribution</h4>
                <div className="rounded-lg border border-slate-800 overflow-hidden font-mono text-xs">
                  <div className="grid grid-cols-2 divide-x divide-slate-800 bg-slate-950/80 p-2 font-sans font-semibold text-slate-400 text-[11px]">
                    <div>Type</div>
                    <div className="pl-3 text-right pr-2">Count</div>
                  </div>
                  <div className="divide-y divide-slate-800/40">
                    <div className="grid grid-cols-2 p-2 divide-x divide-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-[1px] bg-rose-500" /> Strings
                      </div>
                      <div className="pl-3 text-right pr-2 font-mono text-rose-300">{stats.stringsCount}</div>
                    </div>
                    <div className="grid grid-cols-2 p-2 divide-x divide-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-[1px] bg-emerald-500" /> Numbers
                      </div>
                      <div className="pl-3 text-right pr-2 font-mono text-emerald-300">{stats.numbersCount}</div>
                    </div>
                    <div className="grid grid-cols-2 p-2 divide-x divide-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-[1px] bg-indigo-500" /> Booleans
                      </div>
                      <div className="pl-3 text-right pr-2 font-mono text-indigo-300">{stats.booleansCount}</div>
                    </div>
                    <div className="grid grid-cols-2 p-2 divide-x divide-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-[1px] bg-slate-500" /> Null values
                      </div>
                      <div className="pl-3 text-right pr-2 font-mono text-slate-400">{stats.nullsCount}</div>
                    </div>
                    <div className="grid grid-cols-2 p-2 divide-x divide-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-[1px] bg-sky-500" /> Objects
                      </div>
                      <div className="pl-3 text-right pr-2 font-mono text-sky-300">{stats.objectsCount}</div>
                    </div>
                    <div className="grid grid-cols-2 p-2 divide-x divide-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-[1px] bg-purple-500" /> Arrays
                      </div>
                      <div className="pl-3 text-right pr-2 font-mono text-purple-300">{stats.arraysCount}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Auto-inferred TypeScript type declarations for this payload:
                </span>
                <button
                  type="button"
                  onClick={copyTypeScript}
                  className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1 text-xs"
                >
                  {copiedTS ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedTS ? 'Copied Types' : 'Copy TypeScript'}
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-sky-300 overflow-auto max-h-80 whitespace-pre">
                {tsCode}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
