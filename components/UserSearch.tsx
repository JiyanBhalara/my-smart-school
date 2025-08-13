'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
}

interface SearchProps {
  currentUserId: string;
  onChatSelect: (user: User, conversationId?: string) => void;
  className?: string;
}

export default function UserSearch({ currentUserId, onChatSelect, className = '' }: SearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationsMap, setConversationsMap] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        // Search for users
        const res = await fetch(`/api/chat/search?query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data.users);
        setShowResults(true);

        // Fetch existing conversations to check which users we already chat with
        if (data.users.length > 0) {
          const convRes = await fetch('/api/chat/conversations/list');
          if (convRes.ok) {
            const convData = await convRes.json();
            const map: Record<string, string> = {};
            
            convData.conversations.forEach((conv: any) => {
              const otherUserId = conv.teacher.id === currentUserId ? conv.student.id : conv.teacher.id;
              map[otherUserId] = conv.id;
            });
            setConversationsMap(map);
          }
        }
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce search

    return () => clearTimeout(searchTimeout);
  }, [query, currentUserId]);

  const handleUserSelect = (user: User) => {
    const conversationId = conversationsMap[user.id];
    onChatSelect(user, conversationId);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by name..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-colors duration-200"
          onFocus={() => query.length >= 2 && setShowResults(true)}
        />
        <svg 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-slate-600"></div>
          </div>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.length === 0 && !loading && (
            <div className="p-4 text-center text-slate-500">
              <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm">No users found</p>
            </div>
          )}
          
          {results.map((user) => {
            const existingConversation = conversationsMap[user.id];
            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handleUserSelect(user)}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 text-white rounded-full flex items-center justify-center font-medium">
                      {user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                      user.role === 'TEACHER' 
                        ? 'bg-teal-100 text-teal-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'TEACHER' ? 'Teacher' : 'Student'}
                    </span>
                  </div>
                </div>
                
                <button
                  className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    existingConversation
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-800 text-white'
                  }`}
                >
                  {existingConversation ? 'Continue Chat' : 'Start Chat'}
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Backdrop to close search results */}
      {showResults && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}
