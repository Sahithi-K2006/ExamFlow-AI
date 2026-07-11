import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Copy, Trash2, ListChecks, Code2, Database, Type, MessageSquare, AlignLeft, CheckSquare } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Table, Thead, Th, Tr, Td } from '../ui/Table';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import { Input, Select, Textarea } from '../ui/Field';
import { useToast } from '../ui/Toast';
import {
  listQuestions, createQuestion, updateQuestion, deleteQuestion, duplicateQuestion, uploadQuestionImage,
  type AdminQuestion, type QuestionType, type QuestionPayload,
} from '../../api/questions';
import { ApiError } from '../../api/client';

const typeConfig: Record<QuestionType, { label: string; icon: React.ElementType }> = {
  mcq: { label: 'MCQ', icon: ListChecks },
  multiple_correct: { label: 'Multiple Correct', icon: CheckSquare },
  coding: { label: 'Coding', icon: Code2 },
  sql: { label: 'SQL', icon: Database },
  fill_blank: { label: 'Fill Blank', icon: Type },
  short_answer: { label: 'Short Answer', icon: MessageSquare },
  descriptive: { label: 'Descriptive', icon: AlignLeft },
};

const difficultyTone = { easy: 'success', medium: 'warning', hard: 'danger' } as const;

const emptyForm: QuestionPayload = {
  type: 'mcq',
  question_text: '',
  subject: '',
  topic: '',
  difficulty: 'medium',
  marks: 10,
  negative_marks: 0,
  tags: [],
  explanation: '',
};

export const QuestionBank: React.FC = () => {
  const { show } = useToast();
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | QuestionType>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionPayload>(emptyForm);
  const [tagsInput, setTagsInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listQuestions();
      setQuestions(data);
    } catch (err) {
      show({ tone: 'danger', title: err instanceof ApiError ? err.message : 'Failed to load questions' });
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch once on mount only
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => questions.filter(q => {
    const haystack = `${q.question_text} ${q.subject ?? ''} ${q.topic ?? ''}`.toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || q.type === typeFilter;
    return matchesSearch && matchesType;
  }), [questions, search, typeFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setTagsInput('');
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = (q: AdminQuestion) => {
    setEditingId(q.id);
    setForm({
      type: q.type,
      question_text: q.question_text,
      subject: q.subject ?? '',
      topic: q.topic ?? '',
      difficulty: q.difficulty,
      marks: q.marks,
      negative_marks: q.negative_marks,
      tags: q.tags,
      explanation: q.explanation ?? '',
      programming_language: q.programming_language ?? undefined,
    });
    setTagsInput(q.tags.join(', '));
    setImageFile(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: QuestionPayload = {
        ...form,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      };
      let saved: AdminQuestion;
      if (editingId) {
        saved = await updateQuestion(editingId, payload);
      } else {
        saved = await createQuestion(payload);
      }
      if (imageFile) {
        saved = await uploadQuestionImage(saved.id, imageFile);
      }
      setModalOpen(false);
      show({ tone: 'success', title: editingId ? 'Question updated' : 'Question created' });
      await load();
    } catch (err) {
      show({ tone: 'danger', title: err instanceof Error ? err.message : 'Failed to save question' });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (q: AdminQuestion) => {
    try {
      await duplicateQuestion(q.id);
      show({ tone: 'success', title: 'Question duplicated' });
      await load();
    } catch (err) {
      show({ tone: 'danger', title: err instanceof ApiError ? err.message : 'Failed to duplicate question' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      show({ tone: 'info', title: 'Question removed' });
    } catch (err) {
      show({ tone: 'danger', title: err instanceof ApiError ? err.message : 'Failed to delete question' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 560 }}>
          Create and manage reusable questions across all seven supported types. Attach questions to any exam from the exam builder.
        </p>
        <Button icon={<Plus size={16} />} onClick={openCreate}>New Question</Button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            className="form-input"
            placeholder="Search questions or subjects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36, width: '100%' }}
          />
        </div>
        <select className="form-input" value={typeFilter} onChange={e => setTypeFilter(e.target.value as QuestionType | 'all')} style={{ width: 200 }}>
          <option value="all">All types</option>
          {Object.entries(typeConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
        </select>
      </div>

      <Card padding="none">
        {loading ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading questions…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ListChecks} title="No questions found" description="Try a different search term or filter, or create a new question." action={<Button size="sm" onClick={openCreate} icon={<Plus size={14} />}>New Question</Button>} />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Question</Th>
                <Th>Type</Th>
                <Th>Subject / Topic</Th>
                <Th>Difficulty</Th>
                <Th>Marks</Th>
                <Th style={{ textAlign: 'right' }}>Actions</Th>
              </tr>
            </Thead>
            <tbody>
              {filtered.map(q => {
                const TypeIcon = typeConfig[q.type].icon;
                const difficulty = (q.difficulty in difficultyTone ? q.difficulty : 'medium') as keyof typeof difficultyTone;
                return (
                  <Tr key={q.id}>
                    <Td style={{ maxWidth: 340 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{q.question_text}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                        {q.tags.map(t => <Badge key={t} tone="neutral">{t}</Badge>)}
                      </div>
                    </Td>
                    <Td>
                      <Badge tone="accent"><TypeIcon size={11} style={{ marginRight: 4 }} />{typeConfig[q.type].label}</Badge>
                    </Td>
                    <Td>
                      <div style={{ fontWeight: 500 }}>{q.subject || '—'}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{q.topic}</div>
                    </Td>
                    <Td><Badge tone={difficultyTone[difficulty]}>{q.difficulty}</Badge></Td>
                    <Td>
                      <span style={{ fontWeight: 600 }}>{q.marks}</span>
                      {q.negative_marks > 0 && <span style={{ color: 'var(--danger-9)', fontSize: 'var(--text-xs)' }}> / -{q.negative_marks}</span>}
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Button size="sm" variant="ghost" icon={<Pencil size={13} />} aria-label="Edit question" onClick={() => openEdit(q)} />
                        <Button size="sm" variant="ghost" icon={<Copy size={13} />} aria-label="Duplicate question" onClick={() => handleDuplicate(q)} />
                        <Button size="sm" variant="ghost" icon={<Trash2 size={13} />} aria-label="Delete question" onClick={() => handleDelete(q.id)} />
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Question' : 'New Question'}
        description="Changes are saved to the question bank immediately."
        width={640}
        footer={<>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Save Question</Button>
        </>}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Select label="Question Type" required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as QuestionType }))}>
              {Object.entries(typeConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
            </Select>
            <Select label="Difficulty" required value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </div>
          <Textarea label="Question Text" required placeholder="Enter the question…" value={form.question_text} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Subject" placeholder="e.g. Algorithms" value={form.subject ?? ''} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
            <Input label="Topic" placeholder="e.g. Binary Search" value={form.topic ?? ''} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Marks" type="number" value={form.marks} onChange={e => setForm(f => ({ ...f, marks: Number(e.target.value) }))} />
            <Input label="Negative Marks" type="number" value={form.negative_marks} onChange={e => setForm(f => ({ ...f, negative_marks: Number(e.target.value) }))} />
            <Input label="Tags" placeholder="comma, separated" value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
          </div>
          <Textarea label="Explanation (optional)" placeholder="Shown to students after grading…" style={{ minHeight: 60 }} value={form.explanation ?? ''} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} />
          <Input label="Image (optional)" type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
        </form>
      </Modal>
    </div>
  );
};
