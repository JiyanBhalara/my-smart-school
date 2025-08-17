"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface UploadContextType {
  uploadingVideos: Map<string, { title: string; progress: string; startTime: number }>;
  addUpload: (videoId: string, title: string) => void;
  removeUpload: (videoId: string) => void;
  updateProgress: (videoId: string, progress: string) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploadingVideos, setUploadingVideos] = useState(new Map());

  const addUpload = (videoId: string, title: string) => {
    setUploadingVideos(prev => new Map(prev.set(videoId, { 
      title, 
      progress: 'Starting upload...', 
      startTime: Date.now() 
    })));
  };

  const removeUpload = (videoId: string) => {
    setUploadingVideos(prev => {
      const newMap = new Map(prev);
      newMap.delete(videoId);
      return newMap;
    });
  };

  const updateProgress = (videoId: string, progress: string) => {
    setUploadingVideos(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(videoId);
      if (current) {
        newMap.set(videoId, { ...current, progress });
      }
      return newMap;
    });
  };

  // FIXED: Only prevent tab closure for ACTIVE uploads (not completed/failed)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if there are any active uploads (not completed or failed)
      const hasActiveUploads = Array.from(uploadingVideos.values()).some(upload => 
        !upload.progress.includes('completed') && 
        !upload.progress.includes('🎉') && 
        !upload.progress.includes('failed') && 
        !upload.progress.includes('❌')
      );

      if (hasActiveUploads) {
        e.preventDefault();
        e.returnValue = 'Videos are still uploading. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploadingVideos]); // Watch the entire uploadingVideos map, not just size

  // ADDED: Auto-cleanup completed uploads after a delay
  useEffect(() => {
    const completedUploads = Array.from(uploadingVideos.entries()).filter(([_, upload]) => 
      upload.progress.includes('completed') || upload.progress.includes('🎉')
    );

    if (completedUploads.length > 0) {
      // Auto-remove completed uploads after 10 seconds
      const timeouts = completedUploads.map(([videoId, _]) => 
        setTimeout(() => {
          removeUpload(videoId);
        }, 10000) // 10 seconds
      );

      // Cleanup timeouts if component unmounts or uploads change
      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [uploadingVideos]);

  return (
    <UploadContext.Provider value={{ uploadingVideos, addUpload, removeUpload, updateProgress }}>
      {children}
    </UploadContext.Provider>
  );
}

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) throw new Error('useUpload must be used within UploadProvider');
  return context;
};
