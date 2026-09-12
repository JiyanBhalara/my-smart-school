"use client";
import { useState } from 'react';
import { Edit, Trash2, Download, Play, Clock, Calendar, Check, X } from 'lucide-react';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    description?: string;
    blobUrl: string;
    blobPathname: string;
    fileSize: number;
    duration?: number;
    createdAt: string;
    uploadStatus: string;
  };
  lessonId: string;
  isAuthor: boolean;
  onUpdate?: () => void;
}

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  const isDeleteSuccess = message.includes('deleted successfully');
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border max-w-sm ${
        type === 'success' 
          ? `bg-green-50 border-green-200 text-green-800 ${isDeleteSuccess ? 'ring-2 ring-green-300' : ''}` 
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <div className={`p-1 rounded-full bg-[#edf2f5]`}>
              <Check size={14} className="text-ink" />
            </div>
          ) : (
            <div className="p-1 bg-[#fdf3f2] rounded-full">
              <X size={14} className="text-mark" />
            </div>
          )}
        </div>
        <p className={`text-sm font-medium flex-1 ${isDeleteSuccess ? 'font-semibold' : ''}`}>
          {message}
        </p>
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
}

function DeleteConfirmModal({ isOpen, onConfirm, onCancel, loading }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[4px] max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#fdf3f2] rounded-full">
              <Trash2 size={20} className="text-mark" />
            </div>
            <h3 className="text-lg font-semibold text-ink">Delete Video</h3>
          </div>
          
          <p className="text-graphite mb-6">
            Are you sure you want to delete this video? This action cannot be undone and the video file will be permanently removed from storage.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              disabled={loading}
              className="cursor-pointer flex-1 bg-mark text-white font-medium py-2.5 px-4 rounded-[4px] hover:bg-mark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Deleting...' : 'Delete Video'}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="cursor-pointer flex-1 bg-[#edf2f5] text-ink font-medium py-2.5 px-4 rounded-[4px] hover:bg-[#edf2f5] disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoCard({ video, lessonId, isAuthor, onUpdate }: VideoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description || '');
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    
    // Show delete success toast longer than regular toasts
    const duration = message.includes('deleted successfully') ? 6000 : 4000;
    setTimeout(() => setToast(null), duration);
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Title cannot be empty', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/videos/${video.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() })
      });

      if (response.ok) {
        setIsEditing(false);
        showToast('Video updated successfully!', 'success');
        onUpdate?.();
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to update video', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/videos/${video.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShowDeleteModal(false);
        
        // Show prominent success message with auto-reload countdown
        setToast({ 
          message: '✅ Video deleted successfully! Page will refresh automatically...', 
          type: 'success' 
        });
        
        // UPDATED: Automatically reload the page after showing success message
        setTimeout(() => {
          // First call onUpdate if available (for immediate UI update)
          onUpdate?.();
          
          // Then reload the page to ensure complete refresh
          setTimeout(() => {
            window.location.reload();
          }, 500); // Small delay to ensure onUpdate completes
        }, 2000); // Show success message for 2 seconds before reload
        
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to delete video', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-[4px] border border-rule overflow-hidden transition-colors">
        {/* Video Player */}
        <div className="relative bg-black">
          <video
            src={video.blobUrl}
            className="w-full h-48 sm:h-64 md:h-72 lg:h-80"
            controls
            preload="metadata"
            title={video.title}
          />
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Header with Edit/Delete buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-lg font-bold border border-rule rounded-[4px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink transition-colors"
                    placeholder="Video title"
                    maxLength={100}
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-rule rounded-[4px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink resize-none transition-colors"
                    rows={3}
                    placeholder="Video description (optional)"
                    maxLength={500}
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleSave}
                      disabled={loading || !title.trim()}
                      className="cursor-pointer flex-1 sm:flex-none px-4 py-2 bg-ink text-white rounded-[4px] hover:bg-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setTitle(video.title);
                        setDescription(video.description || '');
                      }}
                      disabled={loading}
                      className="cursor-pointer flex-1 sm:flex-none px-4 py-2 bg-gray-500 text-white rounded-[4px] hover:bg-gray-600 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-ink mb-2 line-clamp-2">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-graphite leading-relaxed text-sm sm:text-base line-clamp-3">
                      {video.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {isAuthor && !isEditing && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setIsEditing(true)}
                  className="cursor-pointer p-2 text-ink hover:bg-[#edf2f5] rounded-[4px] transition-colors"
                  title="Edit video"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={loading}
                  className="cursor-pointer p-2 text-mark hover:bg-[#fdf3f2] rounded-[4px] transition-colors disabled:opacity-50"
                  title="Delete video"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Video Info */}
          {!isEditing && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-graphite mb-4">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{formatDate(video.createdAt)}</span>
              </div>
              {video.duration && (
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{formatDuration(video.duration)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span>Size: {formatFileSize(video.fileSize)}</span>
              </div>
            </div>
          )}

          {/* Action Links */}
          {!isEditing && (
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={video.blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-ink text-white rounded-[4px] hover:bg-ink transition-colors font-medium text-sm"
              >
                <Play size={16} />
                <span>Open in new tab</span>
              </a>
              <a
                href={video.blobUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-ink text-white rounded-[4px] hover:bg-ink transition-colors font-medium text-sm"
              >
                <Download size={16} />
                <span>Download MP4</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        loading={loading}
      />

      {/* Toast Notification */}
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
