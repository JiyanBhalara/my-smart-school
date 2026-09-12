'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { upload } from '@vercel/blob/client';
import { useUpload } from '@/contexts/UploadContext';

interface VideoUploadModalProps {
  lessonId: string;
  onClose: () => void;
  onUploaded: () => void;
}

export default function VideoUploadModal({ lessonId, onClose, onUploaded }: VideoUploadModalProps) {
  const [file, setFile] = useState<File>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { addUpload, updateProgress, removeUpload } = useUpload();
  const maxSize = 750 * 1024 * 1024; // 750MB

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > maxSize) {
      setError('File must be less than 750MB.');
      setFile(undefined);
    } else if (selectedFile.type !== 'video/mp4') {
      setError('Only MP4 files are allowed.');
      setFile(undefined);
    } else {
      setFile(selectedFile);
      setError('');
      
      // Auto-generate title from filename if empty
      if (!title.trim()) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt.replace(/[_-]/g, ' '));
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!file || !title.trim()) {
      setError('Please select a file and enter a title.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    // The LessonVideo row is created server-side once Blob storage confirms the
    // upload, so there is no video id yet -- use a client-side key for the toast.
    const toastKey = `upload-${Date.now()}`;
    addUpload(toastKey, title.trim());

    try {
      // Straight from the browser to Blob storage. The file never passes
      // through the serverless function, so the 4.5MB body cap does not apply.
      await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: `/api/lessons/${lessonId}/videos/upload`,
        contentType: 'video/mp4',
        clientPayload: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
        onUploadProgress: ({ percentage }) => {
          setProgress(percentage);
          updateProgress(toastKey, `Uploading... ${Math.round(percentage)}%`);
        },
      });

      updateProgress(toastKey, 'Upload completed! 🎉');
      setTimeout(() => removeUpload(toastKey), 5000);
      onUploaded?.();
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      removeUpload(toastKey);
      setError(
        error instanceof Error
          ? error.message
          : 'Upload failed. Please check your connection and try again.'
      );
    } finally {
      setUploading(false);
    }
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    /* FIXED: Responsive container with proper scrolling */
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md lg:max-w-lg mx-4 my-4 sm:my-8 overflow-hidden max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-purple-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Upload size={20} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Upload Video</h2>
        </div>
        <button
          onClick={onClose}
          disabled={uploading}
          className="cursor-pointer p-2 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      {/* FIXED: Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video File (MP4 only, max 750MB)
            </label>
            <input
              type="file"
              accept="video/mp4"
              onChange={handleFile}
              disabled={uploading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            {file && (
              <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="font-medium truncate" title={file.name}>{file.name}</div>
                <div>Size: {formatFileSize(file.size)}</div>
              </div>
            )}
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              placeholder="Enter video title"
              maxLength={100}
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 resize-none"
              rows={3}
              placeholder="Enter video description (optional)"
              maxLength={500}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Live upload progress */}
          {uploading && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm text-purple-800 mb-2">
                <span className="font-medium">Uploading…</span>
                <span className="tabular-nums">{Math.round(progress)}%</span>
              </div>
              <div
                className="h-2 w-full bg-purple-100 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-purple-600 transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Info */}
          {!error && !uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-700">
                <div className="font-medium mb-1">Upload Process:</div>
                <ul className="text-xs space-y-1 list-disc list-inside ml-2">
                  <li>Video uploads straight to storage from your browser</li>
                  <li>Progress is shown live below</li>
                  <li>Keep this tab open during upload</li>
                </ul>
              </div>
            </div>
          )}

          {/* FIXED: Buttons - Moved to bottom with proper spacing */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-white">
            <button
              type="submit"
              disabled={!file || !title.trim() || uploading}
              className="cursor-pointer flex-1 bg-purple-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {uploading ? `Uploading… ${Math.round(progress)}%` : 'Upload Video'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="cursor-pointer sm:flex-none px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
