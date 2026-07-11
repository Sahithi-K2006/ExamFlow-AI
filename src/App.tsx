import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AppProvider, useApp } from './state';
import { MarketingLanding } from './components/marketing/MarketingLanding';
import { PortalSelection } from './components/PortalSelection';
import { StudentFlow } from './components/StudentFlow';
import { AdminDashboard } from './components/AdminDashboard';
import { SuperAdmin } from './components/SuperAdmin';
import { AdminLogin } from './components/AdminLogin';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { QuestionBank } from './components/admin/QuestionBank';
import { ExamsList } from './components/admin/ExamsList';
import { ExamBuilder } from './components/admin/ExamBuilder';
import { PublishShareExam } from './components/admin/PublishShareExam';
import { StudentManagement } from './components/admin/StudentManagement';
import { QueueMonitoring } from './components/admin/QueueMonitoring';
import { Analytics } from './components/admin/Analytics';
import { Reports } from './components/admin/Reports';
import { SimulationMode } from './components/admin/SimulationMode';
import { AdminSettings } from './components/admin/AdminSettings';
import { Profile } from './components/admin/Profile';
import { HelpCenter } from './components/admin/HelpCenter';
import { RequireStudent, RedirectIfAuthed } from './router/guards';
import { AdminLayout } from './layouts/AdminLayout';
import { useToast } from './components/ui/Toast';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { Shield, User, LogOut, ChevronRight } from 'lucide-react';

const PublicShell: React.FC<{ children: React.ReactNode; hideFooter?: boolean }> = ({ children, hideFooter }) => {
  const { authUser, logoutUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-0)' }}>
      <header
        style={{
          background: 'var(--surface-1)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '10px var(--space-4)',
          minHeight: 'var(--topbar-height)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          gap: 'var(--space-3)',
        }}
      >
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-md)', background: 'var(--accent-9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Shield size={16} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>ExamFlow AI</span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {!authUser && (
            <>
              <button className="btn btn-ghost-nav" onClick={() => navigate('/login')} style={navBtnStyle(location.pathname === '/login')}>
                <User size={14} /> <span className="nav-label">Student Login</span>
              </button>
              <button className="btn btn-ghost-nav" onClick={() => navigate('/admin/login')} style={navBtnStyle(location.pathname === '/admin/login')}>
                <Shield size={14} /> <span className="nav-label">Admin Login</span>
              </button>
            </>
          )}
          {authUser?.role === 'student' && (
            <button className="btn btn-ghost-nav" onClick={() => navigate('/app')} style={navBtnStyle(location.pathname === '/app')}>
              <User size={14} /> <span className="nav-label">My Dashboard</span>
            </button>
          )}
          {authUser?.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => navigate('/admin')} style={{ padding: '8px 16px', fontSize: 'var(--text-sm)' }}>
              <span className="nav-label">Admin Portal</span> <ChevronRight size={14} />
            </button>
          )}
          {authUser && (
            <button
              onClick={() => { logoutUser(); navigate('/'); }}
              style={{ ...navBtnStyle(false), display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LogOut size={14} /> <span className="nav-label">Logout</span>
            </button>
          )}
          <ThemeToggle />
        </nav>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</main>

      {!hideFooter && (
        <footer style={{ background: 'var(--surface-1)', borderTop: '1px solid var(--border-subtle)', padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          &copy; {new Date().getFullYear()} ExamFlow AI. All rights reserved. Designed for high-concurrency examination backends.
        </footer>
      )}
    </div>
  );
};

const navBtnStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: active ? 'var(--surface-2)' : 'transparent',
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  transition: 'all var(--duration-fast) var(--ease-out)',
});

// Public entry point for a published exam's shareable link: "Login → View Exam → Start Exam →
// Queue → Exam". Records which exam this visit targets, then routes to the right next step —
// students land on their dashboard already pointed at this exam once authenticated.
const ExamLinkEntry: React.FC = () => {
  const { slug } = useParams();
  const { authUser, authLoading, setCurrentExamSlug } = useApp();

  useEffect(() => {
    if (slug) setCurrentExamSlug(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only re-run when the slug param changes
  }, [slug]);

  if (authLoading) return null;
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser.role !== 'student') return <Navigate to="/login" replace state={{ message: 'Unauthorized Access' }} />;
  return <Navigate to="/app" replace />;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { show } = useToast();
  const locationMessage = (location.state as { message?: string } | null)?.message;

  // Route guards (RequireAdmin/RequireStudent) hand off an "Unauthorized Access" message via
  // navigation state — surface it as a toast, then clear the state so it doesn't repeat.
  useEffect(() => {
    if (locationMessage) {
      show({ tone: 'danger', title: locationMessage });
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only re-run when the toast message changes
  }, [locationMessage]);

  return (
    <Routes>
      <Route path="/" element={<PublicShell hideFooter><MarketingLanding /></PublicShell>} />
      <Route path="/get-started" element={<PortalSelection />} />
      <Route path="/exam/:slug" element={<PublicShell><ExamLinkEntry /></PublicShell>} />
      <Route path="/login" element={<PublicShell><RedirectIfAuthed role="student"><StudentFlow /></RedirectIfAuthed></PublicShell>} />
      <Route path="/app" element={<PublicShell><RequireStudent><StudentFlow /></RequireStudent></PublicShell>} />
      <Route path="/admin/login" element={<PublicShell><RedirectIfAuthed role="admin"><AdminLogin /></RedirectIfAuthed></PublicShell>} />
      <Route path="/forgot-password" element={<PublicShell><ForgotPassword /></PublicShell>} />
      <Route path="/reset-password" element={<PublicShell><ResetPassword /></PublicShell>} />

      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/questions" element={<QuestionBank />} />
        <Route path="/admin/exams" element={<ExamsList />} />
        <Route path="/admin/exams/new" element={<ExamBuilder />} />
        <Route path="/admin/exams/:examId/edit" element={<ExamBuilder />} />
        <Route path="/admin/exams/:examId/publish" element={<PublishShareExam />} />
        <Route path="/admin/students" element={<StudentManagement />} />
        <Route path="/admin/queue" element={<QueueMonitoring />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/simulation" element={<SimulationMode />} />
        <Route path="/admin/super" element={<SuperAdmin />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/profile" element={<Profile />} />
        <Route path="/admin/help" element={<HelpCenter />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
