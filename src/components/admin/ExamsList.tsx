import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal, Copy, Archive, Share2, Pencil, Users, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { useToast } from '../ui/Toast';
import { listExams, publishExam, unpublishExam, archiveExam, duplicateExam, type ApiExam } from '../../api/admin';
import { ApiError } from '../../api/client';

const statusTone = { draft: 'neutral', published: 'success', unpublished: 'warning', archived: 'danger' } as const;

export const ExamsList: React.FC = () => {
  const navigate = useNavigate();
  const { show } = useToast();
  const [exams, setExams] = useState<ApiExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setExams(await listExams());
    } catch (err) {
      show({ tone: 'danger', title: err instanceof ApiError ? err.message : 'Failed to load exams' });
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch once on mount only
  useEffect(() => { load(); }, []);

  const togglePublish = async (exam: ApiExam) => {
    setOpenMenu(null);
    try {
      if (exam.status === 'published') {
        await unpublishExam(exam.id);
        show({ tone: 'success', title: 'Exam unpublished' });
      } else {
        await publishExam(exam.id);
        show({ tone: 'success', title: 'Exam published' });
      }
      await load();
    } catch (err) {
      show({ tone: 'danger', title: err instanceof ApiError ? err.message : 'Failed to update exam' });
    }
  };

  const toggleArchive = async (exam: ApiExam) => {
    setOpenMenu(null);
    try {
      if (exam.status === 'archived') {
        await unpublishExam(exam.id);
      } else {
        await archiveExam(exam.id);
      }
      show({ tone: 'success', title: exam.status === 'archived' ? 'Exam restored' : 'Exam archived' });
      await load();
    } catch (err) {
      show({ tone: 'danger', title: err instanceof ApiError ? err.message : 'Failed to update exam' });
    }
  };

  const duplicate = async (exam: ApiExam) => {
    setOpenMenu(null);
    try {
      await duplicateExam(exam.id);
      show({ tone: 'success', title: 'Exam duplicated' });
      await load();
    } catch (err) {
      show({ tone: 'danger', title: err instanceof ApiError ? err.message : 'Failed to duplicate exam' });
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading exams…</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 560 }}>
          Create, configure, and publish exams. Once published, a shareable link and QR code are generated automatically.
        </p>
        <Button icon={<Plus size={16} />} onClick={() => navigate('/admin/exams/new')}>Create Exam</Button>
      </div>

      {exams.length === 0 ? (
        <Card><EmptyState icon={Clock} title="No exams yet" description="Create your first exam to get started." action={<Button onClick={() => navigate('/admin/exams/new')} icon={<Plus size={14} />}>Create Exam</Button>} /></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {exams.map(exam => (
            <Card key={exam.id} padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Badge tone={statusTone[exam.status as keyof typeof statusTone] ?? 'neutral'} dot>{exam.status}</Badge>
                <div style={{ position: 'relative' }}>
                  <Button size="sm" variant="ghost" icon={<MoreHorizontal size={15} />} aria-label="Exam actions" onClick={() => setOpenMenu(openMenu === exam.id ? null : exam.id)} />
                  {openMenu === exam.id && (
                    <div style={{ position: 'absolute', right: 0, top: '110%', background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 10, minWidth: 170, overflow: 'hidden' }}>
                      {[
                        { label: 'Edit', icon: Pencil, action: () => navigate(`/admin/exams/${exam.id}/edit`) },
                        { label: 'Publish & Share', icon: Share2, action: () => navigate(`/admin/exams/${exam.id}/publish`) },
                        { label: 'Duplicate', icon: Copy, action: () => duplicate(exam) },
                        { label: exam.status === 'archived' ? 'Restore' : 'Archive', icon: Archive, action: () => toggleArchive(exam) },
                      ].map(item => (
                        <button key={item.label} onClick={item.action} style={menuItemStyle}>
                          <item.icon size={13} /> {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>{exam.title}</h3>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  {exam.start_date ? new Date(exam.start_date).toLocaleString() : 'No start date set'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                <span>{exam.question_count} questions</span>
                <span>{exam.duration_minutes} min</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} /> {exam.max_active_students} slots</span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {exam.status === 'published' ? (
                  <Button size="sm" variant="secondary" fullWidth onClick={() => togglePublish(exam)}>Unpublish</Button>
                ) : (
                  <Button size="sm" variant="secondary" fullWidth onClick={() => togglePublish(exam)}>Publish</Button>
                )}
                <Button size="sm" fullWidth icon={<Share2 size={13} />} onClick={() => navigate(`/admin/exams/${exam.id}/publish`)}>Share</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '9px 14px',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'var(--font-sans)',
};
