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
      <div className="relative bg-white p-6 rounded-[4px] border border-rule min-h-[200px] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-graphite" />
      </div>
    );
  }

  return (
    <div className="relative bg-white p-6 rounded-[4px] border border-rule">
      {/* Action Buttons */}
      {canEdit && onSave && (
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-mark bg-[#fdf3f2] border border-mark rounded-[4px] hover:bg-[#fdf3f2] hover:border-mark focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Cancel editing"
              >
                <X size={16} />
                <span className="hidden sm:inline">Cancel</span>
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-ink border border-ink rounded-[4px] hover:bg-ink hover:border-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-ink bg-[#edf2f5] border border-ink rounded-[4px] hover:bg-[#edf2f5] hover:border-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1 transition-colors"
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
                <h4 className="text-sm font-medium text-ink">Editor</h4>
                <div className="border border-rule rounded-[4px] overflow-hidden">
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
                <h4 className="text-sm font-medium text-ink">Preview</h4>
                <div className="border border-rule rounded-[4px] p-4 bg-[#edf2f5] h-[400px] overflow-auto">
                  <div className="prose prose-sm max-w-none">
                    {value ? (
                      <MarkdownPreview
                        source={value}
                        style={{ backgroundColor: "transparent" }}
                        wrapperElement={{ "data-color-mode": "light" } as React.HTMLAttributes<HTMLDivElement>}
                      />
                    ) : (
                      <p className="text-graphite italic">Preview will appear here...</p>
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
                wrapperElement={{ "data-color-mode": "light" } as React.HTMLAttributes<HTMLDivElement>}
              />
            ) : (
              <p className="text-graphite italic">No content available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
