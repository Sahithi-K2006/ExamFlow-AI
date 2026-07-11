import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Section, SectionHeading, Reveal } from './Reveal';
import { Card } from '../ui/Card';

const faqs = [
  { q: 'How does the FIFO queue decide who gets in next?', a: 'A Redis sorted set orders students by join time. The instant a slot frees up — a submission, an ejection, or a capacity increase — the longest-waiting student is admitted automatically and notified live over WebSockets.' },
  { q: 'What happens if my browser crashes mid-exam?', a: 'Your session and autosaved answers live server-side. Logging back in reconnects you to the exact same session, with a timer reflecting real elapsed time — refreshing can never reset your clock.' },
  { q: 'Can admins change capacity mid-exam?', a: 'Yes — capacity adjustments take effect immediately and the queue engine re-evaluates and admits waiting students on the spot if the new limit allows it.' },
  { q: 'Is student data secure?', a: 'Passwords are bcrypt-hashed, sessions are JWT-signed, and the admin and student portals are cryptographically separate — there is no login surface a student can use to reach admin tools.' },
];

export const FAQSection: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq">
      <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
      <Reveal>
        <Card padding="none" style={{ maxWidth: 760, margin: '0 auto' }}>
          {faqs.map((faq, i) => (
            <div key={faq.q} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                  padding: '20px 24px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'inherit', color: 'var(--text-primary)',
                }}
              >
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{faq.q}</span>
                <ChevronDown size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0, transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform var(--duration-fast) var(--ease-out)' }} />
              </button>
              {open === i && (
                <p style={{ padding: '0 24px 20px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>{faq.a}</p>
              )}
            </div>
          ))}
        </Card>
      </Reveal>
    </Section>
  );
};
