import React from 'react';
import { JSONValue, JSONParseError, SelectedNodeInfo, DensityMode, ThemeMode } from '../types/json';
import { TextView } from './TextView';
import { TreeView } from './TreeView';

interface SplitViewProps {
  rawText: string;
  onRawTextChange: (newText: string) => void;
  parseError: JSONParseError | null;
  data: JSONValue;
  selectedNode: SelectedNodeInfo | null;
  onSelectNode: (info: SelectedNodeInfo) => void;
  density: DensityMode;
  theme: ThemeMode;
  expandedPaths: Set<string>;
  setExpandedPaths: React.Dispatch<React.SetStateAction<Set<string>>>;
  onFormat: (indent: number | 'tab') => void;
  onMinify: () => void;
  onSortKeys: () => void;
}

export const SplitView: React.FC<SplitViewProps> = ({
  rawText,
  onRawTextChange,
  parseError,
  data,
  selectedNode,
  onSelectNode,
  density,
  theme,
  expandedPaths,
  setExpandedPaths,
  onFormat,
  onMinify,
  onSortKeys,
}) => {
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 h-full overflow-hidden">
      {/* Left side: Raw Text / Code Editor */}
      <div className="flex flex-col h-full overflow-hidden">
        <TextView
          rawText={rawText}
          onRawTextChange={onRawTextChange}
          parseError={parseError}
          onFormat={onFormat}
          onMinify={onMinify}
          onSortKeys={onSortKeys}
          theme={theme}
        />
      </div>

      {/* Right side: Interactive Tree View */}
      <div className="flex flex-col h-full overflow-hidden">
        <TreeView
          data={data}
          selectedNode={selectedNode}
          onSelectNode={onSelectNode}
          density={density}
          theme={theme}
          expandedPaths={expandedPaths}
          setExpandedPaths={setExpandedPaths}
        />
      </div>
    </div>
  );
};
