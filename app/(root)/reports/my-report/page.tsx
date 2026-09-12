// app/reports/my-report/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Line } from 'react-chartjs-2';
import { subjectCode, subjectTint } from '@/lib/subject';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

interface QuizAttempt {
  id: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean | null;
  completedAt: string;
  timeSpent: number | null;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  passingScore: number | null;
  maxAttempts: number | null;
  lesson: {
    id: string;
    title: string;
    subject: string;
  };
}

interface QuizResult {
  quiz: Quiz;
  totalAttempts: number;
  attempts: QuizAttempt[];
  latestAttempt: QuizAttempt;
  bestScore: number;
  averageScore: number;
}

interface StudentNote {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  teacher: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Student {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
}

interface OverallStats {
  totalQuizzesTaken: number;
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalPointsEarned: number;
  totalPossiblePoints: number;
  overallPercentage: number;
  passCount: number;
  failCount: number;
}

interface ReportData {
  student: Student;
  overallStats: OverallStats;
  quizResults: QuizResult[];
  notes: StudentNote[];
}

export default function MyReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not student
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'STUDENT') {
      router.push('/');
    }
  }, [session, status, router]);

  // Fetch student's own report
  useEffect(() => {
    const fetchMyReport = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/reports/my-report');
        if (!response.ok) {
          throw new Error('Failed to fetch your report');
        }
        const data: ReportData = await response.json();
        setReportData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'STUDENT') {
      fetchMyReport();
    }
  }, [session]);

  // Chart data
  // Only one chart earns its place: change over time, which a table cannot
  // show. The doughnut graded scores into five invented bands
  // (Excellent/Great/Good/Fair/Needs Work) on a five-colour scale, and the
  // subject bar chart repeated what the gradebook below already groups.
  const progressChartData = reportData && reportData.quizResults.length > 1 ? {
    labels: reportData.quizResults
      .slice()
      .sort((a, b) => new Date(a.latestAttempt.completedAt).getTime() - new Date(b.latestAttempt.completedAt).getTime())
      .map((_, index) => `${index + 1}`),
    datasets: [{
      label: 'Mark',
      data: reportData.quizResults
        .slice()
        .sort((a, b) => new Date(a.latestAttempt.completedAt).getTime() - new Date(b.latestAttempt.completedAt).getTime())
        .map(result => result.latestAttempt.percentage),
      borderColor: '#023047',
      backgroundColor: 'transparent',
      borderWidth: 2,
      fill: false,
      tension: 0,
      pointBackgroundColor: '#023047',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1,
      pointRadius: 3,
    }],
  } : null;

  const progressChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        min: 0,
        max: 100,
        border: { display: false },
        grid: { color: '#c7d3db' },
        ticks: { color: '#5a6b77', font: { size: 11 }, stepSize: 25 },
      },
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: '#5a6b77', font: { size: 11 } },
      },
    },
  };

  if (status === 'loading' || loading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <p className="text-[14px] text-graphite">Loading your report card</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="ruled-page mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <div className="ruled">
          <div className="margin" aria-hidden />
          <div className="column max-w-md border-l-2 border-mark pl-4">
            <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
              Your report card did not load
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-graphite">
              {error
                ? error
                : 'The server did not return your marks. This is usually temporary.'}{' '}
              Reload the page to try again.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex h-9 items-center rounded-[4px] bg-ink px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#01243a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Reload
              </button>
              <Link
                href="/lessons"
                className="inline-flex h-9 items-center rounded-[4px] border border-ink px-4 text-[14px] font-medium text-ink transition-colors hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Back to lessons
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const toRetake = reportData.quizResults.filter(
    (r) => r.latestAttempt.passed === false
  ).length;

  return (
    <div className="ruled-page mx-auto min-h-[calc(100vh-8rem)] max-w-4xl px-5 py-10 sm:px-8 lg:py-14">
      {/* Masthead. The mark is the one loud thing on this page. */}
      <header className="ruled pb-6">
        <div className="margin" aria-hidden />
        <div className="column">
          <h1 className="text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-ink">
            Report card
          </h1>
          <p className="mt-1 text-[14px] text-graphite">
            {reportData.student.name || 'You'}
          </p>

          <div className="mt-7 flex items-baseline gap-4">
            <span className="mark-large">
              {Math.round(reportData.overallStats.averageScore)}%
            </span>
            <span className="text-[14px] text-graphite">average across all quizzes</span>
          </div>

          <div className="mt-4 h-[3px] w-full max-w-md bg-rule">
            <div
              className="h-full bg-mark"
              style={{ width: `${Math.min(100, Math.max(0, reportData.overallStats.averageScore))}%` }}
            />
          </div>

          <p className="mt-5 flex flex-wrap gap-x-8 gap-y-1 text-[14px] text-graphite tabular">
            <span>{reportData.overallStats.totalQuizzesTaken} taken</span>
            <span>{reportData.overallStats.passCount} passed</span>
            {toRetake > 0 && <span>{toRetake} to retake</span>}
            <span>Best {Math.round(reportData.overallStats.highestScore)}%</span>
          </p>
        </div>
      </header>

      <div className="border-t-2 border-ink" />

      {/* The gradebook. Numbers right-aligned on tabular figures so the column
          reads as a column. */}
      <section className="pt-6">
        <div className="ruled pb-2">
          <div className="margin" aria-hidden />
          <div className="column flex items-baseline justify-between gap-4 text-[11px] font-medium tracking-[0.02em] text-graphite">
            <span>Quiz</span>
            <span className="flex shrink-0 gap-6">
              <span className="w-12 text-right">Tries</span>
              <span className="w-12 text-right">Best</span>
              <span className="w-12 text-right">Latest</span>
            </span>
          </div>
        </div>

        {reportData.quizResults.length === 0 ? (
          <div className="ruled border-t border-rule pt-8">
            <div className="margin" aria-hidden />
            <div className="column max-w-md">
              <h2 className="text-[17px] font-semibold text-ink">Nothing marked yet</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-graphite">
                Once you hand in a quiz your mark appears here, with every
                attempt listed so you can see how it changed.
              </p>
              <Link
                href="/lessons"
                className="mt-5 inline-flex h-9 items-center rounded-[4px] bg-ink px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#01243a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Find a lesson
              </Link>
            </div>
          </div>
        ) : (
          <div className="border-b border-rule">
            {reportData.quizResults.map((result) => (
              <div
                key={result.quiz.id}
                className="ruled row-register items-baseline border-t border-rule py-3"
              >
                <div className="margin flex flex-row-reverse items-center justify-end gap-2 sm:flex-row sm:justify-end sm:pt-[3px]">
                  <span className="text-[11px] font-semibold text-graphite">
                    {subjectCode(result.quiz.lesson.subject)}
                  </span>
                  <span
                    aria-hidden
                    className="subject-tab h-4"
                    style={{ background: subjectTint(result.quiz.lesson.subject) }}
                  />
                </div>

                <div className="column flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-ink">
                      {result.quiz.title}
                    </span>
                    <span className="block truncate text-[12px] text-graphite">
                      {result.quiz.lesson.title}
                    </span>
                  </span>

                  <span className="flex shrink-0 gap-6 text-[14px] tabular">
                    <span className="w-12 text-right text-graphite">
                      {result.totalAttempts}
                    </span>
                    <span className="w-12 text-right text-graphite">
                      {Math.round(result.bestScore)}%
                    </span>
                    <span className="w-12 text-right font-semibold text-mark">
                      {Math.round(result.latestAttempt.percentage)}%
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Change over time. */}
      {progressChartData && (
        <section className="ruled pt-10">
          <div className="margin" aria-hidden />
          <div className="column">
            <h2 className="text-[15px] font-semibold text-ink">Marks in order taken</h2>
            <p className="mt-1 text-[12px] text-graphite">
              Each point is one quiz, oldest first.
            </p>
            <div className="mt-4 h-56">
              <Line data={progressChartData} options={progressChartOptions} />
            </div>
          </div>
        </section>
      )}

      {/* Teacher notes. */}
      {reportData.notes.length > 0 && (
        <section className="pt-10">
          <div className="ruled pb-2">
            <div className="margin" aria-hidden />
            <div className="column">
              <h2 className="text-[15px] font-semibold text-ink">Notes from your teachers</h2>
            </div>
          </div>
          {reportData.notes.map((note) => (
            <div key={note.id} className="ruled items-start border-t border-rule py-3">
              <div className="margin pt-[3px] text-[11px] text-graphite tabular">
                {new Date(note.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
              <div className="column">
                <p className="reading text-[15px] leading-relaxed">{note.note}</p>
                <p className="mt-1 text-[12px] text-graphite">
                  {note.teacher.name || 'Teacher'}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="ruled pt-8">
        <div className="margin" aria-hidden />
        <div className="column">
          <Link
            href="/lessons"
            className="text-[14px] text-ink underline decoration-rule underline-offset-[3px] transition-colors hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Back to lessons
          </Link>
        </div>
      </div>
    </div>
  );
}
