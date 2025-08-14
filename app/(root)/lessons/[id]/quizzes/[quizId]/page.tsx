'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { use } from 'react';
import QuizTaker from '@/components/QuizTaker';
import { Card, CardContent } from '@/components/ui/card';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  timeLimit?: number;
  questions: Array<{
    id: string;
    questionText: string;
    questionImage?: string;
    points: number;
    options: Array<{
      id: string;
      optionText: string;
      optionImage?: string;
      isCorrect: boolean;
    }>;
  }>;
}

interface PageProps {
  params: Promise<{ id: string; quizId: string }>; // params is now a Promise
}

export default function TakeQuizPage({ params }: PageProps) {
  const { data: session } = useSession();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unwrap the params Promise using React.use()
  const { id, quizId } = use(params);
  const lessonId = id;
  
  const fetchQuiz = useCallback(async () => {
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
  }, [lessonId, quizId]);
  
  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]); // Now we can safely use fetchQuiz in dependency array

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

  if (!quiz) {
    return null;
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
