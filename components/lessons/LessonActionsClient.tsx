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
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Lesson Actions</h3>
        <div className="space-y-3">
          <Link
            href={`/teacher/lessons/${lessonId}/edit`}
            className="cursor-pointer w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30"
          >
            <Edit size={18} />
            <span>Edit Lesson</span>
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="cursor-pointer w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-red-500/80 text-white font-semibold rounded-xl hover:bg-red-600/80 transition-all duration-300 border border-red-400/30"
          >
            <Trash2 size={18} />
            <span>Delete Lesson</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 size={20} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Lesson</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="cursor-pointer ml-auto p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete &quot;{lessonTitle}&quot;? This action cannot be undone.
                {quizCount > 0 && (
                  <span className="block mt-2 text-red-600 text-sm font-medium">
                    Note: This lesson has {quizCount} quiz(es). You must delete all quizzes first.
                  </span>
                )}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="cursor-pointer flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting || quizCount > 0}
                  className="cursor-pointer flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
