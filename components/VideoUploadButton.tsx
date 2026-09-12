'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import VideoUploadModal from './VideoUploadModal';

interface VideoUploadButtonProps {
  lessonId: string;
  variant?: 'default' | 'primary';
  className?: string;
}

export default function VideoUploadButton({ 
  lessonId, 
  variant = 'default',
  className = '' 
}: VideoUploadButtonProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const baseClasses = "cursor-pointer inline-flex items-center gap-2 font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg";
  
  const variantClasses = {
    default: "px-4 py-2 text-ink text-white hover:text-ink",
    primary: "px-6 py-3 text-ink text-white hover:text-ink"
  };

  return (
    <>
      <button
        onClick={() => setShowUploadModal(true)}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      >
        <Plus size={variant === 'primary' ? 20 : 16} />
        <span>Upload Video</span>
      </button>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 text-black backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <VideoUploadModal
            lessonId={lessonId}
            onClose={() => setShowUploadModal(false)}
            onUploaded={() => {
              setShowUploadModal(false);
              window.location.reload();
            }}
          />
        </div>
      )}
    </>
  );
}
