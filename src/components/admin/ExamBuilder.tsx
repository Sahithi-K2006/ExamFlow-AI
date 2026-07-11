import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ListChecks, Settings2, FileText, Plus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Field';
import { Badge } from '../ui/Badge';
import { Tabs } from '../ui/Tabs';
import { useToast } from '../ui/Toast';
import { listQuestions, type AdminQuestion } from '../../api/questions';
import { createExam, updateExam, getExamDetail, assignExamQuestions, publishExam, type ExamPayload } from '../../api/admin';
import { ApiError } from '../../api/client';

const steps = [
  { value: 'details', label: 'Details', icon: <FileText size={14} /> },
  { value: 'questions', label: 'Questions', icon: <ListChecks size={14} /> },
  { value: 'settings', label: 'Settings', icon: <Settings2 size={14} /> },
];

const toLocalInput = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (value: string): string | null => (value ? new Date(value).toISOString() : null);

const emptyForm: ExamPayload = {
  title: '',
  description: '',
  instructions: '',
  duration_minutes: 60,
  passing_marks: 40,
  negative_marking: false,
  random_question_order: false,
  random_option_order: false,
  max_active_students: 3,
  queue_capacity: 500,
  programming_languages: [],
  browser_restrictions: {},
  start_date: null,
  end_date: null,
};

