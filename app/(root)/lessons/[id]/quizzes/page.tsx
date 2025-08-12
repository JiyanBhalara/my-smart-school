'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: { lessonId: string };
}

export default function QuizzesPage({ params }: PageProps) {
  const { data: session } = useSession();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, [params.lessonId]);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`/api/lessons/${params.lessonId}/quizzes`);
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Please sign in to view quizzes.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading quizzes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Lesson Quizzes</h1>
          {session.user.role === 'TEACHER' && (
            <Link href={`/teacher/lessons/${params.lessonId}/quizzes/new`}>
              <Button>Create New Quiz</Button>
            </Link>
          )}
        </div>

        <div className="space-y-4">
          {quizzes.map((quiz: any) => {
            const latestAttempt = quiz.attempts?.[0];
            const hasAttempts = quiz.attempts?.length > 0;
            const attemptsLeft = quiz.maxAttempts ? quiz.maxAttempts - quiz.attempts.filter((a: any) => a.isCompleted).length : null;

            return (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{quiz.title}</CardTitle>
                      {quiz.description && (
                        <p className="text-gray-600 mt-1">{quiz.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {hasAttempts && (
                        <Badge variant={latestAttempt?.passed ? 'default' : 'secondary'}>
                          {latestAttempt?.passed ? 'Passed' : 'Attempted'}
                        </Badge>
                      )}
                      {attemptsLeft !== null && attemptsLeft <= 0 && (
                        <Badge variant="destructive">No Attempts Left</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-sm">
                      <div className="text-gray-500">Questions</div>
                      <div className="font-medium">{quiz._count.questions}</div>
                    </div>
                    
                    {quiz.timeLimit && (
                      <div className="text-sm">
                        <div className="text-gray-500">Time Limit</div>
                        <div className="font-medium flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {quiz.timeLimit} min
                        </div>
                      </div>
                    )}
                    
                    {quiz.maxAttempts && (
                      <div className="text-sm">
                        <div className="text-gray-500">Max Attempts</div>
                        <div className="font-medium">{quiz.maxAttempts}</div>
                      </div>
                    )}
                    
                    {hasAttempts && (
                      <div className="text-sm">
                        <div className="text-gray-500">Best Score</div>
                        <div className="font-medium">
                          {Math.max(...quiz.attempts.map((a: any) => a.percentage))}%
                        </div>
                      </div>
                    )}
                  </div>

                  {hasAttempts && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Recent Attempts</h4>
                      <div className="space-y-1">
                        {quiz.attempts.slice(0, 3).map((attempt: any) => (
                          <div key={attempt.id} className="flex items-center justify-between text-sm">
                            <span className="flex items-center">
                              {attempt.passed ? (
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500 mr-2" />
                              )}
                              {attempt.percentage}% - {attempt.score}/{attempt.totalPoints}
                            </span>
                            <span className="text-gray-500">
                              {new Date(attempt.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {(!quiz.maxAttempts || (attemptsLeft !== null && attemptsLeft > 0)) ? (
                      <Link href={`/lessons/${params.lessonId}/quizzes/${quiz.id}`}>
                        <Button>
                          {hasAttempts ? 'Retake Quiz' : 'Take Quiz'}
                        </Button>
                      </Link>
                    ) : (
                      <Button disabled>Maximum Attempts Reached</Button>
                    )}
                    
                    {attemptsLeft !== null && attemptsLeft > 0 && (
                      <Badge variant="outline" className="ml-2">
                        {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {quizzes.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600">No quizzes available</h3>
            <p className="text-gray-500">Check back later or ask your teacher to create some quizzes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
