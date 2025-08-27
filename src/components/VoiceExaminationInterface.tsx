import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  Volume2,
  AlertCircle,
  Loader2,
  Type,
  Eye
} from 'lucide-react';

interface VoiceExaminationInterfaceProps {
  examination: {
    _id: string;
    title: string;
    teluguTitle: string;
    paragraph: string;
    teluguParagraph: string;
    instructions: string;
    teluguInstructions: string;
    timeLimit: number;
    maxScore: number;
    passingScore: number;
    wordCount: number;
    estimatedReadingTime: number;
  };
  onComplete: (results: any) => void;
  onBack: () => void;
}

const VoiceExaminationInterface: React.FC<VoiceExaminationInterfaceProps> = ({
  examination,
  onComplete,
  onBack
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(examination.timeLimit);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const recognitionRef = useRef<any>(null);
  const examTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'te-IN'; // Telugu language code
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setRecordingStartTime(Date.now());
        startRecordingTimer();
      };
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscribedText(prev => prev + finalTranscript);
        setInterimText(interimTranscript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Speech Recognition Error",
          description: "Failed to recognize speech. Please try again.",
          variant: "destructive"
        });
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        stopRecordingTimer();
      };
    } else {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please use Chrome or Edge.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Start exam timer
  useEffect(() => {
    if (isExamStarted && !isExamCompleted && timeRemaining > 0) {
      examTimerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (examTimerRef.current) {
        clearInterval(examTimerRef.current);
      }
    };
  }, [isExamStarted, isExamCompleted, timeRemaining]);

  const startRecordingTimer = () => {
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  const startExam = () => {
    setIsExamStarted(true);
    toast({
      title: "Exam Started",
      description: "Your voice examination has begun. Click the microphone to start dictation.",
    });
  };

  const startDictation = () => {
    if (recognitionRef.current) {
      setTranscribedText('');
      setInterimText('');
      setRecordingDuration(0);
      recognitionRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "Dictation Started",
        description: "Start speaking now. Your words will appear in real-time.",
      });
    }
  };

  const stopDictation = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Dictation Stopped",
        description: "Your speech has been captured. Review and submit when ready.",
      });
    }
  };

  const resetDictation = () => {
    setTranscribedText('');
    setInterimText('');
    setRecordingDuration(0);
    setIsRecording(false);
    setIsListening(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleAutoSubmit = async () => {
    if (transcribedText.trim()) {
      await submitDictation();
    } else {
      setIsExamCompleted(true);
      toast({
        title: "Time's Up",
        description: "Examination time has expired. No dictation was submitted.",
        variant: "destructive"
      });
    }
  };

  const submitDictation = async () => {
    if (!transcribedText.trim()) {
      setShowSubmitConfirmation(true);
      return;
    }

    await performSubmission();
  };

  const performSubmission = async () => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('telugu-basics-token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const requestBody = {
        transcribedText: transcribedText.trim(),
        duration: recordingDuration,
        timeSpent: examination.timeLimit - timeRemaining
      };

      const response = await fetch(`https://service-3-backend-production.up.railway.app/api/voice-examinations/student/${examination._id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to submit dictation');
      }

      const result = await response.json();
      
      setIsExamCompleted(true);
      setResults(result.data);
      setShowResults(true);
      
      toast({
        title: "Submission Successful",
        description: "Your dictation has been evaluated successfully.",
      });

      onComplete(result.data);
    } catch (error) {
      console.error('Error submitting dictation:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your dictation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setShowSubmitConfirmation(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showResults && results) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-600">
            <CheckCircle className="w-8 h-8 inline mr-2" />
            Examination Completed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{results.accuracy || 0}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{results.fluency || 0}%</div>
              <div className="text-sm text-gray-600">Fluency</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{results.pronunciation || 0}%</div>
              <div className="text-sm text-gray-600">Pronunciation</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              Overall Score: {results.overallScore || 0}%
            </div>
            <Badge variant={results.isPassed ? "default" : "destructive"} className="text-lg">
              {results.isPassed ? "PASSED" : "NEEDS IMPROVEMENT"}
            </Badge>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Text Comparison:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Original Paragraph (తెలుగు):</h4>
                <p className="text-blue-700 leading-relaxed">{examination.teluguParagraph}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <h4 className="font-medium text-green-800 mb-2">What You Said (మీరు చెప్పినది):</h4>
                <p className="text-green-700 leading-relaxed">{results.transcribedText || transcribedText}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Detailed Analysis:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Word Count:</h4>
                <p className="text-sm text-gray-600">
                  Original: {results.evaluationDetails?.originalWordCount || 0} words | 
                  You said: {results.evaluationDetails?.transcribedWordCount || 0} words
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Character Count:</h4>
                <p className="text-sm text-gray-600">
                  Original: {results.evaluationDetails?.originalCharCount || 0} characters | 
                  You said: {results.evaluationDetails?.transcribedCharCount || 0} characters
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={onBack} variant="outline">
              Back to Examinations
            </Button>
            <Button onClick={() => window.location.reload()}>
              Take Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isExamStarted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{examination.title}</CardTitle>
          <p className="text-primary font-medium">{examination.teluguTitle}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Time Limit: {formatTime(examination.timeLimit)}</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Type className="w-4 h-4" />
              <span>Real-time Dictation Examination</span>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <span>Words: {examination.wordCount} | Est. Reading Time: {formatTime(examination.estimatedReadingTime)}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium">Instructions:</h4>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">{examination.instructions}</p>
              <p className="text-sm text-primary">{examination.teluguInstructions}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium">What you'll do:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Read the provided paragraph aloud</li>
              <li>• Your speech will be transcribed in real-time</li>
              <li>• You'll see what you're saying as you speak</li>
              <li>• Your pronunciation and accuracy will be evaluated</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Button onClick={startExam} className="w-full">
              Start Examination
            </Button>
            <Button onClick={onBack} variant="outline" className="w-full">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{examination.title}</CardTitle>
            <p className="text-primary font-medium">{examination.teluguTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-red-600">
              <Clock className="w-4 h-4 mr-1" />
              {formatTime(timeRemaining)}
            </Badge>
            <Progress 
              value={((examination.timeLimit - timeRemaining) / examination.timeLimit) * 100} 
              className="w-24 h-2"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Reading Paragraph */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Read this paragraph:</h3>
          <div className="p-6 bg-gray-50 rounded-lg border-2 border-primary/20">
            <p className="text-lg leading-relaxed mb-4">{examination.paragraph}</p>
            <p className="text-lg leading-relaxed text-primary font-medium">{examination.teluguParagraph}</p>
          </div>
        </div>

        {/* Real-time Dictation */}
        <div className="space-y-4">
          <h3 className="font-semibold">Real-time Dictation:</h3>
          
          {!isRecording ? (
            <div className="space-y-4">
              <Alert>
                <Type className="h-4 w-4" />
                <AlertDescription>
                  Click the microphone button to start dictation. Speak clearly while reading the paragraph above.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-center">
                <Button
                  onClick={startDictation}
                  disabled={isListening}
                  size="lg"
                  className="w-20 h-20 rounded-full"
                >
                  {isListening ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </Button>
              </div>
              
              {isListening && (
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-red-600">
                    {formatTime(recordingDuration)}
                  </div>
                  <p className="text-sm text-muted-foreground">Listening... Speak now!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Live Transcription Display */}
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <h4 className="font-medium text-green-800 mb-2 flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Live Transcription (మీరు చెప్పుతున్నది):
                </h4>
                <div className="min-h-[100px] text-green-700 leading-relaxed">
                  {transcribedText && (
                    <p className="mb-2">{transcribedText}</p>
                  )}
                  {interimText && (
                    <p className="text-green-500 italic">{interimText}</p>
                  )}
                  {!transcribedText && !interimText && (
                    <p className="text-gray-400 italic">Start speaking to see your words appear here...</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={stopDictation}
                  variant="outline"
                  size="lg"
                  disabled={!isListening}
                >
                  <MicOff className="w-6 h-6 mr-2" />
                  Stop Dictation
                </Button>
                
                <Button
                  onClick={resetDictation}
                  variant="outline"
                  size="lg"
                  disabled={isListening}
                >
                  <RotateCcw className="w-6 h-6 mr-2" />
                  Start Over
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Dictation duration: {formatTime(recordingDuration)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="space-y-4">
          <div className="flex justify-center gap-4">
            {transcribedText.trim() ? (
              <>
                <Button
                  onClick={submitDictation}
                  disabled={isSubmitting}
                  size="lg"
                  className="px-8 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Dictation
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={submitDictation}
                disabled={isSubmitting}
                size="lg"
                variant="outline"
                className="px-8"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Without Dictation
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Early Submission Notice */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {transcribedText.trim() 
                ? "You can submit your dictation now or continue speaking."
                : "You can submit the examination without dictation, but this will result in a score of 0%."
              }
            </p>
          </div>
        </div>

        {/* Time Warning */}
        {timeRemaining <= 60 && timeRemaining > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Warning: Only {formatTime(timeRemaining)} remaining! Submit your dictation soon.
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Confirmation Dialog */}
        {showSubmitConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-center text-red-600">
                  <AlertCircle className="w-6 h-6 inline mr-2" />
                  Submit Without Dictation?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-gray-600">
                  You haven't provided any dictation yet. Are you sure you want to submit the examination without dictation?
                </p>
                <p className="text-center text-sm text-red-600 font-medium">
                  This will result in a score of 0%.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowSubmitConfirmation(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={performSubmission}
                    variant="destructive"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Anyway"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceExaminationInterface;

