import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { Copy, Mail, MessageCircle, Share2, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { getExamDetail, publishExam, type ApiExam } from '../../api/admin';
import { ApiError } from '../../api/client';

const statusTone = { draft: 'neutral', published: 'success', unpublished: 'warning', archived: 'danger' } as const;

export const PublishShareExam: React.FC = () => {
  const { examId = '' } = useParams();
  const { show } = useToast();
  const [exam, setExam] = useState<ApiExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const link = exam ? `${window.location.origin}/exam/${exam.slug}` : '';

  const load = async () => {
    try {
      const data = await getExamDetail(examId);
      setExam(data);
    } catch (err) {
      show({ tone: 'danger', title: err instanceof ApiError ? err.message : 'Failed to load exam' });
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: refetch only when examId changes
  useEffect(() => { load(); }, [examId]);

  useEffect(() => {
    if (!link) return;
    QRCode.toDataURL(link, { width: 160, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [link]);

  const copyLink = () => {
    navigator.clipboard?.writeText(link)
      .then(() => show({ tone: 'success', title: 'Link copied to clipboard' }))
      .catch(() => show({ tone: 'danger', title: 'Could not copy — copy the link manually' }));
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: exam?.title ?? 'ExamFlow AI Exam', url: link });
      } catch {
        // user cancelled the native share sheet — not an error
      }
    } else {
      show({ tone: 'info', title: 'Sharing not supported on this browser', description: 'Use Copy, Email, or WhatsApp instead.' });
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const updated = await publishExam(examId);
      setExam(updated);
      show({ tone: 'success', title: 'Exam published' });
    } catch (err) {
      show({ tone: 'danger', title: err instanceof ApiError ? err.message : 'Failed to publish exam' });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading exam…</div>;
  }
  if (!exam) return null;

  const isPublished = exam.status === 'published';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 780 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Badge tone={statusTone[exam.status as keyof typeof statusTone] ?? 'neutral'} dot>{exam.status}</Badge>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {isPublished ? 'Exam is live and accepting students' : `"${exam.title}" is not published yet`}
        </span>
        {!isPublished && (
          <Button size="sm" onClick={handlePublish} loading={publishing} disabled={exam.question_count === 0}>
            Publish Now
          </Button>
        )}
      </div>
      {!isPublished && exam.question_count === 0 && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-9)' }}>Assign at least one question in the Exam Builder before publishing.</p>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Share this exam</CardTitle>
            <CardDescription>Send the link to students, or let them scan the QR code to open it on mobile.</CardDescription>
          </div>
        </CardHeader>

        <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: '1 1 320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--accent-9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {link}
              </div>
              <Button variant="secondary" icon={<Copy size={14} />} onClick={copyLink}>Copy</Button>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant="secondary" icon={<Share2 size={14} />} onClick={shareLink}>Share</Button>
              <Button variant="secondary" icon={<Mail size={14} />} onClick={() => window.open(`mailto:?subject=${encodeURIComponent('ExamFlow AI Exam Invitation')}&body=${encodeURIComponent(link)}`)}>Email</Button>
              <Button variant="secondary" icon={<MessageCircle size={14} />} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, '_blank')}>WhatsApp</Button>
            </div>

            {isPublished && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--success-9)', marginTop: 4 }}>
                <CheckCircle2 size={13} /> Link is live
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 'var(--space-4)', background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)' }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR code for ${link}`} width={140} height={140} style={{ borderRadius: 8 }} />
            ) : (
              <div style={{ width: 140, height: 140, borderRadius: 8, background: '#fff' }} />
            )}
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Scan to open</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>What happens next</CardTitle>
          </div>
        </CardHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[
            'Students open the link and are prompted to log in if needed.',
            'On Start Exam, the system checks capacity — students either enter immediately or join the Smart Waiting Lounge.',
            'When a slot frees up, the next waiting student is admitted automatically in FIFO order.',
          ].map((line, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-subtle-bg)', color: 'var(--accent-9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              {line}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
