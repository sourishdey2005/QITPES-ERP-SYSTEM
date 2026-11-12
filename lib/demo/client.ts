// Demo-mode query engine.
//
// Wraps the Supabase client so that SELECTs transparently fall back to the
// generated dataset when the database is unreachable or a table is still empty.
// Writes are attempted for real first; if Supabase rejects them (RLS, offline),
// they are applied to a small localStorage overlay so CRUD still feels live.
//
// Set VITE_DEMO_DATA=false to disable this layer entirely.

import { DemoRow, demoId, getDemoRows, hasDemoData } from './dataset';

const OVERLAY_KEY = 'qitpes_demo_overlay_v1';
const DEMO_ENABLED = (import.meta as any).env?.VITE_DEMO_DATA !== 'false';

interface UpsertBucket {
  key: string[];
  rows: DemoRow[];
}

interface Overlay {
  inserts: Record<string, DemoRow[]>;
  updates: Record<string, Record<string, DemoRow>>;
  deletes: Record<string, string[]>;
  upserts: Record<string, UpsertBucket>;
}

const emptyOverlay = (): Overlay => ({ inserts: {}, updates: {}, deletes: {}, upserts: {} });

let overlayCache: Overlay | null = null;

const readOverlay = (): Overlay => {
  if (overlayCache) return overlayCache;
  try {
    const raw = localStorage.getItem(OVERLAY_KEY);
    overlayCache = raw ? { ...emptyOverlay(), ...JSON.parse(raw) } : emptyOverlay();
  } catch {
    overlayCache = emptyOverlay();
  }
  return overlayCache!;
};

const persistOverlay = () => {
  try {
    localStorage.setItem(OVERLAY_KEY, JSON.stringify(readOverlay()));
  } catch {
    // Storage full or unavailable; in-memory overlay still works this session.
  }
};

export const clearDemoOverlay = () => {
  overlayCache = emptyOverlay();
  try {
    localStorage.removeItem(OVERLAY_KEY);
  } catch {
    // ignore
  }
};

export const isDemoModeEnabled = () => DEMO_ENABLED;

// Tables whose reads already fell back to demo rows (so writes stay local too).
const demoActiveTables = new Set<string>();

const matches = (row: DemoRow, field: string, value: any): boolean => {
  const actual = row[field];
  if (value === null) return actual === null || actual === undefined;
  if (actual === null || actual === undefined) return false;
  if (typeof actual === 'number' && typeof value === 'string' && value !== '' && !Number.isNaN(Number(value))) {
    return actual === Number(value);
  }
  return String(actual) === String(value);
};

const applyFilters = (rows: DemoRow[], ops: QueryOp[]): DemoRow[] => {
  let out = rows;
  for (const op of ops) {
    const [field, value] = op.args;
    switch (op.method) {
      case 'eq':
        out = out.filter((r) => matches(r, field, value));
        break;
      case 'neq':
        out = out.filter((r) => !matches(r, field, value));
        break;
      case 'gt':
        out = out.filter((r) => r[field] > value);
        break;
      case 'gte':
        out = out.filter((r) => r[field] >= value);
        break;
      case 'lt':
        out = out.filter((r) => r[field] < value);
        break;
      case 'lte':
        out = out.filter((r) => r[field] <= value);
        break;
      case 'like':
      case 'ilike': {
        const pattern = String(value)
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/%/g, '.*')
          .replace(/_/g, '.');
        const re = new RegExp(`^${pattern}$`, op.method === 'ilike' ? 'i' : '');
        out = out.filter((r) => re.test(String(r[field] ?? '')));
        break;
      }
      case 'in':
        out = out.filter((r) => Array.isArray(value) && value.map(String).includes(String(r[field])));
        break;
      case 'is':
        out = out.filter((r) => (value === null ? r[field] == null : r[field] === value));
        break;
      case 'match':
        out = out.filter((r) => Object.entries(value ?? {}).every(([k, v]) => matches(r, k, v)));
        break;
      default:
        break;
    }
  }

  const orderOp = ops.find((o) => o.method === 'order');
  if (orderOp) {
    const [field, options] = orderOp.args;
    const ascending = options?.ascending !== false;
    out = [...out].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av == null && bv == null) return 0;
      if (av == null) return ascending ? 1 : -1;
      if (bv == null) return ascending ? -1 : 1;
      if (typeof av === 'number' && typeof bv === 'number') return ascending ? av - bv : bv - av;
      const at = Date.parse(String(av));
      const bt = Date.parse(String(bv));
      if (!Number.isNaN(at) && !Number.isNaN(bt)) return ascending ? at - bt : bt - at;
      return ascending ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }

  const rangeOp = ops.find((o) => o.method === 'range');
  const limitOp = ops.find((o) => o.method === 'limit');
  if (rangeOp) {
    const [from, to] = rangeOp.args;
    out = out.slice(from, to + 1);
  } else if (limitOp && typeof limitOp.args[0] === 'number') {
    out = out.slice(0, limitOp.args[0]);
  }

  return out;
};

