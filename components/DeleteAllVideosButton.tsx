"use client";

import { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface DeleteAllVideosButtonProps {
  lessonId: string;
  videoCount: number;
  onDeleted?: () => void; // Callback after successful deletion
  variant?: 'default' | 'compact'; // Different display variants
}

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border max-w-sm ${
        type === 'success' 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <div className="p-1 bg-green-100 rounded-full">
              <CheckCircle size={14} className="text-green-600" />
            </div>
          ) : (
            <div className="p-1 bg-red-100 rounded-full">
              <X size={14} className="text-red-600" />
            </div>
          )}
        </div>
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="cursor-pointer flex-shrink-0 p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  videoCount: number;
}

function DeleteConfirmModal({ isOpen, onConfirm, onCancel, loading, videoCount }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Delete All Videos</h3>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>all {videoCount} videos</strong> from this lesson? 
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm font-medium">
                ⚠️ This action cannot be undone!
              </p>
              <ul className="text-red-600 text-sm mt-2 space-y-1">
                <li>• All videos will be permanently deleted from the database</li>
                <li>• All videos will be removed from Internet Archive</li>
                <li>• This operation cannot be reversed</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              disabled={loading}
              className="cursor-pointer flex-1 bg-red-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? `Deleting ${videoCount} videos...` : `Delete All ${videoCount} Videos`}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="cursor-pointer flex-1 bg-gray-100 text-gray-700 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeleteAllVideosButton({ 
  lessonId, 
  videoCount, 
  onDeleted,
  variant = 'default' 
}: DeleteAllVideosButtonProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleDeleteAll = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/videos/delete-all`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowConfirmModal(false);
        showToast(`✅ All ${videoCount} videos deleted successfully!`, 'success');
        
        // Call onDeleted callback to refresh parent component
        setTimeout(() => {
          onDeleted?.();
        }, 1000);
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to delete videos', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Different button styles based on variant
  const buttonClasses = variant === 'compact' 
    ? "cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
    : "cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors";

  return (
    <>
      <button
        onClick={() => setShowConfirmModal(true)}
        className={buttonClasses}
        title={`Delete all ${videoCount} videos`}
      >
        <Trash2 size={16} />
        {variant === 'compact' ? (
          <>
            <span className="hidden sm:inline">Delete All</span>
            <span className="sm:hidden">Delete</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Delete All Videos</span>
            <span className="sm:hidden">Delete All</span>
          </>
        )}
      </button>

      <DeleteConfirmModal
        isOpen={showConfirmModal}
        onConfirm={handleDeleteAll}
        onCancel={() => setShowConfirmModal(false)}
        loading={loading}
        videoCount={videoCount}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
