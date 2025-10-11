"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { aiService } from "@/lib/services/ai.service";
import { pollService } from "@/lib/services/poll.service";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, RefreshCw, Save, ArrowLeft, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Question } from "@/lib/types";

interface GeneratedPoll {
  title: string;
  description: string;
  questions: Omit<Question, 'id'>[];
  settings: {
    allowAnonymous: boolean;
    showResults: 'always' | 'after-submission' | 'never';
    allowMultipleResponses: boolean;
    requireEmail: boolean;
  };
}

export default function AIPollBuilderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPoll, setGeneratedPoll] = useState<GeneratedPoll | null>(null);
  const [conversationHistory, setConversationHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const placeholders = [
    "Create a customer satisfaction survey for a restaurant",
    "Build an employee engagement poll with 5 questions",
    "Design a product feedback form for a mobile app",
    "Make a event planning poll for a team outing",
    "Generate a market research survey about coffee preferences",
    "Create a training effectiveness assessment poll",
  ];

  const loadingStates = [
    { text: "Analyzing your request..." },
    { text: "Crafting perfect questions..." },
    { text: "Optimizing poll structure..." },
    { text: "Adding engaging elements..." },
    { text: "Finalizing your poll..." },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    const userPrompt = prompt.trim();
    setPrompt("");
    
    // Add user message to conversation
    setConversationHistory((prev) => [
      ...prev,
      { role: "user", content: userPrompt },
    ]);

    setIsGenerating(true);

    try {
      let result: GeneratedPoll;

      if (generatedPoll) {
        // Refine existing poll
        result = await aiService.refinePoll(generatedPoll, userPrompt);
        toast.success("Poll refined successfully!");
      } else {
        // Generate new poll
        result = await aiService.generatePoll(userPrompt);
        toast.success("Poll generated successfully!");
      }

      setGeneratedPoll(result);
      
      // Add assistant response to conversation
      setConversationHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I've ${generatedPoll ? "refined" : "created"} a poll titled "${result.title}" with ${result.questions.length} questions.`,
        },
      ]);
    } catch (error) {
      console.error("Error generating poll:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate poll. Please try again.";
      toast.error(errorMessage);
      
      // Remove the user message if generation failed
      setConversationHistory((prev) => prev.slice(0, -1));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePoll = async () => {
    if (!generatedPoll || !user) {
      toast.error("Please log in to save the poll");
      return;
    }

    try {
      const pollData = aiService.convertToCreatePollData(generatedPoll);
      const savedPoll = await pollService.createPoll(user.$id, pollData);
      
      toast.success("Poll saved successfully!");
      router.push(`/dashboard/polls/${savedPoll.$id}`);
    } catch (error) {
      console.error("Error saving poll:", error);
      toast.error("Failed to save poll. Please try again.");
    }
  };

  const handleReset = () => {
    setGeneratedPoll(null);
    setConversationHistory([]);
    toast.info("Starting fresh! Enter a new prompt to create a poll.");
  };

  const getQuestionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "multiple-choice": "bg-blue-500",
      "yes-no": "bg-green-500",
      "rating": "bg-yellow-500",
      "text": "bg-purple-500",
      "ranking": "bg-pink-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "multiple-choice": "Multiple Choice",
      "yes-no": "Yes/No",
      "rating": "Rating",
      "text": "Text",
      "ranking": "Ranking",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <MultiStepLoader loadingStates={loadingStates} loading={isGenerating} duration={1000} />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/polls")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Polls
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              AI Poll Builder
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Describe your poll needs, and AI will create the perfect survey for you
          </p>
        </div>

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-64 overflow-y-auto">
              {conversationHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Input Section */}
        <div className="mb-8">
          <PlaceholdersAndVanishInput
            placeholders={placeholders}
            onChange={(e) => setPrompt(e.target.value)}
            onSubmit={handleSubmit}
          />
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            {generatedPoll
              ? "Refine your poll by asking for changes"
              : "Describe the poll you want to create"}
          </p>
        </div>

        {/* Generated Poll Preview */}
        {generatedPoll && (
          <div className="space-y-6">
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {generatedPoll.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {generatedPoll.description}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-4">
                    {generatedPoll.questions.length} Questions
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Settings Preview */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm uppercase text-gray-600 dark:text-gray-400">
                      Poll Settings
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {generatedPoll.settings.allowAnonymous && (
                        <Badge variant="outline">Anonymous Responses</Badge>
                      )}
                      {generatedPoll.settings.requireEmail && (
                        <Badge variant="outline">Email Required</Badge>
                      )}
                      {generatedPoll.settings.allowMultipleResponses && (
                        <Badge variant="outline">Multiple Responses</Badge>
                      )}
                      <Badge variant="outline">
                        Show Results: {generatedPoll.settings.showResults}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Questions Preview */}
                  <div>
                    <h3 className="font-semibold mb-4 text-sm uppercase text-gray-600 dark:text-gray-400">
                      Questions
                    </h3>
                    <div className="space-y-4">
                      {generatedPoll.questions.map((question, index) => (
                        <Card key={index} className="bg-gray-50 dark:bg-gray-800/50">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                              <Badge
                                className={`${getQuestionTypeColor(
                                  question.type
                                )} text-white shrink-0`}
                              >
                                {getQuestionTypeLabel(question.type)}
                              </Badge>
                              <div className="flex-1">
                                <p className="font-medium mb-1">
                                  {index + 1}. {question.question}
                                  {question.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </p>
                                {question.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {question.description}
                                  </p>
                                )}
                                
                                {/* Question Type Specific Preview */}
                                {(question.type === "multiple-choice" ||
                                  question.type === "ranking") &&
                                  question.options && (
                                    <ul className="mt-2 space-y-1">
                                      {question.options.map((option, optIndex) => (
                                        <li
                                          key={optIndex}
                                          className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                                        >
                                          <span className="h-4 w-4 rounded-full border-2 border-gray-400" />
                                          {option}
                                        </li>
                                      ))}
                                    </ul>
                                  )}

                                {question.type === "rating" && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      Rating: {question.minRating || 1} to{" "}
                                      {question.maxRating || 5}
                                    </span>
                                  </div>
                                )}

                                {question.allowMultipleAnswers && (
                                  <Badge variant="outline" className="mt-2">
                                    Multiple answers allowed
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
              <Button onClick={handleSavePoll} className="bg-purple-600 hover:bg-purple-700">
                <Save className="h-4 w-4 mr-2" />
                Save & Use Poll
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!generatedPoll && !isGenerating && conversationHistory.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="pt-12 pb-12 text-center">
              <Sparkles className="h-16 w-16 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ready to create amazing polls?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Simply describe what kind of poll you need, and our AI will generate a
                professional survey with perfectly crafted questions.
              </p>
              <div className="max-w-2xl mx-auto space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Try these examples:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {placeholders.slice(0, 3).map((placeholder, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900"
                      onClick={() => setPrompt(placeholder)}
                    >
                      {placeholder}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
