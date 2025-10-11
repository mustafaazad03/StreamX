'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Sparkles,
  Mail,
  Moon,
  Sun,
  Globe,
  Lock,
  Trash2,
  Save,
  Crown
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Get subscription from user preferences or default to 'free'
  const subscription = (user?.prefs && 'subscription' in user.prefs ? user.prefs.subscription as string : null) || 'free';
  
  // Profile settings
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [responseNotifications, setResponseNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  
  // Appearance settings
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  // Privacy settings
  const [showEmail, setShowEmail] = useState(false);
  const [allowAnalytics, setAllowAnalytics] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user, authLoading, router]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // In a real app, you'd call an update user API here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // In a real app, call delete account API
      await logout();
      router.push('/');
      toast.success('Account deleted successfully');
    } catch {
      toast.error('Failed to delete account');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Sun className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Subscription</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account&apos;s profile information and email address.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                  <p className="text-sm text-gray-500">
                    This email will be used for account notifications and login.
                  </p>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Ensure your account is using a strong password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <div className="flex justify-end pt-4">
                  <Button variant="outline">
                    <Lock className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions. Please proceed with caution.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you absolutely sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data from our servers including all
                        polls, responses, and analytics.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteAccount}>
                        Yes, Delete My Account
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Manage how you receive email notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notif">Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch
                    id="email-notif"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="response-notif">Response Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Get notified when someone responds to your poll
                    </p>
                  </div>
                  <Switch
                    id="response-notif"
                    checked={responseNotifications}
                    onCheckedChange={setResponseNotifications}
                    disabled={!emailNotifications}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-report">Weekly Summary</Label>
                    <p className="text-sm text-gray-500">
                      Receive a weekly summary of your poll performance
                    </p>
                  </div>
                  <Switch
                    id="weekly-report"
                    checked={weeklyReport}
                    onCheckedChange={setWeeklyReport}
                    disabled={!emailNotifications}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveNotifications} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                  Customize how StreamX looks on your device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="h-20 flex-col gap-2"
                    onClick={() => setTheme('light')}
                  >
                    <Sun className="h-5 w-5" />
                    <span>Light</span>
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="h-20 flex-col gap-2"
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className="h-5 w-5" />
                    <span>Dark</span>
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className="h-20 flex-col gap-2"
                    onClick={() => setTheme('system')}
                  >
                    <Globe className="h-5 w-5" />
                    <span>System</span>
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Choose your preferred theme or sync with your system settings.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Control your privacy and data sharing preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-email">Show Email on Public Profile</Label>
                    <p className="text-sm text-gray-500">
                      Allow others to see your email address
                    </p>
                  </div>
                  <Switch
                    id="show-email"
                    checked={showEmail}
                    onCheckedChange={setShowEmail}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics">Usage Analytics</Label>
                    <p className="text-sm text-gray-500">
                      Help us improve by sharing anonymous usage data
                    </p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={allowAnalytics}
                    onCheckedChange={setAllowAnalytics}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Export</CardTitle>
                <CardDescription>
                  Download all your data in a portable format.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Request Data Export
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  We&apos;ll send you an email with a download link within 24 hours.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Current Plan
                  <Badge variant={subscription === 'pro' ? 'default' : 'secondary'}>
                    {subscription.toUpperCase()}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Manage your subscription and billing information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {subscription === 'free' ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Crown className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">Upgrade to Pro</h3>
                          <p className="text-gray-600 mb-4">
                            Unlock unlimited polls, advanced analytics, custom branding, and more!
                          </p>
                          <ul className="space-y-2 mb-6">
                            <li className="flex items-center gap-2 text-sm">
                              <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                              Unlimited polls and responses
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                              Advanced analytics and insights
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                              Custom branding and themes
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                              Priority support
                            </li>
                          </ul>
                          <Button className="w-full sm:w-auto">
                            <Crown className="h-4 w-4 mr-2" />
                            Upgrade to Pro - $9.99/month
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Crown className="h-6 w-6 text-blue-600" />
                        <h3 className="text-lg font-semibold">Pro Plan</h3>
                      </div>
                      <p className="text-gray-600 mb-4">
                        You&apos;re on the Pro plan. Enjoy all premium features!
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline">Manage Subscription</Button>
                        <Button variant="outline" className="text-red-600 hover:text-red-700">
                          Cancel Subscription
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {subscription !== 'free' && (
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    View and download your invoices.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No billing history available yet.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
