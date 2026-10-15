import React, { useState, useMemo, useEffect } from 'react';
import { JSONValue, SelectedNodeInfo, DensityMode, ThemeMode } from '../types/json';
import { TreeNode } from './TreeNode';
import { Search, ChevronDown, ChevronUp, Copy, Check, Filter, Layers, X } from 'lucide-react';
import { toJSONPointer } from '../utils/jsonUtils';

interface TreeViewProps {
  data: JSONValue;
  selectedNode: SelectedNodeInfo | null;
  onSelectNode: (info: SelectedNodeInfo) => void;
  density: DensityMode;
  theme: ThemeMode;
  expandedPaths: Set<string>;
  setExpandedPaths: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const TreeView: React.FC<TreeViewProps> = ({
  data,
  selectedNode,
  onSelectNode,
  density,
  theme,
  expandedPaths,
  setExpandedPaths,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Collect all searchable paths & matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim() || data === null || typeof data !== 'object') {
      return [];
    }
    const q = searchQuery.toLowerCase();
    const matches: string[] = [];

    function search(node: any, currentPath: string) {
      if (node === null) {
        if ('null'.includes(q)) matches.push(currentPath);
        return;
      }
      if (typeof node !== 'object') {
        if (String(node).toLowerCase().includes(q)) {
          matches.push(currentPath);
        }
        return;
      }

      if (Array.isArray(node)) {
        node.forEach((item, index) => {
          const itemPath = `${currentPath}[${index}]`;
          search(item, itemPath);
        });
      } else {
        Object.entries(node).forEach(([k, v]) => {
          const keyPath = currentPath ? `${currentPath}.${k}` : k;
          if (k.toLowerCase().includes(q)) {
            matches.push(keyPath);
          }
          search(v, keyPath);
        });
      }
    }

    search(data, '');
    return matches;
  }, [data, searchQuery]);

  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // When search changes, expand ancestors of matches
  useEffect(() => {
    if (searchMatches.length > 0) {
      setCurrentMatchIndex(0);
      setExpandedPaths((prev) => {
        const next = new Set(prev);
        searchMatches.forEach((path) => {
          // Add all parent paths
          let current = '';
          const segments = path.split(/\.|(?=\[)/g);
          segments.forEach((seg) => {
            current = current ? (seg.startsWith('[') ? `${current}${seg}` : `${current}.${seg}`) : seg;
            next.add(current);
          });
        });
        next.add('');
        return next;
      });
    }
  }, [searchMatches, setExpandedPaths]);

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    const targetPath = searchMatches[nextIdx];
    // Select this node
    onSelectNode({
      path: targetPath,
      jsonPointer: toJSONPointer(targetPath),
      key: targetPath.split(/[.\[]/).pop()?.replace(']', '') || '',
      value: null,
      type: 'string',
      depth: 1,
    });
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    const targetPath = searchMatches[prevIdx];
    onSelectNode({
      path: targetPath,
      jsonPointer: toJSONPointer(targetPath),
      key: targetPath.split(/[.\[]/).pop()?.replace(']', '') || '',
      value: null,
      type: 'string',
      depth: 1,
    });
  };

  // Expand to depth level
  const expandToLevel = (level: number) => {
    const next = new Set<string>();

    function traverse(node: any, path: string, depth: number) {
      if (depth < level) {
        next.add(path);
      }
      if (node !== null && typeof node === 'object') {
        if (Array.isArray(node)) {
          node.forEach((item, idx) => {
            traverse(item, `${path}[${idx}]`, depth + 1);
          });
        } else {
          Object.entries(node).forEach(([k, v]) => {
            const nextPath = path ? `${path}.${k}` : k;
            traverse(v, nextPath, depth + 1);
          });
        }
      }
    }

    traverse(data, '', 0);
    setExpandedPaths(next);
  };

  const handleToggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const copyString = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 1500);
  };

  // Theme container classes
  const containerBg =
    theme === 'light'
      ? 'bg-white border-slate-200 text-slate-900'
      : theme === 'contrast'
      ? 'bg-black border-zinc-800 text-white'
      : 'bg-slate-950 border-slate-800/80 text-slate-100';

  const toolbarBg =
    theme === 'light'
      ? 'bg-slate-50 border-b border-slate-200'
      : theme === 'contrast'
      ? 'bg-zinc-950 border-b border-zinc-800'
      : 'bg-slate-900/90 border-b border-slate-800';

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden select-text ${containerBg}`}>
      {/* Top Search & Level Controls */}
      <div className={`px-3 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 ${toolbarBg}`}>
        {/* Search Input Bar */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div
            className={`flex items-center w-full px-2.5 py-1 rounded-md border text-xs ${
              theme === 'light'
                ? 'bg-white border-slate-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600'
                : 'bg-slate-950 border-slate-700 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter keys, values or paths (e.g., requested_vat_ex)..."
              className="w-full bg-transparent outline-none font-mono text-xs placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-200 ml-1"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {searchMatches.length > 0 && (
            <div className="flex items-center gap-1 shrink-0 text-[11px] font-mono text-slate-400 whitespace-nowrap">
              <span>
                {currentMatchIndex + 1}/{searchMatches.length}
              </span>
              <button
                type="button"
                onClick={handlePrevMatch}
                className="p-1 hover:bg-slate-800 rounded text-slate-300"
                title="Previous match"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextMatch}
                className="p-1 hover:bg-slate-800 rounded text-slate-300"
                title="Next match"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Level shortcuts: [L1] [L2] [L3] [L4] */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Depth:</span>
          {[1, 2, 3, 4].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => expandToLevel(lvl)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                theme === 'light'
                  ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                  : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={`Expand to depth level ${lvl}`}
            >
              L{lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tree Canvas */}
      <div className="flex-1 overflow-auto p-2 font-mono scroll-smooth">
        {data === null || data === undefined ? (
          <div className="p-8 text-center text-slate-500 font-sans text-sm">
            No JSON payload loaded. Paste or upload JSON from the left sidebar.
          </div>
        ) : (
          <TreeNode
            keyName={undefined}
            value={data}
            path=""
            depth={0}
            selectedPath={selectedNode?.path ?? null}
            onSelectNode={onSelectNode}
            expandedPaths={expandedPaths}
            onToggleExpand={handleToggleExpand}
            searchQuery={searchQuery}
            density={density}
            theme={theme}
          />
        )}
      </div>

      {/* Bottom Context Breadcrumb Bar (Matches enterprise inspectors like Chrome DevTools / VS Code) */}
      <div
        className={`px-3 py-1.5 border-t flex flex-wrap items-center justify-between text-xs font-mono shrink-0 ${
          theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 max-w-3xl">
          <span className="text-slate-500 text-[11px] uppercase tracking-wider font-sans font-semibold">Path:</span>
          <span className="text-sky-400 font-semibold truncate select-all">
            {selectedNode ? selectedNode.path || '$ (root)' : '$ (root)'}
          </span>

          {selectedNode?.type && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-sans uppercase font-bold ${
                selectedNode.type === 'string'
                  ? 'bg-rose-500/20 text-rose-300'
                  : selectedNode.type === 'number'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : selectedNode.type === 'boolean'
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'bg-slate-500/20 text-slate-300'
              }`}
            >
              {selectedNode.type}
            </span>
          )}
        </div>

        {/* Copy Path / Pointer shortcuts */}
        <div className="flex items-center gap-2">
          {copiedNotification && (
            <span className="text-[11px] text-emerald-400 font-sans flex items-center gap-1">
              <Check className="w-3 h-3" /> Copied {copiedNotification}!
            </span>
          )}
          <button
            type="button"
            onClick={() => copyString(selectedNode?.path || '$', 'Dot Path')}
            className={`px-2 py-0.5 rounded text-[11px] font-sans border transition-colors ${
              theme === 'light'
                ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Copy path in dot notation (e.g. fiscal_years[0].allocations[0])"
          >
            Copy Dot Path
          </button>
          <button
            type="button"
            onClick={() => copyString(toJSONPointer(selectedNode?.path || ''), 'Pointer')}
            className={`px-2 py-0.5 rounded text-[11px] font-sans border transition-colors ${
              theme === 'light'
                ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Copy RFC 6901 JSONPointer (e.g. /fiscal_years/0/allocations/0)"
          >
            Copy JSON Pointer
          </button>
        </div>
      </div>
    </div>
  );
};
