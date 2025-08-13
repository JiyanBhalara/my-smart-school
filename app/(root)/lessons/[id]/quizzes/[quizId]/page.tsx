'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { use } from 'react'; // Import React's use hook
import QuizTaker from '@/components/QuizTaker';
import { Card, CardContent } from '@/components/ui/card';

interface PageProps {
  params: Promise<{ id: string; quizId: string }>; // params is now a Promise
}

export default function TakeQuizPage({ params }: PageProps) {
  const { data: session } = useSession();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unwrap the params Promise using React.use()
  const { id, quizId } = use(params);
  const lessonId = id;
  
  useEffect(() => {
    fetchQuiz();
  }, [quizId]); // Now we can safely use quizId in dependency array

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/quizzes/${quizId}`);
      
      if (response.ok) {
        const data = await response.json();
        setQuiz(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load quiz');
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Please sign in to take this quiz.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading quiz...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <QuizTaker 
        lessonId={lessonId} 
        quizId={quizId} 
        quiz={quiz} 
      />
    </div>
  );
}
