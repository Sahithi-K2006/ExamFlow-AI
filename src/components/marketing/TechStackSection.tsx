import React from 'react';
import { Section, SectionHeading, Reveal } from './Reveal';

const stack = [
  'React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Redis', 'WebSockets', 'JWT', 'Vite',
];

export const TechStackSection: React.FC = () => (
  <Section id="tech-stack">
    <SectionHeading eyebrow="Technology" title="Production infrastructure, not a prototype" description="A real-time backend built on the same stack trusted by high-concurrency systems everywhere." />
    <Reveal>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {stack.map(tech => (
          <div key={tech} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-full)', background: 'var(--surface-1)',
            border: '1px solid var(--border-default)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-xs)',
          }}>
            {tech}
          </div>
        ))}
      </div>
    </Reveal>
  </Section>
);
