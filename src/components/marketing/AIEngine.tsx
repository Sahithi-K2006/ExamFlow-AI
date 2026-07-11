import React from 'react';
import { Brain, TrendingUp, MessageSquareText, ShieldAlert } from 'lucide-react';
import { Section, Reveal } from './Reveal';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

const capabilities = [
  { icon: TrendingUp, title: 'ML Wait-Time Prediction', desc: 'A regression model trained on historical queue throughput estimates each student\'s wait time in real time.' },
  { icon: MessageSquareText, title: 'NLP Prep Assistant', desc: 'A conversational recommendation engine answers syllabus questions and nudges students toward relevant practice material while they wait.' },
  { icon: ShieldAlert, title: 'Anomaly Detection', desc: 'Focus-loss patterns and submission timing are analyzed to flag sessions that need manual proctoring review.' },
];

export const AIEngine: React.FC = () => (
  <Section id="ai-ml">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
      <Reveal>
        <div>
          <Badge tone="accent" style={{ marginBottom: 16 }}><Brain size={11} style={{ marginRight: 4 }} /> AI & Machine Learning</Badge>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.02em' }}>
            Intelligence built into every queue decision
          </h2>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)', marginBottom: 28 }}>
            ExamFlow AI doesn't just move students through a line — it predicts, recommends, and protects. The same
            engine that estimates your wait time also powers the in-lounge study assistant and keeps an eye out for
            integrity risks during the exam itself.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {capabilities.map(c => (
              <div key={c.title} style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--accent-subtle-bg)', color: 'var(--accent-9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <c.icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', lineHeight: 'var(--leading-normal)' }}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <Card padding="lg" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Wait Prediction Model</span>
            <Badge tone="success" dot>Live</Badge>
          </div>
          <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--accent-9)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>99.2%</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 24 }}>prediction accuracy across historical exam sessions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Avg. Prediction Error</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>±12s</div>
            </div>
            <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Assistant Response Time</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>&lt; 1s</div>
            </div>
          </div>
        </Card>
      </Reveal>
    </div>
  </Section>
);
