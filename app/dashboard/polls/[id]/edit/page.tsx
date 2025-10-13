'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePoll } from '@/hooks/usePolls';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { pollService } from '@/lib/services/poll.service';

export default function PollEditPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;
  const { user } = useAuth();
  const { poll, loading: pollLoading } = usePoll(pollId);
  
  const [settings, setSettings] = useState<{
    allowAnonymous: boolean;
    showResults: 'never' | 'after-submission' | 'always';
    allowMultipleResponses: boolean;
    requireEmail: boolean;
  }>({
    allowAnonymous: true,
    showResults: 'after-submission',
    allowMultipleResponses: false,
    requireEmail: false,
  });
  const [saving, setSaving] = useState(false);

  // Load poll data
  useEffect(() => {
    if (poll) {
      setSettings(poll.settings);
    }
  }, [poll]);

  // Check permissions
  useEffect(() => {
    if (poll && user && poll.creatorId !== user.$id) {
      toast.error('You do not have permission to edit this poll');
      router.push('/dashboard');
    }
  }, [poll, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);

    try {
      await pollService.updatePoll(pollId, {
        settings,
      });

      toast.success('Poll settings updated successfully!');
      router.push(`/dashboard/polls/${pollId}`);
    } catch (error) {
      console.error('Error updating poll:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update poll');
    } finally {
      setSaving(false);
    }
  };

  if (pollLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Save className="h-7 w-7 text-white" />
          </div>
          <p className="text-gray-600">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Poll not found</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
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
                <Link href={`/dashboard/polls/${pollId}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Edit Poll Settings</h1>
                <p className="text-sm text-gray-600">Update poll configuration settings</p>
              </div>
            </div>
            <Badge variant={poll.isActive ? 'default' : 'secondary'}>
              {poll.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info - Read Only */}
          <Card>
            <CardHeader>
              <CardTitle>Poll Information</CardTitle>
              <CardDescription>
                Poll information is locked to preserve response integrity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Poll Title</Label>
                <Input
                  id="title"
                  value={poll.title}
                  disabled
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
              {poll.description && (
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={poll.description}
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                    rows={3}
                  />
                </div>
              )}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                  💡 <strong>Note:</strong> Title and description are locked to maintain poll identity.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Settings - Editable */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <CardTitle>Poll Settings</CardTitle>
                  <CardDescription>Configure how your poll works</CardDescription>
                </div>
                <Badge variant="default" className="bg-green-600">
                  Editable
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">Settings Update</p>
                  <p className="text-xs text-amber-800 mt-1">
                    Changes to these settings will affect how participants interact with your poll. Existing responses will not be affected.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Anonymous Responses</Label>
                  <p className="text-sm text-gray-500">
                    Let people participate without logging in
                  </p>
                </div>
                <Switch
                  checked={settings.allowAnonymous}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, allowAnonymous: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Email</Label>
                  <p className="text-sm text-gray-500">
                    Collect email addresses from participants
                  </p>
                </div>
                <Switch
                  checked={settings.requireEmail}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, requireEmail: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Multiple Responses</Label>
                  <p className="text-sm text-gray-500">
                    Let participants submit more than once
                  </p>
                </div>
                <Switch
                  checked={settings.allowMultipleResponses}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, allowMultipleResponses: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Show Results</Label>
                <Select
                  value={settings.showResults}
                  onValueChange={(value: 'after-submission' | 'always' | 'never') =>
                    setSettings({ ...settings, showResults: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="after-submission">After Submission</SelectItem>
                    <SelectItem value="always">Always</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  When participants can see the results
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/polls/${pollId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
