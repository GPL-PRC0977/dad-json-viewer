import React, { useState, useEffect } from 'react';
import { JSONParseError, ThemeMode } from '../types/json';
import { Copy, Check, Wand2, Sparkles, AlertCircle, FileText, ArrowRight, Minimize2, AlignLeft } from 'lucide-react';
import { repairJSON } from '../utils/jsonUtils';

interface TextViewProps {
  rawText: string;
  onRawTextChange: (newText: string) => void;
  parseError: JSONParseError | null;
  onFormat: (indent: number | 'tab') => void;
  onMinify: () => void;
  onSortKeys: () => void;
  theme: ThemeMode;
}

export const TextView: React.FC<TextViewProps> = ({
  rawText,
  onRawTextChange,
  parseError,
  onFormat,
  onMinify,
  onSortKeys,
  theme,
}) => {
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);
  const [repairSuccess, setRepairSuccess] = useState<string | null>(null);

  const lines = rawText.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRepair = () => {
    const { repaired, changed } = repairJSON(rawText);
    if (changed) {
      onRawTextChange(repaired);
      setRepairSuccess('Fixed unquoted keys/trailing commas/quotes!');
      setTimeout(() => setRepairSuccess(null), 2500);
    } else {
      setRepairSuccess('No auto-fixable syntax patterns identified.');
      setTimeout(() => setRepairSuccess(null), 2500);
    }
  };

  const containerBg =
    theme === 'light'
      ? 'bg-white border-slate-200 text-slate-900'
      : theme === 'contrast'
      ? 'bg-black border-zinc-800 text-white'
      : 'bg-slate-950 border-slate-800 text-slate-100';

  const toolbarBg =
    theme === 'light'
      ? 'bg-slate-50 border-b border-slate-200'
      : theme === 'contrast'
      ? 'bg-zinc-950 border-b border-zinc-800'
      : 'bg-slate-900/90 border-b border-slate-800';

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden ${containerBg}`}>
      {/* Editor Toolbar */}
      <div className={`px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 ${toolbarBg}`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onFormat(2)}
            className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1 transition-colors ${
              theme === 'light'
                ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Format with 2 space indents"
          >
            <AlignLeft className="w-3.5 h-3.5" /> Prettify 2s
          </button>
          <button
            type="button"
            onClick={() => onFormat(4)}
            className={`px-2.5 py-1 rounded text-xs font-medium border hidden sm:inline-flex items-center gap-1 transition-colors ${
              theme === 'light'
                ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Format with 4 space indents"
          >
            Prettify 4s
          </button>
          <button
            type="button"
            onClick={onMinify}
            className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1 transition-colors ${
              theme === 'light'
                ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Minify to single line without whitespace"
          >
            <Minimize2 className="w-3.5 h-3.5" /> Minify
          </button>
          <button
            type="button"
            onClick={onSortKeys}
            className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1 transition-colors ${
              theme === 'light'
                ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Sort object keys alphabetically"
          >
            <Sparkles className="w-3.5 h-3.5" /> Sort A-Z
          </button>

          {/* Auto-repair helper */}
          <button
            type="button"
            onClick={handleRepair}
            className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1 transition-colors ${
              parseError
                ? 'border-amber-600 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                : theme === 'light'
                ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Attempt to repair broken JSON (fix unquoted keys, single quotes, trailing commas)"
          >
            <Wand2 className="w-3.5 h-3.5" /> Auto Repair
          </button>

          {repairSuccess && (
            <span className="text-xs text-amber-400 font-sans ml-1">{repairSuccess}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={wrapLines}
              onChange={(e) => setWrapLines(e.target.checked)}
              className="rounded text-sky-500"
            />
            Wrap lines
          </label>

          <button
            type="button"
            onClick={handleCopy}
            className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1 transition-colors ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-600'
                : theme === 'light'
                ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Parse Error Notification Bar */}
      {parseError && (
        <div className="bg-red-950/80 border-b border-red-700/60 px-4 py-2 text-xs text-red-200 flex items-start gap-2.5 shrink-0">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-mono">
            <span className="font-bold text-red-300">Syntax Error:</span> {parseError.message}
            {parseError.line && (
              <span className="ml-2 px-1.5 py-0.5 bg-red-900/60 rounded text-[11px] font-semibold">
                Line {parseError.line}, Col {parseError.column}
              </span>
            )}
            {parseError.snippet && (
              <div className="mt-1 text-slate-300 bg-black/40 px-2 py-1 rounded border border-red-800/40 text-[11px]">
                {parseError.snippet}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleRepair}
            className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white text-[11px] font-sans font-medium rounded transition-colors whitespace-nowrap"
          >
            Try Quick Fix
          </button>
        </div>
      )}

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-hidden font-mono text-xs">
        {/* Line Numbers Column */}
        <div
          className={`py-3 px-2 text-right select-none font-mono text-[11px] shrink-0 border-r ${
            theme === 'light'
              ? 'bg-slate-100 text-slate-400 border-slate-200'
              : 'bg-slate-900/50 text-slate-600 border-slate-800'
          }`}
          style={{ width: `${Math.max(38, String(lines.length).length * 10 + 16)}px` }}
        >
          {lines.map((_, i) => (
            <div
              key={i}
              className={`leading-5 ${
                parseError?.line === i + 1 ? 'text-red-400 font-bold bg-red-500/10 px-0.5 rounded' : ''
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
          spellCheck={false}
          className={`flex-1 p-3 bg-transparent outline-none resize-none font-mono text-xs leading-5 ${
            wrapLines ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
          } ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}
          placeholder="Paste or type JSON here..."
        />
      </div>

      {/* Status Bar */}
      <div
        className={`px-3 py-1 border-t flex items-center justify-between text-[11px] font-mono shrink-0 ${
          theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-3">
          <span>{lines.length} lines</span>
          <span>·</span>
          <span>{(new TextEncoder().encode(rawText).length / 1024).toFixed(1)} KB</span>
          <span>·</span>
          <span className={parseError ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
            {parseError ? 'Invalid JSON' : 'Valid JSON'}
          </span>
        </div>
        <div className="text-slate-500 font-sans">UTF-8</div>
      </div>
    </div>
  );
};
