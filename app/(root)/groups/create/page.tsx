// File: app/groups/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

export default function CreateGroupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Form state
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or not a teacher
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user?.role !== 'TEACHER') {
      router.push('/groups');
      return;
    }
  }, [session, status, router]);

  // Fetch all users for member selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/chat/search?query='); // Empty query to get all users
        if (response.ok) {
          const data = await response.json();
          setAllUsers(data.users || []);
          setSearchResults(data.users || []);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    if (session?.user?.role === 'TEACHER') {
      fetchUsers();
    }
  }, [session]);

  // Handle search with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(allUsers);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetch(`/api/chat/search?query=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.users || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, allUsers]);

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Please select at least one member');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName.trim(),
          description: description.trim() || null,
          memberIds: selectedMembers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create group');
      }

      const data = await response.json();
      router.push(`/groups/${data.group.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const selectedUsers = searchResults.filter(user => selectedMembers.includes(user.id));

  if (status === 'loading') {
    return (
      <div className="sheet-page mx-auto w-full max-w-5xl py-10 bg-[#edf2f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-rule border-t-ink mx-auto"></div>
          <span className="mt-4 text-graphite font-medium text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-page mx-auto w-full max-w-5xl py-10 bg-[#edf2f5]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="cursor-pointer p-2 hover:bg-[#edf2f5] rounded-[4px] transition-colors"
            >
              <svg className="w-5 h-5 text-graphite" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-ink">Create New Group</h1>
          </div>
          <p className="text-graphite">Build your learning community by creating a group and adding members.</p>
        </div>

        {/* Create Group Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-[4px] border border-rule p-6">
            <h2 className="text-xl font-semibold text-ink mb-6">Group Information</h2>
            
            <div className="space-y-6">
              {/* Group Name */}
              <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-ink mb-2">
                  Group Name <span className="text-mark">*</span>
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name (e.g., Math Class 2024, Study Group)"
                  className="w-full px-4 py-3 border border-rule rounded-[4px] focus:ring-2 focus:ring-ink focus:border-transparent transition-colors"
                  maxLength={100}
                />
                <p className="mt-1 text-sm text-graphite">{groupName.length}/100 characters</p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-ink mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this group..."
                  rows={4}
                  className="w-full px-4 py-3 border border-rule rounded-[4px] focus:ring-2 focus:ring-ink focus:border-transparent transition-colors resize-none"
                  maxLength={500}
                />
                <p className="mt-1 text-sm text-graphite">{description.length}/500 characters</p>
              </div>
            </div>
          </div>

          {/* Member Selection */}
          <div className="bg-white rounded-[4px] border border-rule p-6">
            <h2 className="text-xl font-semibold text-ink mb-6">Add Members</h2>

            {/* Search */}
            <div className="relative mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name..."
                className="w-full pl-10 pr-4 py-3 border border-rule rounded-[4px] focus:ring-2 focus:ring-ink focus:border-transparent transition-colors"
              />
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-graphite" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-rule border-t-ink"></div>
                </div>
              )}
            </div>

            {/* Selected Members Summary */}
            {selectedMembers.length > 0 && (
              <div className="mb-6 p-4 bg-[#edf2f5] border border-ink rounded-[4px]">
                <h3 className="text-sm font-medium text-ink mb-3">
                  Selected Members ({selectedMembers.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <span
                      key={user.id}
                      className="inline-flex items-center space-x-2 bg-[#edf2f5] text-ink px-3 py-1 rounded-full text-sm font-medium"
                    >
                      <span>{user.name || 'Unnamed User'}</span>
                      <button
                        type="button"
                        onClick={() => handleMemberToggle(user.id)}
                        className="cursor-pointer hover:bg-[#01243a] rounded-full p-0.5 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* User List */}
            <div className="max-h-96 overflow-y-auto border border-rule rounded-[4px]">
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-graphite">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p>No users found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-4 hover:bg-[#edf2f5] transition-colors cursor-pointer ${ selectedMembers.includes(user.id) ? 'bg-[#edf2f5]' : '' }`}
                      onClick={() => handleMemberToggle(user.id)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || 'User'}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full border border-rule"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-ink text-white rounded-full flex items-center justify-center font-medium">
                            {user.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">
                            {user.name || 'Unnamed User'}
                          </p>
                          <p className="text-xs text-graphite truncate">{user.email}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${ user.role === 'TEACHER' ? 'border border-ink text-ink' : 'border border-rule text-graphite' }`}>
                            {user.role === 'TEACHER' ? 'Teacher' : 'Student'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(user.id)}
                          onChange={() => handleMemberToggle(user.id)}
                          className="h-4 w-4 text-ink focus:ring-ink border-rule rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-[#fdf3f2] border border-mark rounded-[4px] p-4">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-mark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-mark">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-rule">
            <button
              type="button"
              onClick={() => router.back()}
              className="cursor-pointer px-6 py-3 text-ink bg-white border border-rule rounded-[4px] font-medium hover:bg-[#edf2f5] focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !groupName.trim() || selectedMembers.length === 0}
              className="cursor-pointer px-8 py-3 bg-ink text-white rounded-[4px] font-medium hover:bg-ink focus:outline-none focus:ring-2 focus:ring-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create Group</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
