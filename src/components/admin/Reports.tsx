import React, { useState } from 'react';
import { FileDown, FileSpreadsheet, FileText, ClipboardList } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';

const reportTypes = [
  { id: 'attendance', title: 'Attendance Report', description: 'Who opened, logged in, and attempted each exam.' },
  { id: 'queue', title: 'Queue Report', description: 'Wait times, drop-offs, and peak load per exam.' },
  { id: 'exam', title: 'Exam Report', description: 'Question-level performance breakdown.' },
  { id: 'student', title: 'Student Report', description: 'Per-student history across all exams.' },
  { id: 'completion', title: 'Completion Report', description: 'Submission rates and pass/fail distribution.' },
  { id: 'server', title: 'Server Report', description: 'Load, uptime, and capacity utilization.' },
];

export const Reports: React.FC = () => {
  const { show } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);

  const exportAs = (reportId: string, format: string) => {
    setGenerating(reportId);
    setTimeout(() => {
      setGenerating(null);
      show({ tone: 'success', title: `${format.toUpperCase()} export ready`, description: 'Real report generation connects with the backend integration phase.' });
    }, 900);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 640 }}>
        Generate and export detailed reports as PDF, Excel, or CSV.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        {reportTypes.map(report => (
          <Card key={report.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--accent-subtle-bg)', color: 'var(--accent-9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClipboardList size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>{report.title}</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>{report.description}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="secondary" icon={<FileText size={13} />} loading={generating === report.id} onClick={() => exportAs(report.id, 'pdf')}>PDF</Button>
              <Button size="sm" variant="secondary" icon={<FileSpreadsheet size={13} />} loading={generating === report.id} onClick={() => exportAs(report.id, 'xlsx')}>Excel</Button>
              <Button size="sm" variant="secondary" icon={<FileDown size={13} />} loading={generating === report.id} onClick={() => exportAs(report.id, 'csv')}>CSV</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Exports</CardTitle>
            <CardDescription>Your last generated reports</CardDescription>
          </div>
        </CardHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { name: 'Attendance Report — Oct 2026.pdf', when: '2 hours ago' },
            { name: 'Completion Report — DSA-101.xlsx', when: 'Yesterday' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i === 0 ? '1px solid var(--border-subtle)' : 'none' }}>
              <span style={{ fontSize: 'var(--text-sm)' }}>{f.name}</span>
              <Badge tone="neutral">{f.when}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
