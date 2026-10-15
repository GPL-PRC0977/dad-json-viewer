import React, { useState, useMemo } from 'react';
import { JSONValue, ThemeMode } from '../types/json';
import { diffJSON, parseJSONSafe, formatJSON } from '../utils/jsonUtils';
import { GitCompare, PlusCircle, MinusCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface DiffViewProps {
  currentData: JSONValue;
  theme: ThemeMode;
}

export const DiffView: React.FC<DiffViewProps> = ({ currentData, theme }) => {
  const [leftText, setLeftText] = useState(() => formatJSON(currentData, 2));
  const [rightText, setRightText] = useState(() => {
    // Modify slightly for demonstration if desired
    if (typeof currentData === 'object' && currentData !== null) {
      const cloned = JSON.parse(JSON.stringify(currentData));
      if (Array.isArray(cloned.fiscal_years) && cloned.fiscal_years[0]?.allocations?.[0]) {
        cloned.fiscal_years[0].allocations[0].requested_vat_ex = '125000';
        cloned.fiscal_years[0].allocations[0].approved_budget_amount = '175000';
        cloned.fiscal_years[0].allocations.push({
          activity_code: '205',
          activity_name: 'Cloud Infrastructure Migration',
          approved_budget_amount: '250000',
          budget_available: true,
          bundle_class: 'CAPEX',
          requested_vat_ex: '220000'
        });
      }
      return formatJSON(cloned, 2);
    }
    return formatJSON(currentData, 2);
  });

  const parsedLeft = useMemo(() => parseJSONSafe(leftText), [leftText]);
  const parsedRight = useMemo(() => parseJSONSafe(rightText), [rightText]);

  const diffItems = useMemo(() => {
    if (!parsedLeft.data || !parsedRight.data) return [];
    return diffJSON(parsedLeft.data, parsedRight.data).filter((d) => d.type !== 'unchanged');
  }, [parsedLeft.data, parsedRight.data]);

  const stats = useMemo(() => {
    const added = diffItems.filter((d) => d.type === 'added').length;
    const removed = diffItems.filter((d) => d.type === 'removed').length;
    const modified = diffItems.filter((d) => d.type === 'modified').length;
    return { added, removed, modified };
  }, [diffItems]);

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
      {/* Diff Toolbar */}
      <div className={`px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 ${toolbarBg}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <GitCompare className="w-4 h-4 text-sky-400" />
            <span>Structural JSON Diff</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> +{stats.added} added
            </span>
            <span className="text-red-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> -{stats.removed} removed
            </span>
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> ~{stats.modified} modified
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setLeftText(formatJSON(currentData, 2));
          }}
          className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1 transition-colors ${
            theme === 'light'
              ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
              : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title="Reset left pane to current active document"
        >
          <RefreshCw className="w-3 h-3" /> Sync Original
        </button>
      </div>

      {/* Side-by-side Editors */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden min-h-[300px]">
        {/* Left Pane (Base) */}
        <div className="flex flex-col h-full overflow-hidden">
          <div
            className={`px-3 py-1.5 text-xs font-mono border-b flex justify-between ${
              theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}
          >
            <span className="font-semibold">Original Document (Base)</span>
            {parsedLeft.error && <span className="text-red-400">Syntax error</span>}
          </div>
          <textarea
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            spellCheck={false}
            className="flex-1 p-3 bg-transparent outline-none resize-none font-mono text-xs leading-5 whitespace-pre overflow-auto"
            placeholder="Base JSON..."
          />
        </div>

        {/* Right Pane (Target) */}
        <div className="flex flex-col h-full overflow-hidden">
          <div
            className={`px-3 py-1.5 text-xs font-mono border-b flex justify-between ${
              theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}
          >
            <span className="font-semibold">Modified Target Document</span>
            {parsedRight.error && <span className="text-red-400">Syntax error</span>}
          </div>
          <textarea
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
            spellCheck={false}
            className="flex-1 p-3 bg-transparent outline-none resize-none font-mono text-xs leading-5 whitespace-pre overflow-auto"
            placeholder="Comparison JSON..."
          />
        </div>
      </div>

      {/* Difference List Drawer */}
      <div
        className={`border-t max-h-56 overflow-auto font-mono text-xs ${
          theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}
      >
        <div className="px-3 py-1.5 text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/40">
          Detected Modifications ({diffItems.length})
        </div>
        {diffItems.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 font-sans">
            No differences found between the two payloads.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/30">
            {diffItems.map((item, idx) => {
              const isAdd = item.type === 'added';
              const isRem = item.type === 'removed';
              const isMod = item.type === 'modified';

              return (
                <div key={idx} className="px-3 py-1.5 flex items-start gap-2 hover:bg-slate-800/20">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-bold uppercase shrink-0 mt-0.5 ${
                      isAdd
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isRem
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="text-sky-400 font-semibold truncate max-w-sm">{item.path}</span>

                  <div className="flex-1 text-[11px] truncate flex items-center gap-2">
                    {isMod && (
                      <>
                        <span className="text-red-400 line-through truncate max-w-xs">
                          {JSON.stringify(item.oldValue)}
                        </span>
                        <span className="text-slate-500">&rarr;</span>
                        <span className="text-emerald-400 truncate max-w-xs">
                          {JSON.stringify(item.newValue)}
                        </span>
                      </>
                    )}
                    {isAdd && (
                      <span className="text-emerald-400 truncate max-w-md">
                        {JSON.stringify(item.newValue)}
                      </span>
                    )}
                    {isRem && (
                      <span className="text-red-400 line-through truncate max-w-md">
                        {JSON.stringify(item.oldValue)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
