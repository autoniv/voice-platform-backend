// pages/dashboard/analytics.js  —  Charts & metrics
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';

// ── Color palette ─────────────────────────────────────────
const COLORS = ['#444ce7', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa', '#06b6d4'];

// ── Formatters ────────────────────────────────────────────
const fmtDuration = s => { const n = parseInt(s)||0; return n < 60 ? `${n}s` : `${Math.floor(n/60)}m`; };
const fmtDate = d => { try { return format(parseISO(d), 'MMM d'); } catch { return d; } };

// ── Custom tooltip ────────────────────────────────────────
function ChartTooltip({ active, payload, label, fmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-raised)', border: '1px solid var(--bg-border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text-primary)', fontWeight: 600 }}>
          {p.name}: {fmt ? fmt(p.value) : p.value}
        </div>
      ))}
    </div>
  );
}

// ── Section header ────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
      {children}
    </h2>
  );
}

// ── Stat card ─────────────────────────────────────────────
function Stat({ label, value, color = 'var(--brand)' }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '18px 16px' }}>
      <div style={{ fontSize: 26, fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

export default function Analytics() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/calls/analytics/summary')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout title="Analytics">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)' }}>
        Loading analytics…
      </div>
    </Layout>
  );

  if (!data) return (
    <Layout title="Analytics">
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        Failed to load analytics. Ensure your backend is running.
      </div>
    </Layout>
  );

  const { totals, dailyVolume, topAgents, statusBreakdown } = data;
  const t = totals || {};

  // Fill missing days in the last 30 days for the area chart
  const volumeMap = {};
  (dailyVolume || []).forEach(d => { volumeMap[d.date] = d; });

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    return {
      date: key,
      label: fmtDate(key),
      calls: parseInt(volumeMap[key]?.calls || 0),
      minutes: Math.round((parseInt(volumeMap[key]?.total_seconds || 0)) / 60)
    };
  });

  const pieData = (statusBreakdown || []).map(s => ({
    name: s.status || 'unknown',
    value: parseInt(s.count)
  }));

  const agentData = (topAgents || []).map(a => ({
    name: a.name,
    calls: parseInt(a.call_count),
    minutes: Math.round(parseInt(a.total_seconds || 0) / 60)
  }));

  return (
    <Layout title="Analytics">
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── KPI row ── */}
        <div>
          <SectionTitle>Key Metrics — All Time</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            <Stat label="Total Calls"     value={parseInt(t.total_calls   || 0).toLocaleString()} color="var(--brand)" />
            <Stat label="Completed"       value={parseInt(t.completed_calls|| 0).toLocaleString()} color="var(--green)" />
            <Stat label="Total Minutes"   value={Math.round((parseInt(t.total_seconds||0))/60).toLocaleString()} color="#a78bfa" />
            <Stat label="Avg Duration"    value={fmtDuration(t.avg_duration || 0)} color="var(--amber)" />
            <Stat label="Total Cost"      value={`$${parseFloat(t.total_cost||0).toFixed(2)}`} color="#06b6d4" />
          </div>
        </div>

        {/* ── Daily call volume ── */}
        <div className="card">
          <SectionTitle>Daily Call Volume — Last 30 Days</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={last30} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#444ce7" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#444ce7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="label" tick={{ fill: '#565878', fontSize: 11 }} tickLine={false} axisLine={false}
                interval={Math.floor(last30.length / 6)} />
              <YAxis tick={{ fill: '#565878', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false}/>
              <Tooltip content={<ChartTooltip />}/>
              <Area type="monotone" dataKey="calls" name="Calls" stroke="#444ce7" strokeWidth={2}
                fill="url(#callsGrad)" dot={false} activeDot={{ r: 4, fill: '#444ce7' }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Talk time per day ── */}
        <div className="card">
          <SectionTitle>Talk Time — Minutes Per Day</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last30} margin={{ top: 4, right: 4, bottom: 0, left: -10 }} barSize={10}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="label" tick={{ fill: '#565878', fontSize: 11 }} tickLine={false} axisLine={false}
                interval={Math.floor(last30.length / 6)}/>
              <YAxis tick={{ fill: '#565878', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false}/>
              <Tooltip content={<ChartTooltip fmt={v => `${v}m`}/>}/>
              <Bar dataKey="minutes" name="Minutes" fill="#22c55e" radius={[3, 3, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Bottom row: Pie + Top agents ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.5fr)', gap: 16 }}>

          {/* Status breakdown pie */}
          <div className="card">
            <SectionTitle>Call Status Breakdown</SectionTitle>
            {pieData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>No data yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                      dataKey="value" paddingAngle={3} stroke="none">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                    </Pie>
                    <Tooltip content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--bg-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                          <strong>{payload[0].name}</strong>: {payload[0].value}
                        </div>
                      ) : null
                    }/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {pieData.map((entry, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length] }}/>
                      <span style={{ color: 'var(--text-secondary)' }}>{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Top agents bar */}
          <div className="card">
            <SectionTitle>Top Agents by Call Volume</SectionTitle>
            {agentData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>No agent data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={agentData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }} barSize={12}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                  <XAxis type="number" tick={{ fill: '#565878', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false}/>
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9395b8', fontSize: 11 }} tickLine={false} axisLine={false} width={90}/>
                  <Tooltip content={<ChartTooltip />}/>
                  <Bar dataKey="calls" name="Calls" fill="#444ce7" radius={[0, 4, 4, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
