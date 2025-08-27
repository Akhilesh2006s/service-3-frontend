import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target,
  Clock,
  BookOpen,
  GraduationCap,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WordPuzzle from "./WordPuzzle";

interface LearningContentProps {
  lessonId: string;
  title: string;
  teluguTitle: string;
  description: string;
  videoUrl: string;
  trainerName: string;
  duration: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  milestone: number;
  onComplete: (results: LessonResults) => void;
}

interface LessonResults {
  lessonId: string;
  completed: boolean;
  score: number;
  speechAnalysis?: SpeechAnalysis;
  timeSpent: number;
  practiceAttempts: number;
}

interface SpeechAnalysis {
  accuracy: number;
  pronunciation: number;
  fluency: number;
  errors: string[];
  suggestions: string[];
}

interface PracticeStep {
  id: string;
  title: string;
  teluguText: string;
  englishText: string;
  audioUrl?: string;
  type: "pronunciation" | "recognition" | "translation";
}

const LearningContent = ({ 
  lessonId, 
  title, 
  teluguTitle, 
  description, 
  videoUrl, 
  trainerName, 
  duration, 
  difficulty,
  milestone,
  onComplete 
}: LearningContentProps) => {
  const [currentStep, setCurrentStep] = useState<"video" | "practice" | "test" | "complete">("video");
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Blob[]>([]);
  const [speechAnalysis, setSpeechAnalysis] = useState<SpeechAnalysis | null>(null);
  const [practiceProgress, setPracticeProgress] = useState(0);
  const [testResults, setTestResults] = useState<any>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [practiceAttempts, setPracticeAttempts] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Mock practice steps based on "Telugu Basha Sangraha" content
  const practiceSteps: PracticeStep[] = [
    {
      id: "1",
      title: "Vowels Forward",
      teluguText: "అ ఆ ఇ ఈ ఉ ఊ ఋ ౠ ఎ ఏ ఐ ఒ ఓ ఔ అం అః",
      englishText: "a ā i ī u ū ṛ ṝ e ē ai o ō au aṁ aḥ",
      type: "pronunciation"
    },
    {
      id: "2", 
      title: "Vowels Backward",
      teluguText: "అః అం ఔ ఓ ఒ ఐ ఏ ఎ ౠ ఋ ఊ ఉ ఈ ఇ ఆ అ",
      englishText: "aḥ aṁ au ō o ai ē e ṝ ṛ ū u ī i ā a",
      type: "pronunciation"
    },
    {
      id: "3",
      title: "Consonants Forward",
      teluguText: "క ఖ గ ఘ ఙ చ ఛ జ ఝ ఞ ట ఠ డ ఢ ణ త థ ద ధ న ప ఫ బ భ మ య ర ల వ శ ష స హ ళ క్ష ఱ",
      englishText: "ka kha ga gha ṅa ca cha ja jha ña ṭa ṭha ḍa ḍha ṇa ta tha da dha na pa pha ba bha ma ya ra la va śa ṣa sa ha ḷa kṣa ṛa",
      type: "pronunciation"
    },
    {
      id: "4",
      title: "Consonants Backward", 
      teluguText: "ఱ క్ష ళ హ స ష శ వ ల ర య మ భ బ ఫ ప న ధ ద థ త ణ ఢ డ ఠ ట ఞ ఝ జ ఛ చ ఙ ఘ గ ఖ క",
      englishText: "ṛa kṣa ḷa ha sa ṣa śa va la ra ya ma bha ba pha pa na dha da tha ta ṇa ḍha ḍa ṭha ṭa ña jha ja cha ca ṅa gha ga kha ka",
      type: "pronunciation"
    }
  ];

  useEffect(() => {
    // Track time spent
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const handleVideoProgress = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
      
      // Auto-advance to practice when video is complete
      if (progress >= 95) {
        setTimeout(() => {
          setCurrentStep("practice");
        }, 1000);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordings(prev => [...prev, audioBlob]);
        setPracticeAttempts(prev => prev + 1);
        
        // Save recording to backend
        const currentStep = practiceSteps.find((_, index) => index === recordings.length);
        if (currentStep) {
          console.log('🎤 Saving recording for step:', currentStep.title);
          const saved = await saveRecordingToBackend(audioBlob, currentStep.title);
          if (saved) {
            console.log('✅ Recording saved successfully for milestone:', milestone);
          } else {
            console.error('❌ Failed to save recording');
          }
        } else {
          console.warn('⚠️ No current step found for recording');
        }
        
        // Simulate speech analysis
        setTimeout(() => {
          const mockAnalysis: SpeechAnalysis = {
            accuracy: Math.random() * 40 + 60, // 60-100%
            pronunciation: Math.random() * 30 + 70, // 70-100%
            fluency: Math.random() * 25 + 75, // 75-100%
            errors: ["Slight mispronunciation of 'ఋ'", "Need to emphasize 'ఠ' more"],
            suggestions: ["Practice the retroflex sounds more", "Focus on vowel length"]
          };
          setSpeechAnalysis(mockAnalysis);
        }, 2000);
        
        stream.getTracks().forEach(track => track.stop());
        
        toast({
          title: "Recording Complete",
          description: "Analyzing your pronunciation..."
        });
      };

      mediaRecorder.start();
      setIsRecording(true);

    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecordingToBackend = async (audioBlob: Blob, stepTitle: string) => {
    try {
      console.log('🎤 Saving recording to backend for milestone:', milestone);
      console.log('🎤 Step title:', stepTitle);
      console.log('🎤 Recording blob size:', audioBlob.size);
      
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const submissionData = {
        milestone: milestone,
        audioBlob: base64Audio,
        duration: Math.round(audioBlob.size / 16000), // Approximate duration based on file size
        fileName: `milestone-${milestone}-${stepTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.wav`,
        stepTitle: stepTitle,
        lessonId: lessonId,
        lessonTitle: title
      };

      const token = localStorage.getItem('telugu-basics-token');
      
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/submissions/milestone-voice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🎤 Recording saved successfully:', result);
        
        toast({
          title: "Recording Saved",
          description: `Your ${stepTitle} recording has been saved for milestone ${milestone}.`
        });
        
        return true;
      } else {
        const errorText = await response.text();
        console.error('🎤 Failed to save recording:', errorText);
        
        toast({
          title: "Save Failed",
          description: "Failed to save recording. Please try again.",
          variant: "destructive"
        });
        
        return false;
      }
    } catch (error) {
      console.error('🎤 Error saving recording:', error);
      
      toast({
        title: "Save Error",
        description: "An error occurred while saving the recording.",
        variant: "destructive"
      });
      
      return false;
    }
  };

  const handlePracticeComplete = () => {
    setPracticeProgress(100);
    setCurrentStep("test");
  };

  const handleTestComplete = (results: any) => {
    setTestResults(results);
    setCurrentStep("complete");
    
    const lessonResults: LessonResults = {
      lessonId,
      completed: true,
      score: results.score,
      speechAnalysis: speechAnalysis || undefined,
      timeSpent,
      practiceAttempts
    };
    
    onComplete(lessonResults);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800";
      case "Intermediate": return "bg-yellow-100 text-yellow-800";
      case "Advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderVideoStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-lg text-primary font-medium">{teluguTitle}</p>
        <p className="text-muted-foreground">{description}</p>
        <div className="flex items-center justify-center gap-4">
          <Badge className={getDifficultyColor(difficulty)}>{difficulty}</Badge>
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            {duration} min
          </Badge>
          <Badge variant="outline">
            <GraduationCap className="w-3 h-3 mr-1" />
            {trainerName}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Video Explanation
          </CardTitle>
          <CardDescription>
            Watch Mr. Bhaskar Raja explain the concept
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full rounded-lg"
              controls
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onTimeUpdate={handleVideoProgress}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            <div className="mt-4">
              <Progress value={videoProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round(videoProgress)}% complete
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" disabled>
          Previous Lesson
        </Button>
        <Button 
          onClick={() => setCurrentStep("practice")}
          disabled={videoProgress < 90}
        >
          Continue to Practice
        </Button>
      </div>
    </div>
  );

  const renderPracticeStep = () => {
    // For milestones 9-19, show WordPuzzle instead of audio recording
    if (milestone >= 9 && milestone <= 19) {
      return (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Word Puzzle Practice</h2>
            <p className="text-muted-foreground">
              Practice vocabulary and word recognition through interactive puzzles
            </p>
            <Progress value={practiceProgress} className="w-64 mx-auto" />
          </div>

          <WordPuzzle 
            milestone={milestone}
            title={title}
            teluguTitle={teluguTitle}
            description={description}
          />

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep("video")}
            >
              ← Back to Video
            </Button>
            <Button 
              onClick={handlePracticeComplete}
              disabled={practiceProgress < 50}
            >
              Continue to Test
            </Button>
          </div>
        </div>
      );
    }

    // For milestones 1-8, show original audio recording practice
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Practice Session</h2>
          <p className="text-muted-foreground">
            Practice the concepts you just learned
          </p>
          <Progress value={practiceProgress} className="w-64 mx-auto" />
        </div>

        <Tabs defaultValue="pronunciation" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pronunciation">Pronunciation</TabsTrigger>
            <TabsTrigger value="recognition">Recognition</TabsTrigger>
            <TabsTrigger value="translation">Translation</TabsTrigger>
          </TabsList>

          <TabsContent value="pronunciation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Voice Practice
                </CardTitle>
                <CardDescription>
                  Record your pronunciation and get feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {practiceSteps.map((step, index) => (
                  <div key={step.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{step.title}</h4>
                      <Badge variant="secondary">Step {index + 1}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-lg font-medium text-primary">
                        {step.teluguText}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {step.englishText}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={isRecording ? "destructive" : "default"}
                        size="sm"
                        onClick={isRecording ? stopRecording : startRecording}
                        className="flex items-center gap-2"
                      >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        {isRecording ? "Stop Recording" : "Record"}
                      </Button>
                      
                      {recordings.length > 0 && (
                        <Button variant="outline" size="sm">
                          <Volume2 className="w-4 h-4" />
                          Play Last
                        </Button>
                      )}
                    </div>

                    {speechAnalysis && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg space-y-2">
                        <h5 className="font-medium text-blue-900">Analysis Results:</h5>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-blue-700">Accuracy:</span>
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {Math.round(speechAnalysis.accuracy)}%
                            </div>
                          </div>
                          <div>
                            <span className="text-blue-700">Pronunciation:</span>
                            <div className="flex items-center gap-1">
                              <Volume2 className="w-3 h-3" />
                              {Math.round(speechAnalysis.pronunciation)}%
                            </div>
                          </div>
                          <div>
                            <span className="text-blue-700">Fluency:</span>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {Math.round(speechAnalysis.fluency)}%
                            </div>
                          </div>
                        </div>
                        
                        {speechAnalysis.errors.length > 0 && (
                          <div className="mt-2">
                            <h6 className="font-medium text-red-700 flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Areas to Improve:
                            </h6>
                            <ul className="text-xs text-red-600 mt-1 space-y-1">
                              {speechAnalysis.errors.map((error, i) => (
                                <li key={i}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {speechAnalysis.suggestions.length > 0 && (
                          <div className="mt-2">
                            <h6 className="font-medium text-green-700 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Suggestions:
                            </h6>
                            <ul className="text-xs text-green-600 mt-1 space-y-1">
                              {speechAnalysis.suggestions.map((suggestion, i) => (
                                <li key={i}>• {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recognition">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Recognition exercises coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="translation">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Translation exercises coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep("video")}
          >
            ← Back to Video
          </Button>
          <Button 
            onClick={handlePracticeComplete}
            disabled={practiceProgress < 50}
          >
            Continue to Test
          </Button>
        </div>
      </div>
    );
  };

  const renderTestStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Knowledge Test</h2>
        <p className="text-muted-foreground">
          Test your understanding of the concepts
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Test interface coming soon...</p>
          <Button 
            onClick={() => handleTestComplete({ score: 85 })}
            className="mt-4"
          >
            Complete Test
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
      <h2 className="text-2xl font-bold">Lesson Complete!</h2>
      <p className="text-muted-foreground">
        Great job! You've completed "{title}"
      </p>
      
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{formatTime(timeSpent)}</div>
          <div className="text-sm text-muted-foreground">Time Spent</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{practiceAttempts}</div>
          <div className="text-sm text-muted-foreground">Practice Attempts</div>
        </div>
      </div>

      {speechAnalysis && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">Speech Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Accuracy</span>
                <span>{Math.round(speechAnalysis.accuracy)}%</span>
              </div>
              <Progress value={speechAnalysis.accuracy} className="h-2" />
              
              <div className="flex justify-between">
                <span>Pronunciation</span>
                <span>{Math.round(speechAnalysis.pronunciation)}%</span>
              </div>
              <Progress value={speechAnalysis.pronunciation} className="h-2" />
              
              <div className="flex justify-between">
                <span>Fluency</span>
                <span>{Math.round(speechAnalysis.fluency)}%</span>
              </div>
              <Progress value={speechAnalysis.fluency} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-primary p-4">
      <div className="max-w-4xl mx-auto">
        {currentStep === "video" && renderVideoStep()}
        {currentStep === "practice" && renderPracticeStep()}
        {currentStep === "test" && renderTestStep()}
        {currentStep === "complete" && renderCompleteStep()}
      </div>
    </div>
  );
};

export default LearningContent; 
