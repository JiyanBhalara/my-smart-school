// components/EditableMarkdownWrapper.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownViewer from "./MarkdownViewer";

interface EditableMarkdownWrapperProps {
  initialContent: string;
  lessonId: string;
  contentId: string;
  title: string;
  canEdit: boolean;
}

export default function EditableMarkdownWrapper({
  initialContent,
  lessonId,
  contentId,
  title,
  canEdit
}: EditableMarkdownWrapperProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);

  const handleSave = async (newContent: string) => {
    const response = await fetch(`/api/lessons/${lessonId}/content/${contentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        markdown: newContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update content");
    }

    setContent(newContent);
    router.refresh(); // Refresh to sync with server state
  };

  return (
    <MarkdownViewer 
      content={content} 
      canEdit={canEdit} 
      onSave={handleSave} 
    />
  );
}
