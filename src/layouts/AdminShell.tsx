import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, FileText, Users, Activity, BarChart3,
  ClipboardList, Zap, ServerCog, Settings, User, HelpCircle, LogOut,
  Shield, ChevronsLeft, ChevronsRight, Search, Menu,
} from 'lucide-react';
import { useApp } from '../state';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Avatar } from '../components/ui/Avatar';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  end?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  { title: 'Overview', items: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
  ]},
  { title: 'Examinations', items: [
    { label: 'Exams', to: '/admin/exams', icon: FileText },
    { label: 'Question Bank', to: '/admin/questions', icon: BookOpen },
    { label: 'Queue Monitoring', to: '/admin/queue', icon: Activity },
  ]},
  { title: 'People', items: [
    { label: 'Students', to: '/admin/students', icon: Users },
  ]},
  { title: 'Insights', items: [
    { label: 'Reports', to: '/admin/reports', icon: ClipboardList },
    { label: 'Simulation Mode', to: '/admin/simulation', icon: Zap },
  ]},
  { title: 'System', items: [
    { label: 'Server & Logs', to: '/admin/super', icon: ServerCog },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ]},
];

const pageTitle = (pathname: string): string => {
  for (const section of sections) {
    for (const item of section.items) {
      if (item.end ? pathname === item.to : pathname.startsWith(item.to)) return item.label;
    }
  }
  if (pathname.startsWith('/admin/profile')) return 'Profile';
  if (pathname.startsWith('/admin/help')) return 'Help Center';
  return 'Admin Portal';
};

export const AdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authUser, logoutUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer on every navigation
  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const linkStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: collapsed ? '9px' : '9px 12px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    color: active ? 'var(--text-on-accent)' : 'var(--text-secondary)',
    background: active ? 'var(--accent-9)' : 'transparent',
    textDecoration: 'none',
    transition: 'all var(--duration-fast) var(--ease-out)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-0)' }}>
      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="admin-sidebar-backdrop"
          style={{ position: 'fixed', inset: 0, background: 'var(--surface-overlay)', zIndex: 39 }}
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Admin navigation"
        className={`admin-sidebar${mobileOpen ? ' admin-sidebar-open' : ''}`}
        style={{
          width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
          flexShrink: 0,
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--surface-1)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          transition: 'width var(--duration-base) var(--ease-in-out)',
          zIndex: 40,
        }}
      >
        <div
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)', height: 'var(--topbar-height)' }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 'var(--radius-md)', background: 'var(--accent-9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
          }}>
            <Shield size={16} />
          </div>
          {!collapsed && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-base)' }}>ExamFlow AI</span>}
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sections.map(section => (
            <div key={section.title}>
              {!collapsed && (
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 12px', marginBottom: 6 }}>
                  {section.title}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.items.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.end} title={collapsed ? item.label : undefined} style={({ isActive }) => linkStyle(isActive)}>
                    <item.icon size={17} style={{ flexShrink: 0 }} />
                    {!collapsed && item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavLink to="/admin/profile" style={({ isActive }) => linkStyle(isActive)} title={collapsed ? 'Profile' : undefined}>
            <User size={17} /> {!collapsed && 'Profile'}
          </NavLink>
          <NavLink to="/admin/help" style={({ isActive }) => linkStyle(isActive)} title={collapsed ? 'Help Center' : undefined}>
            <HelpCircle size={17} /> {!collapsed && 'Help Center'}
          </NavLink>
          <button
            onClick={() => { logoutUser(); navigate('/'); }}
            title={collapsed ? 'Logout' : undefined}
            style={{ ...linkStyle(false), border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}
          >
            <LogOut size={17} /> {!collapsed && 'Logout'}
          </button>
          <button
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ ...linkStyle(false), border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'inherit', marginTop: 4 }}
          >
            {collapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />} {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          height: 'var(--topbar-height)', flexShrink: 0, borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 var(--space-6)', position: 'sticky', top: 0, zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              className="admin-hamburger"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileOpen(o => !o)}
              style={{ display: 'none', width: 34, height: 34, alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', flexShrink: 0 }}
            >
              <Menu size={17} />
            </button>
            <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{pageTitle(location.pathname)}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div className="admin-search" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '7px 12px', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', width: 220 }}>
              <Search size={14} />
              <span>Quick search…</span>
            </div>
            <ThemeToggle />
            {authUser && <Avatar name={authUser.name} size={32} />}
          </div>
        </header>

        <main style={{ flex: 1, padding: 'var(--space-8)', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
