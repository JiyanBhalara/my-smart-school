// components/QuizCard.tsx
import Link from "next/link";
import QuizDeleteActions from "./lessons/QuizDeleteActions";

interface QuizAttempt {
  id: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean | null;
  completedAt: Date | null;
  isCompleted: boolean;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  maxAttempts: number | null;
  passingScore: number | null;
  timeLimit: number | null;
  createdAt: Date;
  authorId: string;
  attempts: QuizAttempt[];
}

interface QuizCardProps {
  quiz: Quiz;
  lessonId: string;
  index: number;
  userId?: string;
  userRole?: string;
}

/**
 * A quiz on the lesson page: one ruled row, with the mark in the margin.
 *
 * The previous version scored on a six-stop rainbow (emerald / blue / amber /
 * orange / red). A mark is a mark -- it reads in the marking ink and the
 * reader compares the number, not the hue. Pass and fail are distinguished by
 * a word, not by colour alone, which also makes them legible to anyone who
 * cannot separate the hues.
 */
export default function QuizCard({
  quiz,
  lessonId,
  index,
  userId,
  userRole,
}: QuizCardProps) {
  const attempts = quiz.attempts || [];
  const completedAttempts = attempts.filter((attempt) => attempt.isCompleted);
  const latestAttempt =
    completedAttempts.length > 0
      ? completedAttempts.reduce((latest, current) =>
          current.completedAt &&
          (!latest.completedAt || current.completedAt > latest.completedAt)
            ? current
            : latest
        )
      : null;

  const attemptCount = completedAttempts.length;
  const maxAttempts = quiz.maxAttempts || Infinity;
  const attemptsLeft = maxAttempts === Infinity ? Infinity : maxAttempts - attemptCount;
  const canTakeQuiz = attemptsLeft > 0;
  const hasPassingScore = quiz.passingScore !== null;
  const isQuizAuthor = userRole === "TEACHER" && userId === quiz.authorId;

  const taken = latestAttempt !== null;

  return (
    <div className="ruled row-list items-start border-t border-rule py-4">
      <div className="margin flex flex-row-reverse items-baseline justify-end gap-2 sm:flex-col sm:items-end sm:gap-1 sm:pt-[3px]">
        {taken ? (
          <>
            <span className="mark-large text-[26px] leading-none">
              {Math.round(latestAttempt.percentage)}%
            </span>
            {hasPassingScore && latestAttempt.passed !== null && (
              <span className="text-[11px] font-medium text-graphite">
                {latestAttempt.passed ? "Passed" : "Not passed"}
              </span>
            )}
          </>
        ) : (
          <span className="text-[11px] font-medium text-graphite">
            {index + 1}
          </span>
        )}
      </div>

      <div className="column">
        <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-ink">
          {quiz.title}
        </h3>

        {quiz.description && (
          <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-graphite">
            {quiz.description}
          </p>
        )}

        <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-graphite tabular">
          {quiz.timeLimit && <span>{quiz.timeLimit} min</span>}
          {quiz.passingScore !== null && <span>Pass at {quiz.passingScore}%</span>}
          {maxAttempts !== Infinity && (
            <span>
              {attemptCount} of {maxAttempts} {maxAttempts === 1 ? "try" : "tries"} used
            </span>
          )}
          {maxAttempts === Infinity && attemptCount > 0 && (
            <span>
              {attemptCount} {attemptCount === 1 ? "try" : "tries"}
            </span>
          )}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          {canTakeQuiz ? (
            <Link
              href={`/lessons/${lessonId}/quizzes/${quiz.id}`}
              className="inline-flex h-8 items-center rounded-[4px] bg-ink px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#01243a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {taken ? "Try again" : "Start quiz"}
            </Link>
          ) : (
            <span className="text-[13px] text-graphite">
              No tries left
            </span>
          )}

          {taken && (
            <Link
              href={`/lessons/${lessonId}/quizzes/${quiz.id}/report`}
              className="text-[13px] text-ink underline decoration-rule underline-offset-[3px] transition-colors hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              See marked answers
            </Link>
          )}

          {isQuizAuthor && (
            <QuizDeleteActions
              lessonId={lessonId}
              quizId={quiz.id}
              isAuthor={isQuizAuthor}
              variant="single"
              quizTitle={quiz.title}
            />
          )}
        </div>
      </div>
    </div>
  );
}
