import React, { useEffect, useMemo, useState } from 'react';
import { Search, Download, Users, Mail, MoreHorizontal } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Table, Thead, Th, Tr, Td } from '../ui/Table';
import { Avatar } from '../ui/Avatar';
import { StatCard } from '../ui/StatCard';
import { EmptyState } from '../ui/EmptyState';
import { useToast } from '../ui/Toast';
import { listStudents, type ApiStudent } from '../../api/students';
import { ApiError } from '../../api/client';

const statusOf = (s: ApiStudent): 'active' | 'flagged' | 'inactive' => {
  if (s.exams_taken === 0) return 'inactive';
  if (s.avg_score !== null && s.avg_score < 40) return 'flagged';
  return 'active';
};

const statusTone = { active: 'success', flagged: 'danger', inactive: 'neutral' } as const;

const toCsv = (students: ApiStudent[]): string => {
  const header = ['Name', 'Email', 'Student ID', 'College', 'Exams Taken', 'Avg Score', 'Registered'];
  const rows = students.map(s => [s.name, s.email, s.student_id ?? '', s.college ?? '', String(s.exams_taken), s.avg_score !== null ? `${s.avg_score}%` : '', s.created_at]);
  return [header, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
};

export const StudentManagement: React.FC = () => {
  const { show } = useToast();
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setStudents(await listStudents());
      } catch (err) {
        show({ tone: 'danger', title: err instanceof ApiError ? err.message : 'Failed to load students' });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch once on mount only
  }, []);

  const filtered = useMemo(() => students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || (s.student_id ?? '').toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading students…</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Total Students" value={students.length} icon={Users} />
        <StatCard label="Active" value={students.filter(s => statusOf(s) === 'active').length} icon={Users} iconColor="var(--success-9)" />
        <StatCard label="Flagged" value={students.filter(s => statusOf(s) === 'flagged').length} icon={Users} iconColor="var(--danger-9)" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input className="form-input" placeholder="Search by name or enrollment ID…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, width: '100%' }} />
        </div>
        <Button variant="secondary" icon={<Download size={14} />} onClick={exportCsv} disabled={filtered.length === 0}>Export CSV</Button>
      </div>

      <Card padding="none">
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No students found" description={students.length === 0 ? 'No students have registered yet.' : 'Try a different search term.'} />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Student</Th>
                <Th>Enrollment ID</Th>
                <Th>Exams Taken</Th>
                <Th>Avg. Score</Th>
                <Th>Registered</Th>
                <Th>Status</Th>
                <Th style={{ textAlign: 'right' }}>Actions</Th>
              </tr>
            </Thead>
            <tbody>
              {filtered.map(s => {
                const status = statusOf(s);
                return (
                  <Tr key={s.id}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={s.name} size={30} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{s.email}</div>
                        </div>
                      </div>
                    </Td>
                    <Td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{s.student_id ?? '—'}</Td>
                    <Td>{s.exams_taken}</Td>
                    <Td style={{ fontWeight: 600, color: s.avg_score === null ? 'var(--text-tertiary)' : s.avg_score >= 50 ? 'var(--success-9)' : 'var(--danger-9)' }}>
                      {s.avg_score !== null ? `${s.avg_score}%` : '—'}
                    </Td>
                    <Td style={{ color: 'var(--text-tertiary)' }}>{new Date(s.created_at).toLocaleDateString()}</Td>
                    <Td><Badge tone={statusTone[status]} dot>{status}</Badge></Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Button size="sm" variant="ghost" icon={<Mail size={13} />} aria-label="Email student" onClick={() => window.open(`mailto:${s.email}`)} />
                        <Button size="sm" variant="ghost" icon={<MoreHorizontal size={13} />} aria-label="More actions" />
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};
