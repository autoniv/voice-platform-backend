// pages/dashboard/index.js  —  Overview / Home
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import api from '../../lib/api';

function fmtDuration(secs) {
  const s = parseInt(secs) || 0;
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60), r = s % 60;
  return `${m}m ${r}s`;
}
function fmtCost(n) {
  return `$${parseFloat(n || 0).toFixed(2)}`;
}

function StatCard({ label, value, sub, color = 'var(--brand)', icon }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/calls/analytics/summary'),
      api.get('/api/calls?limit=5'),
      api.get('/api/agents')
    ]).then(([a, c, ag]) => {
      setAnalytics(a.data);
      setRecentCalls(c.data.calls || []);
      setAgents(ag.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const t = analytics?.totals || {};

  return (
    <Layout title="Overview">
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)' }}>
          Loading dashboard…
        </div>
      ) : (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <StatCard
              label="Total Calls"
              value={t.total_calls || 0}
              sub="All time"
              color="var(--brand)"
              icon={<PhoneIcon size={15}/>}
            />
            <StatCard
              label="Active Agents"
              value={agents.filter(a => a.is_active).length}
              sub={`${agents.length} total`}
              color="var(--green)"
              icon={<BotIcon size={15}/>}
            />
            <StatCard
              label="Talk Time"
              value={fmtDuration(t.total_seconds)}
              sub="Total duration"
              color="#a78bfa"
              icon={<ClockIcon size={15}/>}
            />
            <StatCard
              label="Total Cost"
              value={fmtCost(t.total_cost)}
              sub="Vapi charges"
              color="var(--amber)"
              icon={<CostIcon size={15}/>}
            />
          </div>

          {/* Quick actions */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 14 }}>Quick Actions</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/dashboard/agents" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ gap: 8 }}><BotIcon size={14}/> New Agent</button>
              </Link>
              <Link href="/dashboard/calls" style={{ textDecoration: 'none' }}>
                <button className="btn btn-ghost" style={{ gap: 8 }}><PhoneIcon size={14}/> View Call Logs</button>
              </Link>
              <Link href="/dashboard/analytics" style={{ textDecoration: 'none' }}>
                <button className="btn btn-ghost" style={{ gap: 8 }}><ChartIcon size={14}/> Analytics</button>
              </Link>
            </div>
          </div>

          {/* Recent calls */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Calls</h2>
              <Link href="/dashboard/calls" style={{ color: 'var(--brand)', textDecoration: 'none', fontSize: 12, fontWeight: 500 }}>View all →</Link>
            </div>
            {recentCalls.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No calls yet. Create an agent and start making calls.
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Agent</th><th>Caller</th><th>Status</th><th>Duration</th><th>Date</th>
                  </tr></thead>
                  <tbody>
                    {recentCalls.map(call => (
                      <tr key={call.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/dashboard/calls?id=${call.id}`)}>
                        <td>{call.agent_name || '—'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{call.caller_number || 'Unknown'}</td>
                        <td><StatusBadge status={call.status}/></td>
                        <td>{fmtDuration(call.duration_seconds)}</td>
                        <td>{call.started_at ? new Date(call.started_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </Layout>
  );
}

function StatusBadge({ status }) {
  const map = { ended: 'badge-green', 'in-progress': 'badge-blue', failed: 'badge-red', busy: 'badge-amber' };
  return <span className={`badge ${map[status] || 'badge-muted'}`}>{status || 'unknown'}</span>;
}

function PhoneIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>; }
function BotIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>; }
function ClockIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function CostIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; }
function ChartIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
