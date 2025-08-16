// components/lessons/QuizDeleteActions.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface QuizDeleteActionsProps {
  lessonId: string;
  quizId?: string;
  quizTitle?: string;
  quizCount?: number;
  isAuthor: boolean;
  variant?: 'single' | 'all';
  className?: string;
}

export default function QuizDeleteActions({
  lessonId,
  quizId,
  quizTitle,
  quizCount = 0,
  isAuthor,
  variant = 'single',
  className = ''
}: QuizDeleteActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  if (!isAuthor) return null;

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    console.log(lessonId);
    setIsDeleting(true);
    try {
      const url = variant === 'single' 
        ? `/api/lessons/${lessonId}/quizzes/${quizId}`
        : `/api/lessons/${lessonId}/quizzes`;
      
      const response = await fetch(url, { method: 'DELETE' });
      
      if (response.ok) {
        router.refresh();
        setShowConfirm(false);
      } else {
        // Only try to parse JSON if there's content
        const text = await response.text();
        let errorMessage = 'Failed to delete quiz(es)';
        
        if (text) {
          try {
            const error = JSON.parse(text);
            errorMessage = error.error || errorMessage;
          } catch {
            // If JSON parsing fails, use the text directly or default message
            errorMessage = text || errorMessage;
          }
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting quiz(es):', error);
      alert('An error occurred while deleting');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (variant === 'all' && quizCount === 0) return null;

  return (
    <div className={`relative ${className}`}>
      {!showConfirm ? (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
            variant === 'single'
              ? 'text-red-600 hover:text-red-700 hover:bg-red-50 text-sm'
              : 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg'
          }`}
          title={variant === 'single' ? `Delete "${quizTitle}"` : `Delete all ${quizCount} quizzes`}
        >
          {isDeleting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
          <span className={variant === 'single' ? 'sr-only sm:not-sr-only' : ''}>
            {variant === 'single' ? 'Delete' : `Delete All (${quizCount})`}
          </span>
        </button>
      ) : (
        <div className={`${variant === 'single' ? 'absolute top-0 right-0 z-50' : ''} bg-white border border-red-200 rounded-lg p-3 shadow-lg`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-sm font-medium text-gray-900">
              {variant === 'single' ? 'Delete Quiz?' : 'Delete All Quizzes?'}
            </span>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            {variant === 'single' 
              ? 'This action cannot be undone.'
              : `This will permanently delete all ${quizCount} quizzes and their data.`
            }
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Delete
            </button>
            <button
              onClick={handleCancel}
              className="cursor-pointer px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
