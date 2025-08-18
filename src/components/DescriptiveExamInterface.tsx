import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import { APIService } from '../services/api';
import { Upload } from 'lucide-react';

interface DescriptiveQuestion {
  question: string;
  instructions: string;
  maxPoints: number;
  wordLimit?: number;
}

interface DescriptiveExam {
  id: string;
  title: string;
  description: string;
  openDate?: string;
  descriptiveTimeLimit: number; // in minutes
  // Exam attempt properties
  attemptId?: string;
  attemptStartedAt?: string;
  attemptTimeLimit?: number;
  attemptRemainingTime?: number;
  descriptiveQuestions: DescriptiveQuestion[];
}

interface DescriptiveExamInterfaceProps {
  exam: DescriptiveExam;
  onComplete: (submissions: any[]) => void;
  onClose: () => void;
}

const DescriptiveExamInterface: React.FC<DescriptiveExamInterfaceProps> = ({
  exam,
  onComplete,
  onClose
}) => {
  const { toast } = useToast();
  const [isStarted, setIsStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [files, setFiles] = useState<Record<number, File | null>>({});
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examStatus, setExamStatus] = useState<'not-started' | 'active' | 'expired' | 'completed'>('not-started');

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Debug logging
  console.log('DescriptiveExamInterface - Exam data:', exam);
  console.log('DescriptiveExamInterface - Questions count:', exam.descriptiveQuestions?.length || 0);
  console.log('DescriptiveExamInterface - Questions:', exam.descriptiveQuestions);
  console.log('DescriptiveExamInterface - Attempt data:', {
    attemptId: exam.attemptId,
    attemptStartedAt: exam.attemptStartedAt,
    attemptTimeLimit: exam.attemptTimeLimit,
    attemptRemainingTime: exam.attemptRemainingTime
  });

  // Calculate exam status based on attempt system
  useEffect(() => {
    if (exam.attemptId && exam.attemptStartedAt && exam.attemptRemainingTime !== undefined) {
      // Exam has been started, use attempt-based timing
      setExamStatus('active');
      setIsStarted(true);
      setTimeRemaining(exam.attemptRemainingTime * 60); // Convert minutes to seconds
    } else {
      // Exam hasn't been started yet
      setExamStatus('not-started');
      setIsStarted(false);
      setTimeRemaining(0);
    }
  }, [exam.attemptId, exam.attemptStartedAt, exam.attemptRemainingTime]);

  // Timer effect - update remaining time from server
  useEffect(() => {
    if (examStatus === 'active' && isStarted && exam.attemptId) {
      // Update remaining time from server every 30 seconds
      const updateTimer = async () => {
        try {
          const response = await fetch(`https://service-3-backend-production.up.railway.app/api/exam-attempts/status/${exam.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data.hasActiveAttempt) {
              const remainingMinutes = result.data.remainingTime;
              setTimeRemaining(remainingMinutes * 60); // Convert to seconds
              
              if (remainingMinutes <= 0) {
                setIsExpired(true);
                setExamStatus('expired');
              }
            } else {
              // Attempt expired or completed
              setIsExpired(true);
              setExamStatus('expired');
            }
          }
        } catch (error) {
          console.error('Error updating timer:', error);
        }
      };

      // Update immediately
      updateTimer();

      // Update every 30 seconds
      const interval = setInterval(updateTimer, 30000);

      return () => clearInterval(interval);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [examStatus, isStarted, exam.attemptId, exam.id]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleStartExam = () => {
    // This function is no longer needed as exam starts when student clicks "Start Exam" in dashboard
    // The attempt is already created and timer is already running
    console.log('Exam already started via attempt system');
  };

  const handleFileChange = (questionIndex: number, file: File | null) => {
    setFiles(prev => ({ ...prev, [questionIndex]: file }));
  };

  const handleTextAnswerChange = (questionIndex: number, text: string) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      newAnswers[questionIndex] = text;
      return newAnswers;
    });
  };


  const handleSubmit = async () => {
    if (isExpired) {
      toast({
        title: "Exam Expired",
        description: "The time limit has expired. You cannot submit this exam.",
        variant: "destructive"
      });
      return;
    }

    // Check if at least one question has an answer (text or PDF)
    const hasAnswers = exam.descriptiveQuestions.some((question, index) => {
      const hasText = answers[index] && answers[index].trim().length > 0;
      const hasFile = files[index];
      return hasText || hasFile;
    });

    if (!hasAnswers) {
      toast({
        title: "No Answers Provided",
        description: "Please provide at least one answer (text or PDF file) before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files and collect submissions
      const submissions = [];
      
      console.log('📁 Starting submission process...');
      console.log('📋 Files to upload:', files);
      console.log('📝 Text answers:', answers);
      
      for (let i = 0; i < exam.descriptiveQuestions.length; i++) {
        const file = files[i];
        const textAnswer = answers[i] || '';
        
        console.log(`📄 Processing question ${i + 1}:`, { file: !!file, textAnswer: textAnswer.length });
        
        let submission = {
          questionIndex: i,
          question: exam.descriptiveQuestions[i].question,
          textAnswer: textAnswer,
          submittedAt: new Date().toISOString()
        };
        
        if (file) {
          // Upload PDF file
          const formData = new FormData();
          formData.append('file', file);
          formData.append('examId', exam.id);

          const token = localStorage.getItem('telugu-basics-token');
          console.log('🔑 Token available:', !!token);

          console.log('📤 Uploading file...');
          const uploadResponse = await fetch('https://service-3-backend-production.up.railway.app/api/uploads/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          console.log('📥 Upload response status:', uploadResponse.status);
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            console.log('✅ Upload successful:', uploadResult);
            
            submission = {
              ...submission,
              pdfUrl: `https://service-3-backend-production.up.railway.app${uploadResult.data.url}`,
              fileName: uploadResult.data.originalName,
              fileSize: uploadResult.data.size
            };
          } else {
            const errorText = await uploadResponse.text();
            console.error('❌ Upload failed:', errorText);
            // Continue without PDF if upload fails
            console.log('⚠️ Continuing without PDF for question', i + 1);
          }
        }
        
        // Only add submission if there's content
        if (textAnswer.trim().length > 0 || file) {
          submissions.push(submission);
        }
      }
      
      console.log('📋 Final submissions:', submissions);

      // Check if any submissions were created
      if (submissions.length === 0) {
        throw new Error('No valid submissions were created');
      }

      // Call the onComplete callback to close the exam interface
      console.log('🔄 Calling onComplete callback...');
      await onComplete(submissions);
      console.log('✅ onComplete callback finished');
      
      toast({
        title: "Exam Submitted Successfully",
        description: "Your PDF files have been uploaded. An evaluator will review and assign marks.",
      });
      
      // Force close the interface as a backup
      console.log('🔄 Force closing exam interface...');
      onClose();

    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit exam. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    switch (examStatus) {
      case 'not-started':
        return <Badge variant="secondary">Ready to Start</Badge>;
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Closed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (examStatus === 'not-started') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{exam.title}</CardTitle>
                <p className="text-muted-foreground mt-2">{exam.description}</p>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Time Limit:</span> {exam.descriptiveTimeLimit} minutes
              </div>
              <div>
                <span className="font-medium">Questions:</span> {exam.descriptiveQuestions.length}
              </div>
              <div>
                <span className="font-medium">Status:</span> Ready to Start
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📋 Exam Instructions</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• This is a descriptive exam with {exam.descriptiveQuestions.length} question(s)</li>
                <li>• You have {exam.descriptiveTimeLimit} minutes to complete the exam</li>
                <li>• You must upload PDF files for each question</li>
                <li>• Prepare your answers as PDF documents before starting</li>
                <li>• Once you start, the timer cannot be paused</li>
                <li>• Submit your PDF files before the time expires</li>
                <li>• Marks will be assigned by an evaluator after submission</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleStartExam} className="flex-1">
                Start Exam
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examStatus === 'expired') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{exam.title}</CardTitle>
                <p className="text-muted-foreground mt-2">{exam.description}</p>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="text-center py-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold mb-2">Exam Closed</h3>
            <p className="text-muted-foreground mb-6">
              The time limit has expired. This exam closed after {exam.descriptiveTimeLimit} minutes from the start time.
            </p>
            <Button onClick={onClose}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{exam.title}</CardTitle>
              <p className="text-muted-foreground mt-2">{exam.description}</p>
            </div>
            <div className="text-right">
              {getStatusBadge()}
              {isStarted && (
                <div className="mt-2">
                  <div className="text-sm font-medium">Time Remaining</div>
                  <div className="text-lg font-mono">{formatTime(timeRemaining)}</div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress 
            value={exam.descriptiveTimeLimit > 0 ? ((exam.descriptiveTimeLimit * 60 - timeRemaining) / (exam.descriptiveTimeLimit * 60)) * 100 : 0} 
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-6">
        {exam.descriptiveQuestions && exam.descriptiveQuestions.length > 0 ? (
          exam.descriptiveQuestions.map((question, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  Question {index + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Question:</Label>
                  <p className="mt-1 text-gray-700">{question.question}</p>
                </div>
                
                {question.instructions && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Instructions:</Label>
                    <p className="mt-1 text-sm text-gray-600">{question.instructions}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="text-center">
                    <Label htmlFor={`file-${index}`} className="text-lg font-medium">
                      Upload Your Answer as PDF (Optional)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      You can upload a PDF file or provide a text answer.
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-full max-w-md">
                      <div className="relative">
                        <Input
                          id={`file-${index}`}
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            handleFileChange(index, file);
                          }}
                          ref={(el) => fileInputRefs.current[index] = el}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={() => fileInputRefs.current[index]?.click()}
                          className="w-full h-20 border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-primary" />
                            <div className="text-center">
                              <p className="font-medium text-primary">Click to Upload PDF</p>
                              <p className="text-xs text-muted-foreground">or drag and drop</p>
                            </div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {files[index] && (
                    <div className="flex justify-center">
                      <div className="w-full max-w-md p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-green-800">{files[index]?.name}</p>
                            <p className="text-sm text-green-600">
                              {(files[index]?.size || 0 / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileChange(index, null)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <Label htmlFor={`text-answer-${index}`} className="text-lg font-medium">
                      Text Answer (Optional)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      You can provide a text answer for this question.
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-full max-w-md">
                      <Input
                        id={`text-answer-${index}`}
                        type="text"
                        placeholder="Enter your answer here..."
                        value={answers[index] || ''}
                        onChange={(e) => handleTextAnswerChange(index, e.target.value)}
                        className="mb-4"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Max Points:</span> {question.maxPoints}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>⚠️ No Questions Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This descriptive exam doesn't have any questions configured. Please contact your trainer to add questions to this exam.
              </p>
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-medium text-yellow-800">Debug Information:</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Exam ID: {exam.id}<br/>
                  Questions Count: {exam.descriptiveQuestions?.length || 0}<br/>
                  Exam Type: Descriptive<br/>
                  Time Limit: {exam.descriptiveTimeLimit} minutes
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || isExpired}
          className="flex-1"
        >
          {isSubmitting ? 'Uploading PDFs...' : 'Submit PDF Files'}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default DescriptiveExamInterface;
