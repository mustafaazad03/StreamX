'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { usePoll } from '@/hooks/usePolls';
import { useAggregatedResults } from '@/hooks/useResponses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Users, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { QuestionType } from '@/lib/types';

interface AggregatedQuestionResult {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  results: Record<string, number>;
  totalResponses: number;
  averageRating?: number;
  topAnswer?: string;
}

export default function PollResultsPage() {
  const params = useParams();
  const pollId = params.id as string;
  const { poll, loading: pollLoading, refetch: refetchPoll } = usePoll(pollId);
  const { results, loading: resultsLoading, refetch: refetchResults } = useAggregatedResults(pollId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchPoll(), refetchResults()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (pollLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
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

  if (!poll || poll.settings.showResults === 'never') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Results Not Available</h3>
            <p className="text-gray-600">
              The creator has chosen not to share poll results publicly
            </p>
            <Button asChild className="mt-4">
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalResponses = results?.totalResponses || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
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
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="border-2 border-blue-100 bg-white/80 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Total Responses</CardDescription>
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {totalResponses}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 bg-white/80 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Questions</CardDescription>
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {poll.questions.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 bg-white/80 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Engagement</CardDescription>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {poll.isActive ? 'Live' : 'Closed'}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Results
          </Button>
        </div>

        {/* Results */}
        {resultsLoading ? (
          <div className="space-y-6">
            {Array(3).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : totalResponses === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-dashed">
              <CardContent className="py-16 text-center">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 mb-6">
                  <BarChart3 className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Waiting for Responses</h3>
                <p className="text-gray-600 mb-6">
                  No one has submitted responses yet. Share the poll to start collecting data!
                </p>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Again
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {poll.questions.map((question, index) => {
              const questionResult = results.questionResults.find(
                (qr: AggregatedQuestionResult) => qr.questionId === question.id
              );

              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden border-2 hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              Question {index + 1}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {question.type.replace('-', ' ')}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl">
                            {question.question}
                          </CardTitle>
                          {question.description && (
                            <CardDescription className="mt-2">
                              {question.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {questionResult?.totalResponses || 0}
                          </div>
                          <div className="text-xs text-gray-500">responses</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {question.type === 'text' ? (
                        <div className="space-y-3">
                          {questionResult?.textResponses?.length > 0 ? (
                            questionResult.textResponses.map((response: string, i: number) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200"
                              >
                                <p className="text-sm text-gray-700">{response}</p>
                              </motion.div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-center py-4">No text responses yet</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(questionResult?.responses || {})
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .map(([option, count], i) => {
                              const numCount = count as number;
                              const percentage = Math.round((numCount / totalResponses) * 100);
                              const maxCount = Math.max(...Object.values(questionResult?.responses || {}).map(v => v as number));
                              const isTopAnswer = numCount === maxCount;

                              return (
                                <motion.div
                                  key={option}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className={`space-y-2 p-3 rounded-lg ${
                                    isTopAnswer ? 'bg-blue-50 border-2 border-blue-200' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900">{option}</span>
                                      {isTopAnswer && numCount > 0 && (
                                        <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-xs">
                                          Top Choice
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-semibold text-blue-600">
                                        {percentage}%
                                      </span>
                                      <span className="text-sm text-gray-500">
                                        ({numCount} {numCount === 1 ? 'vote' : 'votes'})
                                      </span>
                                    </div>
                                  </div>
                                  <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                                      className={`h-full rounded-full ${
                                        isTopAnswer
                                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                                          : 'bg-gradient-to-r from-blue-400 to-blue-500'
                                      }`}
                                    />
                                  </div>
                                </motion.div>
                              );
                            })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button variant="outline" asChild>
            <Link href={`/poll/${pollId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Poll
            </Link>
          </Button>
          {poll.isActive && poll.settings.allowMultipleResponses && (
            <Button asChild>
              <Link href={`/poll/${pollId}`}>
                Submit Another Response
              </Link>
            </Button>
          )}
        </motion.div>

        {/* Powered by */}
        <div className="text-center mt-12">
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
