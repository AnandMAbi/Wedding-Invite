import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, RefreshCw, Search, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type RsvpRow = {
  id: string;
  guest_name: string;
  guest_count: number;
  tribe: string | null;
  tribe_other: string | null;
  fusion_party: string | null;
  sangeet: string | null;
  wedding: string | null;
  staying_over: string | null;
  accommodation_11th: string | null;
  accommodation_12th: string | null;
  accommodation_13th: string | null;
  created_at: string;
};

type ConnStatus = 'connecting' | 'live' | 'error' | 'closed';

const POLL_FALLBACK_MS = 15000;

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function toCsv(rows: RsvpRow[], slNoById: Map<string, number>) {
  const headers = [
    'sl_no', 'id', 'guest_name', 'guest_count', 'tribe', 'tribe_other',
    'fusion_party', 'sangeet', 'wedding', 'staying_over',
    'accommodation_11th', 'accommodation_12th', 'accommodation_13th', 'created_at',
  ];
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => (h === 'sl_no' ? esc(slNoById.get(r.id) ?? '') : esc((r as Record<string, unknown>)[h]))).join(','))].join('\n');
}

export default function ResponsesDashboard() {
  const [rows, setRows] = useState<RsvpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<ConnStatus>('connecting');
  const [lastEvent, setLastEvent] = useState<{ type: string; at: string } | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tribeFilter, setTribeFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [stayFilter, setStayFilter] = useState('all');

  const fetchRows = async () => {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await supabase
      .from('wedding_rsvp_responses')
      .select('*')
      .order('created_at', { ascending: true });
    if (fetchError) {
      setError(fetchError.message);
      setStatus('error');
    } else {
      setRows((data ?? []) as RsvpRow[]);
      if (status !== 'live') setStatus((s) => (s === 'error' && !data ? s : s));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();

    const channel = supabase
      .channel('wedding_rsvp_responses-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wedding_rsvp_responses' },
        (payload) => {
          const at = new Date().toLocaleTimeString();
          if (payload.eventType === 'INSERT') {
            const row = payload.new as RsvpRow;
            setRows((prev) => (prev.some((r) => r.id === row.id) ? prev : [...prev, row]));
            setFlashId(row.id);
            setLastEvent({ type: 'INSERT', at });
            setTimeout(() => setFlashId(null), 3000);
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as RsvpRow;
            setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)));
            setFlashId(row.id);
            setLastEvent({ type: 'UPDATE', at });
            setTimeout(() => setFlashId(null), 3000);
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as Partial<RsvpRow>;
            setRows((prev) => prev.filter((r) => r.id !== old.id));
            setLastEvent({ type: 'DELETE', at });
          }
        }
      )
      .subscribe((s) => {
        if (s === 'SUBSCRIBED') setStatus('live');
        else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setStatus('error');
        else if (s === 'CLOSED') setStatus('closed');
      });

    // Polling fallback so the table still refreshes if realtime/WS is blocked.
    const poll = setInterval(async () => {
      if (document.hidden) return;
      const { data } = await supabase
        .from('wedding_rsvp_responses')
        .select('*')
        .order('created_at', { ascending: true });
      if (data) setRows(data as RsvpRow[]);
    }, POLL_FALLBACK_MS);

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const totalGuests = rows.reduce((sum, r) => sum + (r.guest_count ?? 0), 0);
    const count = (fn: (r: RsvpRow) => boolean) => rows.filter(fn).length;
    return {
      responses: rows.length,
      totalGuests,
      fusionYes: count((r) => r.fusion_party === 'yes'),
      sangeetYes: count((r) => r.sangeet === 'yes'),
      weddingYes: count((r) => r.wedding === 'yes'),
      needStay: count((r) => r.staying_over === 'yes'),
    };
  }, [rows]);

  const tribes = useMemo(() => {
    const set = new Set(rows.map((r) => r.tribe).filter(Boolean) as string[]);
    return ['all', ...Array.from(set)];
  }, [rows]);

  // Sl No. in Supabase table order (oldest first by created_at).
  // Kept stable when searching/filtering so counting matches the DB.
  const slNoById = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r, i) => map.set(r.id, i + 1));
    return map;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (tribeFilter !== 'all' && r.tribe !== tribeFilter) return false;
      if (attendanceFilter === 'fusion' && r.fusion_party !== 'yes') return false;
      if (attendanceFilter === 'sangeet' && r.sangeet !== 'yes') return false;
      if (attendanceFilter === 'wedding' && r.wedding !== 'yes') return false;
      if (attendanceFilter === 'stay' && r.staying_over !== 'yes') return false;
      if (stayFilter === 'yes' && r.staying_over !== 'yes') return false;
      if (stayFilter === 'no' && r.staying_over !== 'no') return false;
      if (stayFilter === '11th' && r.accommodation_11th !== 'yes') return false;
      if (stayFilter === '12th' && r.accommodation_12th !== 'yes') return false;
      if (stayFilter === '13th' && r.accommodation_13th !== 'yes') return false;
      if (
        stayFilter === 'any_night' &&
        !(r.accommodation_11th === 'yes' || r.accommodation_12th === 'yes' || r.accommodation_13th === 'yes')
      )
        return false;
      if (!q) return true;
      return (
        r.guest_name.toLowerCase().includes(q) ||
        (r.tribe_other ?? '').toLowerCase().includes(q) ||
        (r.tribe ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, search, tribeFilter, attendanceFilter, stayFilter]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered, slNoById)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wedding-rsvp-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pill = (v: string | null) => {
    if (v === 'yes') return <span className="dash-pill dash-yes">Yes</span>;
    if (v === 'no') return <span className="dash-pill dash-no">No</span>;
    return <span className="dash-pill dash-na">—</span>;
  };

  return (
    <div className="min-h-screen bg-[#FBF9F2] text-[#5a4a42]">
      <header className="sticky top-0 z-10 border-b border-[#E8DAD6] bg-[#FBF9F2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#B7C4A7]">Live · Supabase Realtime</p>
            <h1 className="font-serif text-2xl leading-none">RSVP Responses <span className="text-[#8a7569]">· #TUTTUPALLA</span></h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wide ${
                status === 'live'
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : status === 'connecting'
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-red-300 bg-red-50 text-red-700'
              }`}
              title={lastEvent ? `Last event: ${lastEvent.type} at ${lastEvent.at}` : 'Realtime channel status'}
            >
              {status === 'live' ? <Wifi size={13} /> : <WifiOff size={13} />}
              {status === 'live' ? '● Live' : status.toUpperCase()}
            </span>
            <button onClick={fetchRows} className="inline-flex items-center gap-1.5 rounded-full border border-[#D6C7B8] px-3 py-1.5 font-mono text-[11px] uppercase hover:bg-[#F6E4E1]" title="Refetch now">
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-full bg-[#5a4a42] px-3 py-1.5 font-mono text-[11px] uppercase text-[#FBF9F2] hover:opacity-90" title="Download filtered rows as CSV">
              <ArrowDownToLine size={13} /> CSV
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Responses', stats.responses],
            ['Total guests', stats.totalGuests],
            ['Fusion ✓', stats.fusionYes],
            ['Sangeet ✓', stats.sangeetYes],
            ['Wedding ✓', stats.weddingYes],
            ['Need stay', stats.needStay],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl border border-[#E8DAD6] bg-white/60 px-3 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#8a7569]">{label}</p>
              <p className="font-serif text-3xl leading-none">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-4 flex flex-wrap items-center gap-2">
          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-[#E8DAD6] bg-white px-3 py-2">
            <Search size={14} className="text-[#B7C4A7]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or tribe…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#D6C7B8]"
            />
          </label>
          <select value={tribeFilter} onChange={(e) => setTribeFilter(e.target.value)} className="rounded-full border border-[#E8DAD6] bg-white px-3 py-2 text-sm">
            {tribes.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All tribes' : t}</option>
            ))}
          </select>
          <select value={attendanceFilter} onChange={(e) => setAttendanceFilter(e.target.value)} className="rounded-full border border-[#E8DAD6] bg-white px-3 py-2 text-sm">
            <option value="all">All events</option>
            <option value="fusion">Fusion ✓</option>
            <option value="sangeet">Sangeet ✓</option>
            <option value="wedding">Wedding ✓</option>
            <option value="stay">Needs stay</option>
          </select>
          <select value={stayFilter} onChange={(e) => setStayFilter(e.target.value)} className="rounded-full border border-[#E8DAD6] bg-white px-3 py-2 text-sm" title="Filter by last question (accommodation)">
            <option value="all">Stay: all</option>
            <option value="yes">Q5 Yes · needs help</option>
            <option value="no">Q5 No</option>
            <option value="11th">11th night ✓</option>
            <option value="12th">12th night ✓</option>
            <option value="13th">13th night ✓</option>
            <option value="any_night">Any night ✓</option>
          </select>
          <span className="font-mono text-[11px] text-[#8a7569]">
            {filtered.length} / {rows.length} shown
            {lastEvent && <> · last {lastEvent.type} {lastEvent.at}</>}
          </span>
        </section>

        {loading ? (
          <p className="mt-10 text-center font-mono text-sm text-[#8a7569]">Loading responses…</p>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm leading-relaxed">
            <p className="font-semibold">Could not read <code>wedding_rsvp_responses</code>: {error}</p>
            <p className="mt-2">
              This table is currently <strong>insert-only</strong> (RLS denies SELECT). Apply the bundled migration
              <code className="mx-1 rounded bg-white px-1">supabase/migrations/20260921000000_enable_realtime_dashboard.sql</code>
              with <code className="rounded bg-white px-1">supabase db push</code> (or run its SQL in the Supabase dashboard)
              to allow reads + realtime.
            </p>
            <pre className="mt-3 overflow-x-auto rounded bg-[#1f1a17] p-3 font-mono text-[11px] text-green-200">{`-- allow public read (dashboard is not private)
