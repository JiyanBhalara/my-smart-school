// app/lessons/[id]/LessonActionsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2, X } from "lucide-react";

interface Props {
  lessonId: string;
  isAuthor: boolean;
  lessonTitle: string;
  quizCount: number;
}

export default function LessonActionsClient({
  lessonId,
  isAuthor,
  lessonTitle,
  quizCount,
}: Props) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/teacher/lessons/${lessonId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/lessons");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete lesson");
      }
    } catch {
      alert("Failed to delete lesson");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!isAuthor) return null;

  return (
    <>
      {/* Two buttons that name themselves need no heading above them, and a
          destructive action should not be the loudest thing on the page:
          delete is a quiet link that opens a confirm dialog. */}
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/teacher/lessons/${lessonId}/edit`}
          className="inline-flex h-9 items-center gap-2 rounded-[4px] border border-rule bg-sheet px-4 text-[14px] font-medium text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Edit size={15} />
          Edit lesson
        </Link>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-1.5 text-[14px] text-mark underline decoration-transparent underline-offset-[3px] transition-colors hover:decoration-mark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Trash2 size={14} />
          Delete lesson
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[4px] border border-rule max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fdf3f2] rounded-[4px]">
                  <Trash2 size={20} className="text-mark" />
                </div>
                <h3 className="text-lg font-semibold text-ink">Delete Lesson</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="cursor-pointer ml-auto p-1 hover:bg-[#edf2f5] rounded-[4px] transition-colors"
                >
                  <X size={20} className="text-graphite" />
                </button>
              </div>
              
              <p className="text-graphite mb-6">
                Are you sure you want to delete &quot;{lessonTitle}&quot;? This action cannot be undone.
                {quizCount > 0 && (
                  <span className="block mt-2 text-mark text-sm font-medium">
                    Note: This lesson has {quizCount} quiz(es). You must delete all quizzes first.
                  </span>
                )}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="cursor-pointer flex-1 px-4 py-2 text-ink bg-[#edf2f5] rounded-[4px] hover:bg-[#edf2f5] font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting || quizCount > 0}
                  className="cursor-pointer flex-1 px-4 py-2 bg-mark text-white rounded-[4px] hover:bg-mark font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
