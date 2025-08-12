'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle } from 'lucide-react';

interface QuizTakerProps {
  lessonId: string;
  quizId: string;
  quiz: any;
}

export default function QuizTaker({ lessonId, quizId, quiz }: QuizTakerProps) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.timeLimit ? quiz.timeLimit * 60 : null
  );
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (loading || submitted) return;
    
    setLoading(true);
    
    try {
      const submissionAnswers = Object.entries(answers).map(([questionId, optionId]) => ({
        questionId,
        optionId
      }));

      const response = await fetch(`/api/lessons/${lessonId}/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: submissionAnswers })
      });

      if (response.ok) {
        const result = await response.json();
        setResults(result);
        setSubmitted(true);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const answeredQuestions = Object.keys(answers).length;

  if (submitted && results) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Quiz Completed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-3xl font-bold text-green-600">
              {results.score} / {results.totalPoints}
            </div>
            <div className="text-lg text-gray-600">
              {results.percentage}% Score
            </div>
            
            {results.results && (
              <div className="mt-6 space-y-2">
                {results.results.map((result: any, index: number) => (
                  <div
                    key={result.questionId}
                    className={`p-3 rounded ${
                      result.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    } border`}
                  >
                    <div className="font-medium">
                      Question {index + 1}: {result.isCorrect ? '✓' : '✗'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Points: {result.pointsEarned} / {quiz.questions[index]?.points || 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button 
              onClick={() => router.push(`/lessons/${lessonId}/quizzes`)}
              className="mt-6"
            >
              Back to Quizzes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          {timeLeft !== null && (
            <div className="flex items-center space-x-2 text-orange-600">
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
            <span>Answered: {answeredQuestions} / {quiz.questions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-medium mb-2">
              {quiz.questions[currentQuestion]?.questionText}
            </h2>
            {quiz.questions[currentQuestion]?.questionImage && (
              <img
                src={quiz.questions[currentQuestion].questionImage}
                alt="Question"
                className="max-w-full h-auto rounded mb-4"
              />
            )}
          </div>

          <div className="space-y-3">
            {quiz.questions[currentQuestion]?.options.map((option: any) => (
              <label
                key={option.id}
                className={`block p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  answers[quiz.questions[currentQuestion].id] === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    value={option.id}
                    checked={answers[quiz.questions[currentQuestion].id] === option.id}
                    onChange={() => handleAnswerSelect(quiz.questions[currentQuestion].id, option.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div>{option.optionText}</div>
                    {option.optionImage && (
                      <img
                        src={option.optionImage}
                        alt="Option"
                        className="mt-2 max-w-xs h-auto rounded"
                      />
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>

        <div className="flex space-x-2">
          {currentQuestion < quiz.questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || answeredQuestions === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigation */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium mb-2">Question Navigation</h3>
        <div className="flex flex-wrap gap-2">
          {quiz.questions.map((_: any, index: number) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                index === currentQuestion
                  ? 'bg-blue-600 text-white'
                  : answers[quiz.questions[index].id]
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
