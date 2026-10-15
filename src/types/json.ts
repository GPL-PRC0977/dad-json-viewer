export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export type ViewMode = 'tree' | 'text' | 'split' | 'table' | 'diff';
export type DensityMode = 'ultra' | 'compact' | 'standard';
export type ThemeMode = 'dark' | 'light' | 'contrast';

export interface SelectedNodeInfo {
  path: string; // e.g., "fiscal_years[0].allocations[0].requested_vat_ex"
  jsonPointer: string; // e.g., "/fiscal_years/0/allocations/0/requested_vat_ex"
  key: string;
  value: JSONValue;
  type: 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object';
  parentPath?: string;
  depth: number;
}

export interface SearchMatch {
  path: string;
  key: string;
  valueString: string;
  matchType: 'key' | 'value' | 'both';
}

export interface JSONParseError {
  message: string;
  line?: number;
  column?: number;
  snippet?: string;
}

export interface JSONStats {
  sizeBytes: number;
  totalKeys: number;
  maxDepth: number;
  stringsCount: number;
  numbersCount: number;
  booleansCount: number;
  nullsCount: number;
  arraysCount: number;
  objectsCount: number;
}

export interface DiffItem {
  path: string;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldValue?: JSONValue;
  newValue?: JSONValue;
}
