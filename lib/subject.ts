// lib/subject.ts
//
// Subject identity for the margin tab: a two-letter code and one of five
// derived tints. The tints are deliberately secondary to the two inks and
// appear only in the 4px margin bar -- never as a background, border or text
// colour anywhere else.
//
// Assignment is a stable hash of the subject name, so a subject keeps the same
// tab across pages and sessions without anything being stored.

const TINTS = [
  "var(--subject-1)",
  "var(--subject-2)",
  "var(--subject-3)",
  "var(--subject-4)",
  "var(--subject-5)",
] as const;

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function subjectTint(subject: string): string {
  if (!subject) return TINTS[0];
  return TINTS[hash(subject.toLowerCase()) % TINTS.length];
}

/**
 * Two-letter code for the margin, the way a timetable abbreviates a subject.
 * "Biology" -> "Bi", "Computer Science" -> "CS".
 */
export function subjectCode(subject: string): string {
  const words = subject.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "--";
  if (words.length === 1) {
    return (words[0][0] + (words[0][1] ?? "")).replace(/^./, (c) => c.toUpperCase());
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}
