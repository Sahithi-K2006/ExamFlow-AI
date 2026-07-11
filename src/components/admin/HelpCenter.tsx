import React, { useState } from 'react';
import { Search, BookOpen, Users, Zap, Shield, Mail, ChevronDown } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const categories = [
  { icon: BookOpen, title: 'Getting Started', description: 'Create your first exam and question bank' },
  { icon: Users, title: 'Student Management', description: 'Track and manage student accounts' },
  { icon: Zap, title: 'Queue Engine', description: 'How the FIFO waiting lounge works' },
  { icon: Shield, title: 'Security & Proctoring', description: 'Access control and exam integrity' },
];

const faqs = [
  { q: 'How does the waiting queue decide who gets in next?', a: 'ExamFlow AI uses a strict FIFO (first-in, first-out) queue backed by Redis. The moment a slot frees up — a student submits, is force-exited, or capacity is increased — the longest-waiting student is admitted automatically, in real time, with no page refresh required.' },
  { q: 'Can I change the number of concurrent exam slots mid-exam?', a: 'Yes. Adjust the capacity slider on the Queue Monitoring page at any time. The queue engine immediately re-evaluates and admits waiting students if the new capacity allows it.' },
  { q: 'What happens if a student\'s browser crashes mid-exam?', a: 'Their session and all autosaved answers are preserved server-side. When they log back in, they\'re automatically reconnected to the exact same session — same questions, same answers, and a timer that reflects real elapsed time, not a reset clock.' },
  { q: 'How is negative marking calculated?', a: 'Each question can carry its own negative-marks value, configured in the Question Bank. When negative marking is enabled for an exam, an incorrect answer subtracts that value from the student\'s score for that question.' },
];

export const HelpCenter: React.FC = () => {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', maxWidth: 860 }}>
      <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
        <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>How can we help?</h2>
        <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            className="form-input"
            placeholder="Search help articles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40, width: '100%', fontSize: 'var(--text-base)', padding: '13px 14px 13px 40px' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        {categories.map(cat => (
          <Card key={cat.title} interactive padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--accent-subtle-bg)', color: 'var(--accent-9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <cat.icon size={19} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>{cat.title}</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 4 }}>{cat.description}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card padding="none">
        <div style={{ padding: 'var(--space-6) var(--space-6) 0' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Frequently Asked Questions</h3>
        </div>
        <div>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)',
                  padding: 'var(--space-5) var(--space-6)', background: 'transparent', border: 'none', cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'inherit', color: 'var(--text-primary)',
                }}
              >
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{faq.q}</span>
                <ChevronDown size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform var(--duration-fast) var(--ease-out)' }} />
              </button>
              {openFaq === i && (
                <p style={{ padding: '0 var(--space-6) var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Still need help?</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Our support team typically responds within a few hours.</p>
        </div>
        <Button icon={<Mail size={15} />} onClick={() => window.open('mailto:support@examflow.ai')}>Contact Support</Button>
      </Card>
    </div>
  );
};
