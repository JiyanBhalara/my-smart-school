'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

interface User {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface Message {
  id: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  isRead: boolean;
  createdAt: string;
  sender: User;
}

interface Conversation {
  id: string;
  teacher: User;
  student: User;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  // Get conversation details and messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        const convResponse = await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId }),
        });

        if (!convResponse.ok) {
          throw new Error('Failed to fetch conversation');
        }

        const convData = await convResponse.json();
        setConversation(convData.conversation);

        const messagesResponse = await fetch(`/api/chat/messages?conversationId=${conversationId}`);

        if (!messagesResponse.ok) {
          throw new Error('Failed to fetch messages');
        }

        const messagesData = await messagesResponse.json();
        setMessages(messagesData.messages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (conversationId && session) {
      fetchData();
    }
  }, [conversationId, session]);

  const otherParticipant = conversation
    ? session?.user?.role === 'TEACHER'
      ? conversation.student
      : conversation.teacher
    : null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: newMessage.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
      setNewMessage('');
    } catch {
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);

      const uploadResponse = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const uploadData = await uploadResponse.json();

      const messageResponse = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          fileUrl: uploadData.fileUrl,
          fileName: uploadData.fileName,
          fileType: uploadData.fileType,
          fileSize: uploadData.fileSize,
        }),
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to send file message');
      }

      const messageData = await messageResponse.json();
      setMessages((prev) => [...prev, messageData.message]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadFile = async (messageId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/chat/download?messageId=${messageId}`);
      if (!response.ok) {
        throw new Error('Failed to generate download link');
      }
      const data = await response.json();
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert('Failed to download file. Please try again.');
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to clear chat history');
      }
      setMessages([]);
    } catch {
      alert('Failed to clear chat history. Please try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-600 mx-auto"></div>
          <span className="mt-4 text-slate-600 font-medium text-lg">Loading chat...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 font-medium">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4 lg:px-6 mb-7">
      <div className="max-w-5xl mx-auto h-[calc(100vh-6rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        
        {/* Chat Header */}
        <header className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-4">
            {otherParticipant?.image ? (
              <Image
                src={otherParticipant.image}
                alt={otherParticipant.name || 'User'}
                width={48}
                height={48}
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-slate-900 truncate max-w-48 lg:max-w-none">
                {otherParticipant?.name || 'Unknown User'}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {otherParticipant?.role === 'TEACHER' ? 'Teacher' : 'Student'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleClearHistory}
            className="cursor-pointer flex items-center space-x-2 text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden lg:inline text-sm font-medium">Clear</span>
          </button>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No messages yet</h3>
                <p className="text-slate-500 max-w-sm">
                  Start the conversation by sending a message below.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.sender.id === session?.user?.id;
              
              return (
                <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-2xl shadow-sm ${
                    isCurrentUser 
                      ? 'bg-slate-700 text-white' 
                      : 'bg-white border border-gray-200 text-slate-900'
                  }`}>
                    {message.content && (
                      <p className="whitespace-pre-wrap leading-relaxed text-sm lg:text-base">
                        {message.content}
                      </p>
                    )}

                    {message.fileUrl && (
                      <div className="mt-3">
                        {message.fileType?.startsWith('image/') ? (
                          <div className="space-y-2">
                            <Image
                              src={message.fileUrl}
                              alt={message.fileName || 'Image'}
                              width={300}
                              height={200}
                              className="rounded-lg max-w-full h-auto object-contain shadow-sm"
                            />
                            {message.fileName && (
                              <p className={`text-xs truncate ${isCurrentUser ? 'text-slate-300' : 'text-slate-500'}`}>
                                {message.fileName}
                              </p>
                            )}
                          </div>
                        ) : message.fileType === 'application/pdf' || message.fileName?.endsWith('.pdf') ? (
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`cursor-pointer flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                              isCurrentUser 
                                ? 'bg-slate-600 border-slate-500 hover:bg-slate-500' 
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <svg className={`w-6 h-6 ${isCurrentUser ? 'text-slate-300' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{message.fileName}</p>
                              {message.fileSize && (
                                <p className={`text-xs ${isCurrentUser ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {formatFileSize(message.fileSize)}
                                </p>
                              )}
                            </div>
                            <svg className={`w-4 h-4 ${isCurrentUser ? 'text-slate-300' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
                            isCurrentUser 
                              ? 'bg-slate-600 border-slate-500' 
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <svg className={`w-6 h-6 ${isCurrentUser ? 'text-slate-300' : 'text-slate-500'}`} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{message.fileName}</p>
                              {message.fileSize && (
                                <p className={`text-xs ${isCurrentUser ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {formatFileSize(message.fileSize)}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDownloadFile(message.id, message.fileName || 'file')}
                              className={`cursor-pointer p-1 rounded transition-colors ${
                                isCurrentUser 
                                  ? 'hover:bg-slate-500 text-slate-300' 
                                  : 'hover:bg-gray-200 text-slate-500'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <p className={`text-xs mt-2 text-right ${
                      isCurrentUser ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Message Input */}
        <footer className="bg-white border-t border-gray-200 p-4 lg:p-6">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full p-3 lg:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none text-slate-900 placeholder-slate-400 transition-colors duration-200 text-sm lg:text-base"
                rows={1}
                style={{ 
                  minHeight: '48px',
                  maxHeight: '120px',
                  height: 'auto'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="cursor-pointer flex items-center justify-center w-12 h-12 bg-gray-100 text-slate-600 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200 disabled:opacity-50"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-600 border-t-transparent"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                )}
              </button>

              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="cursor-pointer flex items-center justify-center w-12 h-12 bg-slate-700 text-white rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 transition-colors duration-200"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </form>
        </footer>
      </div>
    </div>
  );
}
