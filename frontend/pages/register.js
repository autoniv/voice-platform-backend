// pages/register.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../lib/api';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'VoiceAI Pro';

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', form);
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', padding: 20
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}/>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }} className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{BRAND}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Create your account</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--red)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 18
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Full name</label>
                <input type="text" placeholder="Jane Smith" value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Company</label>
                <input type="text" placeholder="Acme Inc." value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Email address</label>
              <input type="email" required placeholder="you@company.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(min. 8 chars)</span></label>
              <input type="password" required placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '11px 16px', fontSize: 15 }}>
              {loading ? <span className="spin">◌</span> : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: 13 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
