'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BarChart3, Settings, LogOut, Sparkles, Wand2, FileText, Clock } from 'lucide-react';
import { usePolls } from '@/hooks/usePolls';
import { useUserStatistics } from '@/hooks/useAnalytics';
import { useParticipatedPolls } from '@/hooks/useParticipatedPolls';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const { polls, loading: pollsLoading } = usePolls();
  const { statistics, loading: statsLoading } = useUserStatistics(user?.$id || '');
  const { participatedPolls, loading: participatedLoading } = useParticipatedPolls(user?.$id);
  const [activeTab, setActiveTab] = useState('my-polls');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                StreamX
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {statsLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Polls</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{statistics?.totalPolls || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Active Polls</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{statistics?.activePolls || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Responses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{statistics?.totalResponses || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Views</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{statistics?.totalViews || 0}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Activity</h2>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/polls/ai-builder')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 border-0"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              AI Poll Builder
            </Button>
            <Button onClick={() => router.push('/dashboard/polls/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Poll
            </Button>
          </div>
        </div>

        {/* Tabs for My Polls and Participated Polls */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="my-polls" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Polls
              {!pollsLoading && <Badge variant="secondary">{polls.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="participated" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Participated
              {!participatedLoading && <Badge variant="secondary">{participatedPolls.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* My Polls Tab */}
          <TabsContent value="my-polls">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pollsLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))
          ) : polls.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No polls yet</h3>
                  <p className="text-gray-600 mb-4">Create your first poll to start engaging your audience</p>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/dashboard/polls/ai-builder')}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 border-0"
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Try AI Builder
                    </Button>
                    <Button onClick={() => router.push('/dashboard/polls/create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Manually
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            polls.map((poll) => (
              <Card key={poll.$id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/dashboard/polls/${poll.$id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">{poll.title}</CardTitle>
                    <Badge variant={poll.isActive ? 'default' : 'secondary'}>
                      {poll.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-1">
                    {poll.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Responses</span>
                      <span className="font-semibold">{poll.responseCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Views</span>
                      <span className="font-semibold">{poll.viewCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Questions</span>
                      <span className="font-semibold">{poll.questions.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                      <span>Created</span>
                      <span>{format(new Date(poll.$createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
            </div>
          </TabsContent>

          {/* Participated Polls Tab */}
          <TabsContent value="participated">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {participatedLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3 mt-2" />
                    </CardContent>
                  </Card>
                ))
              ) : participatedPolls.length === 0 ? (
                <div className="col-span-full">
                  <Card className="border-dashed border-2">
                    <CardContent className="py-12 text-center">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No participated polls yet</h3>
                      <p className="text-gray-600">
                        When you participate in polls, they will appear here
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                participatedPolls.map(({ poll, response, submittedAt }) => (
                  <Card key={response.$id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/poll/${poll.$id}/results`)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2">{poll.title}</CardTitle>
                        <Badge variant={poll.isActive ? 'default' : 'secondary'}>
                          {poll.isActive ? 'Active' : 'Closed'}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-1">
                        {poll.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Submitted</span>
                          <span className="font-semibold">{format(new Date(submittedAt), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Your Answers</span>
                          <span className="font-semibold">{response.answers.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Total Questions</span>
                          <span className="font-semibold">{poll.questions.length}</span>
                        </div>
                        {response.participantName && (
                          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                            <span>As</span>
                            <span>{response.participantName}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