CREATE POLICY "Public can read wedding RSVPs"
ON public.wedding_rsvp_responses FOR SELECT
TO anon, authenticated USING (true);

-- realtime
ALTER PUBLICATION supabase_realtime
ADD TABLE public.wedding_rsvp_responses;`}</pre>
            <button onClick={fetchRows} className="mt-3 rounded-full bg-[#5a4a42] px-4 py-2 font-mono text-[11px] uppercase text-white">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-10 text-center font-mono text-sm text-[#8a7569]">
            No responses yet — new RSVPs will appear here live without refresh.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#E8DAD6] bg-white">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8DAD6] bg-[#F6E4E1]/60 font-mono text-[10px] uppercase tracking-wider text-[#8a7569]">
                  {['Sl No.', 'Guest', 'Count', 'Tribe', 'Fusion', 'Sangeet', 'Wedding', 'Stay?', '11th', '12th', '13th', 'Submitted'].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-[#F6E4E1] transition-colors last:border-0 hover:bg-[#FBF9F2] ${flashId === r.id ? 'bg-green-50' : ''}`}
                  >
                    <td className="px-3 py-2.5 font-mono text-xs text-[#8a7569]">{slNoById.get(r.id) ?? '—'}</td>
                    <td className="px-3 py-2.5 font-medium">{r.guest_name}</td>
                    <td className="px-3 py-2.5 font-mono">{r.guest_count}</td>
                    <td className="px-3 py-2.5">
                      <span className="dash-pill dash-tribe">{r.tribe ?? '—'}</span>
                      {r.tribe === 'Others' && r.tribe_other && (
                        <span className="ml-1 text-xs text-[#8a7569]">({r.tribe_other})</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">{pill(r.fusion_party)}</td>
                    <td className="px-3 py-2.5">{pill(r.sangeet)}</td>
                    <td className="px-3 py-2.5">{pill(r.wedding)}</td>
                    <td className="px-3 py-2.5">{pill(r.staying_over)}</td>
                    <td className="px-3 py-2.5">{pill(r.accommodation_11th)}</td>
                    <td className="px-3 py-2.5">{pill(r.accommodation_12th)}</td>
                    <td className="px-3 py-2.5">{pill(r.accommodation_13th)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-[#8a7569]">{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 font-mono text-[11px] leading-relaxed text-[#8a7569]">
          Source: <code>public.wedding_rsvp_responses</code> ordered by <code>created_at ↑</code> (same as Supabase table, oldest first)
          via Supabase Realtime (<code>postgres_changes · INSERT/UPDATE/DELETE</code>) +
          {` ${POLL_FALLBACK_MS / 1000}s`} polling fallback. Open the invite at <a className="underline" href="/">/</a> and
          this board at <a className="underline" href="#/dashboard">#/dashboard</a> or <a className="underline" href="/?view=dashboard">?view=dashboard</a>.
        </p>
      </main>
    </div>
  );
}
