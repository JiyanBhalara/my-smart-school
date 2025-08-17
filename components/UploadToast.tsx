"use client";

import { useUpload } from '@/contexts/UploadContext';
import { AlertCircle, Upload, CheckCircle, X, Clock, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function UploadToast() {
  const { uploadingVideos, removeUpload } = useUpload();
  const [autoReloadScheduled, setAutoReloadScheduled] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check for completed uploads and schedule auto-reload
    Array.from(uploadingVideos.entries()).forEach(([videoId, { progress }]) => {
      if ((progress.includes('completed') || progress.includes('🎉')) && !autoReloadScheduled.has(videoId)) {
        setAutoReloadScheduled(prev => new Set(prev).add(videoId));
        
        // Schedule auto-reload after showing success message
        setTimeout(() => {
          window.location.reload();
        }, 3000); // 3 seconds to show success message
      }
    });
  }, [uploadingVideos, autoReloadScheduled]);

  if (uploadingVideos.size === 0) return null;

  const formatDuration = (startTime: number) => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressMessage = (progress: string, isCompleted: boolean) => {
    if (isCompleted) {
      return '🎉 Upload completed! Page will refresh automatically...';
    }
    return progress;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 w-full max-w-xs sm:max-w-sm lg:max-w-md px-4 sm:px-0">
      {Array.from(uploadingVideos.entries()).map(([videoId, { title, progress, startTime }]) => {
        const isCompleted = progress.includes('completed') || progress.includes('🎉');
        const isFailed = progress.includes('failed') || progress.includes('❌');
        const isUploading = !isCompleted && !isFailed;
        
        return (
          <div
            key={videoId}
            className={`bg-white border rounded-lg shadow-lg p-3 sm:p-4 animate-in slide-in-from-bottom-2 duration-300 ${
              isCompleted 
                ? 'border-green-200 bg-green-50' 
                : isFailed 
                ? 'border-red-200 bg-red-50' 
                : 'border-blue-200'
            }`}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <div className="p-1.5 sm:p-2 bg-green-100 rounded-full">
                    <CheckCircle size={14} className="text-green-600 sm:w-4 sm:h-4" />
                  </div>
                ) : isFailed ? (
                  <div className="p-1.5 sm:p-2 bg-red-100 rounded-full">
                    <X size={14} className="text-red-600 sm:w-4 sm:h-4" />
                  </div>
                ) : (
                  <div className="p-1.5 sm:p-2 bg-blue-100 rounded-full">
                    <Upload size={14} className="text-blue-600 animate-pulse sm:w-4 sm:h-4" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-xs sm:text-sm truncate" title={title}>
                  {title}
                </div>
                <div className={`text-xs sm:text-sm mt-1 ${
                  isCompleted ? 'text-green-700' : isFailed ? 'text-red-700' : 'text-blue-600'
                }`}>
                  {getProgressMessage(progress, isCompleted)}
                </div>
                
                {/* Duration */}
                <div className="flex items-center gap-1 mt-1.5 sm:mt-2 text-xs text-gray-500">
                  <Clock size={10} className="sm:w-3 sm:h-3" />
                  <span>{formatDuration(startTime)}</span>
                </div>
                
                {/* Warning message for active uploads */}
                {isUploading && (
                  <div className="flex items-center gap-1 mt-1.5 sm:mt-2 text-xs text-amber-600">
                    <AlertCircle size={10} className="sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">Please don't close this tab</span>
                    <span className="sm:hidden">Don't close tab</span>
                  </div>
                )}

                {/* Auto-reload message for completed uploads */}
                {isCompleted && (
                  <div className="flex items-center gap-1 mt-1.5 sm:mt-2 text-xs text-green-600">
                    <RefreshCw size={10} className="sm:w-3 sm:h-3 animate-spin" />
                    <span className="hidden sm:inline">Refreshing page in 3 seconds...</span>
                    <span className="sm:hidden">Refreshing...</span>
                  </div>
                )}
              </div>

              {/* Close button for completed/failed uploads */}
              {(isCompleted || isFailed) && (
                <button
                  onClick={() => removeUpload(videoId)}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Dismiss"
                >
                  <X size={12} className="text-gray-400 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
            </div>

            {/* Progress bar for active uploads */}
            {isUploading && (
              <div className="mt-2 sm:mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1 sm:h-1.5">
                  <div 
                    className="bg-blue-600 h-1 sm:h-1.5 rounded-full animate-pulse transition-all duration-500" 
                    style={{ 
                      width: progress.includes('Processing') ? '80%' : 
                             progress.includes('Uploading') ? '60%' : '40%' 
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Success celebration bar */}
            {isCompleted && (
              <div className="mt-2 sm:mt-3">
                <div className="w-full bg-green-200 rounded-full h-1 sm:h-1.5">
                  <div className="bg-green-600 h-1 sm:h-1.5 rounded-full w-full transition-all duration-1000"></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