export const ExamBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { show } = useToast();
  const [step, setStep] = useState('details');
  const [loading, setLoading] = useState(!!examId);
  const [saving, setSaving] = useState(false);
  const [currentExamId, setCurrentExamId] = useState<string | undefined>(examId);
  const [form, setForm] = useState<ExamPayload>(emptyForm);
  const [languagesInput, setLanguagesInput] = useState('');
  const [restrictionsInput, setRestrictionsInput] = useState('');
  const [questionBank, setQuestionBank] = useState<AdminQuestion[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [startLocal, setStartLocal] = useState('');
  const [endLocal, setEndLocal] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const bank = await listQuestions();
        setQuestionBank(bank);
      } catch (err) {
        show({ tone: 'danger', title: err instanceof ApiError ? err.message : 'Failed to load question bank' });
      }

      if (examId) {
        try {
          const exam = await getExamDetail(examId);
          setForm({
            title: exam.title,
            description: exam.description,
            instructions: exam.instructions,
            duration_minutes: exam.duration_minutes,
            passing_marks: exam.passing_marks,
            negative_marking: exam.negative_marking,
            random_question_order: exam.random_question_order,
            random_option_order: exam.random_option_order,
            max_active_students: exam.max_active_students,
            queue_capacity: exam.queue_capacity,
            programming_languages: exam.programming_languages,
            browser_restrictions: exam.browser_restrictions,
            start_date: exam.start_date,
            end_date: exam.end_date,
          });
          setLanguagesInput(exam.programming_languages.join(', '));
          setRestrictionsInput(typeof exam.browser_restrictions?.notes === 'string' ? (exam.browser_restrictions.notes as string) : '');
          setSelected(exam.question_ids);
          setStartLocal(toLocalInput(exam.start_date));
          setEndLocal(toLocalInput(exam.end_date));
        } catch (err) {
          show({ tone: 'danger', title: err instanceof ApiError ? err.message : 'Failed to load exam' });
        } finally {
          setLoading(false);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: refetch only when examId changes
  }, [examId]);

  const toggleQuestion = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const totalMarks = questionBank.filter(q => selected.includes(q.id)).reduce((sum, q) => sum + q.marks, 0);

  const buildPayload = (): ExamPayload => ({
    ...form,
    programming_languages: languagesInput.split(',').map(l => l.trim()).filter(Boolean),
    browser_restrictions: restrictionsInput ? { notes: restrictionsInput } : {},
    start_date: fromLocalInput(startLocal),
    end_date: fromLocalInput(endLocal),
  });

  const persist = async (): Promise<string | null> => {
    setSaving(true);
    try {
      const payload = buildPayload();
      let id = currentExamId;
      if (id) {
        await updateExam(id, payload);
      } else {
        const created = await createExam(payload);
        id = created.id;
        setCurrentExamId(id);
      }
      await assignExamQuestions(id!, selected);
      return id!;
    } catch (err) {
      show({ tone: 'danger', title: err instanceof ApiError ? err.message : 'Failed to save exam' });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    const id = await persist();
    if (!id) return;
    show({ tone: 'success', title: 'Exam saved as draft' });
    navigate(`/admin/exams/${id}/edit`, { replace: true });
  };

  const handlePublish = async () => {
    const id = await persist();
    if (!id) return;
    try {
      await publishExam(id);
      show({ tone: 'success', title: 'Exam published', description: 'Students can now access it via the shareable link.' });
      navigate(`/admin/exams/${id}/publish`);
    } catch (err) {
      show({ tone: 'danger', title: err instanceof ApiError ? err.message : 'Failed to publish exam' });
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading exam…</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/admin/exams')}>Back to Exams</Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <Tabs items={steps} value={step} onChange={setStep} />
        <Badge tone="neutral">{currentExamId ? 'Editing draft' : 'New exam'}</Badge>
      </div>

      {step === 'details' && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input label="Exam Title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. DSA-101 Midterm" />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this exam cover?" />
          <Textarea label="Instructions for students" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Shown before the student starts the exam…" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            <Input label="Duration (minutes)" type="number" required value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} />
            <Input label="Passing Marks" type="number" required value={form.passing_marks} onChange={e => setForm(f => ({ ...f, passing_marks: Number(e.target.value) }))} />
            <Select label="Negative Marking" value={form.negative_marking ? 'on' : 'off'} onChange={e => setForm(f => ({ ...f, negative_marking: e.target.value === 'on' }))}>
              <option value="off">Disabled</option>
              <option value="on">Enabled</option>
            </Select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Start Date & Time" type="datetime-local" value={startLocal} onChange={e => setStartLocal(e.target.value)} />
            <Input label="End Date & Time" type="datetime-local" value={endLocal} onChange={e => setEndLocal(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button icon={<ArrowRight size={15} />} iconPosition="right" onClick={() => setStep('questions')}>Next: Questions</Button>
          </div>
        </Card>
      )}

      {step === 'questions' && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Select questions from the bank</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{selected.length} selected · {totalMarks} total marks</p>
            </div>
            <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => navigate('/admin/questions')}>New Question</Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {questionBank.length === 0 && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No questions in the bank yet — create one first.</p>
            )}
            {questionBank.map(q => {
              const active = selected.includes(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => toggleQuestion(q.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    border: `1px solid ${active ? 'var(--accent-9)' : 'var(--border-subtle)'}`,
                    background: active ? 'var(--accent-subtle-bg)' : 'var(--surface-2)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    transition: 'all var(--duration-fast) var(--ease-out)',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${active ? 'var(--accent-9)' : 'var(--border-strong)'}`,
                    background: active ? 'var(--accent-9)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {active && <Check size={12} color="#fff" />}
                  </div>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{q.question_text}</span>
                  <Badge tone="neutral">{q.type}</Badge>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', width: 50, textAlign: 'right' }}>{q.marks} pts</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="secondary" icon={<ArrowLeft size={15} />} onClick={() => setStep('details')}>Back</Button>
            <Button icon={<ArrowRight size={15} />} iconPosition="right" onClick={() => setStep('settings')}>Next: Settings</Button>
          </div>
        </Card>
      )}

      {step === 'settings' && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Maximum Active Students" type="number" value={form.max_active_students} onChange={e => setForm(f => ({ ...f, max_active_students: Number(e.target.value) }))} hint="Concurrent exam slots (FIFO queue engine)" />
            <Input label="Queue Capacity" type="number" value={form.queue_capacity} onChange={e => setForm(f => ({ ...f, queue_capacity: Number(e.target.value) }))} hint="Max students allowed to wait" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Select label="Random Question Order" value={form.random_question_order ? 'on' : 'off'} onChange={e => setForm(f => ({ ...f, random_question_order: e.target.value === 'on' }))}>
              <option value="off">Fixed order</option>
              <option value="on">Randomized</option>
            </Select>
            <Select label="Random Option Order" value={form.random_option_order ? 'on' : 'off'} onChange={e => setForm(f => ({ ...f, random_option_order: e.target.value === 'on' }))}>
              <option value="off">Fixed order</option>
              <option value="on">Randomized</option>
            </Select>
          </div>
          <Input label="Allowed Programming Languages" placeholder="JavaScript, Python, SQL" hint="Comma-separated, applies to coding questions" value={languagesInput} onChange={e => setLanguagesInput(e.target.value)} />
          <Textarea label="Browser Restrictions" placeholder="e.g. Disallow tab switching, fullscreen required…" value={restrictionsInput} onChange={e => setRestrictionsInput(e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="secondary" icon={<ArrowLeft size={15} />} onClick={() => setStep('questions')}>Back</Button>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={handleSaveDraft} loading={saving}>Save Draft</Button>
              <Button icon={<Check size={15} />} onClick={handlePublish} loading={saving}>Publish Exam</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
