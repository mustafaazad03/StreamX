'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePoll } from '@/hooks/usePolls';
import { useResponses, useAggregatedResults } from '@/hooks/useResponses';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, QrCode, Link2, BarChart3, Users, Download, Share2, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';

import Image from 'next/image';
import { responseService } from '@/lib/services/response.service';
import { pollService } from '@/lib/services/poll.service';

export default function PollViewPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;
  const { user } = useAuth();
  const { poll, loading: pollLoading } = usePoll(pollId);
  const { responses, loading: responsesLoading } = useResponses(pollId);
  const { results, loading: resultsLoading } = useAggregatedResults(pollId);
  const [copySuccess, setCopySuccess] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (poll) {
      // Generate QR code on demand
      pollService.generateQRCode(pollId).then(setQrCodeUrl).catch(console.error);
    }
  }, [poll, pollId]);

  useEffect(() => {
    if (poll && user && poll.creatorId !== user.$id) {
      toast.error('You do not have permission to view this poll');
      router.push('/dashboard');
    }
  }, [poll, user, router]);

  const copyShareLink = () => {
    if (poll?.shareableLink) {
      navigator.clipboard.writeText(poll.shareableLink);
      setCopySuccess(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `${poll?.title}-qr-code.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

    const exportCSV = async () => {
    try {
      if (!pollId) return;
      
      const csvContent = await responseService.exportToCSV(pollId);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${poll?.title || 'poll'}-responses.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download CSV');
    }
  };

  const togglePollStatus = async () => {
    if (!poll) return;
    try {
      await pollService.togglePollStatus(pollId, !poll.isActive);
      toast.success(poll.isActive ? 'Poll deactivated' : 'Poll activated');
      window.location.reload();
    } catch {
      toast.error('Failed to toggle poll status');
    }
  };

    const deletePoll = async () => {
    if (!poll || !window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) return;
    try {
      await pollService.deletePoll(pollId);
      toast.success('Poll deleted successfully');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete poll');
    }
  };

  if (pollLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-64" />
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Poll not found</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{poll.title}</h1>
                <p className="text-sm text-gray-600">
                  Created {format(new Date(poll.$createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={poll.isActive ? 'default' : 'secondary'}>
                {poll.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Button variant="outline" size="sm" onClick={togglePollStatus}>
                {poll.isActive ? 'Deactivate' : 'Activate'}
              </Button>
              <Button variant="outline" size="sm" onClick={deletePoll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{poll.responseCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Views</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{poll.viewCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Response Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {poll.viewCount && poll.viewCount > 0
                  ? Math.round(((poll.responseCount || 0) / poll.viewCount) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{poll.questions.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="results" className="space-y-6">
          <TabsList>
            <TabsTrigger value="results">
              <BarChart3 className="h-4 w-4 mr-2" />
              Results
            </TabsTrigger>
            <TabsTrigger value="responses">
              <Users className="h-4 w-4 mr-2" />
              Responses ({responses.length})
            </TabsTrigger>
            <TabsTrigger value="share">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {resultsLoading ? (
              <Card>
                <CardContent className="py-12">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ) : results && results.totalResponses > 0 ? (
              poll.questions.map((question, index) => {
                const questionResult = (results.questionResults as Array<{ 
                  questionId: string; 
                  questionText: string; 
                  results: Record<string, number>; 
                  responses?: Record<string, number>;
                  textResponses?: string[];
                  totalResponses: number;
                  averageRating?: number;
                  topAnswer?: string;
                }>).find(
                  (qr) => qr.questionId === question.id
                );

                return (
                  <Card key={question.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {index + 1}. {question.question}
                      </CardTitle>
                      {question.description && (
                        <CardDescription>{question.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {question.type === 'text' ? (
                        <div className="space-y-2">
                          {questionResult?.textResponses?.map((response: string, i: number) => (
                            <div key={i} className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-sm">{response}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(questionResult?.responses || {}).map(([option, count]) => {
                            const numCount = count as number;
                            const percentage = Math.round((numCount / results.totalResponses) * 100);
                            return (
                            <div key={option} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{option}</span>
                                <span className="text-gray-600">
                                  {numCount} ({percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${(numCount / results.totalResponses) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )})}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No responses yet</h3>
                  <p className="text-gray-600">Share your poll to start collecting responses</p>
                </CardContent>
              </Card>
            )}

            {results && results.totalResponses > 0 && (
              <div className="flex justify-end">
                <Button onClick={exportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Responses Tab */}
          <TabsContent value="responses">
            {responsesLoading ? (
              <Card>
                <CardContent className="py-12">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ) : responses.length > 0 ? (
              <div className="space-y-4">
                {responses.map((response) => (
                  <Card key={response.$id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {response.participantName || 'Anonymous'}
                        </CardTitle>
                        <span className="text-sm text-gray-500">
                          {format(new Date(response.$createdAt), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                      {response.participantEmail && (
                        <CardDescription>{response.participantEmail}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {response.answers.map((answer, index) => {
                          const question = poll.questions.find(q => q.id === answer.questionId);
                          return (
                            <div key={index} className="border-l-2 border-blue-600 pl-3">
                              <p className="text-sm font-medium text-gray-700">
                                {question?.question}
                              </p>
                              <p className="text-sm text-gray-900 mt-1">
                                {Array.isArray(answer.value)
                                  ? answer.value.join(', ')
                                  : answer.value}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No responses yet</h3>
                  <p className="text-gray-600">Waiting for participants to submit responses</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Share Tab */}
          <TabsContent value="share">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>QR Code</CardTitle>
                  <CardDescription>
                    Participants can scan this code to access the poll
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {qrCodeUrl ? (
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                      <Image
                        src={qrCodeUrl}
                        alt="Poll QR Code"
                        width={300}
                        height={300}
                      />
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4 w-[300px] h-[300px] flex items-center justify-center">
                      <QrCode className="h-24 w-24 text-gray-300 animate-pulse" />
                    </div>
                  )}
                  <Button onClick={downloadQRCode} className="w-full" disabled={!qrCodeUrl}>
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Share Link</CardTitle>
                  <CardDescription>
                    Copy and share this link with participants
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={poll.shareableLink || ''}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                    />
                    <Button onClick={copyShareLink}>
                      {copySuccess ? 'Copied!' : <Link2 className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      💡 <strong>Tip:</strong> Share this link via email, social media, or messaging apps
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Poll Settings</CardTitle>
                <CardDescription>View your poll configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Anonymous Responses</p>
                    <p className="text-sm text-gray-600">
                      {poll.settings.allowAnonymous ? 'Allowed' : 'Not allowed'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Multiple Responses</p>
                    <p className="text-sm text-gray-600">
                      {poll.settings.allowMultipleResponses ? 'Allowed' : 'Not allowed'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Email Required</p>
                    <p className="text-sm text-gray-600">
                      {poll.settings.requireEmail ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Show Results</p>
                    <p className="text-sm text-gray-600 capitalize">
                      {poll.settings.showResults.replace('-', ' ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
