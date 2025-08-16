// components/MarkdownViewer.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Edit,
  Save,
  X,
  Loader2
} from "lucide-react";

// Dynamically import to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
const MarkdownPreview = dynamic(
  () => import("@uiw/react-markdown-preview"),
  { ssr: false }
);

interface MarkdownViewerProps {
  content: string;
  canEdit?: boolean;
  onSave?: (newContent: string) => Promise<void>;
}

export default function MarkdownViewer({
  content,
  canEdit = false,
  onSave
}: MarkdownViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(content);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync internal state with content prop
  useEffect(() => {
    setValue(content);
  }, [content]);

  const startEdit = () => {
    if (canEdit && onSave) {
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    setValue(content);
    setIsEditing(false);
  };

  const saveEdit = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(value);
      setIsEditing(false);
    } catch (err) {
      console.error('Save error:', err);
      alert((err as Error).message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Show loading state during SSR/hydration
  if (!mounted) {
    return (
      <div className="relative bg-white p-6 rounded-lg border border-gray-200 min-h-[200px] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative bg-white p-6 rounded-lg border border-gray-200">
      {/* Action Buttons */}
      {canEdit && onSave && (
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                title="Cancel editing"
              >
                <X size={16} />
                <span className="hidden sm:inline">Cancel</span>
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 hover:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                title="Save changes"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
              title="Edit content"
            >
              <Edit size={16} />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className={canEdit && onSave ? "mt-12" : "mt-0"}>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Editor */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Editor</h4>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <MDEditor
                    value={value}
                    onChange={(v) => setValue(v || "")}
                    height={400}
                    preview="edit"
                    visibleDragbar={false}
                    textareaProps={{
                      placeholder: "Enter your markdown content here...",
                      style: { 
                        fontSize: 14,
                        lineHeight: 1.6,
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                      }
                    }}
                    data-color-mode="light"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Preview</h4>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 h-[400px] overflow-auto">
                  <div className="prose prose-sm max-w-none">
                    {value ? (
                      <MarkdownPreview
                        source={value}
                        style={{ backgroundColor: "transparent" }}
                        wrapperElement={{ "data-color-mode": "light" } as any}
                      />
                    ) : (
                      <p className="text-gray-500 italic">Preview will appear here...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="prose prose-gray max-w-none">
            {content ? (
              <MarkdownPreview
                source={content}
                style={{ backgroundColor: "transparent" }}
                wrapperElement={{ "data-color-mode": "light" } as any}
              />
            ) : (
              <p className="text-gray-500 italic">No content available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
