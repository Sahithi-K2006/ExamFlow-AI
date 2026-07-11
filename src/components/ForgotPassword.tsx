import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, Info } from 'lucide-react';
import { Card } from './ui/Card';
import { Input } from './ui/Field';
import { Button } from './ui/Button';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No password-reset endpoint exists yet — this is the UI shell, ready to wire up
    // once the backend exposes a real "request reset" route. Deliberately not faking
    // a success email here.
    setSubmitted(true);
  };

  return (
    <div className="grid-background" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '48px 20px', minHeight: '100vh' }}>
      <Card padding="lg" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-lg)', background: 'var(--accent-9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <KeyRound size={24} />
          </div>
        </div>
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 6, textAlign: 'center', color: 'var(--text-primary)' }}>Forgot your password?</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 26, textAlign: 'center' }}>
          Enter your account email and we'll send you a link to reset your password.
        </p>

        {submitted ? (
          <div style={{ display: 'flex', gap: 10, background: 'var(--info-subtle-bg)', border: '1px solid var(--info-subtle-border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
            <Info size={16} color="var(--info-9)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              Password reset isn't connected to a server yet — this screen is ready to send a real reset email once
              backend integration resumes.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input label="Email Address" type="email" required placeholder="you@university.edu" value={email} onChange={e => setEmail(e.target.value)} />
            <Button type="submit" fullWidth>Send Reset Link</Button>
          </form>
        )}

        <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to Sign In
        </Link>
      </Card>
    </div>
  );
};
