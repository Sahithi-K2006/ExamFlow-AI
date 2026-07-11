import React from 'react';
import { LayoutDashboard, BookOpen, FileText, Activity, BarChart3, Zap } from 'lucide-react';
import { Section, Reveal } from './Reveal';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

const items = [
  { icon: LayoutDashboard, label: 'Live Dashboard' },
  { icon: BookOpen, label: 'Question Bank' },
  { icon: FileText, label: 'Exam Builder' },
  { icon: Activity, label: 'Queue Monitoring' },
  { icon: BarChart3, label: 'Analytics & Reports' },
  { icon: Zap, label: 'Load Simulation' },
];

export const AdminPortalSection: React.FC = () => (
  <Section alt id="admin-portal">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
      <Reveal>
        <Card padding="lg">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {items.map(item => (
              <div key={item.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '18px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <item.icon size={20} color="var(--accent-9)" />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>
      <Reveal delay={0.1}>
        <div>
          <Badge tone="accent" style={{ marginBottom: 16 }}>🛡 Admin Portal</Badge>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.02em' }}>Complete control, one screen away</h2>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
            Build exams from a reusable question bank, publish with a shareable link and QR code, watch the queue move
            in real time, and export institution-grade reports — all from a single, restricted-access portal that
            students can never authenticate into.
          </p>
        </div>
      </Reveal>
    </div>
  </Section>
);
