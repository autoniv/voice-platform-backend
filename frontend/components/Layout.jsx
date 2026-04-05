// components/Layout.jsx  —  Sidebar + top bar shell
import { useRouter } from 'next/router';
import Link from 'next/link';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'VoiceAI Pro';

const NAV = [
  { href: '/dashboard',          icon: GridIcon,   label: 'Overview'  },
  { href: '/dashboard/agents',   icon: BotIcon,    label: 'Agents'    },
  { href: '/dashboard/calls',    icon: PhoneIcon,  label: 'Call Logs' },
  { href: '/dashboard/analytics',icon: ChartIcon,  label: 'Analytics' },
];

export default function Layout({ children, title }) {
  const router = useRouter();

  function logout() {
    localStorage.removeItem('token');
    router.push('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--bg-border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--bg-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {BRAND}
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = router.pathname === href || (href !== '/dashboard' && router.pathname.startsWith(href));
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                  background: active ? 'rgba(68,76,231,0.15)' : 'transparent',
                  color: active ? 'var(--brand)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                  fontSize: 13.5,
                  transition: 'all 0.12s',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-raised)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                  <Icon size={16} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--bg-border)' }}>
          <button onClick={logout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 10, fontSize: 13.5 }}>
            <LogoutIcon size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          padding: '16px 28px',
          borderBottom: '1px solid var(--bg-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-surface)',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h1>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--brand-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'var(--brand)'
          }}>U</div>
        </header>

        {/* Page body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

// ── Tiny inline SVG icons ─────────────────────────────────
function GridIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function BotIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>;
}
function PhoneIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
}
function ChartIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function LogoutIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
