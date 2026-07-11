import React from 'react';
import { KeyRound, Lock, UserCheck, Eye, ShieldCheck, DatabaseZap } from 'lucide-react';
import { Section, SectionHeading, Reveal } from './Reveal';
import { Card } from '../ui/Card';

const items = [
  { icon: KeyRound, title: 'JWT Authentication', desc: 'Short-lived, signed tokens with role claims enforced on every protected route.' },
  { icon: Lock, title: 'bcrypt Password Hashing', desc: 'Passwords are never stored in plain text — salted and hashed server-side.' },
  { icon: UserCheck, title: 'Role-Based Access Control', desc: 'Students and admins are cryptographically separate; there is no shared login surface.' },
  { icon: Eye, title: 'Tab-Switch Proctoring', desc: 'Focus-loss events are logged and surfaced to administrators in real time.' },
  { icon: DatabaseZap, title: 'SQL Injection Protection', desc: 'Parameterized queries via SQLAlchemy ORM — no raw string interpolation, ever.' },
  { icon: ShieldCheck, title: 'XSS & CSRF Hardening', desc: 'React\'s default escaping plus bearer-token auth sidesteps the classic cross-site attack surface.' },
];

export const SecuritySection: React.FC = () => (
  <Section alt id="security">
    <SectionHeading eyebrow="Security" title="Built to survive an audit" description="Every layer of ExamFlow AI is designed around a simple rule: exam integrity cannot be optional." />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
      {items.map((item, i) => (
        <Reveal key={item.title} delay={i * 0.05}>
          <Card padding="md" style={{ display: 'flex', gap: 14, height: '100%' }}>
            <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--success-subtle-bg)', color: 'var(--success-9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <item.icon size={18} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 'var(--leading-normal)', marginTop: 2 }}>{item.desc}</div>
            </div>
          </Card>
        </Reveal>
      ))}
    </div>
  </Section>
);
