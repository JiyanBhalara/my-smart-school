import Link from "next/link";
import { subjectCode, subjectTint } from "@/lib/subject";

type LessonRowProps = {
  id: string;
  title: string;
  subject: string;
  createdAt: Date;
  tags: { tag: { name: string } }[];
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function shortDate(date: Date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/**
 * One line in the lesson index. The margin carries the subject tab, so you can
 * scan by subject straight down the gutter; the row itself is ruled, not
 * boxed.
 */
export default function LessonRow({
  id,
  title,
  subject,
  createdAt,
  tags,
}: LessonRowProps) {
  return (
    <Link
      href={`/lessons/${id}`}
      className="group ruled row-list items-start border-t border-rule py-4 transition-colors hover:bg-sheet focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
    >
      {/* Below 640px the gutter collapses, so the tab leads the row instead of
          sitting in it. Order flips with the layout. */}
      <div className="margin flex flex-row-reverse items-center justify-end gap-2 sm:flex-row sm:items-start sm:justify-end sm:pt-[5px]">
        <span className="text-[11px] font-semibold text-graphite">
          {subjectCode(subject)}
        </span>
        <span
          aria-hidden
          className="subject-tab h-4 self-start"
          style={{ background: subjectTint(subject) }}
        />
      </div>

      <div className="column">
        <h2 className="text-[17px] font-600 font-semibold leading-snug tracking-[-0.01em] text-ink group-hover:underline group-hover:decoration-rule group-hover:underline-offset-[3px]">
          {title}
        </h2>

        <p className="mt-0.5 text-[13px] text-graphite">{subject}</p>

        <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-graphite tabular">
          <span>Added {shortDate(createdAt)}</span>
          {tags.length > 0 && (
            <span className="text-graphite">
              {tags.map((t) => t.tag.name).join(", ")}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
