// pages/dashboard/calls.js  —  Call history & transcripts
import { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';

function fmtDuration(s) {
  const n = parseInt(s) || 0;
  if (n < 60) return `${n}s`;
  return `${Math.floor(n / 60)}m ${n % 60}s`;
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_COLORS = { ended: 'badge-green', 'in-progress': 'badge-blue', failed: 'badge-red', busy: 'badge-amber' };

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ agent_id: '', status: '', page: 1 });
  const [selected, setSelected] = useState(null);   // Full call detail for modal

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 20, page: filters.page });
      if (filters.agent_id) params.append('agent_id', filters.agent_id);
      if (filters.status)   params.append('status', filters.status);
      const { data } = await api.get(`/api/calls?${params}`);
      setCalls(data.calls || []);
      setPagination(data.pagination || {});
    } catch { } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);
  useEffect(() => {
    api.get('/api/agents').then(r => setAgents(r.data)).catch(() => {});
  }, []);

  async function openDetail(call) {
    try {
      const { data } = await api.get(`/api/calls/${call.id}`);
      setSelected(data);
    } catch { setSelected(call); }
  }

  return (
    <Layout title="Call Logs">
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Filters */}
        <div className="card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={labelStyle}>Filter by Agent</label>
              <select value={filters.agent_id} onChange={e => setFilters(f => ({ ...f, agent_id: e.target.value, page: 1 }))}>
                <option value="">All agents</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={labelStyle}>Status</label>
              <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
                <option value="">All statuses</option>
                <option value="ended">Ended</option>
                <option value="in-progress">In Progress</option>
                <option value="failed">Failed</option>
                <option value="busy">Busy</option>
              </select>
            </div>
            <button className="btn btn-ghost" onClick={() => setFilters({ agent_id: '', status: '', page: 1 })} style={{ alignSelf: 'flex-end' }}>
              Clear
            </button>
          </div>
        </div>

        {/* Calls table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {loading ? 'Loading…' : `${pagination.total || 0} calls`}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click a row to view transcript</span>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading calls…</div>
          ) : calls.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No calls found. Calls appear here automatically after Vapi webhooks fire.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Agent</th><th>Caller Number</th><th>Status</th>
                  <th>Duration</th><th>Cost</th><th>Date</th><th>End Reason</th>
                </tr></thead>
                <tbody>
                  {calls.map(call => (
                    <tr key={call.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(call)}>
                      <td>{call.agent_name || <span style={{ color: 'var(--text-muted)' }}>Deleted agent</span>}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{call.caller_number || 'Unknown'}</td>
                      <td><span className={`badge ${STATUS_COLORS[call.status] || 'badge-muted'}`}>{call.status || '—'}</span></td>
                      <td>{fmtDuration(call.duration_seconds)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>${parseFloat(call.cost_usd || 0).toFixed(4)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(call.started_at)}</td>
                      <td><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{call.ended_reason || '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--bg-border)', display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                disabled={filters.page <= 1} style={{ fontSize: 12 }}>← Prev</button>
              <span style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                Page {filters.page} of {pagination.pages}
              </span>
              <button className="btn btn-ghost" onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page >= pagination.pages} style={{ fontSize: 12 }}>Next →</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Call Detail Modal ── */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }} onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: 620, maxHeight: '88vh', overflowY: 'auto', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Call Detail</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>

            {/* Meta grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                ['Agent', selected.agent_name || '—'],
                ['Caller', selected.caller_number || 'Unknown'],
                ['Status', selected.status || '—'],
                ['Duration', fmtDuration(selected.duration_seconds)],
                ['Cost', `$${parseFloat(selected.cost_usd || 0).toFixed(4)}`],
                ['End Reason', selected.ended_reason || '—'],
                ['Started', fmtDate(selected.started_at)],
                ['Ended', fmtDate(selected.ended_at)],
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg-raised)', border: '1px solid var(--bg-border)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Summary */}
            {selected.summary && (
              <div style={{ marginBottom: 16 }}>
                <div style={labelStyle}>AI Summary</div>
                <div style={{ background: 'rgba(68,76,231,0.07)', border: '1px solid rgba(68,76,231,0.2)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {selected.summary}
                </div>
              </div>
            )}

            {/* Transcript */}
            {selected.transcript ? (
              <div>
                <div style={labelStyle}>Full Transcript</div>
                <div style={{
                  background: 'var(--bg-raised)', border: '1px solid var(--bg-border)',
                  borderRadius: 8, padding: '14px', fontSize: 12, fontFamily: 'var(--font-mono)',
                  lineHeight: 1.8, color: 'var(--text-secondary)', maxHeight: 300, overflowY: 'auto',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                  {selected.transcript}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                Transcript not available for this call.
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 };
