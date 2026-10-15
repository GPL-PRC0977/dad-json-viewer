/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ViewMode,
  DensityMode,
  ThemeMode,
  SelectedNodeInfo,
  JSONValue,
} from './types/json';
import {
  parseJSONSafe,
  formatJSON,
  minifyJSON,
  sortJSONKeys,
  toJSONPointer,
} from './utils/jsonUtils';
import { SAMPLE_DATASETS } from './data/sampleDatasets';
import { Sidebar } from './components/Sidebar';
import { TreeView } from './components/TreeView';
import { TextView } from './components/TextView';
import { SplitView } from './components/SplitView';
import { TableView } from './components/TableView';
import { DiffView } from './components/DiffView';
import { CloudRunModal } from './components/CloudRunModal';
import { StatsModal } from './components/StatsModal';
import { UrlFetchModal } from './components/UrlFetchModal';
import {
  Cloud,
  Download,
  Upload,
  Check,
  AlertCircle,
  BarChart2,
  Terminal,
} from 'lucide-react';

export default function App() {
  // State initialization with the user's budget allocation dataset from screenshot
  const initialPreset = SAMPLE_DATASETS[0];
  const [rawText, setRawText] = useState<string>(() =>
    formatJSON(initialPreset.data, 2)
  );
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [density, setDensity] = useState<DensityMode>('compact');
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // Selected node state
  const [selectedNode, setSelectedNode] = useState<SelectedNodeInfo | null>({
    path: 'fiscal_years[0].allocations[0].requested_vat_ex',
    jsonPointer: '/fiscal_years/0/allocations/0/requested_vat_ex',
    key: 'requested_vat_ex',
    value: '100000',
    type: 'string',
    depth: 4,
  });

  // Modals state
  const [isCloudRunModalOpen, setIsCloudRunModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);

  // Safe parse
  const { data: parsedData, error: parseError } = useMemo(
    () => parseJSONSafe(rawText),
    [rawText]
  );

  // Expanded paths set
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    // Collect all paths initially so the tree is visibly rich like in the user's screenshot
    const initialPaths = new Set<string>();
    function collect(node: any, path: string) {
      initialPaths.add(path);
      if (node !== null && typeof node === 'object') {
        if (Array.isArray(node)) {
          node.forEach((item, idx) => collect(item, `${path}[${idx}]`));
        } else {
          Object.entries(node).forEach(([k, v]) => {
            const nextPath = path ? `${path}.${k}` : k;
            collect(v, nextPath);
          });
        }
      }
    }
    collect(initialPreset.data, '');
    return initialPaths;
  });

  // Hierarchy actions
  const handleExpandAll = useCallback(() => {
    if (!parsedData || typeof parsedData !== 'object') return;
    const all = new Set<string>();
    function traverse(node: any, path: string) {
      all.add(path);
      if (node !== null && typeof node === 'object') {
        if (Array.isArray(node)) {
          node.forEach((item, idx) => traverse(item, `${path}[${idx}]`));
        } else {
          Object.entries(node).forEach(([k, v]) => {
            const nextPath = path ? `${path}.${k}` : k;
            traverse(v, nextPath);
          });
        }
      }
    }
    traverse(parsedData, '');
    setExpandedPaths(all);
  }, [parsedData]);

  const handleCollapseAll = useCallback(() => {
    setExpandedPaths(new Set(['']));
  }, []);

  const handleExpandChildren = useCallback(() => {
    if (!selectedNode || !parsedData) return;
    const targetPath = selectedNode.path;
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      function traverse(node: any, currPath: string) {
        next.add(currPath);
        if (node !== null && typeof node === 'object') {
          if (Array.isArray(node)) {
            node.forEach((item, idx) => traverse(item, `${currPath}[${idx}]`));
          } else {
            Object.entries(node).forEach(([k, v]) => {
              const p = currPath ? `${currPath}.${k}` : k;
              traverse(v, p);
            });
          }
        }
      }

      // Find subtree node
      let subNode: any = parsedData;
      if (targetPath) {
        const segments = targetPath.split(/\.|(?=\[)/g);
        for (const seg of segments) {
          if (!subNode) break;
          if (seg.startsWith('[') && seg.endsWith(']')) {
            const idx = parseInt(seg.slice(1, -1), 10);
            subNode = subNode[idx];
          } else {
            subNode = subNode[seg];
          }
        }
      }

      traverse(subNode, targetPath);
      return next;
    });
  }, [selectedNode, parsedData]);

  const handleCollapseToParent = useCallback(() => {
    if (!selectedNode || !selectedNode.path) return;
    const currPath = selectedNode.path;
    // Find parent path
    const lastDot = currPath.lastIndexOf('.');
    const lastBracket = currPath.lastIndexOf('[');
    const splitIndex = Math.max(lastDot, lastBracket);

    const parentPath = splitIndex > 0 ? currPath.substring(0, splitIndex) : '';

    setExpandedPaths((prev) => {
      const next = new Set(prev);
      // Remove current path and any children
      Array.from(next).forEach((p) => {
        if (p === currPath || p.startsWith(`${currPath}.`) || p.startsWith(`${currPath}[`)) {
          next.delete(p);
        }
      });
      return next;
    });

    // Select parent
    setSelectedNode({
      path: parentPath,
      jsonPointer: toJSONPointer(parentPath),
      key: parentPath.split(/[.\[]/).pop()?.replace(']', '') || '',
      value: null,
      type: 'object',
      depth: Math.max(0, selectedNode.depth - 1),
    });
  }, [selectedNode]);

  // Copy handlers
  const handleCopyKey = useCallback(() => {
    if (selectedNode?.key) {
      navigator.clipboard.writeText(selectedNode.key);
    }
  }, [selectedNode]);

  const handleCopyValue = useCallback(() => {
    if (selectedNode) {
      const text =
        typeof selectedNode.value === 'object' && selectedNode.value !== null
          ? JSON.stringify(selectedNode.value, null, 2)
          : String(selectedNode.value);
      navigator.clipboard.writeText(text);
    }
  }, [selectedNode]);

  const handleCopyPath = useCallback(() => {
    if (selectedNode) {
      navigator.clipboard.writeText(selectedNode.path || '$');
    }
  }, [selectedNode]);

  // Format & transform handlers
  const handleFormat = useCallback(
    (indent: number | 'tab') => {
      if (parsedData !== null) {
        setRawText(formatJSON(parsedData, indent));
      }
    },
    [parsedData]
  );

  const handleMinify = useCallback(() => {
    if (parsedData !== null) {
      setRawText(minifyJSON(parsedData));
    }
  }, [parsedData]);

  const handleSortKeys = useCallback(() => {
    if (parsedData !== null) {
      const sorted = sortJSONKeys(parsedData, true);
      setRawText(formatJSON(sorted, 2));
    }
  }, [parsedData]);

  // Load sample dataset
  const handleLoadSample = useCallback((sampleId: string) => {
    const found = SAMPLE_DATASETS.find((s) => s.id === sampleId);
    if (found) {
      const formatted = formatJSON(found.data, 2);
      setRawText(formatted);

      // Auto-expand paths for sample
      const allPaths = new Set<string>();
      function collect(node: any, path: string) {
        allPaths.add(path);
        if (node !== null && typeof node === 'object') {
          if (Array.isArray(node)) {
            node.forEach((item, idx) => collect(item, `${path}[${idx}]`));
          } else {
            Object.entries(node).forEach(([k, v]) => {
              const nextPath = path ? `${path}.${k}` : k;
              collect(v, nextPath);
            });
          }
        }
      }
      collect(found.data, '');
      setExpandedPaths(allPaths);
      setSelectedNode(null);
    }
  }, []);

  // Upload file
  const handleUploadFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setRawText(content);
        try {
          const parsed = JSON.parse(content);
          const allPaths = new Set<string>();
          function collect(node: any, path: string, depth: number) {
            if (depth < 4) allPaths.add(path);
            if (node !== null && typeof node === 'object') {
              if (Array.isArray(node)) {
                node.forEach((item, idx) => collect(item, `${path}[${idx}]`, depth + 1));
              } else {
                Object.entries(node).forEach(([k, v]) => {
                  const nextPath = path ? `${path}.${k}` : k;
                  collect(v, nextPath, depth + 1);
                });
              }
            }
          }
          collect(parsed, '', 0);
          setExpandedPaths(allPaths);
        } catch {
          // Keep raw text for error reporting
        }
        setSelectedNode(null);
      }
    };
    reader.readAsText(file);
  }, []);

  // Download file
  const handleDownloadFile = useCallback(() => {
    const blob = new Blob([rawText], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payload.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [rawText]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleExpandAll();
      } else if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCollapseAll();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleCopyKey();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handleCopyValue();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleCopyPath();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExpandAll, handleCollapseAll, handleCopyKey, handleCopyValue, handleCopyPath]);

  // App container theme class
  const appBgClass =
    theme === 'light'
      ? 'bg-slate-100 text-slate-900'
      : theme === 'contrast'
      ? 'bg-black text-white'
      : 'bg-slate-950 text-slate-100';

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${appBgClass}`}>
      {/* Top Bar Contract (3 zones: Brand Wordmark - Context & Nav - Primary Action) */}
      <header
        className={`h-11 px-4 border-b flex items-center justify-between gap-8 shrink-0 select-none ${
          theme === 'light'
            ? 'bg-white border-slate-200'
            : theme === 'contrast'
            ? 'bg-zinc-950 border-zinc-800'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        {/* Zone 1: Single Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <span className="font-mono text-sky-400 font-extrabold">&#123;&nbsp;&#125;</span>
            <span className={theme === 'light' ? 'text-slate-900' : 'text-slate-100'}>DAD JSON Viewer</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-normal">
              Enterprise Edition
            </span>
          </div>
        </div>

        {/* Zone 2: Context status / Breadcrumb info */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400 overflow-hidden">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-slate-500 font-sans">Active Target:</span>
            <span className="text-sky-400 font-semibold truncate max-w-sm">
              {selectedNode?.path ? `${selectedNode.path}` : '$ (root node)'}
            </span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {parseError ? (
              <span className="text-red-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Syntax Error
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Ready
              </span>
            )}
          </div>
        </div>

        {/* Zone 3: Primary Action & Quick Modals */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsStatsModalOpen(true)}
            className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1 transition-colors ${
              theme === 'light'
                ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Inspect payload metrics and TypeScript types"
          >
            <BarChart2 className="w-3.5 h-3.5 text-sky-400" /> Metrics
          </button>

          <button
            type="button"
            onClick={() => setIsCloudRunModalOpen(true)}
            className="px-3 py-1 rounded text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-colors shadow-xs"
            title="Open Google Cloud Run deployment blueprint"
          >
            <Cloud className="w-3.5 h-3.5" /> Deploy to Cloud Run
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Action & Tree Controls Sidebar */}
        <Sidebar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          onExpandChildren={handleExpandChildren}
          onCollapseToParent={handleCollapseToParent}
          selectedNode={selectedNode}
          onCopyKey={handleCopyKey}
          onCopyValue={handleCopyValue}
          onCopyPath={handleCopyPath}
          onLoadSample={handleLoadSample}
          onUploadFile={handleUploadFile}
          onDownloadFile={handleDownloadFile}
          onOpenUrlModal={() => setIsUrlModalOpen(true)}
          onOpenStatsModal={() => setIsStatsModalOpen(true)}
          onOpenCloudRunModal={() => setIsCloudRunModalOpen(true)}
          density={density}
          onDensityChange={setDensity}
          theme={theme}
          onThemeChange={setTheme}
        />

        {/* Main Content Area based on ViewMode */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {viewMode === 'tree' && (
            <TreeView
              data={parsedData}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              density={density}
              theme={theme}
              expandedPaths={expandedPaths}
              setExpandedPaths={setExpandedPaths}
            />
          )}

          {viewMode === 'text' && (
            <TextView
              rawText={rawText}
              onRawTextChange={setRawText}
              parseError={parseError}
              onFormat={handleFormat}
              onMinify={handleMinify}
              onSortKeys={handleSortKeys}
              theme={theme}
            />
          )}

          {viewMode === 'split' && (
            <SplitView
              rawText={rawText}
              onRawTextChange={setRawText}
              parseError={parseError}
              data={parsedData}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              density={density}
              theme={theme}
              expandedPaths={expandedPaths}
              setExpandedPaths={setExpandedPaths}
              onFormat={handleFormat}
              onMinify={handleMinify}
              onSortKeys={handleSortKeys}
            />
          )}

          {viewMode === 'table' && (
            <TableView data={parsedData} density={density} theme={theme} />
          )}

          {viewMode === 'diff' && (
            <DiffView currentData={parsedData} theme={theme} />
          )}
        </main>
      </div>

      {/* Cloud Run Deployment Blueprint Modal */}
      <CloudRunModal
        isOpen={isCloudRunModalOpen}
        onClose={() => setIsCloudRunModalOpen(false)}
        theme={theme}
      />

      {/* Stats & TypeScript Interface Modal */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        data={parsedData}
        rawText={rawText}
        theme={theme}
      />

      {/* Fetch URL Modal */}
      <UrlFetchModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onLoadJSON={(text) => {
          setRawText(text);
          try {
            const parsed = JSON.parse(text);
            const allPaths = new Set<string>();
            function collect(node: any, path: string, depth: number) {
              if (depth < 4) allPaths.add(path);
              if (node !== null && typeof node === 'object') {
                if (Array.isArray(node)) {
                  node.forEach((item, idx) => collect(item, `${path}[${idx}]`, depth + 1));
                } else {
                  Object.entries(node).forEach(([k, v]) => {
                    const nextPath = path ? `${path}.${k}` : k;
                    collect(v, nextPath, depth + 1);
                  });
                }
              }
            }
            collect(parsed, '', 0);
            setExpandedPaths(allPaths);
          } catch {
            // Error captured by safe parse
          }
        }}
        theme={theme}
      />
    </div>
  );
}
