'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import toast, { Toaster } from 'react-hot-toast';
import SupabaseImage from '@/components/SupabaseImage';

interface QuizOption {
  id: string;
  optionText: string;
  optionImage?: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  questionImage?: string;
  points: number;
  options: QuizOption[];
}

interface Quiz {
  id: string;
  title: string;
  timeLimit?: number;
  questions: QuizQuestion[];
}

interface QuizResult {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
}

interface SubmissionResults {
  score: number;
  totalPoints: number;
  percentage: number;
  timeSpent?: number;
  results?: QuizResult[];
  maxScore?: number;
  totalQuestions?: number;
}

interface QuizTakerProps {
  lessonId: string;
  quizId: string;
  quiz: Quiz;
}

export default function QuizTaker({ lessonId, quizId, quiz }: QuizTakerProps) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.timeLimit ? quiz.timeLimit * 60 : null
  );
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<SubmissionResults | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  
  const notifiedAt75Ref = useRef(false);
  const notifiedAt50Ref = useRef(false);
  const startTimeRef = useRef<Date>(new Date());

  const initialTimeLimit = useMemo(() => {
    return quiz.timeLimit ? quiz.timeLimit * 60 : null;
  }, [quiz.timeLimit]);

  const getTimeSpent = useCallback(() => {
    const now = new Date();
    return Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000);
  }, []);

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (loading || submitted) return;
    
    setLoading(true);
    
    try {
      const submissionAnswers = Object.entries(answers).map(([questionId, optionId]) => ({
        questionId,
        optionId
      }));

      const timeSpent = getTimeSpent();

      const response = await fetch(`/api/lessons/${lessonId}/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers: submissionAnswers,
          timeSpent: timeSpent,
          isAutoSubmit: isAutoSubmit
        })
      });

      if (response.ok) {
        const result = await response.json();
        setResults({ ...result, timeSpent });
        setSubmitted(true);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  }, [loading, submitted, answers, lessonId, quizId, getTimeSpent]);

  useEffect(() => {
    if (timeLeft === null || submitted || !initialTimeLimit) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          setTimeExpired(true);
          // Use setTimeout to avoid setState during render
          setTimeout(() => {
            handleSubmit(true);
          }, 0);
          return 0;
        }

        if (prev && initialTimeLimit) {
          const timeUsedPercentage = ((initialTimeLimit - prev) / initialTimeLimit) * 100;
          
          if (timeUsedPercentage >= 50 && !notifiedAt50Ref.current) {
            notifiedAt50Ref.current = true;
            const minutesLeft = Math.floor(prev / 60);
            const secondsLeft = prev % 60;
            
            // Use setTimeout to avoid setState during render
            setTimeout(() => {
              toast.dismiss();
              toast.error(
                `⏰ 50% Time Used! ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')} remaining`,
                {
                  id: 'time-warning-50',
                  duration: 5000,
                  position: 'top-center',
                  style: {
                    background: '#FEF3C7',
                    color: '#92400E',
                    border: '2px solid #F59E0B',
                    borderRadius: '12px',
                    fontWeight: '600',
                  },
                  icon: '⚠️',
                }
              );
            }, 0);
          }
          
          if (timeUsedPercentage >= 75 && !notifiedAt75Ref.current) {
            notifiedAt75Ref.current = true;
            const minutesLeft = Math.floor(prev / 60);
            const secondsLeft = prev % 60;
            
            // Use setTimeout to avoid setState during render
            setTimeout(() => {
              toast.dismiss();
              toast.error(
                `🚨 Only 25% Time Left! ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')} remaining`,
                {
                  id: 'time-warning-75',
                  duration: 6000,
                  position: 'top-center',
                  style: {
                    background: '#FEE2E2',
                    color: '#991B1B',
                    border: '2px solid #EF4444',
                    borderRadius: '12px',
                    fontWeight: '600',
                  },
                  icon: '🚨',
                }
              );
            }, 0);
          }
        }

        return prev ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted, initialTimeLimit, handleSubmit]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatTimeSpent = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
    }
    return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  }, []);

  const handleAnswerSelect = useCallback((questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  }, []);

  const progress = useMemo(() => ((currentQuestion + 1) / quiz.questions.length) * 100, [currentQuestion, quiz.questions.length]);
  const answeredQuestions = useMemo(() => Object.keys(answers).length, [answers]);

  if (submitted && results) {
    return (
      <div className="ruled-page mx-auto min-h-[calc(100vh-8rem)] max-w-3xl px-5 py-8 sm:px-8 lg:py-12">
        <Toaster toastOptions={{ duration: 4000 }} />

        {/* The marked paper. One loud thing: the mark. */}
        <header className="ruled pb-6">
          <div className="margin" aria-hidden />
          <div className="column">
            <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
              {quiz.title}
            </h1>
            <p className="mt-1 text-[13px] text-graphite">
              {timeExpired ? "Time ran out, so this was handed in for you" : "Handed in"}
            </p>

            <div className="mt-6 flex items-baseline gap-4">
              <span className="mark-large">
                {Math.round(results.percentage || 0)}%
              </span>
              <span className="text-[14px] text-graphite tabular">
                {results.score || 0} of{" "}
                {results.maxScore || results.totalQuestions || quiz.questions.length}{" "}
                points
              </span>
            </div>

            <div className="mt-4 h-[3px] w-full max-w-sm bg-rule">
              <div
                className="h-full bg-mark"
                style={{ width: `${Math.min(100, Math.max(0, results.percentage || 0))}%` }}
              />
            </div>

            <p className="mt-4 text-[13px] text-graphite tabular">
              Took {formatTimeSpent(results.timeSpent || 0)}
              {quiz.timeLimit && <span className="ml-5">Limit {quiz.timeLimit} min</span>}
            </p>
          </div>
        </header>

        <div className="border-t-2 border-ink" />

        {/* Per-question marks, read down the margin like a marked script. */}
        <section className="pt-6">
          <div className="ruled pb-2">
            <div className="margin" aria-hidden />
            <div className="column">
              <h2 className="text-[15px] font-semibold text-ink">Your answers</h2>
            </div>
          </div>

          {(results.results || []).map((result: QuizResult, index: number) => {
            const question = quiz.questions[index];
            const maxPoints = question?.points || 1;
            const earnedPoints = result.isCorrect ? maxPoints : 0;

            return (
              <div
                key={result.questionId || index}
                className="ruled items-start border-t border-rule py-3"
              >
                {/* The tick or cross sits in the margin, where a teacher marks */}
                <div className="margin flex items-baseline justify-end gap-2 pt-[2px]">
                  <span className="text-[11px] text-graphite tabular">{index + 1}</span>
                  <span
                    className={`text-[15px] font-semibold ${
                      result.isCorrect ? "text-ink" : "text-mark"
                    }`}
                    aria-hidden
                  >
                    {result.isCorrect ? "✓" : "✗"}
                  </span>
                </div>

                <div className="column flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="reading min-w-0 flex-1 text-[15px] leading-snug">
                    {question?.questionText}
                  </p>
                  <p className="shrink-0 text-[13px] text-graphite tabular">
                    <span className="sr-only">
                      {result.isCorrect ? "Correct. " : "Incorrect. "}
                    </span>
                    {earnedPoints} / {maxPoints}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <div className="ruled border-t border-rule pt-6">
          <div className="margin" aria-hidden />
          <div className="column flex flex-wrap gap-3">
            <Button onClick={() => router.push(`/lessons/${lessonId}`)}>
              Back to lesson
            </Button>
            {(results.percentage || 0) < 80 && (
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Try again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ruled-page mx-auto min-h-[calc(100vh-8rem)] max-w-3xl px-5 py-8 sm:px-8 lg:py-12">
      <Toaster toastOptions={{ duration: 4000 }} />

      {/* Masthead: the quiz, the position in it, and the time. Nothing else --
          this screen has one job and the question below is the loud thing. */}
      <header className="ruled pb-4">
        <div className="margin" aria-hidden />
        <div className="column">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
              {quiz.title}
            </h1>
            {timeLeft !== null && (
              <p
                className={`text-[15px] tabular ${
                  timeLeft < 60 ? "font-semibold text-mark" : "text-graphite"
                }`}
                aria-live={timeLeft < 60 ? "assertive" : "off"}
              >
                {formatTime(timeLeft)} left
              </p>
            )}
          </div>
          <p className="mt-1 text-[13px] text-graphite tabular">
            Question {currentQuestion + 1} of {quiz.questions.length}
            <span className="ml-5">{answeredQuestions} answered</span>
          </p>
        </div>
      </header>

      {/* A rule that fills, rather than a pill. */}
      <div className="ruled">
        <div className="margin" aria-hidden />
        <div className="column">
          <div
            className="h-[3px] w-full bg-rule"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress through the quiz"
          >
            <div
              className="h-full bg-ink transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* The question. Number in the margin, prose in the reading face. */}
      <section className="ruled pt-8">
        <div className="margin pt-1 text-[13px] font-semibold text-ink">
          {currentQuestion + 1}
        </div>
        <div className="column">
          <h2 className="reading text-[20px] font-medium leading-[1.5]">
            {quiz.questions[currentQuestion]?.questionText}
          </h2>

          {quiz.questions[currentQuestion]?.questionImage && (
            <div className="mt-4 border border-rule">
              <SupabaseImage
                src={quiz.questions[currentQuestion].questionImage}
                alt=""
                className="h-auto max-w-full"
                width={600}
                height={400}
              />
            </div>
          )}

          <div className="mt-6 border-t border-rule">
            {quiz.questions[currentQuestion]?.options?.map(
              (option: QuizOption, optionIndex: number) => {
                const selected =
                  answers[quiz.questions[currentQuestion].id] === option.id;
                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-baseline gap-3 border-b border-rule py-3 pl-3 transition-colors ${
                      selected
                        ? "border-l-2 border-l-ink bg-sheet pl-[10px]"
                        : "border-l-2 border-l-transparent hover:bg-sheet"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      value={option.id}
                      checked={selected}
                      onChange={() =>
                        handleAnswerSelect(
                          quiz.questions[currentQuestion].id,
                          option.id
                        )
                      }
                      className="mt-1 h-4 w-4 shrink-0 accent-[#023047] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    />
                    <span className="w-4 shrink-0 text-[13px] font-medium text-graphite">
                      {String.fromCharCode(97 + optionIndex)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="reading block text-[16px] leading-[1.5]">
                        {option.optionText}
                      </span>
                      {option.optionImage && (
                        <SupabaseImage
                          src={option.optionImage}
                          alt=""
                          className="mt-2 h-auto max-w-full border border-rule sm:max-w-xs"
                          width={300}
                          height={200}
                        />
                      )}
                    </span>
                  </label>
                );
              }
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="secondary"
              onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              Back
            </Button>

            {currentQuestion < quiz.questions.length - 1 ? (
              <Button
                onClick={() =>
                  setCurrentQuestion((prev) =>
                    Math.min(quiz.questions.length - 1, prev + 1)
                  )
                }
              >
                Next question
              </Button>
            ) : (
              <Button onClick={() => handleSubmit(false)} disabled={loading}>
                {loading ? "Handing in…" : "Hand in"}
              </Button>
            )}
          </div>

          {/* Question index. A row of numbers, outlined where answered -- the
              three-swatch colour legend it replaces existed only because the
              colours did not explain themselves. */}
          <nav className="mt-8 border-t border-rule pt-4" aria-label="Questions">
            <div className="flex flex-wrap gap-1">
              {quiz.questions.map((_: QuizQuestion, index: number) => {
                const answered = Boolean(answers[quiz.questions[index].id]);
                const current = index === currentQuestion;
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    aria-current={current ? "true" : undefined}
                    aria-label={`Question ${index + 1}${answered ? ", answered" : ", not answered"}`}
                    className={`h-8 w-8 rounded-[2px] border text-[13px] tabular transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                      current
                        ? "border-ink bg-ink font-semibold text-white"
                        : answered
                          ? "border-ink bg-transparent font-medium text-ink"
                          : "border-rule bg-transparent text-graphite hover:border-ink"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[12px] text-graphite tabular">
              Outlined means answered. {answeredQuestions} of{" "}
              {quiz.questions.length} done.
            </p>
          </nav>
        </div>
      </section>
    </div>
  );
}
