import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Copy, Trash2, ListChecks, Code2, Database, Type, MessageSquare, AlignLeft, CheckSquare, X } from 'lucide-react';
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

const CODING_LANGUAGES = ['javascript', 'python', 'java', 'cpp', 'c', 'typescript', 'go'];

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
  options: ['', ''],
  correct_answer: {},
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
      options: q.options.length > 0 ? q.options : ['', ''],
      correct_answer: q.correct_answer,
      initial_code: q.initial_code ?? undefined,
    });
    setTagsInput(q.tags.join(', '));
    setImageFile(null);
    setModalOpen(true);
  };

  // MCQ / Multiple Correct option-list editing
  const updateOption = (index: number, value: string) => {
    setForm(f => {
      const options = [...(f.options ?? [])];
      const oldValue = options[index];
      options[index] = value;
      // Keep correct_answer in sync so renaming a selected option doesn't silently
      // orphan the stored answer (grading matches on exact option text).
      let correct_answer = f.correct_answer;
      if (f.type === 'mcq' && correct_answer?.value === oldValue) {
        correct_answer = { value };
      } else if (f.type === 'multiple_correct' && Array.isArray(correct_answer?.values)) {
        correct_answer = { values: (correct_answer.values as string[]).map(v => (v === oldValue ? value : v)) };
      }
      return { ...f, options, correct_answer };
    });
  };

  const addOption = () => setForm(f => ({ ...f, options: [...(f.options ?? []), ''] }));

  const removeOption = (index: number) => {
    setForm(f => {
      const removed = f.options?.[index];
      const options = (f.options ?? []).filter((_, i) => i !== index);
      let correct_answer = f.correct_answer;
      if (f.type === 'mcq' && correct_answer?.value === removed) {
        correct_answer = {};
      } else if (f.type === 'multiple_correct' && Array.isArray(correct_answer?.values)) {
        correct_answer = { values: (correct_answer.values as string[]).filter(v => v !== removed) };
      }
      return { ...f, options, correct_answer };
    });
  };

  const setSingleCorrect = (value: string) => setForm(f => ({ ...f, correct_answer: { value } }));

  const toggleMultiCorrect = (value: string) => setForm(f => {
    const current = Array.isArray(f.correct_answer?.values) ? (f.correct_answer!.values as string[]) : [];
    const values = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    return { ...f, correct_answer: { values } };
  });

  const validateForm = (): string | null => {
    if (form.type === 'mcq' || form.type === 'multiple_correct') {
      const nonEmptyOptions = (form.options ?? []).filter(o => o.trim());
      if (nonEmptyOptions.length < 2) return 'Add at least 2 answer options.';
      if (form.type === 'mcq' && !form.correct_answer?.value) return 'Select which option is correct.';
      if (form.type === 'multiple_correct' && !(Array.isArray(form.correct_answer?.values) && form.correct_answer.values.length > 0)) {
        return 'Select at least one correct option.';
      }
    }
    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      show({ tone: 'danger', title: validationError });
      return;
    }
    setSaving(true);
    try {
      const isOptionBased = form.type === 'mcq' || form.type === 'multiple_correct';
      const payload: QuestionPayload = {
        ...form,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        options: isOptionBased ? (form.options ?? []).filter(o => o.trim()) : [],
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

          {(form.type === 'mcq' || form.type === 'multiple_correct') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                Answer Options <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>— {form.type === 'mcq' ? 'select the correct one' : 'select all correct ones'}</span>
              </label>
              {(form.options ?? []).map((opt, i) => {
                const isCorrect = form.type === 'mcq'
                  ? form.correct_answer?.value === opt && opt !== ''
                  : Array.isArray(form.correct_answer?.values) && (form.correct_answer.values as string[]).includes(opt) && opt !== '';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type={form.type === 'mcq' ? 'radio' : 'checkbox'}
                      name="correct-option"
                      checked={isCorrect}
                      disabled={!opt.trim()}
                      onChange={() => (form.type === 'mcq' ? setSingleCorrect(opt) : toggleMultiCorrect(opt))}
                      style={{ accentColor: 'var(--accent-9)', flexShrink: 0 }}
                    />
                    <input
                      className="form-input"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={e => updateOption(i, e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', fontSize: 'var(--text-sm)' }}
                    />
                    <Button
                      type="button" size="sm" variant="ghost" icon={<X size={13} />} aria-label="Remove option"
                      onClick={() => removeOption(i)} disabled={(form.options ?? []).length <= 2}
                    />
                  </div>
                );
              })}
              <Button type="button" size="sm" variant="secondary" icon={<Plus size={13} />} onClick={addOption} style={{ alignSelf: 'flex-start' }}>
                Add Option
              </Button>
            </div>
          )}

          {form.type === 'coding' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Select
                label="Programming Language"
                value={form.programming_language ?? ''}
                onChange={e => setForm(f => ({ ...f, programming_language: e.target.value || undefined }))}
              >
                <option value="">Any / unspecified</option>
                {CODING_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </Select>
              <Textarea
                label="Starter Code (optional)"
                placeholder="Pre-filled into the student's code editor…"
                style={{ minHeight: 100, fontFamily: 'var(--font-mono)' }}
                value={form.initial_code ?? ''}
                onChange={e => setForm(f => ({ ...f, initial_code: e.target.value }))}
              />
            </div>
          )}

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
