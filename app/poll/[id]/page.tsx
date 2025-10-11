'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePoll } from '@/hooks/usePolls';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, CheckCircle2, GripVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { responseService } from '@/lib/services/response.service';
import { Answer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function PollParticipationPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;
  const { poll, loading: pollLoading, error: pollError } = usePoll(pollId);
  const { session, createAnonymousSession } = useAuth();
  const [answers, setAnswers] = useState<{ [key: string]: string | string[] | number }>({});
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [draggedItems, setDraggedItems] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    const initSession = async () => {
      if (!session && !sessionInitialized) {
        setSessionInitialized(true);
        try {
          await createAnonymousSession();
          setSessionError(false);
        } catch (error) {
          console.error('Failed to create anonymous session:', error);
          setSessionError(true);
        }
      } else if (session) {
        setSessionError(false);
      }
    };
    initSession();
  }, [session, sessionInitialized, createAnonymousSession]);

  useEffect(() => {
    const checkResponse = async () => {
      if (session && poll && !poll.settings.allowMultipleResponses) {
        try {
          const responded = await responseService.hasParticipantResponded(
            pollId,
            session.userId
          );
          setHasResponded(responded);
        } catch (error) {
          console.error('Failed to check response status:', error);
        }
      }
    };
    checkResponse();
  }, [session, poll, pollId]);

  // Initialize ranking questions
  useEffect(() => {
    if (poll) {
      const rankingQuestions = poll.questions.filter(q => q.type === 'ranking');
      const initialDraggedItems: { [key: string]: string[] } = {};
      
      rankingQuestions.forEach(q => {
        if (q.options) {
          initialDraggedItems[q.id] = [...q.options];
        }
      });
      
      setDraggedItems(initialDraggedItems);
    }
  }, [poll]);

  const handleRankingChange = (questionId: string, items: string[]) => {
    setDraggedItems(prev => ({ ...prev, [questionId]: items }));
    setAnswers({ ...answers, [questionId]: items });
  };

  const moveRankingItem = (questionId: string, fromIndex: number, toIndex: number) => {
    const items = [...(draggedItems[questionId] || [])];
    const [movedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, movedItem);
    handleRankingChange(questionId, items);
  };

  const handleAnswerChange = (questionId: string, value: string | string[] | number) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleMultipleChoiceChange = (questionId: string, option: string, checked: boolean) => {
    const currentAnswers = (answers[questionId] as string[]) || [];
    if (checked) {
      setAnswers({ ...answers, [questionId]: [...currentAnswers, option] });
    } else {
      setAnswers({
        ...answers,
        [questionId]: currentAnswers.filter((a) => a !== option),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      if (!sessionError) {
        toast.error('Please wait while we set up your session');
        // Try to create session again
        try {
          await createAnonymousSession();
        } catch (error) {
          toast.error('Failed to initialize session. Please refresh the page.');
        }
      } else {
        toast.error('Session error. Please refresh the page and try again.');
      }
      return;
    }

    // Validate required fields
    const requiredQuestions = poll?.questions.filter(q => q.required) || [];
    const missingAnswers = requiredQuestions.filter(q => !answers[q.id]);

    if (missingAnswers.length > 0) {
      toast.error('Please answer all required questions');
      return;
    }

    if (poll?.settings.requireEmail && !participantEmail) {
      toast.error('Please provide your email address');
      return;
    }

    setSubmitting(true);

    try {
      const formattedAnswers: Omit<Answer, 'timestamp'>[] = Object.entries(answers).map(
        ([questionId, value]) => {
          const question = poll?.questions.find(q => q.id === questionId);
          return {
            questionId,
            questionType: question?.type || 'text',
            value,
          };
        }
      );

      await responseService.submitResponse(
        {
          pollId,
          participantName: poll?.settings.allowAnonymous ? participantName : undefined,
          participantEmail: poll?.settings.requireEmail ? participantEmail : undefined,
          answers: formattedAnswers,
        },
        session.userId
      );

      setSubmitted(true);
      toast.success('Response submitted successfully!');
    } catch (error) {
      console.error('Failed to submit response:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (pollLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!poll || !poll.isActive || pollError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {pollError ? 'Error loading poll' : !poll ? 'Poll not found' : 'Poll is currently closed'}
            </h3>
            <p className="text-gray-600 mb-4">
              {pollError 
                ? 'There was an error loading this poll. Please try again.'
                : !poll
                ? 'This poll does not exist or has been removed'
                : 'This poll is not accepting responses at the moment'}
            </p>
            {pollError && (
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasResponded && !poll.settings.allowMultipleResponses) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Already submitted</h3>
            <p className="text-gray-600">
              You have already submitted a response to this poll
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-3">Thank you!</h3>
            <p className="text-gray-600 mb-6">
              Your response has been submitted successfully.
            </p>
            {poll.settings.showResults !== 'never' && (
              <Button onClick={() => router.push(`/poll/${pollId}/results`)}>
                View Results
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              StreamX
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{poll.title}</h1>
          {poll.description && (
            <p className="text-gray-600 max-w-2xl mx-auto">{poll.description}</p>
          )}
        </div>

        {/* Poll Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Participant Info */}
          {(poll.settings.allowAnonymous || poll.settings.requireEmail) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Information</CardTitle>
                <CardDescription>
                  {poll.settings.requireEmail
                    ? 'Required to participate'
                    : 'Optional - helps us personalize your experience'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {poll.settings.allowAnonymous && (
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Name {!poll.settings.requireEmail && '(Optional)'}
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      required={poll.settings.requireEmail}
                    />
                  </div>
                )}
                {poll.settings.requireEmail && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={participantEmail}
                      onChange={(e) => setParticipantEmail(e.target.value)}
                      required
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Questions */}
          {poll.questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {index + 1}. {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </CardTitle>
                {question.description && (
                  <CardDescription>{question.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {question.type === 'multiple-choice' && (
                  <div className="space-y-3">
                    {question.allowMultipleAnswers ? (
                      question.options?.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${question.id}-${option}`}
                            checked={((answers[question.id] as string[]) || []).includes(option)}
                            onCheckedChange={(checked) =>
                              handleMultipleChoiceChange(question.id, option, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={`${question.id}-${option}`}
                            className="font-normal cursor-pointer"
                          >
                            {option}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <RadioGroup
                        value={answers[question.id] as string}
                        onValueChange={(value) => handleAnswerChange(question.id, value)}
                        required={question.required}
                      >
                        {question.options?.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                            <Label
                              htmlFor={`${question.id}-${option}`}
                              className="font-normal cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </div>
                )}

                {question.type === 'yes-no' && (
                  <RadioGroup
                    value={answers[question.id] as string}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    required={question.required}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id={`${question.id}-yes`} />
                      <Label htmlFor={`${question.id}-yes`} className="font-normal cursor-pointer">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id={`${question.id}-no`} />
                      <Label htmlFor={`${question.id}-no`} className="font-normal cursor-pointer">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                )}

                {question.type === 'rating' && (
                  <div className="space-y-2">
                    <div className="flex gap-2 justify-center">
                      {Array.from(
                        { length: (question.maxRating || 5) - (question.minRating || 1) + 1 },
                        (_, i) => (question.minRating || 1) + i
                      ).map((rating) => (
                        <Button
                          key={rating}
                          type="button"
                          variant={answers[question.id] === rating ? 'default' : 'outline'}
                          className="w-12 h-12"
                          onClick={() => handleAnswerChange(question.id, rating)}
                        >
                          {rating}
                        </Button>
                      ))}
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{question.minRating || 1} - Lowest</span>
                      <span>{question.maxRating || 5} - Highest</span>
                    </div>
                  </div>
                )}

                {question.type === 'text' && (
                  <Textarea
                    placeholder="Enter your answer"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.required}
                    rows={4}
                  />
                )}

                {question.type === 'ranking' && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-3">
                      Drag items to rank them from most to least preferred (top = most preferred)
                    </p>
                    {(draggedItems[question.id] || question.options || []).map((option, index) => (
                      <div
                        key={option}
                        className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/html', index.toString());
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const fromIndex = parseInt(e.dataTransfer.getData('text/html'));
                          moveRankingItem(question.id, fromIndex, index);
                        }}
                      >
                        <GripVertical className="h-5 w-5 text-gray-400" />
                        <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 rounded-full font-semibold text-sm">
                          {index + 1}
                        </span>
                        <span className="flex-1">{option}</span>
                        <div className="flex gap-2">
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveRankingItem(question.id, index, index - 1)}
                              className="h-8 w-8 p-0"
                            >
                              ↑
                            </Button>
                          )}
                          {index < (draggedItems[question.id]?.length || 0) - 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveRankingItem(question.id, index, index + 1)}
                              className="h-8 w-8 p-0"
                            >
                              ↓
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button 
              type="submit" 
              size="lg" 
              disabled={submitting || !session} 
              className="w-full md:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : !session ? (
                'Setting up session...'
              ) : (
                'Submit Response'
              )}
            </Button>
          </div>
          
          {!session && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Initializing your session, please wait...
            </p>
          )}
        </form>

        {/* Powered by */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Powered by{' '}
            <span className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              StreamX
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
