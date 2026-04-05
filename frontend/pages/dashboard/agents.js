// pages/dashboard/agents.js  —  Create & manage voice agents
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';

const VOICES = [
  { id: 'paula',   label: 'Paula — Warm Female (EN)' },
  { id: 'josh',    label: 'Josh — Professional Male (EN)' },
  { id: 'rachel',  label: 'Rachel — Friendly Female (EN)' },
  { id: 'adam',    label: 'Adam — Clear Male (EN)' },
  { id: 'bella',   label: 'Bella — Energetic Female (EN)' },
];

const PROMPT_TEMPLATES = [
  { label: 'Customer Support', prompt: 'You are a friendly customer support agent. Help customers resolve their issues quickly and professionally. Be empathetic, clear, and concise.' },
  { label: 'Lead Qualification', prompt: 'You are a sales assistant qualifying inbound leads. Ask about their needs, budget, timeline, and decision-making process. Be engaging and professional.' },
  { label: 'Appointment Booking', prompt: 'You are an appointment scheduling assistant. Help callers book, reschedule, or cancel appointments. Confirm details clearly before finishing.' },
  { label: 'Custom', prompt: '' },
];

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const emptyForm = { name: '', system_prompt: '', first_message: '', voice_id: 'paula', language: 'en' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchAgents(); }, []);

  async function fetchAgents() {
    setLoading(true);
    try {
      const { data } = await api.get('/api/agents');
      setAgents(data);
    } catch { } finally { setLoading(false); }
  }

  function openCreate() {
    setEditAgent(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  }

  function openEdit(agent) {
    setEditAgent(agent);
    setForm({
      name: agent.name,
      system_prompt: agent.system_prompt || '',
      first_message: agent.first_message || '',
      voice_id: agent.voice_id || 'paula',
      language: agent.language || 'en',
    });
    setError('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return setError('Agent name is required.');
    if (!form.system_prompt.trim()) return setError('System prompt is required.');
    setSaving(true); setError('');
    try {
      if (editAgent) {
        const { data } = await api.patch(`/api/agents/${editAgent.id}`, form);
        setAgents(prev => prev.map(a => a.id === editAgent.id ? { ...a, ...data } : a));
      } else {
        const { data } = await api.post('/api/agents', form);
        setAgents(prev => [data, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save agent.');
    } finally { setSaving(false); }
  }

  async function handleDelete(agent) {
    if (!confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) return;
    setDeleting(agent.id);
    try {
      await api.delete(`/api/agents/${agent.id}`);
      setAgents(prev => prev.filter(a => a.id !== agent.id));
    } catch { alert('Failed to delete agent.'); }
    finally { setDeleting(null); }
  }

  async function toggleActive(agent) {
    try {
      const { data } = await api.patch(`/api/agents/${agent.id}`, { is_active: !agent.is_active });
      setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, ...data } : a));
    } catch { alert('Failed to update agent.'); }
  }

  return (
    <Layout title="Voice Agents">
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
              {agents.length} agent{agents.length !== 1 ? 's' : ''} · Each agent is a Vapi assistant running invisibly in your account
            </p>
          </div>
          <button className="btn btn-primary" onClick={openCreate} style={{ gap: 8 }}>
            <PlusIcon size={14}/> New Agent
          </button>
        </div>

        {/* Agent grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading agents…</div>
        ) : agents.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '56px 24px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--bg-raised)', border: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-muted)' }}>
              <BotIcon size={24}/>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No agents yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>Create your first AI voice agent to get started.</p>
            <button className="btn btn-primary" onClick={openCreate} style={{ gap: 8 }}>
              <PlusIcon size={14}/> Create First Agent
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {agents.map(agent => (
              <div key={agent.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Agent header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: agent.is_active ? 'rgba(68,76,231,0.15)' : 'var(--bg-raised)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: agent.is_active ? 'var(--brand)' : 'var(--text-muted)'
                    }}>
                      <BotIcon size={18}/>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{agent.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {VOICES.find(v => v.id === agent.voice_id)?.label?.split('—')[0]?.trim() || agent.voice_id}
                      </div>
                    </div>
                  </div>
                  {/* Active toggle */}
                  <button onClick={() => toggleActive(agent)} style={{
                    background: agent.is_active ? 'rgba(34,197,94,0.15)' : 'var(--bg-raised)',
                    color: agent.is_active ? 'var(--green)' : 'var(--text-muted)',
                    border: 'none', borderRadius: 20, padding: '4px 10px',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer'
                  }}>
                    {agent.is_active ? '● Active' : '○ Inactive'}
                  </button>
                </div>

                {/* Prompt preview */}
                {agent.system_prompt && (
                  <p style={{
                    fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
                    background: 'var(--bg-raised)', borderRadius: 6, padding: '8px 10px',
                    border: '1px solid var(--bg-border)',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {agent.system_prompt}
                  </p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button className="btn btn-ghost" onClick={() => openEdit(agent)} style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                    <EditIcon size={13}/> Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(agent)} disabled={deleting === agent.id} style={{ fontSize: 12 }}>
                    {deleting === agent.id ? '…' : <TrashIcon size={13}/>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{editAgent ? 'Edit Agent' : 'Create New Agent'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', padding: '9px 12px', borderRadius: 6, fontSize: 12, marginBottom: 16 }}>{error}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Name */}
              <div>
                <label style={labelStyle}>Agent Name</label>
                <input placeholder="e.g. Sales Assistant" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>

              {/* Voice & Language */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Voice</label>
                  <select value={form.voice_id} onChange={e => setForm({ ...form, voice_id: e.target.value })}>
                    {VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Language</label>
                  <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="hi">Hindi</option>
                    <option value="pt">Portuguese</option>
                  </select>
                </div>
              </div>

              {/* Prompt template picker */}
              {!editAgent && (
                <div>
                  <label style={labelStyle}>Prompt Template <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional starting point)</span></label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {PROMPT_TEMPLATES.map(t => (
                      <button key={t.label} onClick={() => t.prompt && setForm(f => ({ ...f, system_prompt: t.prompt }))}
                        style={{
                          background: 'var(--bg-raised)', border: '1px solid var(--bg-border)',
                          borderRadius: 6, padding: '5px 10px', fontSize: 12, color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* System Prompt */}
              <div>
                <label style={labelStyle}>System Prompt <span style={{ color: 'var(--red)' }}>*</span></label>
                <textarea
                  rows={5} placeholder="Describe how your agent should behave, what it knows, and how it should talk to callers..."
                  value={form.system_prompt} onChange={e => setForm({ ...form, system_prompt: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* First Message */}
              <div>
                <label style={labelStyle}>First Message <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(what the agent says first)</span></label>
                <input placeholder={`Hello! I'm ${form.name || 'your assistant'}. How can I help?`}
                  value={form.first_message} onChange={e => setForm({ ...form, first_message: e.target.value })} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 120, justifyContent: 'center' }}>
                  {saving ? <span className="spin">◌</span> : (editAgent ? 'Save Changes' : 'Create Agent')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', marginBottom: 6 };

function PlusIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function BotIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>; }
function EditIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
