import React from 'react';
import { Quote } from 'lucide-react';
import { Section, SectionHeading, Reveal } from './Reveal';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';

// Placeholder testimonials — replace with real quotes once available.
const testimonials = [
  { name: 'Dr. Aditi Rao', role: 'Dean of Examinations, placeholder university', quote: 'Our servers used to fall over every midterm. ExamFlow AI turned that into a non-event.' },
  { name: 'Marcus Chen', role: 'IT Director, placeholder institute', quote: 'The waiting lounge alone cut our support tickets in half — students finally understand what\'s happening.' },
  { name: 'Priya Nandakumar', role: 'Computer Science Faculty, placeholder college', quote: 'Setting up an exam and getting a shareable link took minutes, not a ticket to IT.' },
];

export const TestimonialsSection: React.FC = () => (
  <Section alt id="testimonials">
    <SectionHeading eyebrow="Testimonials" title="Trusted by institutions like yours" description="Placeholder quotes — swap in real feedback once you have it." />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
      {testimonials.map((t, i) => (
        <Reveal key={t.name} delay={i * 0.08}>
          <Card padding="lg" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Quote size={22} color="var(--accent-9)" style={{ opacity: 0.5 }} />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)', flex: 1 }}>"{t.quote}"</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              <Avatar name={t.name} size={34} />
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{t.role}</div>
              </div>
            </div>
          </Card>
        </Reveal>
      ))}
    </div>
  </Section>
);
