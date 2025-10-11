'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePolls } from '@/hooks/usePolls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { QuestionType, CreatePollData } from '@/lib/types';
import Link from 'next/link';

interface QuestionInput {
  type: QuestionType;
  question: string;
  description?: string;
  options?: string[];
  required: boolean;
  minRating?: number;
  maxRating?: number;
}

export default function CreatePollPage() {
  const router = useRouter();
  const { createPoll } = usePolls();
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { type: 'multiple-choice', question: '', required: true, options: ['', ''] }
  ]);
  
  const [settings, setSettings] = useState({
    allowAnonymous: true,
    showResults: 'after-submission' as const,
    allowMultipleResponses: false,
    requireEmail: false,
  });

  const addQuestion = () => {
    setQuestions([...questions, { 
      type: 'multiple-choice', 
      question: '', 
      required: true, 
      options: ['', ''] 
    }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof QuestionInput, value: string | boolean | number | QuestionType) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    if (!updated[questionIndex].options) {
      updated[questionIndex].options = [];
    }
    updated[questionIndex].options!.push('');
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options && updated[questionIndex].options!.length > 2) {
      updated[questionIndex].options!.splice(optionIndex, 1);
      setQuestions(updated);
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options![optionIndex] = value;
      setQuestions(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a poll title');
      return;
    }

    if (questions.some(q => !q.question.trim())) {
      toast.error('Please fill in all question fields');
      return;
    }

    // Validate options only for multiple-choice questions (yes-no is auto-generated)
    if (questions.some(q => 
      q.type === 'multiple-choice' && 
      (!q.options || q.options.some(o => !o.trim()))
    )) {
      toast.error('Please fill in all option fields');
      return;
    }

    setLoading(true);

    try {
      const pollData: CreatePollData = {
        title,
        description,
        questions: questions.map(q => ({
          type: q.type,
          question: q.question,
          description: q.description,
          options: q.type === 'yes-no' ? ['Yes', 'No'] : q.options?.filter(o => o.trim()),
          required: q.required,
          minRating: q.minRating,
          maxRating: q.maxRating,
          order: 0,
        })),
        settings,
      };

      const poll = await createPoll(pollData);
      toast.success('Poll created successfully!');
      router.push(`/dashboard/polls/${poll.$id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Create New Poll</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Poll Information</CardTitle>
              <CardDescription>Basic details about your poll</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Poll Title *</Label>
                <Input
                  id="title"
                  placeholder="What's your poll about?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add more context about your poll"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Questions</h2>
              <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.map((question, qIndex) => (
              <Card key={qIndex}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <CardTitle className="text-base">Question {qIndex + 1}</CardTitle>
                    </div>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(qIndex)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <Select
                      value={question.type}
                      onValueChange={(value) => updateQuestion(qIndex, 'type', value as QuestionType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                        <SelectItem value="yes-no">Yes/No</SelectItem>
                        <SelectItem value="rating">Rating Scale</SelectItem>
                        <SelectItem value="text">Text Response</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Question *</Label>
                    <Input
                      placeholder="Enter your question"
                      value={question.question}
                      onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Input
                      placeholder="Add more context"
                      value={question.description || ''}
                      onChange={(e) => updateQuestion(qIndex, 'description', e.target.value)}
                    />
                  </div>

                  {(question.type === 'multiple-choice') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Options</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(qIndex)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      {question.options?.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <Input
                            placeholder={`Option ${oIndex + 1}`}
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            required
                          />
                          {question.options!.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(qIndex, oIndex)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'rating' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Min Rating</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={question.minRating || 1}
                          onChange={(e) => updateQuestion(qIndex, 'minRating', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Rating</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={question.maxRating || 5}
                          onChange={(e) => updateQuestion(qIndex, 'maxRating', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <Label htmlFor={`required-${qIndex}`}>Required</Label>
                    <Switch
                      id={`required-${qIndex}`}
                      checked={question.required}
                      onCheckedChange={(checked) => updateQuestion(qIndex, 'required', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Poll Settings</CardTitle>
              <CardDescription>Configure how your poll works</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="anonymous">Allow Anonymous Responses</Label>
                  <p className="text-sm text-gray-500">Participants don&apos;t need to provide their name</p>
                </div>
                <Switch
                  id="anonymous"
                  checked={settings.allowAnonymous}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowAnonymous: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="multiple">Allow Multiple Responses</Label>
                  <p className="text-sm text-gray-500">Same participant can submit multiple times</p>
                </div>
                <Switch
                  id="multiple"
                  checked={settings.allowMultipleResponses}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowMultipleResponses: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email">Require Email</Label>
                  <p className="text-sm text-gray-500">Collect email addresses from participants</p>
                </div>
                <Switch
                  id="email"
                  checked={settings.requireEmail}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireEmail: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Show Results</Label>
                <Select
                  value={settings.showResults}
                  onValueChange={(value) => setSettings({ ...settings, showResults: value as typeof settings.showResults })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">Always (Live Results)</SelectItem>
                    <SelectItem value="after-submission">After Submission</SelectItem>
                    <SelectItem value="never">Never (Creator Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Poll'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
