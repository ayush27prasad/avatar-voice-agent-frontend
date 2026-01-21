 'use client';
 
 import { useEffect, useState } from 'react';
 import Link from 'next/link';
 import { createClient } from '@supabase/supabase-js';
 import { Button } from '@/components/ui/button';
 
type TableData = {
  name: string;
  rows: Record<string, unknown>[];
  columns: readonly string[];
  label: string;
};

const TABLE_CONFIG = [
  {
    name: 'users',
    label: 'Users',
    columns: ['contact_number', 'name', 'created_at', 'updated_at'],
  },
  {
    name: 'appointments',
    label: 'Appointments',
    columns: ['contact_number', 'name', 'slot_date', 'slot_time', 'status', 'notes', 'created_at'],
  },
  {
    name: 'available_slots',
    label: 'Available Slots',
    columns: ['slot_date', 'slot_time', 'status', 'created_at'],
  },
  {
    name: 'conversation_summaries',
    label: 'Conversation Summaries',
    columns: ['contact_number', 'summary', 'preferences', 'booked_slots', 'created_at'],
  },
] as const;
 
 export default function AdminPage() {
   const [tables, setTables] = useState<TableData[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 
    const clientKey = publishableKey || anonKey;
    if (!url || !clientKey) {
      setError('Missing NEXT_PUBLIC_SUPABASE_URL and a publishable/anon key.');
       setLoading(false);
       return;
     }
 
    const supabase = createClient(url, clientKey);
 
     async function loadTables() {
       try {
         setLoading(true);
        const results = await Promise.all(
          TABLE_CONFIG.map(async (table) => {
            const { data, error: tableError } = await supabase
              .from(table.name)
              .select(table.columns.join(','))
              .order('created_at', { ascending: false });
 
             if (tableError) {
              throw new Error(`${table.name}: ${tableError.message}`);
             }
 
             return {
              name: table.name,
              label: table.label,
              columns: table.columns,
              rows: (data ?? []) as unknown as Record<string, unknown>[],
             };
           })
         );
 
         setTables(results);
         setError(null);
       } catch (err) {
         setError(err instanceof Error ? err.message : String(err));
       } finally {
         setLoading(false);
       }
     }
 
     loadTables();
   }, []);
 
  return (
    <>
      <main className="min-h-svh bg-background px-6 py-10">
        <button
          type="button"
          aria-label="Back to home"
          onClick={() => {
            window.location.href = '/';
          }}
          className="fixed left-6 top-6 z-[9999] inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-lg font-bold text-secondary-foreground shadow-lg transition hover:bg-secondary/80"
        >
          ←
        </button>
        <div className="mx-auto flex w-full max-w-6xl items-center justify-center">
          <h1 className="text-2xl font-semibold">Admin Data (Read Only)</h1>
        </div>

        <div className="mx-auto mt-8 w-full max-w-6xl space-y-10">
          {loading && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
              <span>Loading data…</span>
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            tables.map((table) => {
              const fallback = TABLE_CONFIG.find((entry) => entry.name === table.name);
              const columns = table.columns?.length ? table.columns : fallback?.columns ?? [];
              return (
                <section key={table.name} className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{table.label}</h2>
                    <span className="text-xs text-muted-foreground">
                      {table.rows.length} rows
                    </span>
                  </div>

                  {table.rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No rows found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            {columns.map((key) => (
                              <th key={key} className="py-2 pr-4 font-medium text-muted-foreground">
                                {formatHeader(key)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.map((row, index) => (
                            <tr
                              key={`${table.name}-${index}`}
                              className="border-b border-border/40 last:border-none even:bg-muted/20"
                            >
                              {columns.map((key) => (
                                <td key={key} className="py-2 pr-4 align-top">
                                  {formatCell(key, row[key])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })}
        </div>
      </main>
    </>
  );
 }
 
function formatHeader(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCell(key: string, value: unknown) {
   if (value === null || value === undefined) return '-';
  if (key === 'created_at' || key === 'updated_at') {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }
  if (key === 'slot_date') {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  }
  if (key === 'slot_time') {
    return String(value);
  }
  if (key === 'summary') {
    const text = String(value);
    return text.length > 140 ? `${text.slice(0, 140)}…` : text;
  }
   if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
   if (typeof value === 'object') return JSON.stringify(value);
   return String(value);
 }
