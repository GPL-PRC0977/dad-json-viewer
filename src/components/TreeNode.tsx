import React, { useState, useEffect } from 'react';
import { JSONValue, SelectedNodeInfo, DensityMode, ThemeMode } from '../types/json';
import { Copy, Check, ChevronRight, ChevronDown } from 'lucide-react';
import { toJSONPointer } from '../utils/jsonUtils';

interface TreeNodeProps {
  keyName?: string;
  value: JSONValue;
  path: string;
  depth: number;
  isLast?: boolean;
  selectedPath: string | null;
  onSelectNode: (info: SelectedNodeInfo) => void;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  searchQuery: string;
  density: DensityMode;
  theme: ThemeMode;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  keyName,
  value,
  path,
  depth,
  selectedPath,
  onSelectNode,
  expandedPaths,
  onToggleExpand,
  searchQuery,
  density,
  theme,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;
  const isExpanded = expandedPaths.has(path);
  const isSelected = selectedPath === path;

  // Determine value type
  const valType: SelectedNodeInfo['type'] = isArray
    ? 'array'
    : isObject
    ? 'object'
    : value === null
    ? 'null'
    : (typeof value as 'string' | 'number' | 'boolean');

  const childEntries = isObject
    ? Object.entries(value as { [k: string]: JSONValue })
    : isArray
    ? (value as JSONValue[]).map((v, i) => [String(i), v] as [string, JSONValue])
    : [];

