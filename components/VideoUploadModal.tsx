'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
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

  // Poll for upload completion
  const pollUploadStatus = async (videoId: string) => {
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max (120 * 5 seconds)
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/lessons/${lessonId}/videos`);
        if (response.ok) {
          const data = await response.json();
          const video = data.videos.find((v: any) => v.id === videoId);
          
          if (video?.uploadStatus === 'COMPLETED') {
            updateProgress(videoId, 'Upload completed! 🎉');
            setTimeout(() => removeUpload(videoId), 5000);
            onUploaded?.();
            return;
          } else if (video?.uploadStatus === 'FAILED') {
            updateProgress(videoId, 'Upload failed ❌');
            setTimeout(() => removeUpload(videoId), 10000);
            return;
          }
        }
        
        // Continue polling if still uploading
        attempts++;
        if (attempts < maxAttempts) {
          if (attempts < 6) {
            updateProgress(videoId, 'Uploading to Internet Archive...');
          } else {
            updateProgress(videoId, 'Processing on Internet Archive... (this may take several minutes)');
          }
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        } else {
          updateProgress(videoId, 'Upload taking longer than expected. Check back later.');
          setTimeout(() => removeUpload(videoId), 30000);
        }
      } catch (error) {
        console.error('Status check failed:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000); // Retry in 10 seconds on error
        }
      }
    };
    
    setTimeout(checkStatus, 3000); // Start checking after 3 seconds
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!file || !title.trim()) {
      setError('Please select a file and enter a title.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());

      const response = await fetch(`/api/lessons/${lessonId}/videos/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        // Add to upload context for persistent toast
        addUpload(result.videoId, title.trim());
        
        // Start polling for status
        pollUploadStatus(result.videoId);
        
        onClose();
      } else {
        setError(result.error || 'Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Network error. Please check your connection and try again.');
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

          {/* Upload Info */}
          {!error && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-700">
                <div className="font-medium mb-1">Upload Process:</div>
                <ul className="text-xs space-y-1 list-disc list-inside ml-2">
                  <li>Video will be uploaded to Internet Archive</li>
                  <li>Processing may take several minutes</li>
                  <li>You'll get a notification when upload completes</li>
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
              {uploading ? 'Starting Upload...' : 'Upload Video'}
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
