import React, { useState, useMemo } from 'react';
import { JSONValue, DensityMode, ThemeMode } from '../types/json';
import { Table, Download, Search, ArrowUpDown, ChevronDown, Check, FileSpreadsheet } from 'lucide-react';
import { jsonToCSV } from '../utils/jsonUtils';

interface TableViewProps {
  data: JSONValue;
  density: DensityMode;
  theme: ThemeMode;
}

export const TableView: React.FC<TableViewProps> = ({ data, density, theme }) => {
  const [copiedCSV, setCopiedCSV] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Find all arrays in the data structure
  const detectedArrays = useMemo(() => {
    const list: { path: string; label: string; items: any[] }[] = [];

    function findArrays(node: any, path: string) {
      if (Array.isArray(node) && node.length > 0) {
        list.push({
          path: path || 'root',
          label: `${path || 'root'} (${node.length} rows)`,
          items: node,
        });
      }
      if (node && typeof node === 'object' && !Array.isArray(node)) {
        Object.entries(node).forEach(([k, v]) => {
          const next = path ? `${path}.${k}` : k;
          findArrays(v, next);
        });
      }
    }

    findArrays(data, '');
    return list;
  }, [data]);

  const [selectedArrayPath, setSelectedArrayPath] = useState<string>(
    detectedArrays[0]?.path || ''
  );

  const activeArray = useMemo(() => {
    if (detectedArrays.length === 0) return [];
    const found = detectedArrays.find((a) => a.path === selectedArrayPath);
    return found ? found.items : detectedArrays[0].items;
  }, [detectedArrays, selectedArrayPath]);

  // Extract columns
  const columns = useMemo(() => {
    if (!activeArray || activeArray.length === 0) return [];
    const colSet = new Set<string>();
    activeArray.forEach((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        Object.keys(item).forEach((k) => colSet.add(k));
      }
    });
    return Array.from(colSet);
  }, [activeArray]);

  // Filter & sort rows
  const filteredRows = useMemo(() => {
    let result = [...activeArray];

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      result = result.filter((row) => {
        if (!row || typeof row !== 'object') {
          return String(row).toLowerCase().includes(q);
        }
        return Object.values(row).some((val) =>
          String(val ?? '').toLowerCase().includes(q)
        );
      });
    }

    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a?.[sortColumn];
        const valB = b?.[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }

        const cmp = String(valA).localeCompare(String(valB));
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [activeArray, tableSearch, sortColumn, sortDirection]);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
      }
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    const csv = jsonToCSV(activeArray);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedArrayPath || 'data'}_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCSV = () => {
    const csv = jsonToCSV(activeArray);
    navigator.clipboard.writeText(csv);
    setCopiedCSV(true);
    setTimeout(() => setCopiedCSV(false), 1500);
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

  const rowPaddingClass =
    density === 'ultra' ? 'py-1 px-2 text-[11px]' : density === 'standard' ? 'py-2.5 px-3 text-[13px]' : 'py-1.5 px-2.5 text-[12px]';

  if (detectedArrays.length === 0) {
    return (
      <div className={`h-full w-full flex flex-col items-center justify-center p-8 text-center ${containerBg}`}>
        <Table className="w-12 h-12 text-slate-500 mb-3" />
        <h3 className="text-base font-semibold mb-1">No Tabular Arrays Detected</h3>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          Table view works best with JSON that contains arrays of objects (like allocations, orders, or logs).
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden ${containerBg}`}>
      {/* Table Toolbar */}
      <div className={`px-3 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 ${toolbarBg}`}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Array selector dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 font-sans">Array:</span>
            <select
              value={selectedArrayPath}
              onChange={(e) => setSelectedArrayPath(e.target.value)}
              className={`text-xs px-2.5 py-1 rounded border outline-none font-mono ${
                theme === 'light'
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-950 border-slate-700 text-slate-200'
              }`}
            >
              {detectedArrays.map((arr) => (
                <option key={arr.path} value={arr.path}>
                  {arr.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search table */}
          <div
            className={`flex items-center px-2 py-1 rounded border text-xs w-48 ${
              theme === 'light'
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-slate-950 border-slate-700 text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
            <input
              type="text"
              placeholder="Search table rows..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full bg-transparent outline-none text-xs"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyCSV}
            className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1 transition-colors ${
              copiedCSV
                ? 'bg-emerald-600 text-white'
                : theme === 'light'
                ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {copiedCSV ? <Check className="w-3.5 h-3.5" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            {copiedCSV ? 'Copied CSV' : 'Copy CSV'}
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1 transition-colors ${
              theme === 'light'
                ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Export .CSV
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse font-mono text-left">
          <thead
            className={`sticky top-0 z-10 border-b select-none ${
              theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <tr>
              <th className="py-1.5 px-2 text-[11px] font-sans font-semibold text-slate-500 w-12 text-center border-r border-slate-700/20">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="py-1.5 px-3 text-[11px] font-semibold tracking-wider font-mono cursor-pointer hover:bg-slate-800/20 border-r border-slate-700/20"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>{col}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {filteredRows.map((row, idx) => (
              <tr
                key={idx}
                className={`transition-colors ${
                  theme === 'light' ? 'hover:bg-slate-100/70' : 'hover:bg-slate-900/60'
                }`}
              >
                <td className="py-1 px-2 text-[11px] font-mono text-slate-500 text-center border-r border-slate-800/20 select-none">
                  {idx}
                </td>
                {columns.map((col) => {
                  const val = row?.[col];
                  const isBool = typeof val === 'boolean';
                  const isNum = typeof val === 'number';
                  const isObj = val !== null && typeof val === 'object';

                  return (
                    <td
                      key={col}
                      className={`${rowPaddingClass} border-r border-slate-800/10 truncate max-w-xs`}
                      title={isObj ? JSON.stringify(val) : String(val ?? '')}
                    >
                      {val === null || val === undefined ? (
                        <span className="text-slate-500 italic">null</span>
                      ) : isBool ? (
                        <span className={val ? 'text-indigo-400 font-semibold' : 'text-slate-400 font-semibold'}>
                          {val ? 'true' : 'false'}
                        </span>
                      ) : isNum ? (
                        <span className="text-emerald-400 tabular-nums">{val}</span>
                      ) : isObj ? (
                        <span className="text-slate-400 text-[11px]">{JSON.stringify(val)}</span>
                      ) : (
                        <span className="text-slate-200">{String(val)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div
        className={`px-3 py-1.5 border-t flex items-center justify-between text-[11px] font-mono shrink-0 ${
          theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}
      >
        <span>
          Showing {filteredRows.length} of {activeArray.length} items
        </span>
        <span>{columns.length} columns</span>
      </div>
    </div>
  );
};