const relationSpecs: Array<{ as: string; table: string; localKey: string }> = [
  { as: 'employees', table: 'employees', localKey: 'employee_id' },
  { as: 'projects', table: 'projects', localKey: 'project_id' },
  { as: 'shifts', table: 'shifts', localKey: 'shift_id' },
  { as: 'contract_workers', table: 'contract_workers', localKey: 'worker_id' },
  { as: 'conference_rooms', table: 'conference_rooms', localKey: 'room_id' },
  { as: 'purchase_orders', table: 'purchase_orders', localKey: 'po_id' },
  { as: 'warehouses', table: 'warehouses', localKey: 'warehouse_id' },
  { as: 'tenders', table: 'tenders', localKey: 'tender_id' },
  { as: 'crm_clients', table: 'crm_clients', localKey: 'client_id' },
  { as: 'crm_leads', table: 'crm_leads', localKey: 'lead_id' },
];

const attachRelations = (table: string, rows: DemoRow[], selectArg: string): DemoRow[] => {
  if (!selectArg) return rows;

  const specs = relationSpecs.filter((spec) => selectArg.includes(`${spec.as}(`));
  const wantsHead = selectArg.includes('head:profiles(') || selectArg.includes('profiles(');

  return rows.map((row) => {
    const next = { ...row };
    for (const spec of specs) {
      const related = getDemoRows(spec.table);
      if (!related) continue;
      next[spec.as] = related.find((r) => String(r.id) === String(row[spec.localKey])) ?? null;
    }

    if (wantsHead) {
      const profiles = getDemoRows('profiles');
      next.head = profiles?.find((p) => String(p.id) === String(row.head_id)) ?? null;
      if (!next.head && row.manager_id) {
        next.head = profiles?.find((p) => String(p.id) === String(row.manager_id)) ?? null;
      }
    }

    if (table === 'journal_entries' && selectArg.includes('journal_lines(')) {
      const lines = getDemoRows('journal_lines') ?? [];
      const accounts = getDemoRows('chart_of_accounts') ?? [];
      next.journal_lines = lines
        .filter((l) => String(l.journal_id) === String(row.id))
        .map((l) => ({
          ...l,
          chart_of_accounts: accounts.find((a) => String(a.id) === String(l.account_id)) ?? null,
        }));
    }

    if (table === 'journal_lines' && selectArg.includes('chart_of_accounts(')) {
      const accounts = getDemoRows('chart_of_accounts') ?? [];
      next.chart_of_accounts = accounts.find((a) => String(a.id) === String(row.account_id)) ?? null;
    }

    return next;
  });
};

const buildDemoRows = (table: string): DemoRow[] => {
  const base = (getDemoRows(table) ?? []).map((r) => ({ ...r }));
  const overlay = readOverlay();

  const upsertBucket = overlay.upserts[table];
  let rows = base;
  if (upsertBucket && upsertBucket.rows.length > 0) {
    rows = rows.filter(
      (row) => !upsertBucket.rows.some((u) => upsertBucket.key.every((k) => String(u[k]) === String(row[k]))),
    );
    rows = [...upsertBucket.rows.map((r) => ({ ...r })), ...rows];
  }

  const inserts = overlay.inserts[table] ?? [];
  if (inserts.length) rows = [...inserts.map((r) => ({ ...r })), ...rows];

  const updates = overlay.updates[table] ?? {};
  if (Object.keys(updates).length) {
    rows = rows.map((row) => (updates[String(row.id)] ? { ...row, ...updates[String(row.id)] } : row));
  }

  const deleted = overlay.deletes[table] ?? [];
  if (deleted.length) rows = rows.filter((row) => !deleted.includes(String(row.id)));

  return rows;
};

