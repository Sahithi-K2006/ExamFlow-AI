import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Info } from 'lucide-react';
import { Card } from './ui/Card';
import { Input } from './ui/Field';
import { Button } from './ui/Button';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    // No password-reset endpoint exists yet — UI shell only, see ForgotPassword.tsx.
    setSubmitted(true);
  };

  return (
    <div className="grid-background" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '48px 20px', minHeight: '100vh' }}>
      <Card padding="lg" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-lg)', background: 'var(--accent-9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <ShieldCheck size={24} />
          </div>
        </div>
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 6, textAlign: 'center', color: 'var(--text-primary)' }}>Reset your password</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 26, textAlign: 'center' }}>
          Choose a new password for your account.
        </p>

        {!token && (
          <div style={{ display: 'flex', gap: 10, background: 'var(--warning-subtle-bg)', border: '1px solid var(--warning-subtle-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 18, fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
            <Info size={14} color="var(--warning-9)" style={{ flexShrink: 0, marginTop: 1 }} />
            No reset token found in the URL — in production this page is only reached via the link in a reset email.
          </div>
        )}

        {submitted ? (
          <div style={{ display: 'flex', gap: 10, background: 'var(--info-subtle-bg)', border: '1px solid var(--info-subtle-border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
            <Info size={16} color="var(--info-9)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              Password reset isn't connected to a server yet — this screen is ready to submit a real reset once
              backend integration resumes.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {error && (
              <div style={{ background: 'var(--danger-subtle-bg)', border: '1px solid var(--danger-subtle-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--danger-9)', fontSize: 'var(--text-sm)' }}>
                {error}
              </div>
            )}
            <Input label="New Password" type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            <Input label="Confirm New Password" type="password" required placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            <Button type="submit" fullWidth>Reset Password</Button>
          </form>
        )}

        <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to Sign In
        </Link>
      </Card>
    </div>
  );
};
