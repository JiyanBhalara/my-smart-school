import Link from "next/link";

/**
 * A colophon, not a sitemap. The header already carries navigation, and this
 * app has no pricing page, blog or careers -- the four-column footer was
 * sixteen links to pages that do not exist.
 */
export default function Footer() {
  return (
    <footer className="mt-16 border-t border-rule">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-5 py-6 text-[13px] text-graphite sm:flex-row sm:items-baseline sm:justify-between sm:px-8">
        <p>My Smart School</p>
        <nav className="flex flex-wrap gap-5" aria-label="Footer">
          <Link
            href="/lessons"
            className="transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Lessons
          </Link>
          <Link
            href="/groups"
            className="transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Groups
          </Link>
          <Link
            href="/reports/my-report"
            className="transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Report card
          </Link>
        </nav>
      </div>
    </footer>
  );
}