const applyMutationOverlay = (table: string, ops: QueryOp[]): any => {
  const overlay = readOverlay();
  const mutation = ops.find((o) => ['insert', 'update', 'upsert', 'delete'].includes(o.method));
  if (!mutation) return { data: null, error: null };

  const nowIso = new Date().toISOString();
  const idOf = (row: DemoRow, index: number) => row.id ?? demoId(`local-${table}`, Date.now() % 100000 + index);

  if (mutation.method === 'insert' || mutation.method === 'upsert') {
    const input = mutation.args[0];
    const payload: DemoRow[] = (Array.isArray(input) ? input : [input]).filter(Boolean) as DemoRow[];
    const rows = payload.map((row, i) => ({
      id: idOf(row, i),
      created_at: row.created_at ?? nowIso,
      ...row,
    }));

    if (mutation.method === 'upsert') {
      const onConflict: string = mutation.args[1]?.onConflict ?? '';
      const key = onConflict ? onConflict.split(',').map((k: string) => k.trim()).filter(Boolean) : ['id'];
      overlay.upserts[table] = { key, rows };
    } else {
      overlay.inserts[table] = [...rows, ...(overlay.inserts[table] ?? [])];
    }

    persistOverlay();
    demoActiveTables.add(table);
    return { data: rows, error: null, count: rows.length, status: 201, statusText: 'Created' };
  }

  const filters = ops.filter((o) => ['eq', 'in', 'is'].includes(o.method));
  const matchesRow = (row: DemoRow) =>
    filters.length === 0
      ? true
      : filters.every((f) => {
          const [field, value] = f.args;
          if (f.method === 'in') return Array.isArray(value) && value.map(String).includes(String(row[field]));
          return matches(row, field, value);
        });

  if (mutation.method === 'update') {
    const patch = mutation.args[0] ?? {};
    const all = buildDemoRows(table);
    const targets = all.filter(matchesRow);
    overlay.updates[table] = { ...(overlay.updates[table] ?? {}) };
    for (const row of targets) {
      if (row.id) overlay.updates[table][String(row.id)] = { ...(overlay.updates[table][String(row.id)] ?? {}), ...patch };
    }
    // Also patch pending inserts in place so a freshly added row reflects edits.
    overlay.inserts[table] = (overlay.inserts[table] ?? []).map((row) => (matchesRow(row) ? { ...row, ...patch } : row));
    persistOverlay();
    demoActiveTables.add(table);
    return { data: targets.map((row) => ({ ...row, ...patch })), error: null, status: 200, statusText: 'OK' };
  }

  // delete
  const all = buildDemoRows(table);
  const targets = all.filter(matchesRow);
  overlay.deletes[table] = Array.from(new Set([...(overlay.deletes[table] ?? []), ...targets.map((r) => String(r.id))]));
  overlay.inserts[table] = (overlay.inserts[table] ?? []).filter((row) => !matchesRow(row));
  persistOverlay();
  demoActiveTables.add(table);
  return { data: targets, error: null, status: 204, statusText: 'No Content' };
};

export interface QueryOp {
  method: string;
  args: any[];
}

const isReadOps = (ops: QueryOp[]) =>
  !ops.some((o) => ['insert', 'update', 'upsert', 'delete'].includes(o.method));

// The database may be unreachable (offline, bad DNS, paused project). Waiting for
// the browser's network timeout makes every page look empty for 10-30 seconds, so
// real requests get a short budget before the local dataset takes over.
const REAL_TIMEOUT_MS = 2500;
const NETWORK_RETRY_MS = 60_000;

let networkDownUntil = 0;

