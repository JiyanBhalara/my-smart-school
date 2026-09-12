import Link from "next/link";

/**
 * The landing page. The previous copy described "an AI-driven platform for
 * sustainable, personalized computer-science education" with "eco-friendly
 * activities", none of which this app does. It also leaned on palette
 * utilities and entrance animations that no longer exist.
 *
 * What it actually is: lessons, quizzes, report cards and chat, for a school.
 */
export default function Home() {
  return (
    <div className="ruled-page mx-auto min-h-[34rem] max-w-3xl py-14 lg:py-24">
      <header className="ruled pb-8">
        <div className="margin" aria-hidden />
        <div className="column">
          <h1 className="max-w-xl text-[36px] font-bold leading-[40px] tracking-[-0.025em] text-ink sm:text-[42px] sm:leading-[46px]">
            A school, written down
          </h1>
          <p className="reading mt-4 max-w-lg text-[18px] text-graphite">
            Lessons with their material, videos and quizzes. Marks that appear
            the moment a quiz is handed in. A report card that shows how a term
            actually went.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-[4px] bg-ink px-5 text-[15px] font-medium text-white transition-colors hover:bg-[#01243a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Create an account
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-[4px] border border-ink px-5 text-[15px] font-medium text-ink transition-colors hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <div className="border-t-2 border-ink" />

      <section className="pt-8">
        <div className="ruled items-start border-t border-rule py-5 first:border-t-0">
          <div className="margin pt-[3px] text-[11px] font-semibold text-graphite">
            Teachers
          </div>
          <div className="column">
            <p className="reading max-w-lg text-[16px]">
              Write a lesson, attach the slides or the PDF, upload the video,
              then set a quiz on it. Marking happens on its own; you read the
              results by student or by quiz, and keep private notes on anyone
              you are watching.
            </p>
          </div>
        </div>

        <div className="ruled items-start border-t border-rule py-5">
          <div className="margin pt-[3px] text-[11px] font-semibold text-graphite">
            Students
          </div>
          <div className="column">
            <p className="reading max-w-lg text-[16px]">
              Work through the lesson, take the quiz, see the mark and which
              answers were wrong. Your report card collects every attempt so you
              can see what improved.
            </p>
          </div>
        </div>

        <div className="ruled items-start border-t border-rule py-5">
          <div className="margin pt-[3px] text-[11px] font-semibold text-graphite">
            Both
          </div>
          <div className="column">
            <p className="reading max-w-lg text-[16px]">
              One-to-one and group chats, with files, so a question about
              last night&apos;s homework does not have to wait until morning.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
