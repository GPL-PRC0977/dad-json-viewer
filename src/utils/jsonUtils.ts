import { JSONValue, JSONParseError, JSONStats, DiffItem } from '../types/json';

/**
 * Parses JSON safely and calculates line/col position if an error occurs.
 */
export function parseJSONSafe(raw: string): { data: JSONValue | null; error: JSONParseError | null } {
  if (!raw.trim()) {
    return { data: null, error: null };
  }
  try {
    const data = JSON.parse(raw);
    return { data, error: null };
  } catch (err: any) {
    const message = err.message || 'Invalid JSON syntax';
    let line: number | undefined;
    let column: number | undefined;
    let snippet: string | undefined;

    // Extract position from message like "at position 142" or "line 4 column 12"
    const posMatch = message.match(/at position (\d+)/i);
    const lineColMatch = message.match(/line (\d+) column (\d+)/i);

    if (lineColMatch) {
      line = parseInt(lineColMatch[1], 10);
      column = parseInt(lineColMatch[2], 10);
    } else if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const lines = raw.slice(0, pos).split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }

    if (line !== undefined) {
      const lines = raw.split('\n');
      const errorLine = lines[line - 1] || '';
      snippet = errorLine.trim().slice(0, 80);
    }

    return {
      data: null,
      error: { message, line, column, snippet },
    };
  }
}

/**
 * Attempts to repair common JSON defects:
 * - Single quotes instead of double quotes
 * - Trailing commas before } or ]
 * - Unquoted object keys (e.g., { name: "test" } -> { "name": "test" })
 * - Python-style booleans (True, False, None)
 * - Trailing comments (// or /* ... *\/)
 */
export function repairJSON(raw: string): { repaired: string; changed: boolean } {
  let text = raw;

  // 1. Remove single-line comments // ...
  text = text.replace(/(^|[^:\\])\/\/.*$/gm, '$1');

  // 2. Remove multi-line comments /* ... */
  text = text.replace(/\/\*[\s\S]*?\*\//g, '');

  // 3. Replace Python constants
  text = text.replace(/\bTrue\b/g, 'true');
  text = text.replace(/\bFalse\b/g, 'false');
  text = text.replace(/\bNone\b/g, 'null');

  // 4. Remove trailing commas before closing braces/brackets
  text = text.replace(/,(\s*[}\]])/g, '$1');

  // 5. Quote unquoted keys: e.g. { foo: "bar" } or , foo: 123
  text = text.replace(/([{,]\s*)([a-zA-Z0-9_$-]+)\s*:/g, '$1"$2":');

  // 6. Replace single quotes around strings: 'value' -> "value"
  text = text.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');

  const changed = text !== raw;
  return { repaired: text, changed };
}

/**
 * Formats JSON string with chosen indentation.
 */
export function formatJSON(data: JSONValue, indent: number | 'tab' = 2): string {
  const space = indent === 'tab' ? '\t' : indent;
  return JSON.stringify(data, null, space);
}

/**
 * Minifies JSON string to a single line.
 */
export function minifyJSON(data: JSONValue): string {
  return JSON.stringify(data);
}

/**
 * Recursively sorts object keys alphabetically.
 */
export function sortJSONKeys(val: JSONValue, recursive: boolean = true): JSONValue {
  if (Array.isArray(val)) {
    return recursive ? val.map((item) => sortJSONKeys(item, true)) : val;
  }
  if (val !== null && typeof val === 'object') {
    const sorted: { [key: string]: JSONValue } = {};
    const keys = Object.keys(val).sort((a, b) => a.localeCompare(b));
    for (const k of keys) {
      sorted[k] = recursive ? sortJSONKeys(val[k], true) : val[k];
    }
    return sorted;
  }
  return val;
}

/**
 * Generates TypeScript interface from a JSON object.
 */
export function generateTypeScriptInterface(obj: JSONValue, rootName: string = 'RootObject'): string {
  const interfaces: Map<string, string> = new Map();

  function inferType(val: JSONValue, nameHint: string): string {
    if (val === null) return 'null';
    if (typeof val === 'string') return 'string';
    if (typeof val === 'number') return 'number';
    if (typeof val === 'boolean') return 'boolean';

    if (Array.isArray(val)) {
      if (val.length === 0) return 'any[]';
      const itemTypes = Array.from(new Set(val.map((item, i) => inferType(item, `${nameHint}Item`))));
      if (itemTypes.length === 1) {
        return `${itemTypes[0]}[]`;
      }
      return `(${itemTypes.join(' | ')})[]`;
    }

    if (typeof val === 'object') {
      const typeName = nameHint.charAt(0).toUpperCase() + nameHint.slice(1);
      const lines: string[] = [];
      lines.push(`export interface ${typeName} {`);

      for (const [key, propVal] of Object.entries(val)) {
        const cleanKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
        const childType = inferType(propVal, `${typeName}_${key}`);
        lines.push(`  ${cleanKey}: ${childType};`);
      }

      lines.push('}');
      interfaces.set(typeName, lines.join('\n'));
      return typeName;
    }

    return 'any';
  }

  inferType(obj, rootName);

  return Array.from(interfaces.values()).reverse().join('\n\n');
}

