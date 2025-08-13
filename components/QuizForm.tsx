'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trash2,
  Plus,
  Timer,
  Edit3,
  Info,
  CheckCircle2,
  Image as ImageIcon,
  HelpCircle,
  LayoutList,
  FileText,
  Upload,
  ExternalLink,
} from 'lucide-react';

interface QuizFormProps {
  lessonId: string;
  initialData?: {
    id?: string;
    title?: string;
    description?: string;
    timeLimit?: number;
    maxAttempts?: number;
    questions?: Question[];
  };
  isEdit?: boolean;
}

interface Question {
  text: string;
  imageUrl?: string;
  points: number;
  options: Option[];
}

interface Option {
  text: string;
  imageUrl?: string;
  isCorrect: boolean;
}

interface QuizFormData  {
  title: string;
  description: string;
  timeLimit: string;
  maxAttempts: number;
  questions: Question[];
}

export default function QuizForm({ lessonId, initialData, isEdit = false }: QuizFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  const [formData, setFormData] = useState<QuizFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    timeLimit: initialData?.timeLimit?.toString() || '',
    maxAttempts: initialData?.maxAttempts || 1,
    questions: initialData?.questions || [
      {
        text: '',
        imageUrl: '',
        points: 1,
        options: [
          { text: '', imageUrl: '', isCorrect: true },
          { text: '', imageUrl: '', isCorrect: false },
          { text: '', imageUrl: '', isCorrect: false },
          { text: '', imageUrl: '', isCorrect: false },
        ],
      },
    ],
  });

  // Upload helper: posts file to /api/uploads/quiz-image and returns a public URL
  async function uploadImage(file: File, params: { lessonId: string; scope: 'question' | 'option' }) {
    const form = new FormData();
    form.append('file', file);
    form.append('lessonId', params.lessonId);
    form.append('scope', params.scope);

    const res = await fetch('/api/uploads/quiz-image', {
      method: 'POST',
      body: form,
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // ignore
    }

    if (!res.ok) {
      throw new Error(json?.error || `Upload failed (${res.status}).`);
    }
    if (!json?.url) {
      throw new Error('Upload succeeded but no URL returned.');
    }
    return json.url as string;
  }

  const addQuestion = (): void => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          text: '',
          imageUrl: '',
          points: 1,
          options: [
            { text: '', imageUrl: '', isCorrect: true },
            { text: '', imageUrl: '', isCorrect: false },
            { text: '', imageUrl: '', isCorrect: false },
            { text: '', imageUrl: '', isCorrect: false },
          ],
        },
      ],
    }));
  };

  const removeQuestion = (questionIndex: number): void => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, index) => index !== questionIndex),
    }));
  };

  const updateQuestion = (questionIndex: number, field: keyof Question, value: string | number): void => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, index) => (index === questionIndex ? { ...q, [field]: value } : q)),
    }));
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    field: keyof Option,
    value: string | boolean
  ): void => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, qIndex) =>
        qIndex === questionIndex
          ? {
              ...q,
              options: q.options.map((opt, oIndex) => (oIndex === optionIndex ? { ...opt, [field]: value } : opt)),
            }
          : q
      ),
    }));
  };

  const setCorrectAnswer = (questionIndex: number, optionIndex: number): void => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, qIndex) =>
        qIndex === questionIndex
          ? {
              ...q,
              options: q.options.map((opt, oIndex) => ({
                ...opt,
                isCorrect: oIndex === optionIndex,
              })),
            }
          : q
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEdit ? `/api/teacher/quizzes/${initialData?.id}` : `/api/teacher/lessons/${lessonId}/quizzes`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
          maxAttempts: parseInt(formData.maxAttempts.toString()),
        }),
      });

      if (response.ok) {
        router.push(`/lessons/${lessonId}`);
      } else {
        const text = await response.text();
        try {
          const errJson = text ? JSON.parse(text) : null;
          alert(errJson?.error || 'Failed to save quiz');
        } catch {
          alert(`Failed to save quiz (${response.status}).`);
        }
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRemoveChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, timeLimit: value }));
  };

  const handleMaxAttemptsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(e.target.value) || 1;
    setFormData((prev) => ({ ...prev, maxAttempts: value }));
  };

  const handlePointsChange = (questionIndex: number, e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(e.target.value) || 1;
    updateQuestion(questionIndex, 'points', value);
  };

  const totalPoints = formData.questions.reduce((sum, q) => sum + (q.points || 0), 0);

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      {/* Header banner */}
      <div className="mb-6 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-teal-50 to-cyan-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-cyan-100">
              <Edit3 className="h-5 w-5 text-teal-700" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-teal-900 sm:text-2xl">
                {isEdit ? 'Edit Quiz' : 'Create New Quiz'}
              </h1>
              <p className="mt-1 text-sm text-teal-800/80">
                Build a multiple-choice quiz with images, points, and time limits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-xl bg-white px-3 py-2 text-sm font-medium text-teal-900 ring-1 ring-cyan-100 sm:flex sm:flex-col">
              <span className="inline-flex items-center gap-2">
                <LayoutList className="h-4 w-4 text-teal-600" />
                {formData.questions.length} question{formData.questions.length === 1 ? '' : 's'}
              </span>
              <span className="mt-1 inline-flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-600" />
                {totalPoints} total points
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General settings */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-slate-600" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="title" className="mb-1.5 block">
                  Quiz Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Introduction to HTML"
                  required
                  className="focus-visible:ring-teal-500"
                />
                <p className="mt-1 text-xs text-slate-500">A short, descriptive title for the quiz.</p>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="description" className="mb-1.5 block">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="What will learners be assessed on?"
                  className="resize-y focus-visible:ring-teal-500"
                />
              </div>

              <div>
                <Label htmlFor="timeLimit" className="mb-1.5 block">
                  Time Limit (minutes)
                </Label>
                <div className="relative">
                  <Input
                    id="timeLimit"
                    type="number"
                    value={formData.timeLimit}
                    onChange={handleTimeRemoveChange}
                    placeholder="No limit"
                    className="pr-10 focus-visible:ring-teal-500"
                    min={0}
                  />
                  <Timer className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <p className="mt-1 text-xs text-slate-500">Leave empty for no time limit.</p>
              </div>

              <div>
                <Label htmlFor="maxAttempts" className="mb-1.5 block">
                  Max Attempts
                </Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min={1}
                  value={formData.maxAttempts}
                  onChange={handleMaxAttemptsChange}
                  className="focus-visible:ring-teal-500"
                />
                <p className="mt-1 text-xs text-slate-500">How many times a student can attempt this quiz.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions header */}
        <h2 className="text-lg font-semibold text-slate-900">Questions</h2>

        {/* Questions list */}
        {formData.questions.map((question, questionIndex) => {
          const correctIdx = question.options.findIndex((o) => o.isCorrect);

          return (
            <Card
              key={questionIndex}
              className="overflow-hidden border-slate-200 shadow-sm transition-all hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                    {questionIndex + 1}
                  </div>
                  <CardTitle className="text-base">Question {questionIndex + 1}</CardTitle>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {correctIdx >= 0 ? `Option ${correctIdx + 1}` : 'Unset'}
                  </span>

                  {formData.questions.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeQuestion(questionIndex)}
                      className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-5 pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label className="mb-1.5 block">Question Text</Label>
                    <Textarea
                      value={question.text}
                      onChange={(e) => updateQuestion(questionIndex, 'text', e.target.value)}
                      rows={3}
                      placeholder="Type the question students will answer"
                      required
                      className="resize-y focus-visible:ring-teal-500"
                    />
                  </div>

                  {/* Question Image: URL + Upload + Preview */}
                  <div className="sm:col-span-2">
                    <Label className="mb-1.5 block">Question Image (optional)</Label>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="relative sm:flex-1">
                        <Input
                          value={question.imageUrl || ''}
                          onChange={(e) => updateQuestion(questionIndex, 'imageUrl', e.target.value)}
                          placeholder="https://example.com/image.png"
                          className="pr-10 focus-visible:ring-teal-500"
                        />
                        <ImageIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                setUploading(true);
                                const url = await uploadImage(file, { lessonId, scope: 'question' });
                                updateQuestion(questionIndex, 'imageUrl', url);
                              } catch (err: any) {
                                alert(err.message || 'Upload failed');
                              } finally {
                                setUploading(false);
                                // Fix: Check if the element exists and has a value property
                                if (e.target) {
                                  e.target.value = '';
                                }
                              }
                            }}
                          />
                        </label>

                        {question.imageUrl ? (
                          <a
                            href={question.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Preview
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">PNG, JPG, or WEBP up to 5MB.</p>
                  </div>

                  <div>
                    <Label className="mb-1.5 block">Points</Label>
                    <Input
                      type="number"
                      min={1}
                      value={question.points}
                      onChange={(e) => handlePointsChange(questionIndex, e)}
                      className="focus-visible:ring-teal-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">Default is 1 point.</p>
                  </div>
                </div>

                {/* Options */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Label className="text-sm">Answer Options</Label>
                    <span title="Select one correct option">
                      <HelpCircle className="h-4 w-4 text-slate-400" />
                    </span>
                  </div>

                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const isActive = option.isCorrect;
                      return (
                        <div
                          key={optionIndex}
                          className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                            isActive
                              ? 'border-emerald-200 bg-emerald-50/60'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correct-${questionIndex}`}
                            checked={isActive}
                            onChange={() => setCorrectAnswer(questionIndex, optionIndex)}
                            className="mt-2 h-4 w-4 accent-emerald-600"
                            aria-label={`Mark option ${optionIndex + 1} as correct`}
                          />

                          <div className="grid w-full gap-2 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <Label className="mb-1 block text-xs text-slate-500">
                                Option {optionIndex + 1} Text
                              </Label>
                              <Input
                                value={option.text}
                                onChange={(e) => updateOption(questionIndex, optionIndex, 'text', e.target.value)}
                                placeholder={`Enter option ${optionIndex + 1}`}
                                required
                                className="focus-visible:ring-teal-500"
                              />
                            </div>

                            {/* Option Image: URL + Upload + Preview */}
                            <div className="sm:col-span-2">
                              <Label className="mb-1 block text-xs text-slate-500">Option Image (optional)</Label>

                              <div className="flex items-center gap-2">
                                <Input
                                  value={option.imageUrl || ''}
                                  onChange={(e) => updateOption(questionIndex, optionIndex, 'imageUrl', e.target.value)}
                                  placeholder="https://example.com/option.png"
                                  className="focus-visible:ring-teal-500"
                                />

                                <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      try {
                                        setUploading(true);
                                        const url = await uploadImage(file, { lessonId, scope: 'option' });
                                        updateOption(questionIndex, optionIndex, 'imageUrl', url);
                                      } catch (err: any) {
                                        alert(err.message || 'Upload failed');
                                      } finally {
                                        setUploading(false);
                                        // Fix: Check if the element exists and has a value property
                                        if (e.target) {
                                          e.target.value = '';
                                        }
                                      }
                                    }}
                                  />
                                </label>

                                {option.imageUrl ? (
                                  <a
                                    href={option.imageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Preview
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Per-question action row: Add Next Question */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addQuestion}
                    className="border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Next Question
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Bottom add button */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={addQuestion}
            className="mt-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>

        {/* Sticky footer actions */}
        <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white/85 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:mx-0 sm:rounded-xl sm:border sm:px-6">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-800">{formData.questions.length}</span> question
              {formData.questions.length === 1 ? '' : 's'} •{' '}
              <span className="font-medium text-slate-800">{totalPoints}</span> total points
              {uploading ? <span className="ml-2 text-teal-700">• Uploading...</span> : null}
            </div>

            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-slate-300 hover:bg-slate-50"
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || uploading}
                className="bg-teal-600 hover:bg-teal-700 focus-visible:ring-teal-500"
              >
                {loading ? 'Saving...' : isEdit ? 'Update Quiz' : 'Create Quiz'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
