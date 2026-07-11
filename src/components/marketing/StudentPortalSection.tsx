import React from 'react';
import { Award, Clock, ListChecks } from 'lucide-react';
import { Section, Reveal } from './Reveal';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const StudentPortalSection: React.FC = () => (
  <Section id="student-portal">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
      <Reveal>
        <div>
          <Badge tone="accent" style={{ marginBottom: 16 }}>🎓 Student Portal</Badge>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.02em' }}>One account, every exam</h2>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
            Register once and your account persists — resume a waiting-room position or an in-progress exam even after
            closing the browser. A live question navigator, autosaved answers, and a clear pass/fail report make the
            whole experience feel like a real product, not a form.
          </p>
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <Card padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <Badge tone="success" dot>Live Now</Badge>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Points: 45</span>
          </div>
          <h4 style={{ fontSize: 'var(--text-lg)', marginBottom: 8, color: 'var(--text-primary)' }}>Data Structures & Algorithms Midterm</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 20 }}>Covers algorithmic complexities, linear/tree structures, and data filters.</p>
          <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}><Clock size={13} /> 15 mins</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}><ListChecks size={13} /> 3 questions</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}><Award size={13} /> Auto-graded</div>
          </div>
        </Card>
      </Reveal>
    </div>
  </Section>
);