const isNetworkFailure = (message: string) =>
  /failed to fetch|networkerror|network error|load failed|err_name_not_resolved|timeout/i.test(message);

const withTimeout = <T,>(promise: PromiseLike<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('DEMO_TIMEOUT')), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

export async function runDemoQuery(real: any, table: string, ops: QueryOp[]): Promise<any> {
  if (isReadOps(ops)) {
    const demoAvailable = DEMO_ENABLED && hasDemoData(table);
    // Recently confirmed unreachable: serve the local dataset immediately.
    const skipReal = demoAvailable && Date.now() < networkDownUntil;

    let realResponse: any = null;
    if (!skipReal) {
      try {
        realResponse = await withTimeout(real, REAL_TIMEOUT_MS);
      } catch (error: any) {
        realResponse = { data: null, error: { message: error?.message ?? 'Demo fallback' } };
      }
      if (realResponse?.error && isNetworkFailure(String(realResponse.error?.message ?? ''))) {
        networkDownUntil = Date.now() + NETWORK_RETRY_MS;
      }
    }

    const realData = realResponse?.data;
    const hasRealData = Array.isArray(realData) ? realData.length > 0 : realData != null;

    if (!skipReal && !realResponse?.error && hasRealData) {
      demoActiveTables.delete(table);
      networkDownUntil = 0;
      return realResponse;
    }

    if (!demoAvailable) {
      return realResponse ?? { data: [], error: null };
    }

    demoActiveTables.add(table);

    const selectOp = ops.find((o) => o.method === 'select');
    const selectArg: string = typeof selectOp?.args?.[0] === 'string' ? selectOp.args[0] : '*';
    const countRequested = selectOp?.args?.[1]?.count != null;

    let rows = buildDemoRows(table);
    rows = applyFilters(rows, ops);
    rows = attachRelations(table, rows, selectArg);

    const single = ops.some((o) => o.method === 'single');
    const maybeSingle = ops.some((o) => o.method === 'maybeSingle');

    if (single || maybeSingle) {
      const row = rows[0] ?? null;
      return {
        data: row,
        error: row || maybeSingle ? null : { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
        count: rows.length,
        status: 200,
        statusText: 'OK',
      };
    }

    return {
      data: rows,
      error: null,
      count: countRequested ? rows.length : null,
      status: 200,
      statusText: 'OK',
    };
  }

  // Writes: use the local overlay when this table is already served by demo data.
  if (!DEMO_ENABLED || !hasDemoData(table)) {
    try {
      return await real;
    } catch (error: any) {
      return { data: null, error: { message: error?.message ?? 'Request failed' } };
    }
  }

  if (demoActiveTables.has(table) || Date.now() < networkDownUntil) {
    return applyMutationOverlay(table, ops);
  }

  try {
    const response = await withTimeout(real, REAL_TIMEOUT_MS);
    if (!response?.error) return response;
    return applyMutationOverlay(table, ops);
  } catch {
    return applyMutationOverlay(table, ops);
  }
}

/** Wrap a PostgREST query builder so it can fall back to demo rows. */
export function wrapQueryBuilder(real: any, table: string): any {
  const ops: QueryOp[] = [];

  const proxy: any = new Proxy(real, {
    get(target, prop, receiver) {
      if (prop === 'then') {
        return (onFulfilled?: any, onRejected?: any) =>
          runDemoQuery(target, table, ops).then(onFulfilled, onRejected);
      }

      const value = Reflect.get(target, prop, target);
      if (typeof value === 'function') {
        return (...args: any[]) => {
          ops.push({ method: String(prop), args });
          const result = value.apply(target, args);
          if (result === target) return proxy;
          if (result && typeof result.then === 'function') return wrapQueryBuilder(result, table);
          return result;
        };
      }
      return value;
    },
  });

  return proxy;
}

/** Wrap a Supabase client so `.from(table)` queries get demo fallbacks. */
export function withDemoData<T extends object>(client: T): T {
  if (!DEMO_ENABLED) return client;
  return new Proxy(client as any, {
    get(target, prop) {
      if (prop === 'from') {
        return (table: string) => wrapQueryBuilder((target as any).from(table), table);
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  }) as T;
}
