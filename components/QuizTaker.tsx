'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Trophy } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import SupabaseImage from '@/components/SupabaseImage';

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
  const [timeExpired, setTimeExpired] = useState(false);
  
  const notifiedAt75Ref = useRef(false);
  const notifiedAt50Ref = useRef(false);
  const startTimeRef = useRef<Date>(new Date());

  const initialTimeLimit = useMemo(() => {
    return quiz.timeLimit ? quiz.timeLimit * 60 : null;
  }, [quiz.timeLimit]);

  const getTimeSpent = useCallback(() => {
    const now = new Date();
    return Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000);
  }, []);

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (loading || submitted) return;
    
    setLoading(true);
    
    try {
      const submissionAnswers = Object.entries(answers).map(([questionId, optionId]) => ({
        questionId,
        optionId
      }));

      const timeSpent = getTimeSpent();

      const response = await fetch(`/api/lessons/${lessonId}/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers: submissionAnswers,
          timeSpent: timeSpent,
          isAutoSubmit: isAutoSubmit
        })
      });

      if (response.ok) {
        const result = await response.json();
        setResults({ ...result, timeSpent });
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
  }, [loading, submitted, answers, lessonId, quizId, getTimeSpent]);

  useEffect(() => {
    if (timeLeft === null || submitted || !initialTimeLimit) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          setTimeExpired(true);
          // Use setTimeout to avoid setState during render
          setTimeout(() => {
            handleSubmit(true);
          }, 0);
          return 0;
        }

        if (prev && initialTimeLimit) {
          const timeUsedPercentage = ((initialTimeLimit - prev) / initialTimeLimit) * 100;
          
          if (timeUsedPercentage >= 50 && !notifiedAt50Ref.current) {
            notifiedAt50Ref.current = true;
            const minutesLeft = Math.floor(prev / 60);
            const secondsLeft = prev % 60;
            
            // Use setTimeout to avoid setState during render
            setTimeout(() => {
              toast.dismiss();
              toast.error(
                `⏰ 50% Time Used! ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')} remaining`,
                {
                  id: 'time-warning-50',
                  duration: 5000,
                  position: 'top-center',
                  style: {
                    background: '#FEF3C7',
                    color: '#92400E',
                    border: '2px solid #F59E0B',
                    borderRadius: '12px',
                    fontWeight: '600',
                  },
                  icon: '⚠️',
                }
              );
            }, 0);
          }
          
          if (timeUsedPercentage >= 75 && !notifiedAt75Ref.current) {
            notifiedAt75Ref.current = true;
            const minutesLeft = Math.floor(prev / 60);
            const secondsLeft = prev % 60;
            
            // Use setTimeout to avoid setState during render
            setTimeout(() => {
              toast.dismiss();
              toast.error(
                `🚨 Only 25% Time Left! ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')} remaining`,
                {
                  id: 'time-warning-75',
                  duration: 6000,
                  position: 'top-center',
                  style: {
                    background: '#FEE2E2',
                    color: '#991B1B',
                    border: '2px solid #EF4444',
                    borderRadius: '12px',
                    fontWeight: '600',
                  },
                  icon: '🚨',
                }
              );
            }, 0);
          }
        }

        return prev ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted, initialTimeLimit, handleSubmit]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatTimeSpent = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
    }
    return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  }, []);

  const handleAnswerSelect = useCallback((questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  }, []);

  const progress = useMemo(() => ((currentQuestion + 1) / quiz.questions.length) * 100, [currentQuestion, quiz.questions.length]);
  const answeredQuestions = useMemo(() => Object.keys(answers).length, [answers]);
  const completionRate = useMemo(() => (answeredQuestions / quiz.questions.length) * 100, [answeredQuestions, quiz.questions.length]);

  if (submitted && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 sm:py-8 lg:py-12">
        <Toaster toastOptions={{ duration: 4000 }} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6 pt-6 sm:pb-8 sm:pt-8 lg:pt-12">
              <div className="flex justify-center mb-4 sm:mb-6">
                {results.percentage >= 80 ? (
                  <div className="relative">
                    <Trophy className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-yellow-500" />
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                ) : (
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-green-500" />
                )}
              </div>
              <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Quiz Completed!
              </CardTitle>
              <p className="text-gray-600 text-sm sm:text-base">
                {timeExpired ? 'Time expired - Quiz auto-submitted' : 
                 results.percentage >= 80 ? 'Excellent work!' : 
                 results.percentage >= 60 ? 'Good job!' : 'Keep practicing!'}
              </p>
            </CardHeader>
            
            <CardContent className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 lg:pb-12">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-xl lg:text-3xl font-bold">{results.score || 0}</div>
                    <div className="text-xs sm:text-xs lg:text-sm opacity-90">/ {results.maxScore || results.totalQuestions || quiz.questions.length}</div>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {results.percentage || 0}%
                </div>
                <div className="text-gray-600 text-sm sm:text-base">Overall Score</div>
              </div>

              <div className="text-center mb-6 sm:mb-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">Time Spent</span>
                </div>
                <div className="text-lg sm:text-xl font-bold text-blue-900">
                  {formatTimeSpent(results.timeSpent || 0)}
                </div>
                {quiz.timeLimit && (
                  <div className="text-sm text-blue-600 mt-1">
                    Time Limit: {quiz.timeLimit} minutes
                  </div>
                )}
              </div>

              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Question Results</h3>
                <div className="max-h-64 sm:max-h-80 overflow-y-auto space-y-3">
                  {(results.results || []).map((result: any, index: number) => {
                    const question = quiz.questions[index];
                    const maxPoints = question?.points || 1;
                    const earnedPoints = result.isCorrect ? maxPoints : 0;
                    
                    return (
                      <div
                        key={result.questionId || index}
                        className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                          result.isCorrect 
                            ? 'bg-green-50 border-green-200 shadow-sm' 
                            : 'bg-red-50 border-red-200 shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                              result.isCorrect ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                              {result.isCorrect ? '✓' : '✗'}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm sm:text-base">
                                Question {index + 1}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                                {question?.questionText?.substring(0, 50)}...
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900 text-sm sm:text-base">
                              {earnedPoints} / {maxPoints}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">points</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button 
                  onClick={() => router.push(`/lessons/${lessonId}`)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  Back to Lessons
                </Button>
                {(results.percentage || 0) < 80 && (
                  <Button 
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="flex-1 border-2 border-gray-300 hover:border-gray-400 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200"
                    size="lg"
                  >
                    Retake Quiz
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster toastOptions={{ duration: 4000 }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Card className="mb-4 sm:mb-6 lg:mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  {quiz.title}
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm lg:text-base">
                  Answer all questions to complete the quiz
                </p>
              </div>
              
              {timeLeft !== null && (
                <div className={`flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-semibold text-sm sm:text-base ${
                  timeLeft < 300 ? 'bg-red-100 text-red-700 animate-pulse' : 
                  timeLeft < 600 ? 'bg-orange-100 text-orange-700' : 
                  'bg-blue-100 text-blue-700'
                }`}>
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-mono">{formatTime(timeLeft)}</span>
                  {timeLeft < 300 && (
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm font-medium text-gray-600">
                <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <span>Progress: {Math.round(progress)}%</span>
                  <span className="text-blue-600">
                    Answered: {answeredQuestions} / {quiz.questions.length}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Progress value={progress} className="h-2 sm:h-3 bg-gray-200" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Start</span>
                  <span className="font-medium">
                    {completionRate.toFixed(0)}% Complete
                  </span>
                  <span>Finish</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-3">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      {currentQuestion + 1}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Question {currentQuestion + 1}
                    </span>
                  </div>
                  
                  <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 leading-relaxed mb-3 sm:mb-4">
                    {quiz.questions[currentQuestion]?.questionText}
                  </h2>
                  
                  {quiz.questions[currentQuestion]?.questionImage && (
                    <div className="mb-4 sm:mb-6">
                      <SupabaseImage
                        src={quiz.questions[currentQuestion].questionImage}
                        alt="Question"
                        className="max-w-full h-auto rounded-xl shadow-md"
                        width={600}
                        height={400}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {quiz.questions[currentQuestion]?.options?.map((option: any, optionIndex: number) => (
                    <label
                      key={option.id}
                      className={`block p-3 sm:p-4 lg:p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        answers[quiz.questions[currentQuestion].id] === option.id
                          ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="relative pt-1">
                          <input
                            type="radio"
                            name={`question-${currentQuestion}`}
                            value={option.id}
                            checked={answers[quiz.questions[currentQuestion].id] === option.id}
                            onChange={() => handleAnswerSelect(quiz.questions[currentQuestion].id, option.id)}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-2 border-gray-300 focus:ring-blue-500 focus:ring-2"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <span className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium text-gray-600 flex-shrink-0">
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <div className="text-gray-900 font-medium text-sm sm:text-base break-words">
                              {option.optionText}
                            </div>
                          </div>
                          {option.optionImage && (
                            <SupabaseImage
                              src={option.optionImage}
                              alt={`Option ${String.fromCharCode(65 + optionIndex)}`}
                              className="mt-2 sm:mt-3 max-w-full sm:max-w-xs h-auto rounded-lg shadow-sm"
                              width={300}
                              height={200}
                            />
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-4 sm:mt-6 lg:mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold border-2 disabled:opacity-50 text-sm sm:text-base"
                size="lg"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                Previous
              </Button>

              <div className="flex gap-2 sm:gap-3 lg:gap-4">
                {currentQuestion < quiz.questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                    size="lg"
                  >
                    Next
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubmit(false)}
                    disabled={loading || answeredQuestions === 0}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        Submit Quiz
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 order-first lg:order-last">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm sticky top-4 sm:top-6">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Question Navigation
                </h3>
                
                <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  {quiz.questions.map((_: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                        index === currentQuestion
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                          : answers[quiz.questions[index].id]
                          ? 'bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200'
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 sm:space-y-2 text-xs mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded"></div>
                    <span className="text-gray-600">Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span className="text-gray-600">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white border border-gray-200 rounded"></div>
                    <span className="text-gray-600">Unanswered</span>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-gray-200">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Completion</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        {Math.round(completionRate)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Answered</span>
                      <span className="text-xs sm:text-sm font-semibold text-blue-600">
                        {answeredQuestions}/{quiz.questions.length}
                      </span>
                    </div>
                    {timeLeft !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">Time Left</span>
                        <span className={`text-xs sm:text-sm font-semibold font-mono ${
                          timeLeft < 300 ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {formatTime(timeLeft)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