/**
 * Computes payload metadata and statistics.
 */
export function computeJSONStats(val: JSONValue, rawString?: string): JSONStats {
  const stats: JSONStats = {
    sizeBytes: rawString ? new TextEncoder().encode(rawString).length : new TextEncoder().encode(JSON.stringify(val)).length,
    totalKeys: 0,
    maxDepth: 0,
    stringsCount: 0,
    numbersCount: 0,
    booleansCount: 0,
    nullsCount: 0,
    arraysCount: 0,
    objectsCount: 0,
  };

  function traverse(node: JSONValue, currentDepth: number) {
    if (currentDepth > stats.maxDepth) {
      stats.maxDepth = currentDepth;
    }

    if (node === null) {
      stats.nullsCount++;
    } else if (typeof node === 'string') {
      stats.stringsCount++;
    } else if (typeof node === 'number') {
      stats.numbersCount++;
    } else if (typeof node === 'boolean') {
      stats.booleansCount++;
    } else if (Array.isArray(node)) {
      stats.arraysCount++;
      for (let i = 0; i < node.length; i++) {
        traverse(node[i], currentDepth + 1);
      }
    } else if (typeof node === 'object') {
      stats.objectsCount++;
      const keys = Object.keys(node);
      stats.totalKeys += keys.length;
      for (const k of keys) {
        traverse(node[k], currentDepth + 1);
      }
    }
  }

  traverse(val, 0);
  return stats;
}

/**
 * Converts a dot/bracket path to JSONPointer (RFC 6901).
 * e.g., "fiscal_years[0].allocations[1].activity_code" -> "/fiscal_years/0/allocations/1/activity_code"
 */
export function toJSONPointer(path: string): string {
  if (!path || path === '$') return '/';
  const clean = path
    .replace(/^\$\.?/, '')
    .replace(/\[(\d+)\]/g, '/$1')
    .replace(/\./g, '/');
  return clean.startsWith('/') ? clean : `/${clean}`;
}

/**
 * Converts array of uniform objects to CSV.
 */
export function jsonToCSV(items: any[]): string {
  if (!Array.isArray(items) || items.length === 0) return '';

  const headers = Array.from(
    new Set(
      items.flatMap((item) => (item && typeof item === 'object' && !Array.isArray(item) ? Object.keys(item) : []))
    )
  );

  if (headers.length === 0) return '';

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [
    headers.join(','),
    ...items.map((item) => {
      if (!item || typeof item !== 'object') return escapeCSV(item);
      return headers.map((h) => escapeCSV(item[h])).join(',');
    }),
  ];

  return rows.join('\n');
}

/**
 * Computes deep differences between two JSON structures.
 */
export function diffJSON(obj1: JSONValue, obj2: JSONValue): DiffItem[] {
  const diffs: DiffItem[] = [];

  function compare(a: any, b: any, path: string) {
    if (a === b) {
      diffs.push({ path: path || '$', type: 'unchanged', oldValue: a, newValue: b });
      return;
    }

    if (a === undefined && b !== undefined) {
      diffs.push({ path: path || '$', type: 'added', newValue: b });
      return;
    }

    if (a !== undefined && b === undefined) {
      diffs.push({ path: path || '$', type: 'removed', oldValue: a });
      return;
    }

    const typeA = Array.isArray(a) ? 'array' : typeof a;
    const typeB = Array.isArray(b) ? 'array' : typeof b;

    if (typeA !== typeB || a === null || b === null || typeA !== 'object') {
      diffs.push({ path: path || '$', type: 'modified', oldValue: a, newValue: b });
      return;
    }

    // Both are arrays or both are objects
    if (Array.isArray(a) && Array.isArray(b)) {
      const maxLen = Math.max(a.length, b.length);
      for (let i = 0; i < maxLen; i++) {
        compare(a[i], b[i], `${path}[${i}]`);
      }
    } else {
      const allKeys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort();
      for (const key of allKeys) {
        const nextPath = path ? `${path}.${key}` : key;
        compare(a[key], b[key], nextPath);
      }
    }
  }

  compare(obj1, obj2, '');
  return diffs;
}
