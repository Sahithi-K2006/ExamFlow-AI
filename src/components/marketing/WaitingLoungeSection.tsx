import React from 'react';
import { Terminal, HelpCircle, Wifi } from 'lucide-react';
import { Section, SectionHeading, Reveal } from './Reveal';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const WaitingLoungeSection: React.FC = () => (
  <Section alt id="waiting-lounge">
    <SectionHeading eyebrow="Smart Waiting Lounge" title="Waiting that doesn't feel like waiting" description="No more static 'please wait' screens. Students get a live position tracker, a practice sandbox, and an AI assistant — all while the queue moves in real time." />
    <Reveal>
      <Card padding="none" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', minHeight: 320 }}>
          <div style={{ padding: 32, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 130, height: 130 }}>
              <svg width="130" height="130" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--accent-9)" strokeWidth="8" strokeDasharray="283" strokeDashoffset="120" strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>#4</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>of 12 waiting</div>
              </div>
            </div>
            <Badge tone="info"><Wifi size={10} /> Live position updates</Badge>
          </div>

          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--accent-subtle-bg)', color: 'var(--accent-9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Terminal size={18} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>Mini Practice IDE</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Warm up with a scratch coding sandbox before the real thing starts.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--info-subtle-bg)', color: 'var(--info-9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HelpCircle size={18} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>AI Prep Assistant</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Ask syllabus questions and get instant, contextual answers.</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Reveal>
  </Section>
);