  const handleRowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectNode({
      path,
      jsonPointer: toJSONPointer(path),
      key: keyName || '',
      value,
      type: valType,
      depth,
    });
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExpandable) {
      onToggleExpand(path);
    }
  };

  const copyToClipboard = (text: string, type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1400);
  };

  // Density dimensions
  const rowHeightClass =
    density === 'ultra' ? 'min-h-[20px] py-0.5 text-[11px]' : density === 'standard' ? 'min-h-[30px] py-1 text-[13px]' : 'min-h-[24px] py-0.5 text-[12px]';

  // Highlight matched search text
  const highlightSearch = (text: string) => {
    if (!searchQuery.trim()) return text;
    const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-amber-400/40 text-amber-200 rounded-xs px-0.5 font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Color mappings matching the user screenshot & corporate palette
  const getKeyColor = () => {
    if (theme === 'light') {
      return 'text-slate-800 font-medium';
    }
    return 'text-slate-200 font-medium';
  };

  const getValueRender = () => {
    if (value === null) {
      return <span className={theme === 'light' ? 'text-slate-400 italic' : 'text-slate-500 italic'}>null</span>;
    }
    if (typeof value === 'boolean') {
      return (
        <span className={theme === 'light' ? 'text-indigo-600 font-semibold' : 'text-indigo-400 font-semibold'}>
          {value ? 'true' : 'false'}
        </span>
      );
    }
    if (typeof value === 'number') {
      return (
        <span className={theme === 'light' ? 'text-emerald-700 font-mono font-medium' : 'text-emerald-400 font-mono font-medium'}>
          {value}
        </span>
      );
    }
    if (typeof value === 'string') {
      // In the user's screenshot, strings are rendered like "application/pdf" in dark red/burgundy
      return (
        <span className={theme === 'light' ? 'text-rose-700 break-all' : 'text-rose-300 break-all'}>
          &quot;{highlightSearch(value)}&quot;
        </span>
      );
    }
    return null;
  };

  // Type indicators matching screenshot
  const getTypeGlyph = () => {
    if (isObject) {
      return (
        <span
          className={`inline-flex items-center justify-center font-mono font-bold text-[11px] mr-1 ${
            theme === 'light' ? 'text-slate-600' : 'text-slate-300'
          }`}
          title={`Object with ${childEntries.length} properties`}
        >
          &#123;&#125;
        </span>
      );
    }
    if (isArray) {
      return (
        <span
          className={`inline-flex items-center justify-center font-mono font-bold text-[11px] mr-1 ${
            theme === 'light' ? 'text-slate-600' : 'text-slate-300'
          }`}
          title={`Array with ${childEntries.length} items`}
        >
          &#91;&#93;
        </span>
      );
    }

    // Primitive small indicator square
    if (typeof value === 'boolean') {
      return <span className="inline-block w-2 h-2 mr-1.5 rounded-[1px] bg-indigo-500 shrink-0" title="Boolean" />;
    }
    if (typeof value === 'number') {
      return <span className="inline-block w-2 h-2 mr-1.5 rounded-[1px] bg-emerald-500 shrink-0" title="Number" />;
    }
    if (typeof value === 'string') {
      return <span className="inline-block w-2 h-2 mr-1.5 rounded-[1px] bg-rose-600 shrink-0" title="String" />;
    }
    return <span className="inline-block w-2 h-2 mr-1.5 rounded-[1px] bg-slate-500 shrink-0" title="Null" />;
  };

  // Background and selection highlight
  const selectionBgClass = isSelected
    ? theme === 'light'
      ? 'bg-sky-100/90 text-sky-950 border-sky-300 shadow-[inset_2px_0_0_#0284c7]'
      : 'bg-sky-950/70 text-sky-100 border-sky-700 shadow-[inset_2px_0_0_#38bdf8]'
    : theme === 'light'
    ? 'hover:bg-slate-100/80 text-slate-900'
    : 'hover:bg-slate-900/60 text-slate-200';

  return (
    <div className="w-full font-mono select-text group/node relative">
      {/* Node row */}
      <div
        onClick={handleRowClick}
        className={`flex items-center w-full px-2 cursor-pointer transition-colors duration-75 border-y border-transparent ${rowHeightClass} ${selectionBgClass}`}
      >
        {/* Indent guides */}
        <div
          className="flex shrink-0 items-center h-full"
          style={{ width: `${depth * (density === 'ultra' ? 14 : 18)}px` }}
        >
          {Array.from({ length: depth }).map((_, i) => (
            <div
              key={i}
              className={`h-full w-[18px] shrink-0 border-r ${
                theme === 'light' ? 'border-slate-200' : 'border-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Expand / Collapse Button matching screenshot: small square box with +/- */}
        <div className="w-4 h-4 flex items-center justify-center mr-1 shrink-0">
          {isExpandable ? (
            <button
              type="button"
              onClick={handleToggleClick}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              className={`w-3.5 h-3.5 flex items-center justify-center rounded-[2px] border text-[9px] font-bold transition-transform ${
                theme === 'light'
                  ? 'border-slate-400 bg-white text-slate-700 hover:border-slate-600 hover:bg-slate-50'
                  : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-400 hover:bg-slate-700'
              }`}
            >
              {isExpanded ? '−' : '+'}
            </button>
          ) : (
            <div className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Type Icon */}
        <div className="shrink-0 flex items-center">{getTypeGlyph()}</div>

        {/* Key Label */}
        {keyName !== undefined && (
          <span className={`shrink-0 mr-1.5 ${getKeyColor()}`}>
            {highlightSearch(keyName)}
            <span className={theme === 'light' ? 'text-slate-400 ml-0.5' : 'text-slate-600 ml-0.5'}>:</span>
          </span>
        )}

        {/* Value or Bracket summary */}
        {isExpandable ? (
          <span
            className={`text-xs select-none ${
              theme === 'light' ? 'text-slate-400 font-sans' : 'text-slate-500 font-sans'
            }`}
          >
            {!isExpanded && (
              <span className="font-mono text-[11px] opacity-75">
                {isArray ? `Array(${childEntries.length})` : `Object(${childEntries.length})`}
              </span>
            )}
          </span>
        ) : (
          <div className="truncate flex-1">{getValueRender()}</div>
        )}

        {/* Quick action buttons on hover / selected */}
        <div className="ml-auto hidden group-hover/node:flex items-center gap-1 shrink-0 pl-2">
          {keyName && (
            <button
              type="button"
              title="Copy Key"
              onClick={(e) => copyToClipboard(keyName, 'key', e)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-medium transition-colors ${
                copiedType === 'key'
                  ? 'bg-emerald-600 text-white'
                  : theme === 'light'
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {copiedType === 'key' ? 'Copied' : 'Key'}
            </button>
          )}

          {!isExpandable && (
            <button
              type="button"
              title="Copy Value"
              onClick={(e) => copyToClipboard(String(value), 'val', e)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-medium transition-colors ${
                copiedType === 'val'
                  ? 'bg-emerald-600 text-white'
                  : theme === 'light'
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {copiedType === 'val' ? 'Copied' : 'Val'}
            </button>
          )}

          <button
            type="button"
            title="Copy Path"
            onClick={(e) => copyToClipboard(path, 'path', e)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-medium transition-colors ${
              copiedType === 'path'
                ? 'bg-emerald-600 text-white'
                : theme === 'light'
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {copiedType === 'path' ? 'Copied' : 'Path'}
          </button>
        </div>
      </div>

      {/* Children rendering */}
      {isExpandable && isExpanded && (
        <div className="w-full">
          {childEntries.map(([childKey, childVal], index) => {
            const childPath = isArray ? `${path}[${childKey}]` : path ? `${path}.${childKey}` : childKey;

            return (
              <TreeNode
                key={childPath}
                keyName={childKey}
                value={childVal}
                path={childPath}
                depth={depth + 1}
                isLast={index === childEntries.length - 1}
                selectedPath={selectedPath}
                onSelectNode={onSelectNode}
                expandedPaths={expandedPaths}
                onToggleExpand={onToggleExpand}
                searchQuery={searchQuery}
                density={density}
                theme={theme}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
