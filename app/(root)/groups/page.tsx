// File: app/groups/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    image: string | null;
  };
  members: Array<{
    user: {
      id: string;
      name: string | null;
      image: string | null;
      role: string;
    };
    role: string;
  }>;
  messages: Array<{
    id: string;
    content: string | null;
    createdAt: string;
    sender: {
      id: string;
      name: string | null;
    };
  }>;
  pinnedMessage?: {
    id: string;
    content: string | null;
    sender: {
      id: string;
      name: string | null;
    };
  } | null;
}

export default function GroupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isTeacher = session?.user?.role === 'TEACHER';

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups');
        if (!response.ok) {
          throw new Error('Failed to fetch groups');
        }
        const data = await response.json();
        setGroups(data.groups);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchGroups();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <span className="ml-2 text-gray-600">Loading groups...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy mb-2">Groups</h1>
            <p className="text-gray-600">Connect with your learning community</p>
          </div>
          
          {/* Create Group Button - Teachers Only */}
          {isTeacher && (
            <Link
              href="/groups/create"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create Group</span>
            </Link>
          )}
        </div>

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No groups yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {isTeacher 
                ? 'Create your first group to start building your learning community and engage with students.'
                : 'You haven\'t joined any groups yet. Ask your teacher to add you to a group to get started.'
              }
            </p>
            {isTeacher && (
              <Link
                href="/groups/create"
                className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Your First Group</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} currentUserId={session?.user?.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Group Card Component
function GroupCard({ group, currentUserId }: { group: Group; currentUserId?: string }) {
  const lastMessage = group.messages?.[0];
  const memberCount = group.members.length;
  const isCreator = group.createdBy.id === currentUserId;
  const userMembership = group.members.find(m => m.user.id === currentUserId);
  const isAdmin = userMembership?.role === 'ADMIN';

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Link href={`/groups/${group.id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-emerald-200 cursor-pointer group">
        {/* Group Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center flex-1 min-w-0">
            {group.imageUrl ? (
              <Image
                src={group.imageUrl}
                alt={group.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full border-2 border-emerald-200 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            )}
            <div className="ml-3 flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                {group.name}
              </h3>
              <p className="text-sm text-gray-500 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {memberCount} member{memberCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {/* Role Badge */}
          <div className="flex flex-col items-end space-y-1">
            {isCreator ? (
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium">
                Creator
              </span>
            ) : isAdmin ? (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                Admin
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                Member
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {group.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {group.description}
          </p>
        )}

        {/* Pinned Message */}
        {group.pinnedMessage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 12V4a1 1 0 00-1-1H9a1 1 0 00-1 1v8c0 .6.4 1 1 1h6c.6 0 1-.4 1-1z" />
                <path d="M9 12v8c0 .6.4 1 1 1s1-.4 1-1v-8H9z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-yellow-700 font-medium mb-1">
                  📌 Pinned by {group.pinnedMessage.sender.name}
                </p>
                <p className="text-sm text-yellow-800 truncate">
                  {group.pinnedMessage.content || 'Attachment'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Last Message */}
        <div className="border-t border-gray-100 pt-4">
          {lastMessage ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 font-medium truncate">
                  {lastMessage.sender.name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatTimeAgo(lastMessage.createdAt)}
                </p>
              </div>
              <p className="text-sm text-gray-700 truncate">
                {lastMessage.content || '📎 Sent an attachment'}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center py-2">
              <p className="text-sm text-gray-500 italic">No messages yet</p>
            </div>
          )}
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-emerald-100 opacity-0 group-hover:opacity-20 transition-opacity duration-200 rounded-xl pointer-events-none" />
      </div>
    </Link>
  );
}
