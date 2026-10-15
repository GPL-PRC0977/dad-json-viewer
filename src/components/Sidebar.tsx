import React, { useRef, useState } from 'react';
import {
  FileText,
  FolderTree,
  Columns2,
  Table,
  GitCompare,
  ChevronsUpDown,
  Maximize2,
  Minimize2,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  Upload,
  Download,
  Globe,
  Sparkles,
  BarChart2,
  Cloud,
  FileCode,
  Settings2,
  Sun,
  Moon,
  Contrast,
  Database,
  Terminal,
} from 'lucide-react';
import { ViewMode, DensityMode, ThemeMode, SelectedNodeInfo } from '../types/json';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';

interface SidebarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onExpandChildren: () => void;
  onCollapseToParent: () => void;
  selectedNode: SelectedNodeInfo | null;
  onCopyKey: () => void;
  onCopyValue: () => void;
  onCopyPath: () => void;
  onLoadSample: (sampleId: string) => void;
  onUploadFile: (file: File) => void;
  onDownloadFile: () => void;
  onOpenUrlModal: () => void;
  onOpenStatsModal: () => void;
  onOpenCloudRunModal: () => void;
  density: DensityMode;
  onDensityChange: (d: DensityMode) => void;
  theme: ThemeMode;
  onThemeChange: (t: ThemeMode) => void;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  viewMode,
  onViewModeChange,
  onExpandAll,
  onCollapseAll,
  onExpandChildren,
  onCollapseToParent,
  selectedNode,
  onCopyKey,
  onCopyValue,
  onCopyPath,
  onLoadSample,
  onUploadFile,
  onDownloadFile,
  onOpenUrlModal,
  onOpenStatsModal,
  onOpenCloudRunModal,
  density,
  onDensityChange,
  theme,
  onThemeChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  const handleCopy = (fn: () => void, name: string) => {
    fn();
    setCopiedAction(name);
    setTimeout(() => setCopiedAction(null), 1400);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      e.target.value = '';
    }
  };

  const sidebarBg =
    theme === 'light'
      ? 'bg-slate-100/90 border-r border-slate-200 text-slate-800'
      : theme === 'contrast'
      ? 'bg-black border-r border-zinc-800 text-zinc-200'
      : 'bg-slate-900/95 border-r border-slate-800 text-slate-200';

  const sectionHeadingClass =
    theme === 'light'
      ? 'text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1 mt-2 font-mono'
      : 'text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 mt-2 font-mono';

  const actionButtonClass =
    theme === 'light'
      ? 'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 transition-colors text-left disabled:opacity-40 disabled:pointer-events-none'
      : 'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left disabled:opacity-40 disabled:pointer-events-none';

  return (
    <aside className={`w-64 flex flex-col h-full shrink-0 select-none overflow-y-auto ${sidebarBg}`}>
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-sky-500 text-slate-950 font-bold flex items-center justify-center text-xs font-mono">
              {"{ }"}
            </div>
            <h1 className="text-sm font-bold tracking-tight text-white font-sans">DAD JSON Viewer</h1>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Enterprise Inspector</p>
        </div>

        {/* Cloud Run Quick Badge */}
        <button
          type="button"
          onClick={onOpenCloudRunModal}
          className="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 text-[10px] font-medium flex items-center gap-1 transition-colors"
          title="Google Cloud Run Deployment Specs"
        >
          <Cloud className="w-3 h-3" /> Cloud Run
        </button>
      </div>

      {/* Navigation View Modes */}
      <div className="p-2 space-y-0.5 border-b border-slate-800/80">
        <div className={sectionHeadingClass}>Inspection Mode</div>
        <button
          type="button"
          onClick={() => onViewModeChange('tree')}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === 'tree'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" /> Tree mode
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('text')}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === 'text'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Text mode
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('split')}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === 'split'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Columns2 className="w-3.5 h-3.5" /> Split dual view
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === 'table'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Table className="w-3.5 h-3.5" /> Table grid mode
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('diff')}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === 'diff'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" /> JSON Diff mode
        </button>
      </div>

      {/* Tree Hierarchy Actions (Direct Parity with User Screenshot) */}
      <div className="p-2 space-y-0.5 border-b border-slate-800/80">
        <div className={sectionHeadingClass}>Tree Controls</div>
        <button
          type="button"
          onClick={onExpandAll}
          className={actionButtonClass}
          title="Expand all nodes"
        >
          <Maximize2 className="w-3.5 h-3.5 text-slate-400" /> Expand all
        </button>
        <button
          type="button"
          onClick={onCollapseAll}
          className={actionButtonClass}
          title="Collapse all nodes"
        >
          <Minimize2 className="w-3.5 h-3.5 text-slate-400" /> Collapse all
        </button>
        <button
          type="button"
          onClick={onExpandChildren}
          disabled={!selectedNode}
          className={actionButtonClass}
          title="Expand children of selected node"
        >
          <ArrowDownLeft className="w-3.5 h-3.5 text-slate-400" /> Expand children
        </button>
        <button
          type="button"
          onClick={onCollapseToParent}
          disabled={!selectedNode}
          className={actionButtonClass}
          title="Collapse current branch to parent"
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" /> Collapse to parent
        </button>
      </div>

      {/* Context Selection Clipboard Actions (Direct Parity with User Screenshot) */}
      <div className="p-2 space-y-0.5 border-b border-slate-800/80">
        <div className={sectionHeadingClass}>Node Clipboard</div>
        <button
          type="button"
          onClick={() => handleCopy(onCopyKey, 'key')}
          disabled={!selectedNode?.key}
          className={actionButtonClass}
          title="Copy selected key name"
        >
          {copiedAction === 'key' ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-400" />
          )}
          {copiedAction === 'key' ? 'Key copied!' : 'Copy key'}
        </button>
        <button
          type="button"
          onClick={() => handleCopy(onCopyValue, 'value')}
          disabled={!selectedNode}
          className={actionButtonClass}
          title="Copy selected value"
        >
          {copiedAction === 'value' ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-400" />
          )}
          {copiedAction === 'value' ? 'Value copied!' : 'Copy value'}
        </button>
        <button
          type="button"
          onClick={() => handleCopy(onCopyPath, 'path')}
          disabled={!selectedNode}
          className={actionButtonClass}
          title="Copy dot notation path"
        >
          {copiedAction === 'path' ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-400" />
          )}
          {copiedAction === 'path' ? 'Path copied!' : 'Copy path'}
        </button>
      </div>

      {/* Datasets & Storage */}
      <div className="p-2 space-y-0.5 border-b border-slate-800/80">
        <div className={sectionHeadingClass}>Presets & I/O</div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json,.txt,.log"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={actionButtonClass}
        >
          <Upload className="w-3.5 h-3.5 text-slate-400" /> Upload .json file
        </button>

        <button
          type="button"
          onClick={onOpenUrlModal}
          className={actionButtonClass}
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" /> Load from URL
        </button>

        <button
          type="button"
          onClick={onDownloadFile}
          className={actionButtonClass}
        >
          <Download className="w-3.5 h-3.5 text-slate-400" /> Export JSON file
        </button>

        <button
          type="button"
          onClick={onOpenStatsModal}
          className={actionButtonClass}
        >
          <BarChart2 className="w-3.5 h-3.5 text-slate-400" /> Metrics & Types
        </button>

        {/* Sample Datasets Dropdown */}
        <div className="pt-1.5 px-2">
          <label className="text-[10px] text-slate-400 block mb-1 font-mono">Sample Presets:</label>
          <select
            onChange={(e) => {
              if (e.target.value) onLoadSample(e.target.value);
            }}
            defaultValue=""
            className="w-full text-xs py-1 px-2 rounded bg-slate-950 border border-slate-700 text-slate-200 outline-none"
          >
            <option value="" disabled>Select corporate preset...</option>
            {SAMPLE_DATASETS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Density & Theme Controls */}
      <div className="p-3 mt-auto border-t border-slate-800/80 text-xs space-y-2">
        {/* Density */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">Density:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              type="button"
              onClick={() => onDensityChange('ultra')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                density === 'ultra' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Ultra-compact 20px rows"
            >
              Ultra
            </button>
            <button
              type="button"
              onClick={() => onDensityChange('compact')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                density === 'compact' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Compact 24px rows"
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => onDensityChange('standard')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                density === 'standard' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Standard 30px rows"
            >
              Std
            </button>
          </div>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">Theme:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              type="button"
              onClick={() => onThemeChange('dark')}
              className={`p-1 rounded text-[10px] transition-colors ${
                theme === 'dark' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Corporate Dark Slate"
            >
              <Moon className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onThemeChange('light')}
              className={`p-1 rounded text-[10px] transition-colors ${
                theme === 'light' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Corporate Light"
            >
              <Sun className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onThemeChange('contrast')}
              className={`p-1 rounded text-[10px] transition-colors ${
                theme === 'contrast' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="High Contrast OLED"
            >
              <Contrast className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 text-[10px] text-slate-500 font-mono border-t border-slate-800/40 flex items-center justify-between">
          <span>DAD JSON Viewer</span>
          <span>Cloud Run Ready</span>
        </div>
      </div>
    </aside>
  );
};
