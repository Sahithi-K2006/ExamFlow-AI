import React from 'react';
import { Link2, LogIn, Hourglass, CheckCircle2, Send } from 'lucide-react';
import { Section, SectionHeading, Reveal } from './Reveal';

const steps = [
  { icon: Link2, title: 'Open the exam link', desc: 'A student receives a unique exam link and opens it — no app install required.' },
  { icon: LogIn, title: 'Sign in', desc: 'If not already signed in, the student logs into their persistent ExamFlow account.' },
  { icon: Hourglass, title: 'Enter or wait', desc: 'The system checks live capacity. A free slot means instant entry; otherwise, a FIFO position in the Smart Waiting Lounge.' },
  { icon: CheckCircle2, title: 'Auto-admitted', desc: 'The moment a slot frees up, the next student is admitted automatically — pushed live, no refresh needed.' },
  { icon: Send, title: 'Submit & get graded', desc: 'Answers are locked, auto-graded where possible, and the next waiting student is admitted in the same instant.' },
];

export const HowItWorks: React.FC = () => (
  <Section alt id="how-it-works">
    <SectionHeading eyebrow="Process" title="How it works" description="Five steps between a traffic spike and a fair, orderly exam session." />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 720, margin: '0 auto' }}>
      {steps.map((step, i) => (
        <Reveal key={step.title} delay={i * 0.08}>
          <div style={{ display: 'flex', gap: 20, paddingBottom: i === steps.length - 1 ? 0 : 32, position: 'relative' }}>
            {i !== steps.length - 1 && (
              <div style={{ position: 'absolute', left: 23, top: 48, bottom: 0, width: 2, background: 'var(--border-subtle)' }} />
            )}
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-9)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-sm)', zIndex: 1,
            }}>
              <step.icon size={21} />
            </div>
            <div style={{ paddingTop: 8 }}>
              <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)', marginBottom: 6 }}>{step.title}</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>{step.desc}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  </Section>
);
