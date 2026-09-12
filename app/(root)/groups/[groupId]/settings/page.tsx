// File: app/groups/[groupId]/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

interface GroupMember {
  user: User;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdBy: User;
  members: GroupMember[];
}

export default function GroupSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Fixed: Add this state

  // Form states
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  // Fetch current user data - FIXED: Add this effect
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!session?.user?.email) return;
      
      try {
        console.log('Fetching current user with email:', session.user.email); // DEBUG
        const response = await fetch('/api/chat/search?query=');
        if (response.ok) {
          const data = await response.json();
          const user = data.users.find((u: User) => u.email === session.user.email);
          if (user) {
            setCurrentUser(user);
            console.log('Current user fetched for settings:', user); // DEBUG
          } else {
            console.log('Current user not found in search results'); // DEBUG
          }
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };

    fetchCurrentUser();
  }, [session]);

  // Fetch group data
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await fetch(`/api/groups/${groupId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch group');
        }
        const data = await response.json();
        setGroup(data.group);
        setGroupName(data.group.name);
        setDescription(data.group.description || '');
        console.log('Group data fetched in settings:', data.group); // DEBUG
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching group data:', err); // DEBUG
      } finally {
        setLoading(false);
      }
    };

    if (groupId && session) {
      fetchGroup();
    }
  }, [groupId, session]);

  // Check if current user is admin - FIXED: Use currentUser instead of session.user.id
  const currentUserMembership = group?.members.find(m => m.user.id === currentUser?.id);
  const isAdmin = currentUserMembership?.role === 'ADMIN';
  const isCreator = group?.createdBy.id === currentUser?.id;

  // DEBUG LOGGING FOR ADMIN CHECK IN SETTINGS
  useEffect(() => {
    if (group && currentUser) {
      console.log('=== SETTINGS ADMIN CHECK DEBUG ===');
      console.log('Current user:', currentUser);
      console.log('Group creator:', group.createdBy);
      console.log('Group members:', group.members);
      
      const membership = group.members.find(m => m.user.id === currentUser.id);
      console.log('User membership found:', membership);
      
      if (membership) {
        console.log('User role in group:', membership.role);
        console.log('Is admin?', membership.role === 'ADMIN');
      } else {
        console.log('ERROR: User is not a member of this group!');
      }
      
      const isCreatorCheck = group.createdBy.id === currentUser.id;
      console.log('Is creator?', isCreatorCheck);
      console.log('Final isAdmin result:', membership?.role === 'ADMIN');
      console.log('==================================');
    }
  }, [group, currentUser]);

  // Redirect if not admin - FIXED: Better logic
  useEffect(() => {
    if (group && currentUser) {
      console.log('Checking admin access...', { isAdmin, currentUser: currentUser.id }); // DEBUG
      if (!isAdmin) {
        console.log('Access denied - redirecting to group chat'); // DEBUG
        router.push(`/groups/${groupId}`);
      }
    }
  }, [group, currentUser, isAdmin, router, groupId]);

  // Search for users to add
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetch(`/api/chat/search?query=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          // Filter out users who are already members
          const existingMemberIds = group?.members.map(m => m.user.id) || [];
          const filteredUsers = data.users.filter(
            (user: User) => !existingMemberIds.includes(user.id)
          );
          setSearchResults(filteredUsers);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, group?.members]);

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update group');
      }

      const data = await response.json();
      setGroup(data.group);
      alert('Group updated successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update group');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [userId] }),
      });

      if (!response.ok) {
        throw new Error('Failed to add member');
      }

      // Refresh group data
      const groupResponse = await fetch(`/api/groups/${groupId}`);
      if (groupResponse.ok) {
        const groupData = await groupResponse.json();
        setGroup(groupData.group);
      }

      // Remove from search results
      setSearchResults(prev => prev.filter(user => user.id !== userId));
      alert('Member added successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the group?')) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/members?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      // Refresh group data
      const groupResponse = await fetch(`/api/groups/${groupId}`);
      if (groupResponse.ok) {
        const groupData = await groupResponse.json();
        setGroup(groupData.group);
      }

      alert('Member removed successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'ADMIN' | 'MEMBER') => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to change member role');
      }

      // Update group members
      setGroup(prev => prev ? {
        ...prev,
        members: prev.members.map(m => 
          m.user.id === userId ? { ...m, role: newRole } : m
        )
      } : prev);

      alert(`Member role updated to ${newRole.toLowerCase()}!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to change member role');
    }
  };

  const handleDeleteGroup = async () => {
    if (!isCreator) return;

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete group');
      }

      router.push('/groups');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete group');
    }
  };

  const handleClearMessages = async () => {
    if (!confirm('Are you sure you want to clear all messages? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/messages`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear messages');
      }

      alert('All messages have been cleared!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to clear messages');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#edf2f5] pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-rule border-t-ink mx-auto"></div>
          <span className="mt-4 text-graphite font-medium text-lg">Loading settings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#edf2f5] pt-20 flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-[#fdf3f2] border border-mark rounded-[4px] p-6">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-mark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-mark font-medium">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  // FIXED: Better access control check
  if (!group) {
    return (
      <div className="min-h-screen bg-[#edf2f5] pt-20 flex items-center justify-center">
        <p className="text-graphite">Group not found</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#edf2f5] pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-rule border-t-ink mx-auto"></div>
          <span className="mt-4 text-graphite font-medium text-lg">Loading user data...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#edf2f5] pt-20 flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-[#edf2f5] border border-mark rounded-[4px] p-6">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-mark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-mark font-medium">Access Denied</p>
              <p className="text-mark text-sm">Only group administrators can access these settings.</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.push(`/groups/${groupId}`)}
              className="cursor-pointer px-4 py-2 bg-yellow-600 text-white rounded-[4px] font-medium hover:bg-yellow-700 transition-colors"
            >
              Back to Group Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf2f5] pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push(`/groups/${groupId}`)}
              className="cursor-pointer p-2 hover:bg-[#edf2f5] rounded-[4px] transition-colors"
            >
              <svg className="w-5 h-5 text-graphite" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-ink">Group Settings</h1>
          </div>
          <p className="text-graphite">Manage your group settings and members</p>
        </div>

        <div className="space-y-8">
          {/* Group Information */}
          <div className="bg-white rounded-[4px] border border-rule p-6">
            <h2 className="text-xl font-semibold text-ink mb-6">Group Information</h2>
            
            <form onSubmit={handleUpdateGroup} className="space-y-6">
              <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-ink mb-2">
                  Group Name <span className="text-mark">*</span>
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 border border-rule rounded-[4px] focus:ring-2 focus:ring-ink focus:border-transparent transition-colors"
                  maxLength={100}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-ink mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-rule rounded-[4px] focus:ring-2 focus:ring-ink focus:border-transparent transition-colors resize-none"
                  maxLength={500}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving || !groupName.trim()}
                  className="cursor-pointer px-6 py-3 bg-ink text-white rounded-[4px] font-medium hover:bg-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Members Management */}
          <div className="bg-white rounded-[4px] border border-rule p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-ink">Members ({group.members.length})</h2>
              <button
                onClick={() => setShowAddMembers(!showAddMembers)}
                className="cursor-pointer px-4 py-2 bg-ink text-white rounded-[4px] font-medium hover:bg-ink transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Members</span>
              </button>
            </div>

            {/* Add Members Section */}
            {showAddMembers && (
              <div className="mb-6 p-4 bg-[#edf2f5] rounded-[4px]">
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users to add..."
                    className="w-full px-4 py-2 border border-rule rounded-[4px] focus:ring-2 focus:ring-ink focus:border-transparent"
                  />
                </div>

                {searchQuery && (
                  <div className="max-h-48 overflow-y-auto border border-rule rounded-[4px]">
                    {searchLoading ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-ink border-t-transparent mx-auto"></div>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center text-graphite">
                        No users found
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {searchResults.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 hover:bg-[#edf2f5]">
                            <div className="flex items-center space-x-3">
                              {user.image ? (
                                <Image
                                  src={user.image}
                                  alt={user.name || 'User'}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                  {user.name?.[0]?.toUpperCase() || '?'}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-ink">{user.name}</p>
                                <p className="text-xs text-graphite">{user.email}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddMember(user.id)}
                              className="cursor-pointer px-3 py-1 bg-ink text-white text-sm rounded font-medium hover:bg-ink transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Members List */}
            <div className="space-y-3">
              {group.members.map((member) => (
                <div key={member.user.id} className="flex items-center justify-between p-4 border border-rule rounded-[4px] hover:bg-[#edf2f5]">
                  <div className="flex items-center space-x-4">
                    {member.user.image ? (
                      <Image
                        src={member.user.image}
                        alt={member.user.name || 'User'}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full border border-rule"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-ink text-white rounded-full flex items-center justify-center font-medium">
                        {member.user.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-ink">
                        {member.user.name || 'Unnamed User'}
                        {member.user.id === currentUser?.id && ' (You)'}
                        {member.user.id === group.createdBy.id && ' (Creator)'}
                      </p>
                      <p className="text-sm text-graphite">{member.user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${ member.role === 'ADMIN' ? 'bg-[#edf2f5] text-ink' : 'bg-[#edf2f5] text-graphite' }`}>
                          {member.role}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${ member.user.role === 'TEACHER' ? 'border border-ink text-ink' : 'border border-rule text-graphite' }`}>
                          {member.user.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Member Actions */}
                  {member.user.id !== currentUser?.id && member.user.id !== group.createdBy.id && (
                    <div className="flex items-center space-x-2">
                      {/* Role Toggle */}
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.user.id, e.target.value as 'ADMIN' | 'MEMBER')}
                        className="cursor-pointer text-sm border border-rule rounded px-2 py-1 focus:ring-2 focus:ring-ink"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveMember(member.user.id)}
                        className="cursor-pointer p-2 text-mark hover:bg-[#fdf3f2] rounded-[4px] transition-colors"
                        title="Remove member"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-[4px] border border-mark p-6">
            <h2 className="text-xl font-semibold text-mark mb-6">Danger Zone</h2>
            
            <div className="space-y-4">
              {/* Clear Messages */}
              <div className="flex items-center justify-between p-4 border border-mark rounded-[4px]">
                <div>
                  <h3 className="font-medium text-ink">Clear All Messages</h3>
                  <p className="text-sm text-graphite">Permanently delete all messages in this group</p>
                </div>
                <button
                  onClick={handleClearMessages}
                  className="cursor-pointer px-4 py-2 bg-mark text-white rounded-[4px] font-medium hover:bg-mark transition-colors"
                >
                  Clear Messages
                </button>
              </div>

              {/* Delete Group */}
              {isCreator && (
                <div className="flex items-center justify-between p-4 border border-mark rounded-[4px]">
                  <div>
                    <h3 className="font-medium text-ink">Delete Group</h3>
                    <p className="text-sm text-graphite">Permanently delete this group and all its data</p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="cursor-pointer px-4 py-2 bg-mark text-white rounded-[4px] font-medium hover:bg-mark transition-colors"
                  >
                    Delete Group
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-[4px] p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-ink mb-4">Delete Group</h3>
              <p className="text-graphite mb-6">
                Are you sure you want to delete this group? This action cannot be undone and all messages will be permanently lost.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="cursor-pointer flex-1 px-4 py-2 text-ink bg-[#edf2f5] rounded-[4px] font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteGroup();
                    setShowDeleteConfirm(false);
                  }}
                  className="cursor-pointer flex-1 px-4 py-2 bg-mark text-white rounded-[4px] font-medium hover:bg-mark transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

