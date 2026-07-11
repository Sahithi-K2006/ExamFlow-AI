import React from 'react';
import { Activity, Sparkles, BarChart3, ShieldCheck, Zap, Users } from 'lucide-react';
import { Section, SectionHeading, Reveal } from './Reveal';
import { Card } from '../ui/Card';

const features = [
  { icon: Activity, title: 'Real-Time Queue Engine', desc: 'A Redis-backed FIFO queue admits students the instant a slot frees up — no refresh, no polling, pushed live over WebSockets.', color: 'var(--accent-9)' },
  { icon: Sparkles, title: 'AI-Powered Recommendations', desc: 'Machine learning estimates wait times from historical load, and an NLP assistant helps students prepare while they wait.', color: 'var(--info-9)' },
  { icon: Users, title: 'Smart Waiting Lounge', desc: 'Replace a static spinner with a live position tracker, practice sandbox, and AI chat — waiting becomes productive.', color: 'var(--success-9)' },
  { icon: BarChart3, title: 'Enterprise Analytics', desc: 'Attendance, completion, queue-health, and performance dashboards with PDF/Excel/CSV export, built for administrators.', color: 'var(--warning-9)' },
  { icon: ShieldCheck, title: 'Bank-Grade Security', desc: 'JWT auth, bcrypt password hashing, role-based access control, and tab-switch proctoring keep every exam session honest.', color: 'var(--danger-9)' },
  { icon: Zap, title: 'Instant Admission', desc: 'The moment a student submits, the next person in line is admitted automatically — fairness enforced by design, not by luck.', color: 'var(--accent-9)' },
];

export const Features: React.FC = () => (
  <Section id="features">
    <SectionHeading eyebrow="Platform" title="Everything a high-stakes exam needs" description="Built for institutions running thousands of concurrent test-takers without the infrastructure headaches." />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
      {features.map((f, i) => (
        <Reveal key={f.title} delay={i * 0.06}>
          <Card padding="lg" interactive style={{ height: '100%' }}>
            <div style={{ width: 46, height: 46, borderRadius: 'var(--radius-lg)', background: `color-mix(in srgb, ${f.color} 14%, transparent)`, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <f.icon size={22} />
            </div>
            <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)', marginBottom: 8 }}>{f.title}</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>{f.desc}</p>
          </Card>
        </Reveal>
      ))}
    </div>
  </Section>
);
