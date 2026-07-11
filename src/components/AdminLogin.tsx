import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, AlertCircle } from 'lucide-react';
import { useApp } from '../state';
import { Card } from './ui/Card';
import { Input } from './ui/Field';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';

export const AdminLogin: React.FC = () => {
  const { loginAdmin, authError, clearAuthError } = useApp();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { message?: string } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setSubmitting(true);
    const ok = await loginAdmin(email, password, rememberMe);
    setSubmitting(false);
    if (ok) {
      navigate('/admin', { replace: true });
    }
  };

  const errorMessage = authError || location.state?.message;

  return (
    <div className="grid-background" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '48px 20px' }}>
      <Card padding="lg" style={{ width: '100%', maxWidth: 420 }} className="animate-scale-in">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-lg)', background: 'var(--accent-9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: 'var(--shadow-accent)',
          }}>
            <Shield size={24} />
          </div>
        </div>
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 6, textAlign: 'center', color: 'var(--text-primary)' }}>Administrator Sign-In</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 26, textAlign: 'center' }}>
          Restricted access — only predefined administrator credentials are accepted.
        </p>

        {errorMessage && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'var(--danger-subtle-bg)',
            border: '1px solid var(--danger-subtle-border)', borderRadius: 'var(--radius-md)', padding: '11px 14px',
            color: 'var(--danger-9)', fontSize: 'var(--text-sm)', marginBottom: 18,
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} /> {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Admin Email" type="email" placeholder="admin@examflow.ai" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          <Checkbox checked={rememberMe} onChange={setRememberMe} label="Remember me on this device" />
          <Button type="submit" fullWidth loading={submitting} style={{ marginTop: 6 }}>
            {submitting ? 'Verifying' : 'Access Admin Portal'}
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          Not an administrator? <Link to="/login" style={{ color: 'var(--accent-9)', fontWeight: 600, textDecoration: 'none' }}>Go to Student Login</Link>
        </div>
      </Card>
    </div>
  );
};
