import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

const columns = [
  { title: 'Product', links: [
    { label: 'Features', anchor: 'features' },
    { label: 'How It Works', anchor: 'how-it-works' },
    { label: 'Security', anchor: 'security' },
    { label: 'Analytics', anchor: 'analytics' },
  ] },
  { title: 'Portals', links: [
    { label: 'Student Login', to: '/login' },
    { label: 'Admin Login', to: '/admin/login' },
  ] },
  { title: 'Company', links: [
    { label: 'About', anchor: undefined },
    { label: 'Contact', anchor: undefined },
    { label: 'Privacy Policy', anchor: undefined },
    { label: 'Terms of Service', anchor: undefined },
  ] },
];

export const MarketingFooter: React.FC = () => {
  const navigate = useNavigate();

  const handleLinkClick = (link: { to?: string; anchor?: string }) => (e: React.MouseEvent) => {
    if (link.to) {
      e.preventDefault();
      navigate(link.to);
    } else if (link.anchor) {
      e.preventDefault();
      document.getElementById(link.anchor)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer style={{ background: 'var(--surface-1)', borderTop: '1px solid var(--border-subtle)', padding: '64px 24px 32px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(3, 1fr)', gap: 32, marginBottom: 48 }}>
          <div>
            <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-md)', background: 'var(--accent-9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Shield size={16} />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>ExamFlow AI</span>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', maxWidth: 280, lineHeight: 'var(--leading-normal)' }}>
              AI-powered smart virtual queue management and online examination platform.
            </p>
          </div>
          {columns.map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(link => (
                  <a key={link.label} href="#" onClick={handleLinkClick(link)} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textDecoration: 'none' }}>{link.label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 24, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          &copy; {new Date().getFullYear()} ExamFlow AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
