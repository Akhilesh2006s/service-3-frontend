import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Mic, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send,
  Timer,
  AlertCircle
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";

interface MCQQuestion {
  id: string;
  question: string;
  teluguQuestion: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface VoiceQuestion {
  id: string;
  title: string;
  teluguTitle: string;
  instruction: string;
  teluguInstruction: string;
  example?: string;
}

interface ExamResults {
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: Record<string, number>;
  timeSpent: number;
}



interface ExamInterfaceProps {
  examType: "mcq" | "voice" | "mixed" | "descriptive";
  title: string;
  description: string;
  timeLimit?: number; // in minutes
  mcqQuestions?: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    points?: number;
  }>;
  voiceQuestions?: Array<{
    question: string;
    targetWords: string[];
    sampleAudioUrl?: string;
    instructions: string;
    points?: number;
  }>;
  descriptiveQuestions?: Array<{
    question: string;
    instructions: string;
    maxPoints: number;
    wordLimit?: number;
  }>;
  onComplete: (results: ExamResults) => void;
  isViewingResults?: boolean;
  previousResults?: ExamResults;
}

const ExamInterface = ({ 
  examType, 
  title, 
  description, 
  timeLimit = 30,
  mcqQuestions = [],
  voiceQuestions = [],
  onComplete,
  isViewingResults = false,
  previousResults
}: ExamInterfaceProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [examResults, setExamResults] = useState<ExamResults | null>(null);

  const [showDetailedResults, setShowDetailedResults] = useState(isViewingResults);
  
  const { toast } = useToast();

  // If viewing results, set up the results immediately
  useEffect(() => {
    if (isViewingResults && previousResults) {
      console.log('ExamInterface - Viewing results with previousResults:', previousResults);
      setExamResults(previousResults);
      setIsExamCompleted(true);
      setShowDetailedResults(true);
      // Skip the exam flow and go directly to results
      return;
    }
  }, [isViewingResults, previousResults]);

  // Use the questions passed from the parent component (actual exam questions)
  const questions = mcqQuestions && mcqQuestions.length > 0 ? mcqQuestions.map((q, index) => ({
    id: `q_${index}`,
    question: q.question,
    teluguQuestion: q.question, // Use the same question for both
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation
  })) : [];

  // If viewing results, map the previous answers to the current question IDs
  useEffect(() => {
    if (isViewingResults && previousResults && previousResults.answers) {
      const mappedAnswers: Record<string, number> = {};
      questions.forEach((question, index) => {
        // Try to find the answer using the question index
        const answerKey = Object.keys(previousResults.answers).find(key => 
          key.includes(index.toString()) || key === question.id
        );
        if (answerKey && previousResults.answers[answerKey] !== undefined) {
          mappedAnswers[question.id] = previousResults.answers[answerKey];
        }
      });
      setAnswers(mappedAnswers);
    }
  }, [isViewingResults, previousResults, questions]);

  const voiceQ = voiceQuestions && voiceQuestions.length > 0 ? voiceQuestions.map((q, index) => ({
    id: `v_${index}`,
    title: q.question,
    teluguTitle: q.question, // Use the same question for both
    instruction: q.instructions,
    teluguInstruction: q.instructions
  })) : [];



  const startExam = () => {
    setIsExamStarted(true);
    // Start timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          completeExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const completeExam = () => {
    setIsExamCompleted(true);
    
    // Calculate results like word puzzle
    let score = 0;
    let totalQuestions = 0;
    let correctAnswers: string[] = [];
    let incorrectAnswers: string[] = [];
    let missedAnswers: string[] = [];
    
    if (examType === "mcq" || examType === "mixed") {
      totalQuestions += questions.length;
      questions.forEach(question => {
        const studentAnswer = answers[question.id];
        console.log(`Question ${question.id}: studentAnswer=${studentAnswer}, correctAnswer=${question.correctAnswer}`);
        if (studentAnswer === question.correctAnswer) {
          score++;
          correctAnswers.push(question.id);
        } else if (studentAnswer !== undefined) {
          incorrectAnswers.push(question.id);
        } else {
          missedAnswers.push(question.id);
        }
      });
    }
    
    if (examType === "voice" || examType === "mixed") {
      totalQuestions += voiceQ.length;
      // Voice recordings will be evaluated by trainers
      score += 0; // Placeholder for voice recording evaluation
    }
    
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const passed = percentage >= 70; // 70% passing threshold
    
    const results = {
      score,
      totalQuestions,
      percentage,
      answers,
      timeSpent: timeLimit * 60 - timeRemaining
    };
    
    console.log('ExamInterface - Exam completed with results:', results);
    console.log('ExamInterface - Score calculation:', { score, totalQuestions, percentage, passed });
    console.log('ExamInterface - Current answers state:', answers);
    
    setExamResults(results);
    onComplete(results);
    
    toast({
      title: passed ? "🎉 Exam Passed!" : "📝 Exam Completed",
      description: `Score: ${score} correct out of ${totalQuestions} questions (${percentage}%) - ${passed ? "PASSED" : "Need Improvement"}`,
      duration: 5000
    });
  };

  const handleMCQAnswer = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMCQSection = () => (
    <div className="space-y-6">
      {questions.length > 0 ? (
        questions.map((question, index) => (
          <Card key={question.id} className={index === currentQuestionIndex ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Question {index + 1}</Badge>
                <Badge variant="outline">
                  {answers[question.id] !== undefined ? "Answered" : "Unanswered"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">{question.question}</h3>
                <p className="text-primary font-medium">{question.teluguQuestion}</p>
              </div>
              
              <RadioGroup
                value={answers[question.id]?.toString() || ""}
                onValueChange={(value) => handleMCQAnswer(question.id, parseInt(value))}
                disabled={examResults !== null}
              >
                {question.options.map((option, optionIndex) => {
                  const isSelected = answers[question.id] === optionIndex;
                  const isCorrectAnswer = question.correctAnswer === optionIndex;
                  const showResults = examResults !== null;
                  
                  return (
                    <div 
                      key={optionIndex} 
                      className={`flex items-center space-x-2 p-2 rounded border ${
                        showResults && isCorrectAnswer 
                          ? "border-green-500 bg-green-50" 
                          : showResults && isSelected && !isCorrectAnswer 
                            ? "border-red-500 bg-red-50" 
                            : "border-gray-200"
                      }`}
                    >
                      <RadioGroupItem 
                        value={optionIndex.toString()} 
                        id={`${question.id}-${optionIndex}`}
                        disabled={showResults}
                      />
                      <Label 
                        htmlFor={`${question.id}-${optionIndex}`} 
                        className={`cursor-pointer ${
                          showResults && isCorrectAnswer 
                            ? "text-green-700 font-semibold" 
                            : showResults && isSelected && !isCorrectAnswer 
                              ? "text-red-700 font-semibold" 
                              : ""
                        }`}
                      >
                        {option}
                        {showResults && isCorrectAnswer && (
                          <span className="ml-2 text-green-600">✅ Correct</span>
                        )}
                        {showResults && isSelected && !isCorrectAnswer && (
                          <span className="ml-2 text-red-600">❌ Your Answer</span>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No MCQ questions available for this exam.</p>
            <p className="text-sm text-muted-foreground mt-2">Please contact your trainer if you believe this is an error.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderVoiceSection = () => (
    <div className="space-y-6">
      {voiceQ.length > 0 ? (
        voiceQ.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{question.title}</h3>
                  <p className="text-primary font-medium">{question.teluguTitle}</p>
                </div>
                <Badge variant="secondary">
                  Voice Question
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{question.instruction}</p>
                <p className="text-sm text-primary">{question.teluguInstruction}</p>
                {question.example && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Example: {question.example}
                  </p>
                )}
              </div>
              
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Voice Recording</h3>
                <p className="text-muted-foreground">
                  Voice recording functionality has been removed from this application.
                </p>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No voice questions available for this exam.</p>
            <p className="text-sm text-muted-foreground mt-2">Please contact your trainer if you believe this is an error.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (!isExamStarted && !isViewingResults) {
    // Check if there are any questions available
    const hasQuestions = (examType === "mcq" && questions.length > 0) || 
                        (examType === "voice" && voiceQ.length > 0) || 
                        (examType === "mixed" && (questions.length > 0 || voiceQ.length > 0));

    if (!hasQuestions) {
      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-destructive">No Questions Available</CardTitle>
            <CardDescription>This exam doesn't have any questions configured yet.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Please contact your trainer to add questions to this exam.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Time Limit: {timeLimit} minutes</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>
                {examType === "mcq" && `${questions.length} MCQ Questions`}
                {examType === "voice" && `${voiceQ.length} Voice Questions`}
                {examType === "mixed" && `${questions.length} MCQ + ${voiceQ.length} Voice Questions`}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium">Instructions:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Read each question carefully before answering</li>
              <li>• For voice questions, ensure clear pronunciation</li>
              <li>• You can review your answers before submitting</li>
              <li>• The exam will auto-submit when time expires</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Button onClick={startExam} className="w-full">
              Start Exam
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isExamCompleted) {
    return (
      <div className="space-y-6">
        {/* Detailed Results Display */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {examResults?.percentage >= 70 ? "🎉 EXAM PASSED!" : "📝 EXAM RESULTS"}
            </CardTitle>
            <CardDescription className="text-center">
              Detailed scoring breakdown
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Score Summary */}
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {isViewingResults && previousResults ? previousResults.score : examResults?.score} / {isViewingResults && previousResults ? previousResults.totalQuestions : examResults?.totalQuestions}
              </div>
              <div className="text-xl text-muted-foreground mb-4">
                {isViewingResults && previousResults ? previousResults.percentage : examResults?.percentage}% Score
              </div>
              <Badge 
                variant={(isViewingResults && previousResults ? previousResults.percentage : examResults?.percentage) >= 70 ? "default" : "destructive"}
                className="text-lg px-6 py-2"
              >
                {(isViewingResults && previousResults ? previousResults.percentage : examResults?.percentage) >= 70 ? "✅ PASSED" : "❌ NEEDS IMPROVEMENT"}
              </Badge>
            </div>

            {/* Performance Summary */}
            {!showDetailedResults && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="text-lg font-semibold text-center mb-3">Performance Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {questions.filter((q, index) => {
                        const answersToUse = isViewingResults && previousResults ? previousResults.answers : examResults?.answers;
                        const studentAnswer = answersToUse?.[q.id];
                        return studentAnswer === q.correctAnswer;
                      }).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Correct Answers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {questions.filter((q, index) => {
                        const answersToUse = isViewingResults && previousResults ? previousResults.answers : examResults?.answers;
                        const studentAnswer = answersToUse?.[q.id];
                        return studentAnswer !== undefined && studentAnswer !== q.correctAnswer;
                      }).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Wrong Answers</div>
                  </div>
                </div>
                <div className="text-center mt-3">
            <p className="text-sm text-muted-foreground">
                    Click "View Detailed Results" to see question-by-question feedback
                  </p>
                </div>
              </div>
            )}

            {/* Question-by-Question Results */}
            {showDetailedResults && (examType === "mcq" || examType === "mixed") ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">Detailed Question Results</h3>
                {questions.map((question, index) => {
                  // Use previousResults.answers when viewing results, otherwise use examResults.answers
                  const answersToUse = isViewingResults && previousResults ? previousResults.answers : examResults?.answers;
                  
                  // For debugging, also try to find answer by index if not found by ID
                  let studentAnswer = answersToUse?.[question.id];
                  if (studentAnswer === undefined && isViewingResults && previousResults?.answers) {
                    // Try to find answer by index
                    const answerByIndex = previousResults.answers[`q_${index}`];
                    if (answerByIndex !== undefined) {
                      studentAnswer = answerByIndex;
                      console.log(`Found answer by index for question ${index}: ${answerByIndex}`);
                    }
                  }
                  

                  
                  // Ensure both values are numbers for comparison
                  const studentAnswerNum = typeof studentAnswer === 'number' ? studentAnswer : undefined;
                  
                  // Use studentAnswerNum for all comparisons to ensure consistency
                  const displayAnswer = studentAnswerNum;
                  // If correctAnswer is undefined, assume it's 0 (first option) as fallback
                  const correctAnswerNum = typeof question.correctAnswer === 'number' ? question.correctAnswer : 0;
                  const isCorrect = studentAnswerNum !== undefined && studentAnswerNum === correctAnswerNum;
                  const isAnswered = studentAnswerNum !== undefined;
                  

                  

                  
                  return (
                    <Card 
                      key={question.id} 
                      className={`border-2 ${
                        isCorrect 
                          ? "border-green-500 bg-green-50" 
                          : isAnswered 
                            ? "border-red-500 bg-red-50" 
                            : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">Question {index + 1}</Badge>
                          <div className="flex items-center gap-2">
                            {isCorrect ? (
                              <Badge variant="default" className="bg-green-600">
                                ✅ Correct
                              </Badge>
                            ) : isAnswered ? (
                              <Badge variant="destructive">
                                ❌ Wrong
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="font-medium">{question.question}</p>
                        </div>
                        
                        {/* CORRECT ANSWER DISPLAY */}
                        <div className="mb-4 p-3 bg-green-100 border-2 border-green-400 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🎯</span>
                            <div>
                              <span className="font-bold text-green-900 text-lg">Correct Answer: </span>
                              <span className="font-bold text-green-900 text-xl">{question.options[correctAnswerNum]}</span>
                </div>
            </div>
          </div>
          
                        {/* ANSWER COMPARISON */}
                        {isAnswered && (
                          <div className="mb-4 p-3 bg-blue-100 border-2 border-blue-400 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center">
                                <span className="font-bold text-blue-900">Your Answer:</span>
                                <div className="text-lg font-bold text-blue-900">{question.options[studentAnswerNum]}</div>
                              </div>
                              <div className="text-center">
                                <span className="font-bold text-green-900">Correct Answer:</span>
                                <div className="text-lg font-bold text-green-900">{question.options[correctAnswerNum]}</div>
                              </div>
                            </div>
                            <div className="text-center mt-2">
                              <span className={`font-bold text-lg ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                {isCorrect ? '✅ CORRECT' : '❌ WRONG'}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div 
                              key={optionIndex}
                              className={`p-2 rounded border ${
                                optionIndex === question.correctAnswer
                                  ? "border-green-500 bg-green-100 font-semibold"
                                  : optionIndex === studentAnswer && !isCorrect
                                    ? "border-red-500 bg-red-100 font-semibold"
                                    : "border-gray-200"
                              }`}
                            >
                              <span className="mr-2">
                                {optionIndex === question.correctAnswer ? "✅" : 
                                 optionIndex === studentAnswer && !isCorrect ? "❌" : "○"}
                              </span>
                              {option}
                              {optionIndex === question.correctAnswer && (
                                <span className="ml-2 text-green-700 font-medium">(Correct Answer)</span>
                              )}
                              {optionIndex === studentAnswer && !isCorrect && (
                                <span className="ml-2 text-red-700 font-medium">(Your Answer)</span>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Detailed Feedback for Wrong Answers */}
                        {!isCorrect && isAnswered && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              <span className="font-medium text-amber-800">Why this is wrong:</span>
                            </div>
                            <div className="text-sm text-amber-700 space-y-1">
                              <p><strong>You selected:</strong> {question.options[studentAnswer]}</p>
                              <p><strong>Correct answer:</strong> {question.options[question.correctAnswer]}</p>
                              {question.explanation && (
                                <p><strong>Explanation:</strong> {question.explanation}</p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Success Message for Correct Answers */}
                        {isCorrect && isAnswered && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-800">Excellent! You got this right!</span>
                            </div>
                            {question.explanation && (
                              <p className="text-sm text-green-700 mt-1">
                                <strong>Explanation:</strong> {question.explanation}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-6">
              <Button 
                onClick={() => setShowDetailedResults(!showDetailedResults)}
                variant="outline"
                className="flex items-center gap-2"
              >
                {showDetailedResults ? "Hide" : "View"} Detailed Results
            </Button>
              {!isViewingResults && (
                <Button 
                  onClick={() => onComplete(examResults)}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit Results
            </Button>
              )}
            </div>

            {/* Time Spent */}
            <div className="text-center text-muted-foreground mt-4">
              <Clock className="w-4 h-4 inline mr-2" />
              Time spent: {Math.floor((examResults?.timeSpent || 0) / 60)}m {(examResults?.timeSpent || 0) % 60}s
          </div>
        </CardContent>
      </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exam Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-destructive">
                <Timer className="w-4 h-4" />
                <span className="font-mono">{formatTime(timeRemaining)}</span>
              </div>
              <Badge variant="secondary">
                {currentQuestionIndex + 1} / {
                                  examType === "mcq" ? questions.length :
                examType === "voice" ? voiceQ.length :
                questions.length + voiceQ.length
                }
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Exam Content */}
      <Tabs value={examType} className="space-y-6">
        {examType === "mixed" && (
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mcq" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              MCQ Questions
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Voice Questions
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="mcq">
          {renderMCQSection()}
        </TabsContent>

        <TabsContent value="voice">
          {renderVoiceSection()}
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={completeExam}
          >
            Submit Exam
          </Button>
        </div>
      </div>



      {/* Detailed Results Display - Like Word Puzzle */}
      {examResults && (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {examResults.percentage >= 70 ? "🎉 EXAM PASSED!" : "📝 EXAM RESULTS"}
            </CardTitle>
            <CardDescription className="text-center">
              Detailed scoring breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Summary */}
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {examResults.score} / {examResults.totalQuestions}
              </div>
              <div className="text-xl text-muted-foreground mb-4">
                {examResults.percentage}% Score
              </div>
              <Badge 
                variant={examResults.percentage >= 70 ? "default" : "destructive"}
                className="text-lg px-6 py-2"
              >
                {examResults.percentage >= 70 ? "✅ PASSED" : "❌ NEEDS IMPROVEMENT"}
              </Badge>
            </div>

            {/* Question-by-Question Results */}
            {showDetailedResults && (examType === "mcq" || examType === "mixed") ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">Detailed Question Results</h3>
                {questions.map((question, index) => {
                  const studentAnswer = examResults.answers[question.id];
                  const isCorrect = studentAnswer === question.correctAnswer;
                  const isAnswered = studentAnswer !== undefined;
                  
                  return (
                    <Card 
                      key={question.id} 
                      className={`border-2 ${
                        isCorrect 
                          ? "border-green-500 bg-green-50" 
                          : isAnswered 
                            ? "border-red-500 bg-red-50" 
                            : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">Question {index + 1}</Badge>
                          <div className="flex items-center gap-2">
                            {isCorrect ? (
                              <Badge variant="default" className="bg-green-600">
                                ✅ Correct
                              </Badge>
                            ) : isAnswered ? (
                              <Badge variant="destructive">
                                ❌ Wrong
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                ⏭️ Skipped
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="font-medium">{question.question}</p>
                        </div>
                        
                        {/* CORRECT ANSWER DISPLAY */}
                        <div className="mb-4 p-3 bg-green-100 border-2 border-green-400 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🎯</span>
                            <div>
                              <span className="font-bold text-green-900 text-lg">Correct Answer: </span>
                              <span className="font-bold text-green-900 text-xl">{question.options[correctAnswerNum]}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* ANSWER COMPARISON */}
                        {isAnswered && (
                          <div className="mb-4 p-3 bg-blue-100 border-2 border-blue-400 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center">
                                <span className="font-bold text-blue-900">Your Answer:</span>
                                <div className="text-lg font-bold text-blue-900">{question.options[studentAnswerNum]}</div>
                              </div>
                              <div className="text-center">
                                <span className="font-bold text-green-900">Correct Answer:</span>
                                <div className="text-lg font-bold text-green-900">{question.options[correctAnswerNum]}</div>
                              </div>
                            </div>
                            <div className="text-center mt-2">
                              <span className={`font-bold text-lg ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                {isCorrect ? '✅ CORRECT' : '❌ WRONG'}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div 
                              key={optionIndex}
                              className={`p-2 rounded border ${
                                optionIndex === question.correctAnswer
                                  ? "border-green-500 bg-green-100 font-semibold"
                                  : optionIndex === studentAnswer && !isCorrect
                                    ? "border-red-500 bg-red-100 font-semibold"
                                    : "border-gray-200"
                              }`}
                            >
                              <span className="mr-2">
                                {optionIndex === question.correctAnswer ? "✅" : 
                                 optionIndex === studentAnswer && !isCorrect ? "❌" : "○"}
                              </span>
                              {option}
                              {optionIndex === question.correctAnswer && (
                                <span className="ml-2 text-green-700 font-medium">(Correct Answer)</span>
                              )}
                              {optionIndex === studentAnswer && !isCorrect && (
                                <span className="ml-2 text-red-700 font-medium">(Your Answer)</span>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Detailed Feedback for Wrong Answers */}
                        {!isCorrect && isAnswered && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              <span className="font-medium text-amber-800">Why this is wrong:</span>
                            </div>
                            <div className="text-sm text-amber-700 space-y-1">
                              <p><strong>You selected:</strong> {question.options[studentAnswer]}</p>
                              <p><strong>Correct answer:</strong> {question.options[question.correctAnswer]}</p>
                              {question.explanation && (
                                <p><strong>Explanation:</strong> {question.explanation}</p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Success Message for Correct Answers */}
                        {isCorrect && isAnswered && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-800">Excellent! You got this right!</span>
                            </div>
                            {question.explanation && (
                              <p className="text-sm text-green-700 mt-1">
                                <strong>Explanation:</strong> {question.explanation}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : null}

            {/* Performance Summary */}
            {!showDetailedResults && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="text-lg font-semibold text-center mb-3">Performance Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {questions.filter((q, index) => {
                        const studentAnswer = examResults.answers[q.id];
                        return studentAnswer === q.correctAnswer;
                      }).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Correct Answers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {questions.filter((q, index) => {
                        const studentAnswer = examResults.answers[q.id];
                        return studentAnswer !== undefined && studentAnswer !== q.correctAnswer;
                      }).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Wrong Answers</div>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <p className="text-sm text-muted-foreground">
                    Click "View Detailed Results" to see question-by-question feedback
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-6">
              <Button 
                onClick={() => setShowDetailedResults(!showDetailedResults)}
                variant="outline"
                className="flex items-center gap-2"
              >
                {showDetailedResults ? "Hide" : "View"} Detailed Results
              </Button>
              {!isViewingResults && (
                <Button 
                  onClick={() => onComplete(examResults)}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit Results
                </Button>
              )}
            </div>

            {/* Time Spent */}
            <div className="text-center text-muted-foreground mt-4">
              <Clock className="w-4 h-4 inline mr-2" />
              Time spent: {Math.floor(examResults.timeSpent / 60)}m {examResults.timeSpent % 60}s
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExamInterface;