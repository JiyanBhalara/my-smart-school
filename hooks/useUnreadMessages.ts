import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UnreadData {
  totalUnread: number;
  conversationsWithUnread: any[];
  usersWithUnread: string[];
}

export function useUnreadMessages() {
  const { data: session, status } = useSession();
  const [unreadData, setUnreadData] = useState<UnreadData>({
    totalUnread: 0,
    conversationsWithUnread: [],
    usersWithUnread: []
  });
  const [loading, setLoading] = useState(true);

  const fetchUnreadData = async () => {
    if (status !== 'authenticated') return;
    
    try {
      const response = await fetch('/api/chat/unread');
      if (response.ok) {
        const data = await response.json();
        setUnreadData(data);
      }
    } catch (error) {
      console.error('Error fetching unread data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadData();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchUnreadData, 10000);
    return () => clearInterval(interval);
  }, [status]);

  return { unreadData, loading, refetch: fetchUnreadData };
}
