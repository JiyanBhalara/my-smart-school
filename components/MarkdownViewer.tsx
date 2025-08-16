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
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

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
      alert((err as Error).message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative bg-white p-6 rounded-lg border border-gray-200">
      {/* Professional Action Buttons */}
      {(canEdit && onSave) && (
        <div className="absolute top-4 right-4 flex gap-3 z-10">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                className="cursor-pointer inline-flex items-center gap-2 mb-4 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-200 shadow-sm"
                title="Cancel editing"
              >
                <X size={16} />
                <span className="hidden sm:inline">Cancel</span>
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="cursor-pointer inline-flex items-center gap-2 mb-4 px-4 py-2 text-sm font-semibold text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 hover:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
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
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all duration-200 shadow-sm"
              title="Edit content"
            >
              <Edit size={16} />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}
        </div>
      )}

      {/* Side by side editor and preview */}
      {isEditing ? (
        <div className="flex flex-col lg:flex-row gap-4 mt-8">
          {/* Editor */}
          <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
            <MDEditor
              value={value}
              onChange={(v) => setValue(v || "")}
              height={400}
              preview="edit"
              textareaProps={{ 
                className: "p-4 font-mono text-sm leading-relaxed",
                style: { resize: 'none' }
              }}
              data-color-mode="light"
            />
          </div>

          {/* Live Preview */}
          <div className="flex-1 border border-gray-300 rounded-lg p-4 overflow-auto max-h-[400px] bg-gray-50">
            <div className="prose prose-sm max-w-none">
              <MarkdownPreview
                source={value}
                style={{ backgroundColor: "transparent" }}
                wrapperElement={{ 'data-color-mode': 'light' }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="prose prose-base max-w-none mt-4">
          <MarkdownPreview
            source={content}
            style={{ backgroundColor: "transparent" }}
            wrapperElement={{ "data-color-mode": "light" }}
          />
        </div>
      )}

      <style jsx global>{`
        .wmde-markdown {
          font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
          background-color: transparent !important;
        }

        .wmde-markdown h1 {
          color: #111827;
          font-size: 2.25rem;
          font-weight: 700;
          margin: 2rem 0 1rem 0;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }

        .wmde-markdown h2 {
          color: #111827;
          font-size: 1.875rem;
          font-weight: 600;
          margin: 2rem 0 1rem 0;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }

        .wmde-markdown h3 {
          color: #111827;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.5rem 0 0.75rem 0;
        }

        .wmde-markdown p {
          color: #374151;
          margin-bottom: 1rem;
          line-height: 1.7;
        }

        .wmde-markdown ul,
        .wmde-markdown ol {
          color: #374151;
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }

        .wmde-markdown li {
          margin-bottom: 0.5rem;
        }

        .wmde-markdown blockquote {
          border-left: 4px solid #3b82f6;
          background-color: #eff6ff;
          padding: 1rem;
          margin: 1.5rem 0;
          border-radius: 0.5rem;
        }

        .wmde-markdown code {
          background-color: #f3f4f6;
          color: #ef4444;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .wmde-markdown pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }

        .wmde-markdown pre code {
          background-color: transparent;
          color: #f9fafb;
          font-weight: normal;
        }

        .wmde-markdown table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          background-color: white;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .wmde-markdown th {
          background-color: #f3f4f6;
          color: #111827;
          font-weight: 600;
          padding: 0.75rem;
          text-align: left;
          border-bottom: 2px solid #e5e7eb;
        }

        .wmde-markdown td {
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
          color: #374151;
        }

        .wmde-markdown a {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
        }

        .wmde-markdown a:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .wmde-markdown strong {
          color: #111827;
          font-weight: 600;
        }

        .wmde-markdown em {
          color: #374151;
          font-style: italic;
        }

        /* Editor specific styles for better alignment */
        .w-md-editor-text-textarea {
          font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, Consolas, 'Roboto Mono', monospace;
          line-height: 1.6;
          padding: 1rem !important;
        }

        .w-md-editor-text {
          border-radius: 0.5rem;
        }

        .w-md-editor {
          background-color: white;
        }
      `}</style>
    </div>
  );
}
