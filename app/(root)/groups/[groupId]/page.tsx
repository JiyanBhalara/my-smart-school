// File: app/groups/[groupId]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface User {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface GroupMember {
  user: User;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

interface GroupMessage {
  id: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
  sender: User;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdBy: User;
  members: GroupMember[];
  pinnedMessage?: {
    id: string;
    content: string | null;
    fileUrl: string | null;
    fileName: string | null;
    sender: User;
  } | null;
}

export default function GroupChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showPinOptions, setShowPinOptions] = useState<string | null>(null);

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

  // Fetch group data and messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch group details
        const groupResponse = await fetch(`/api/groups/${groupId}`);
        if (!groupResponse.ok) {
          throw new Error('Failed to fetch group');
        }
        const groupData = await groupResponse.json();
        setGroup(groupData.group);

        // Fetch messages
        const messagesResponse = await fetch(`/api/groups/${groupId}/messages`);
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

    if (groupId && session) {
      fetchData();
    }
  }, [groupId, session]);

  // Add this useEffect to your group chat page after fetching messages:

useEffect(() => {
  // Mark messages as read when user enters the group
  const markAsRead = async () => {
    if (groupId) {
      try {
        await fetch(`/api/groups/${groupId}/read`, {
          method: 'POST'
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  markAsRead();
}, [groupId]);

// Also add this to mark as read when user sends a message
// Update your handleSendMessage function:
const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newMessage.trim() || sending) return;

  setSending(true);
  try {
    const response = await fetch(`/api/groups/${groupId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newMessage.trim(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    setMessages(prev => [...prev, data.message]);
    setNewMessage('');
    
    // Mark messages as read after sending
    try {
      await fetch(`/api/groups/${groupId}/read`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  } catch {
    alert('Failed to send message. Please try again.');
  } finally {
    setSending(false);
  }
};

  const currentUserMembership = group?.members.find(m => m.user.id === session?.user?.id);
  const isAdmin = currentUserMembership?.role === 'ADMIN';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('groupId', groupId);

      const uploadResponse = await fetch('/api/groups/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const uploadData = await uploadResponse.json();

      const messageResponse = await fetch(`/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      setMessages(prev => [...prev, messageData.message]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePinMessage = async (messageId: string) => {
    if (!isAdmin) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });

      if (!response.ok) {
        throw new Error('Failed to pin message');
      }

      const data = await response.json();
      setGroup(prev => prev ? { ...prev, pinnedMessage: data.pinnedMessage } : prev);
    } catch {
      alert('Failed to pin message. Please try again.');
    }
    setShowPinOptions(null);
  };

  const handleUnpinMessage = async () => {
    if (!isAdmin) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/pin`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to unpin message');
      }

      setGroup(prev => prev ? { ...prev, pinnedMessage: null } : prev);
    } catch {
      alert('Failed to unpin message. Please try again.');
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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-emerald-600 mx-auto"></div>
          <span className="mt-4 text-slate-600 font-medium text-lg">Loading group...</span>
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

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <p className="text-gray-600">Group not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4 lg:px-6 mb-7">
      <div className="max-w-5xl mx-auto h-[calc(100vh-6rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        
        {/* Group Header */}
        <header className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/groups')}
              className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {group.imageUrl ? (
              <Image
                src={group.imageUrl}
                alt={group.name}
                width={48}
                height={48}
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            )}
            
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-slate-900 truncate max-w-48 lg:max-w-none">
                {group.name}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {group.members.length} members
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Members Button */}
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="cursor-pointer flex items-center space-x-2 text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span className="hidden lg:inline text-sm font-medium">Members</span>
            </button>

            {/* Settings Button */}
            {isAdmin && (
              <Link
                href={`/groups/${groupId}/settings`}
                className="cursor-pointer flex items-center space-x-2 text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden lg:inline text-sm font-medium">Settings</span>
              </Link>
            )}
          </div>
        </header>

        {/* Pinned Message */}
        {group.pinnedMessage && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <svg className="w-4 h-4 text-yellow-600 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 12V4a1 1 0 00-1-1H9a1 1 0 00-1 1v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1z" />
                  <path d="M9 12v8c0 .6.4 1 1 1s1-.4 1-1v-8H9z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-yellow-700 font-medium mb-1">
                    📌 Pinned by {group.pinnedMessage.sender.name}
                  </p>
                  <p className="text-sm text-yellow-800">
                    {group.pinnedMessage.content || `📎 ${group.pinnedMessage.fileName}`}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={handleUnpinMessage}
                  className="cursor-pointer text-yellow-600 hover:text-yellow-800 p-1 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No messages yet</h3>
                <p className="text-slate-500 max-w-sm">
                  Start the conversation by sending the first message to the group.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.sender.id === session?.user?.id;
              
              return (
                <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className="relative group">
                    <div className={`max-w-xs lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-2xl shadow-sm ${
                      isCurrentUser 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-white border border-gray-200 text-slate-900'
                    }`}>
                      {/* Sender name for group messages */}
                      {!isCurrentUser && (
                        <p className="text-xs font-semibold text-emerald-600 mb-1">
                          {message.sender.name}
                        </p>
                      )}

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
                                <p className={`text-xs truncate ${isCurrentUser ? 'text-emerald-100' : 'text-slate-500'}`}>
                                  {message.fileName}
                                </p>
                              )}
                            </div>
                          ) : (
                            <a
                              href={message.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                                isCurrentUser 
                                  ? 'bg-emerald-500 border-emerald-400 hover:bg-emerald-400' 
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              <svg className={`w-6 h-6 ${isCurrentUser ? 'text-emerald-100' : 'text-slate-500'}`} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{message.fileName}</p>
                                {message.fileSize && (
                                  <p className={`text-xs ${isCurrentUser ? 'text-emerald-200' : 'text-slate-500'}`}>
                                    {formatFileSize(message.fileSize)}
                                  </p>
                                )}
                              </div>
                            </a>
                          )}
                        </div>
                      )}

                      <p className={`text-xs mt-2 text-right ${
                        isCurrentUser ? 'text-emerald-200' : 'text-slate-500'
                      }`}>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Pin option for admins */}
                    {isAdmin && !isCurrentUser && (
                      <button
                        onClick={() => setShowPinOptions(showPinOptions === message.id ? null : message.id)}
                        className="cursor-pointer absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
                        </svg>
                      </button>
                    )}

                    {showPinOptions === message.id && (
                      <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handlePinMessage(message.id)}
                          className="cursor-pointer flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 12V4a1 1 0 00-1-1H9a1 1 0 00-1 1v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1z" />
                            <path d="M9 12v8c0 .6.4 1 1 1s1-.4 1-1v-8H9z" />
                          </svg>
                          <span>Pin Message</span>
                        </button>
                      </div>
                    )}
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
                className="w-full p-3 lg:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-slate-900 placeholder-slate-400 transition-colors duration-200 text-sm lg:text-base"
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
                className="cursor-pointer flex items-center justify-center w-12 h-12 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors duration-200"
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
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </form>
        </footer>
      </div>

      {/* Members Sidebar */}
      {showMembers && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowMembers(false)} />
          <div className="fixed right-0 top-20 bottom-0 w-80 bg-white border-l border-gray-200 z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Members</h3>
                <button
                  onClick={() => setShowMembers(false)}
                  className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                {group.members.map((member) => (
                  <div key={member.user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    {member.user.image ? (
                      <Image
                        src={member.user.image}
                        alt={member.user.name || 'User'}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-full flex items-center justify-center font-medium">
                        {member.user.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {member.user.name || 'Unnamed User'}
                        {member.user.id === session?.user?.id && ' (You)'}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          member.role === 'ADMIN' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {member.role === 'ADMIN' ? 'Admin' : 'Member'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          member.user.role === 'TEACHER' 
                            ? 'bg-teal-100 text-teal-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {member.user.role === 'TEACHER' ? 'Teacher' : 'Student'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

