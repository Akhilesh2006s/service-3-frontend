import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  BookOpen, 
  FileText, 
  Award, 
  Clock, 
  CheckCircle,
  Play,
  Calendar,
  TrendingUp,
  Target,
  GraduationCap,
  Sparkles,
  Star,
  Trophy,
  Heart,
  Pause,
  Volume2,
  Maximize,
  LogOut,
  Trash2,
  RefreshCw,
  Type,
  Globe,
  Mic
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import MilestoneSystem from "@/components/MilestoneSystem";

import WordPuzzle from "@/components/WordPuzzle";
import ExamInterface from "@/components/ExamInterface";
import DescriptiveExamInterface from "@/components/DescriptiveExamInterface";
import DescriptiveResultsView from "@/components/DescriptiveResultsView";
import YouTubePlayer from "@/components/YouTubePlayer";
import { isYouTubeUrl } from "@/utils/youtubeUtils";
import TeluguReading from "@/components/TeluguReading";

import TeluguDictation from "@/components/TeluguDictation";

import TeluguSentenceFormation from "@/components/TeluguSentenceFormation";
import TeluguSpelling from "@/components/TeluguSpelling";
import VoiceExaminationInterface from "@/components/VoiceExaminationInterface";



interface ExamResults {
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: Record<string, number>;

  timeSpent: number;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  type: "mcq" | "voice" | "mixed" | "descriptive";
  timeLimit: number;
  isCompleted: boolean;
  score?: number;
  dueDate?: Date;
  milestone?: number;
  category?: string;
  difficulty?: string;
  passingScore?: number;
  createdAt?: Date;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  cannotRetake?: boolean;
  openDate?: string;
  descriptiveTimeLimit?: number;
  totalMaxMarks?: number;
  // Exam attempt properties (added dynamically)
  attemptId?: string;
  attemptStartedAt?: string;
  attemptTimeLimit?: number;
  attemptRemainingTime?: number;
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
}

interface LearningActivity {
  id: string;
  title: string;
  teluguTitle: string;
  type: "video" | "practice" | "assessment";
  duration: number;
  isCompleted: boolean;
  progress: number;
}

const LearnerDashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showExam, setShowExam] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("curriculum");
  const [showVideoContent, setShowVideoContent] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string>("");
  const [currentMilestone, setCurrentMilestone] = useState<number>(1);



  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionDetails, setSubmissionDetails] = useState<Record<string, any>>({});
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [videoLectures, setVideoLectures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<string>("all");
  const [voiceExaminations, setVoiceExaminations] = useState<any[]>([]);
  const [selectedVoiceExamination, setSelectedVoiceExamination] = useState<any>(null);
  const [showVoiceExamination, setShowVoiceExamination] = useState(false);







  // Check user role and redirect if not a learner
  useEffect(() => {
    if (user && user.role !== 'learner') {
      console.log(`Access denied: User role ${user.role} cannot access learner dashboard`);
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the Learner Dashboard.",
        variant: "destructive"
      });
      
      // Redirect to appropriate dashboard based on role
      switch (user.role) {
        case 'trainer':
          navigate('/trainer');
          break;
        case 'evaluator':
          navigate('/evaluator');
          break;
        default:
          navigate('/');
      }
      return;
    }
  }, [user, navigate, toast]);

  // Fetch voice examinations
  const fetchVoiceExaminations = async () => {
    try {
      console.log('🔍 Fetching voice examinations...');
      const token = localStorage.getItem('telugu-basics-token');
      console.log('🔍 Token available:', !!token);
      
      const response = await fetch('http://localhost:5000/api/voice-examinations/student', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Voice examinations response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔍 Voice examinations result:', result);
        setVoiceExaminations(result.data || []);
      } else {
        const errorText = await response.text();
        console.error('🔍 Voice examinations error:', errorText);
      }
    } catch (error) {
      console.error('🔍 Error fetching voice examinations:', error);
    }
  };

  // Define fetchExams and fetchSubmissions functions in component scope
  const fetchExams = async () => {
    if (isLoading) {
      console.log('LearnerDashboard - Skipping fetchExams, already loading...');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('LearnerDashboard - Fetching exams...');
      
      // Fetch exams
              const examResponse = await fetch('http://localhost:5000/api/exams/student', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('LearnerDashboard - Exams response status:', examResponse.status);

      if (examResponse.ok) {
        const examResult = await examResponse.json();
        console.log('LearnerDashboard - Exams result:', examResult);
        
        if (examResult.success) {
          console.log('LearnerDashboard - Raw exam data from backend:', examResult.data);
          
          // Also fetch submissions to get scores
          console.log('LearnerDashboard - Fetching submissions for scores...');
          const submissionResponse = await fetch('http://localhost:5000/api/submissions/student', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
              'Content-Type': 'application/json'
            }
          });

          let submissionData: any[] = [];
          if (submissionResponse.ok) {
            const submissionResult = await submissionResponse.json();
            console.log('LearnerDashboard - Submissions result:', submissionResult);
            if (submissionResult.success) {
              submissionData = submissionResult.data;
            }
          }

          // Create a map of exam scores from submissions
          const examScores: Record<string, { score: number; status: string; isCompleted: boolean }> = {};
          submissionData.forEach((submission: any) => {
            const examId = submission.examId || (submission.exam && submission.exam._id);
            if (examId) {
              examScores[examId] = {
                score: submission.score || 0,
                status: submission.status || 'pending',
                isCompleted: submission.status === 'evaluated' || submission.status === 'completed'
              };
            }
          });

          console.log('LearnerDashboard - Exam scores from submissions:', examScores);
          
          // Transform the exam data to match our interface
          const transformedExams = examResult.data.map((exam: any) => {
            console.log('LearnerDashboard - Processing exam:', exam.title, 'descriptiveQuestions:', exam.descriptiveQuestions);
            
            const examScore = examScores[exam._id];
            console.log('LearnerDashboard - Exam score data for', exam.title, ':', examScore);
            
            return {
              id: exam._id || exam.id,
              title: exam.title,
              description: exam.description,
              type: exam.type,
              timeLimit: exam.timeLimit,
              isCompleted: examScore?.isCompleted || exam.isCompleted || false,
              score: examScore?.score || exam.score || undefined,
              dueDate: exam.dueDate,
              milestone: exam.milestone,
              category: exam.category,
              difficulty: exam.difficulty,
              passingScore: exam.passingScore,
              createdAt: exam.createdAt,
              createdBy: exam.createdBy,
              cannotRetake: examScore?.isCompleted || exam.cannotRetake || exam.isCompleted,
              openDate: exam.openDate,
              descriptiveTimeLimit: exam.descriptiveTimeLimit,
              totalMaxMarks: exam.totalMaxMarks || 100,
              mcqQuestions: exam.mcqQuestions || [],
              voiceQuestions: exam.voiceQuestions || [],
              descriptiveQuestions: exam.descriptiveQuestions || []
            };
          });
          
          console.log('LearnerDashboard - Transformed exams with scores:', transformedExams);
          setExams(transformedExams);
        }
      } else {
        // Debug: Log error response
        const errorText = await examResponse.text();
        console.error('LearnerDashboard - Exams error response:', errorText);
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  };

  const fetchSubmissions = async () => {
    try {
      // Debug: Log the current user and token
      console.log('LearnerDashboard - Current user:', user);
      console.log('LearnerDashboard - User role:', user?.role);
      console.log('LearnerDashboard - Token:', localStorage.getItem('telugu-basics-token'));
      
      const response = await fetch('http://localhost:5000/api/submissions/student', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('LearnerDashboard - Submissions response status:', response.status);
      console.log('LearnerDashboard - Submissions response:', response);

      if (response.ok) {
        const result = await response.json();
        console.log('LearnerDashboard - Submissions result:', result);
        if (result.success) {
          setSubmissions(result.data);
          
          // Store submission details for results viewing
          const submissionDetailsMap: Record<string, any> = {};
          result.data.forEach((submission: any) => {
            const examId = submission.examId || (submission.exam && submission.exam._id);
            if (examId) {
              submissionDetailsMap[examId] = submission;
            }
          });
          setSubmissionDetails(submissionDetailsMap);
          
          // Update exam completion status based on submissions
          setExams(prevExams => 
            prevExams.map(exam => {
              const submission = result.data.find((s: any) => 
                (s.examId === exam.id || (s.exam && s.exam._id === exam.id)) && s.status === 'evaluated'
              );
              
              if (submission) {
                return {
                  ...exam,
                  isCompleted: true,
                  score: submission.score || submission.calculatedScore || 0
                };
              }
              return exam;
            })
          );
        }
      } else {
        // Debug: Log error response
        const errorText = await response.text();
        console.error('LearnerDashboard - Submissions error response:', errorText);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const fetchVideoLectures = async () => {
    try {
      console.log('🎬 LearnerDashboard - Fetching video lectures...');
      const response = await fetch('http://localhost:5000/api/video-lectures/student', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🎬 Video lectures response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('🎬 Video lectures API result:', result);
        
        if (result.success) {
          console.log('🎬 Video lectures loaded:', result.data);
          setVideoLectures(result.data);
        } else {
          console.error('🎬 Video lectures error:', result.message);
        }
      } else {
        console.error('🎬 Video lectures response not ok:', response.status);
        const errorText = await response.text();
        console.error('🎬 Error details:', errorText);
      }
    } catch (error) {
      console.error('🎬 Error fetching video lectures:', error);
    }
  };

  // Fetch exams from the server (only if user is a learner)
  useEffect(() => {
    if (user && user.role === 'learner' && !hasLoaded) {
      // Add a small delay to prevent rapid requests
      const timer = setTimeout(() => {
        fetchExams();
        fetchSubmissions();
        fetchVideoLectures();
        fetchVoiceExaminations();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [user, hasLoaded]);

  // Refresh data periodically to get updated evaluation results
  useEffect(() => {
    if (user && user.role === 'learner') {
      const refreshInterval = setInterval(() => {
        fetchSubmissions();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  const handleExamStart = async (exam: Exam) => {
    if (exam.isCompleted && exam.type === 'descriptive') {
      // For completed descriptive exams, show results view
      // Find the latest submission for this exam
      const examSubmissions = submissions.filter(sub => 
        sub.examId === exam.id || (sub.exam && sub.exam._id === exam.id)
      );
      
      // Get the latest submission (most recent)
      const submission = examSubmissions.length > 0 
        ? examSubmissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0]
        : null;
      
      console.log('🔍 Looking for submission for exam:', exam.id);
      console.log('📋 All submissions:', submissions);
      console.log('🎯 Exam submissions found:', examSubmissions.length);
      console.log('📝 Selected submission:', submission);
      
      if (submission) {
        setSelectedSubmission(submission);
        setSelectedExam(exam);
        setShowResults(true);
        setShowExam(false);
      } else {
        // If no submission found, show a message
        toast({
          title: "No Submission Found",
          description: "No submission found for this exam. Please contact support.",
          variant: "destructive"
        });
      }
      return;
    }
    
    if (exam.isCompleted) {
      // For other completed exams, show results view
      setSelectedExam(exam);
      setShowExam(true);
      return;
    }

    // For descriptive exams, start the timer when student clicks start
    if (exam.type === 'descriptive') {
      try {
        const response = await fetch(`http://localhost:5000/api/exam-attempts/start/${exam.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Exam attempt started:', result);
          
          // Store attempt info for the exam interface
          exam.attemptId = result.data.attemptId;
          exam.attemptStartedAt = result.data.startedAt;
          exam.attemptTimeLimit = result.data.timeLimit;
          exam.attemptRemainingTime = result.data.remainingTime;
          
          console.log('📝 Updated exam with attempt data:', {
            attemptId: exam.attemptId,
            attemptStartedAt: exam.attemptStartedAt,
            attemptTimeLimit: exam.attemptTimeLimit,
            attemptRemainingTime: exam.attemptRemainingTime
          });
          
          setSelectedExam(exam);
          setShowExam(true);
        } else {
          const errorText = await response.text();
          console.error('Failed to start exam attempt:', errorText);
          toast({
            title: "Error Starting Exam",
            description: "Failed to start exam. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error starting exam attempt:', error);
        toast({
          title: "Error Starting Exam",
          description: "Failed to start exam. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      // For non-descriptive exams, just show the exam
      setSelectedExam(exam);
      setShowExam(true);
    }
  };

  const handleVoiceExaminationStart = (examination: any) => {
    setSelectedVoiceExamination(examination);
    setShowVoiceExamination(true);
  };

  const handleVoiceExaminationComplete = (results: any) => {
    setShowVoiceExamination(false);
    setSelectedVoiceExamination(null);
    fetchVoiceExaminations(); // Refresh the list
    toast({
      title: "Voice Examination Completed",
      description: `You scored ${results.overallScore}% on the voice examination.`,
    });
  };

  const handleVoiceExaminationBack = () => {
    setShowVoiceExamination(false);
    setSelectedVoiceExamination(null);
  };

  const handleExamComplete = async (results: ExamResults) => {
    console.log('LearnerDashboard - Exam completed with results:', results);
    setShowExam(false);
    
    if (selectedExam) {
      try {
        // Create submission record with only valid fields
        const submissionData = {
          examId: selectedExam.id,
          submissionType: selectedExam.type,
          score: results.score,
          totalQuestions: results.totalQuestions,
          correctAnswers: results.score, // This should be the count of correct answers
          timeSpent: results.timeSpent,
          answers: results.answers // Send the actual answers
        };
        
        console.log('LearnerDashboard - Submitting exam data:', submissionData);
        
        const submissionResponse = await fetch('http://localhost:5000/api/submissions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionData)
        });

        console.log('LearnerDashboard - Submission response status:', submissionResponse.status);

        if (submissionResponse.ok) {
          const submissionResult = await submissionResponse.json();
          console.log('LearnerDashboard - Submission result:', submissionResult);
          
          // Update the exam score in the local state immediately
          setExams(prevExams => 
            prevExams.map(exam => 
              exam.id === selectedExam.id 
                ? { 
                    ...exam, 
                    isCompleted: true, 
                    score: results.percentage,
                    cannotRetake: true // Mark as cannot retake
                  }
                : exam
            )
          );
          
          toast({
            title: "Exam Completed! 🎉",
            description: `Congratulations! You scored ${results.percentage}% on ${selectedExam.title}. Your submission has been recorded and cannot be retaken.`,
            variant: results.percentage >= 70 ? "default" : "destructive"
          });
        } else {
          const errorText = await submissionResponse.text();
          console.error('LearnerDashboard - Submission error response:', errorText);
          
          toast({
            title: "Submission Error",
            description: "Exam completed but failed to save submission. Please contact support.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Failed to submit exam:', error);
        toast({
          title: "Submission Error",
          description: "Exam completed but failed to save submission. Please contact support.",
          variant: "destructive"
        });
      }
    }
    
    setSelectedExam(null);
    
    // Update the exam completion status immediately without relying on fetchSubmissions
    setExams(prevExams => 
      prevExams.map(exam => 
        exam.id === selectedExam.id 
          ? { 
              ...exam, 
              isCompleted: true, 
              score: results.percentage,
              cannotRetake: true // Mark as cannot retake
            }
          : exam
      )
    );
    
    // Only refresh exams, skip submissions since it's failing
    setTimeout(() => {
      fetchExams();
    }, 1000);
  };

  const handleDescriptiveExamComplete = async (submissions: any[]) => {
    console.log('LearnerDashboard - Descriptive exam completed with submissions:', submissions);
    
    // Immediately close the exam interface
    setShowExam(false);
    setSelectedExam(null);
    
    if (selectedExam) {
      try {
        // Create submission record for descriptive exam
        const submissionData = {
          examId: selectedExam.id,
          submissionType: 'descriptive',
          descriptiveAnswers: submissions.map(submission => ({
            questionIndex: submission.questionIndex,
            question: submission.question,
            textAnswer: submission.textAnswer || '',
            pdfUrl: submission.pdfUrl,
            fileName: submission.fileName,
            fileSize: submission.fileSize,
            submittedAt: submission.submittedAt
          })),
          timeSpent: 0, // Descriptive exams don't have time limits
          status: 'pending' // Will be evaluated by evaluator
        };
        
        console.log('LearnerDashboard - Submitting descriptive exam data:', submissionData);
        
        const submissionResponse = await fetch('http://localhost:5000/api/submissions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionData)
        });

        console.log('LearnerDashboard - Descriptive submission response status:', submissionResponse.status);

        if (submissionResponse.ok) {
          const submissionResult = await submissionResponse.json();
          console.log('LearnerDashboard - Descriptive submission result:', submissionResult);
          
          // Update the exam completion status in the local state immediately
          setExams(prevExams => 
            prevExams.map(exam => 
              exam.id === selectedExam.id 
                ? { 
                    ...exam, 
                    isCompleted: true, 
                    score: undefined, // No score yet - pending evaluation
                    cannotRetake: true // Mark as cannot retake
                  }
                : exam
            )
          );
          
          toast({
            title: "Descriptive Exam Submitted! 📝",
            description: "Your PDF submissions have been sent for evaluation. You will receive your score once an evaluator reviews your work.",
          });
          
          console.log('LearnerDashboard - Exam interface should be closed now');
        } else {
          const errorText = await submissionResponse.text();
          console.error('LearnerDashboard - Descriptive submission error response:', errorText);
          
          toast({
            title: "Submission Error",
            description: "Failed to submit descriptive exam. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Failed to submit descriptive exam:', error);
        toast({
          title: "Submission Error",
          description: "Failed to submit descriptive exam. Please try again.",
          variant: "destructive"
        });
      }
    }
    
    // Ensure exam interface is closed even if there's an error
    setShowExam(false);
    setSelectedExam(null);
    
    // Refresh exams to get updated status
    setTimeout(() => {
      fetchExams();
    }, 1000);
  };

  const handleStartLearning = () => {
    setActiveTab("curriculum");
    setShowVideoContent(true);
    setCurrentMilestone(1);
    
    console.log('🎬 Video lectures from database:', videoLectures);
    
    // Find video lecture for milestone 1 from backend data
    const videoLecture = videoLectures.find(video => video.milestone === 1);
    console.log('🎬 Found video lecture for milestone 1:', videoLecture);
    
    if (videoLecture) {
      console.log('🎬 Setting video URL:', videoLecture.videoUrl);
      setCurrentVideo(videoLecture.videoUrl);
      toast({
        title: "Starting Structured Learning",
        description: `Loading ${videoLecture.isYouTubeVideo ? 'YouTube' : 'video'} for Telugu vowels tutorial`
      });
    } else {
      console.log('⚠️ No video lecture found for milestone 1, using fallback');
      // Fallback to default video path
      setCurrentVideo("/videos/milestone-1/video-1.mp4");
      toast({
        title: "Starting Structured Learning",
        description: "Loading Telugu vowels tutorial video (no custom video found)"
      });
    }
  };

  const handleMilestoneSelect = (milestoneId: number) => {
    setCurrentMilestone(milestoneId);
    
    // Find video lecture for this milestone from backend data
    const videoLecture = videoLectures.find(video => video.milestone === milestoneId);
    
    if (videoLecture) {
      setCurrentVideo(videoLecture.videoUrl);
      toast({
        title: "Milestone Selected",
        description: `Loading ${videoLecture.isYouTubeVideo ? 'YouTube' : 'video'} for Milestone ${milestoneId}`
      });
    } else {
      // Fallback to default video path
      setCurrentVideo(`/videos/milestone-${milestoneId}/video-${milestoneId}.mp4`);
      toast({
        title: "Milestone Selected",
        description: `Loading video for Milestone ${milestoneId} (no custom video found)`
      });
    }
  };

  const getMilestoneTitle = (milestoneId: number) => {
    const titles = {
      1: "Telugu Basics - Lesson 1: Vowels (ఆ నుంచి అహ వరకు)",
      2: "Telugu Basics - Lesson 2: Consonants (క నుంచి బండి ర వరకు)",
      3: "Telugu Basics - Lesson 3: Special Characters (తలకట్టు to విసర్గమ్)",
      4: "Telugu Basics - Lesson 4: Guninthalu Method 1",
      5: "Telugu Basics - Lesson 5: Guninthalu Method 2",
      6: "Telugu Basics - Lesson 6: Guninthalu Method 3",
      7: "Telugu Basics - Lesson 7: Three Consonant Combinations",
      8: "Telugu Basics - Lesson 8: Two Consonant Combinations",
      9: "Telugu Basics - Lesson 9: Four Step Method - Stage One",
      10: "Telugu Basics - Lesson 10: Four Step Method - Stage Two",
      11: "Telugu Basics - Lesson 11: Double Letter Words",
      12: "Telugu Basics - Lesson 12: Compound Letter Words",
      13: "Telugu Basics - Lesson 13: Two Double Letter Words",
      14: "Telugu Basics - Lesson 14: Two Compound Letter Words",
      15: "Telugu Basics - Lesson 15: Complex Combination Words",
      16: "Telugu Basics - Lesson 16: Complete Letter Modification",
      17: "Telugu Basics - Lesson 17: హాల్లు ను పూర్తిగా మార్చడం ద్వారా ఒత్తు వచ్చే వాటిని చెప్పగలరా?",
      18: "Telugu Basics - Lesson 18: హాల్లు కు వున్న తలకట్టు తీసివేయడం ద్వారా ఒత్తు వచ్చే వాటిని చెప్పగలరా?",
      19: "Telugu Basics - Lesson 19: హల్లులో ఎలాంటి మార్పు అవసరంలేకుండా ఒత్తు వచ్చే వాటిని చెప్పగలరా?"
    };
    return titles[milestoneId as keyof typeof titles] || `Lesson ${milestoneId}`;
  };

  const getMilestoneDescription = (milestoneId: number) => {
    const descriptions = {
      1: "Learn Telugu vowels from ఆ to అహ with forward and backward recitation",
      2: "Master basic consonants from క to బండి ర with forward and backward recitation",
      3: "Learn special characters, modifiers, and their usage in Telugu script",
      4: "Learn the first method of guninthalu with 5 examples forward and backward",
      5: "Master the second method of guninthalu with 5 examples forward and backward",
      6: "Learn the third method of guninthalu with 5 examples forward and backward",
      7: "Practice three consonant combinations in guninthalu formation",
      8: "Master two consonant combinations in guninthalu formation",
      9: "Learn 50 simple Telugu words with proper pronunciation and meaning",
      10: "Master the foundational four-step methodology for word formation",
      11: "Learn advanced four-step methodology for complex word formation",
      12: "Practice 10 double letter words using the four-step method",
      13: "Learn 10 compound letter words using the four-step method",
      14: "Master 10 words with two double letters using advanced techniques",
      15: "Practice 10 words with two compound letters using advanced techniques",
      16: "Learn 10 complex combination words with multiple letter modifications",
      17: "హాల్లు ను పూర్తిగా మార్చడం ద్వారా ఒత్తు వచ్చే వాటిని చెప్పగలరా? - Can you tell me about those that get 'otthu' by completely changing the consonant?",
      18: "హాల్లు కు వున్న తలకట్టు తీసివేయడం ద్వారా ఒత్తు వచ్చే వాటిని చెప్పగలరా? - Can you tell me about those that get 'otthu' by removing the 'talakattu' from the consonant?",
      19: "హల్లులో ఎలాంటి మార్పు అవసరంలేకుండా ఒత్తు వచ్చే వాటిని చెప్పగలరా?"
    };
    return descriptions[milestoneId as keyof typeof descriptions] || `Lesson ${milestoneId} description`;
  };

  const handleVideoPlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out"
    });
  };



  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const totalProgress = activities.length > 0 ? activities.reduce((sum, activity) => sum + activity.progress, 0) / activities.length : 0;
  const completedActivities = activities.filter(a => a.isCompleted).length;
  const completedExams = exams.filter(e => e.isCompleted).length;



  // Check if user has learner role
  if (!user || user.role !== 'learner') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access the Learner Dashboard.</p>
          <button 
            onClick={() => navigate('/')} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (showResults && selectedExam && selectedSubmission) {
    return (
      <div className="min-h-screen bg-gradient-primary p-4">
        <DescriptiveResultsView
          submission={selectedSubmission}
          questions={selectedExam.descriptiveQuestions || []}
          onClose={() => {
            setShowResults(false);
            setSelectedExam(null);
            setSelectedSubmission(null);
          }}
          examMaxMarks={selectedExam.totalMaxMarks || 100}
        />
      </div>
    );
  }

  if (showExam && selectedExam) {
    return (
      <div className="min-h-screen bg-gradient-primary p-4">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="outline" 
            onClick={() => setShowExam(false)}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          
          {selectedExam.type === "descriptive" ? (
            <>
              {console.log('LearnerDashboard - selectedExam for descriptive:', selectedExam)}
              {console.log('LearnerDashboard - descriptiveQuestions:', selectedExam.descriptiveQuestions)}
              <DescriptiveExamInterface
                exam={{
                  id: selectedExam.id,
                  title: selectedExam.title,
                  description: selectedExam.description,
                  openDate: selectedExam.openDate || new Date().toISOString(),
                  descriptiveTimeLimit: selectedExam.descriptiveTimeLimit || 60,
                  // Include attempt properties
                  attemptId: selectedExam.attemptId,
                  attemptStartedAt: selectedExam.attemptStartedAt,
                  attemptTimeLimit: selectedExam.attemptTimeLimit,
                  attemptRemainingTime: selectedExam.attemptRemainingTime,
                  descriptiveQuestions: selectedExam.descriptiveQuestions || []
                }}
                onComplete={handleDescriptiveExamComplete}
                onClose={() => setShowExam(false)}
              />
            </>
          ) : (
            <ExamInterface
              examType={selectedExam.type}
              title={selectedExam.title}
              description={selectedExam.description}
              timeLimit={selectedExam.timeLimit}
              mcqQuestions={selectedExam.mcqQuestions}
              voiceQuestions={selectedExam.voiceQuestions}
              onComplete={handleExamComplete}
              isViewingResults={selectedExam.isCompleted}
              previousResults={selectedExam.isCompleted ? {
                score: selectedExam.score || 0,
                                              totalQuestions: (selectedExam.mcqQuestions?.length || 0) + (selectedExam.descriptiveQuestions?.length || 0) + (selectedExam.voiceQuestions?.length || 0),
                percentage: selectedExam.score || 0,
                answers: submissionDetails[selectedExam.id]?.answers || {},

                timeSpent: submissionDetails[selectedExam.id]?.timeSpent || 0
              } : undefined}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Enhanced Header - Mobile Responsive */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-8 border border-primary/20">
          <div className="absolute top-0 right-0 w-16 h-16 sm:w-32 sm:h-32 bg-primary/5 rounded-full -translate-y-8 translate-x-8 sm:-translate-y-16 sm:translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-24 sm:h-24 bg-primary/5 rounded-full translate-y-6 -translate-x-6 sm:translate-y-12 sm:-translate-x-12"></div>
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-primary/20 rounded-xl">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold text-white">
                    Welcome {user?.name || 'username'}!
                  </h1>
                  <p className="text-sm sm:text-lg text-white/80">Continue your Telugu learning journey with passion</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Welcome, {user?.name || 'Learner'}!</span>
                <Badge variant="secondary" className="text-xs">{user?.role || 'Unknown Role'}</Badge>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    fetchSubmissions();
                    fetchExams();
                    toast({
                      title: "Data Refreshed",
                      description: "Your evaluation results have been updated.",
                    });
                  }}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs sm:text-sm">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>



        {/* Professional Navigation Tabs - Mobile Responsive */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 shadow-lg">
          <CardContent className="p-4 sm:p-8">
            <div className="mb-4 sm:mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">Learning Dashboard</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Choose your learning path and explore Telugu language skills</p>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
              <TabsList className="flex flex-wrap justify-center w-full bg-gradient-to-r from-primary/5 to-primary/15 border border-primary/20 rounded-lg shadow-sm p-1 sm:p-2 gap-1">
                <TabsTrigger key="exams" value="exams" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 hover:bg-primary/10 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-md mx-0.5 sm:mx-1">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Exams & Assessments</span>
                  <span className="sm:hidden">Exams</span>
                </TabsTrigger>
                <TabsTrigger key="curriculum" value="curriculum" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 hover:bg-primary/10 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-md mx-0.5 sm:mx-1">
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Curriculum</span>
                  <span className="sm:hidden">Learn</span>
                </TabsTrigger>
                <TabsTrigger key="telugu-reading" value="telugu-reading" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 hover:bg-primary/10 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-md mx-0.5 sm:mx-1">
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">తెలుగు చదవడం</span>
                  <span className="sm:hidden">చదవడం</span>
                </TabsTrigger>

                <TabsTrigger key="telugu-dictation" value="telugu-dictation" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 hover:bg-primary/10 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-md mx-0.5 sm:mx-1">
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">తెలుగు డిక్టేషన్</span>
                  <span className="sm:hidden">డిక్టేషన్</span>
                </TabsTrigger>
                <TabsTrigger key="telugu-sentence-formation" value="telugu-sentence-formation" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 hover:bg-primary/10 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-md mx-0.5 sm:mx-1">
                  <Type className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">వాక్య నిర్మాణం</span>
                  <span className="sm:hidden">వాక్యం</span>
                </TabsTrigger>
                <TabsTrigger key="telugu-spelling" value="telugu-spelling" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 hover:bg-primary/10 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-md mx-0.5 sm:mx-1">
                  <Type className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">వర్ణమాల</span>
                  <span className="sm:hidden">వర్ణమాల</span>
                </TabsTrigger>
                <TabsTrigger key="voice-examinations" value="voice-examinations" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 hover:bg-primary/10 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-md mx-0.5 sm:mx-1">
                  <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Voice Examinations</span>
                  <span className="sm:hidden">Voice</span>
                </TabsTrigger>
              </TabsList>



              <TabsContent value="exams" className="space-y-4">
                {/* Exam Statistics Summary */}
                {exams.length > 0 && (
                  <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-primary">Exam Progress</h3>
                        <Button 
                          onClick={() => {
                            fetchExams();
                            fetchSubmissions();
                          }}
                          variant="outline" 
                          size="sm"
                          className="border-primary/30 hover:bg-primary/10"
                        >
                          🔄 Refresh Status
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                        <div>
                          <div className="text-xl sm:text-2xl font-bold text-primary">
                            {exams.filter(exam => 
                              selectedMilestone === "all" || exam.milestone?.toString() === selectedMilestone
                            ).length}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Total Exams</div>
                        </div>
                        <div>
                          <div className="text-xl sm:text-2xl font-bold text-green-600">
                            {exams.filter(exam => 
                              (selectedMilestone === "all" || exam.milestone?.toString() === selectedMilestone) && exam.isCompleted
                            ).length}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Completed</div>
                        </div>
                        <div>
                          <div className="text-xl sm:text-2xl font-bold text-blue-600">
                            {exams.filter(exam => 
                              (selectedMilestone === "all" || exam.milestone?.toString() === selectedMilestone) && !exam.isCompleted
                            ).length}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Available</div>
                        </div>
                        <div>
                          <div className="text-xl sm:text-2xl font-bold text-orange-600">
                            {exams.filter(exam => 
                              (selectedMilestone === "all" || exam.milestone?.toString() === selectedMilestone) && 
                              exam.createdAt && (new Date().getTime() - new Date(exam.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000)
                            ).length}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">New This Week</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Milestone Filter - Mobile Responsive */}
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <span className="font-medium text-primary text-sm sm:text-base">Filter by Milestone:</span>
                        <Select value={selectedMilestone} onValueChange={setSelectedMilestone}>
                          <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Select milestone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Milestones</SelectItem>
                            {Array.from({ length: 8 }, (_, i) => i + 1).map((milestone) => (
                              <SelectItem key={milestone} value={milestone.toString()}>
                                Milestone {milestone}: {getMilestoneTitle(milestone)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {exams.filter(exam => 
                          selectedMilestone === "all" || exam.milestone?.toString() === selectedMilestone
                        ).length} exams
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid gap-4">
                  {exams.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        No Exams Available
                      </h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Exams will appear here when they are posted by your trainers. Keep checking back for new assessments!
                      </p>
                    </div>
                  ) : (
                    <>
                      {exams
                        .filter(exam => 
                          selectedMilestone === "all" || exam.milestone?.toString() === selectedMilestone
                        )
                        .map((exam, index) => (
                        <Card key={exam.id || `exam-${index}`} className={`hover:shadow-xl transition-all duration-300 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 ${
                          exam.isCompleted ? 'ring-2 ring-green-200' : ''
                        }`}>
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-0">
                              {exam.isCompleted && (
                                <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                  </div>
                                </div>
                              )}
                              <div className="space-y-2 sm:space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                  <h3 className="font-semibold text-base sm:text-lg">{exam.title}</h3>
                                  <div className="flex items-center gap-2">
                                    {exam.isCompleted ? (
                                      <>
                                        <Badge variant="default" className={`px-3 py-1 ${
                                          exam.type === 'descriptive' ? 'bg-blue-600' : 'bg-green-600'
                                        }`}>
                                          {exam.type === 'descriptive' ? 'Submitted' : 'Completed'}
                                        </Badge>
                                        {exam.type === 'descriptive' ? (
                                          <div className="flex items-center gap-1 text-blue-600 font-semibold">
                                            <FileText className="w-4 h-4" />
                                            Pending
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1 text-green-600 font-semibold">
                                            <Star className="w-4 h-4" />
                                            {exam.score}%
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <Badge variant="secondary" className="px-3 py-1">
                                        Available
                                      </Badge>
                                    )}
                                    {/* Show "New" badge for exams posted within last 7 days */}
                                    {exam.createdAt && (new Date().getTime() - new Date(exam.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000) && (
                                      <Badge variant="default" className="px-3 py-1 bg-blue-600 animate-pulse">
                                        New
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{exam.description}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                    {exam.timeLimit} minutes
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                    {exam.type.toUpperCase()}
                                  </span>
                                  {exam.milestone && (
                                    <span className="flex items-center gap-1">
                                      <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                                      Milestone {exam.milestone}
                                    </span>
                                  )}
                                  {exam.difficulty && (
                                    <span className="flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                      {exam.difficulty.charAt(0).toUpperCase() + exam.difficulty.slice(1)}
                                    </span>
                                  )}
                                  {exam.passingScore && (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                      Pass: {exam.passingScore}%
                                    </span>
                                  )}
                                  {exam.score && (
                                    <span className="flex items-center gap-1">
                                      <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                                      Score: {exam.score}%
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                    Posted: {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString() : 'Recently'}
                                  </span>
                                  {exam.createdBy && (
                                    <span className="flex items-center gap-1">
                                      <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
                                      By: {exam.createdBy.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {exam.isCompleted ? (
                                <div className="text-center space-y-2 sm:space-y-3">
                                  <div className="text-xl sm:text-2xl font-bold text-primary">
                                    {exam.type === 'descriptive' ? 
                                      (exam.score ? `${exam.score}/${exam.totalMaxMarks || 100}` : '📝') : 
                                      `${exam.score}%`
                                    }
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {exam.type === 'descriptive' ? 
                                      (exam.score ? 'Marks Awarded' : 'Submitted for Evaluation') : 
                                      'Final Score'
                                    }
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {exam.type === 'descriptive' ? 
                                      (exam.score ? '✅ EVALUATED' : '📝 PENDING EVALUATION') : 
                                      (exam.score >= (exam.passingScore || 70) ? '✅ PASSED' : '❌ FAILED')
                                    }
                                  </div>
                                  <div className="text-xs text-red-500">
                                    Cannot Retake
                                  </div>
                                  <Button 
                                    onClick={() => handleExamStart(exam)}
                                    size="sm"
                                    variant="outline"
                                    className="border-primary/30 hover:bg-primary/10 w-full sm:w-auto"
                                  >
                                    {exam.type === 'descriptive' ? 'View Submission' : 'View Results'}
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  onClick={() => handleExamStart(exam)}
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
                                >
                                  Attempt Test
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="curriculum">
                {showVideoContent ? (
                  <div className="space-y-6">
                    {/* Video Player Section */}
                    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Play className="w-5 h-5" />
                          {getMilestoneTitle(currentMilestone)}
                        </CardTitle>
                        <CardDescription>
                          {getMilestoneDescription(currentMilestone)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {currentVideo ? (
                          <div className="space-y-4">
                            {isYouTubeUrl(currentVideo) ? (
                              <YouTubePlayer
                                videoUrl={currentVideo}
                                title={getMilestoneTitle(currentMilestone)}
                                description={getMilestoneDescription(currentMilestone)}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                showControls={true}
                                autoplay={false}
                                muted={false}
                                loop={false}
                              />
                            ) : (
                              <>
                                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                  <video 
                                    className="w-full h-full object-cover"
                                    controls
                                    autoPlay={false}
                                    preload="metadata"
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onLoadStart={() => console.log("Video loading started")}
                                    onCanPlay={() => console.log("Video can play")}
                                    onError={(e) => {
                                      console.log("Video error:", e);
                                      // Fallback to a placeholder video
                                      setCurrentVideo("");
                                    }}
                                  >
                                    <source src={currentVideo} type="video/mp4" />
                                    <source src={`http://localhost:5000${currentVideo}`} type="video/mp4" />
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={handleVideoPlay}
                                    className="flex items-center gap-2"
                                  >
                                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    {isPlaying ? "Pause" : "Play"} Video
                                  </Button>
                                  <Button variant="outline" className="flex items-center gap-2">
                                    <Volume2 className="w-4 h-4" />
                                    Audio Only
                                  </Button>
                                  <Button variant="outline" className="flex items-center gap-2">
                                    <Maximize className="w-4 h-4" />
                                    Fullscreen
                                  </Button>
                                </div>
                              </>
                            )}
                            <div className="p-4 bg-muted/50 rounded-lg">
                              <h4 className="font-semibold mb-2">Lesson Summary:</h4>
                              <p className="text-sm text-muted-foreground">
                                This lesson covers all Telugu vowels including అ, ఆ, ఇ, ఈ, ఉ, ఊ, ఋ, ౠ, ఎ, ఏ, ఐ, ఒ, ఓ, ఔ, అం, and అః. 
                                Practice forward and backward recitation to master pronunciation.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Fallback Video Player */}
                            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg flex items-center justify-center border-2 border-dashed border-primary/30">
                              <div className="text-center">
                                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Play className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{getMilestoneTitle(currentMilestone)}</h3>
                                <p className="text-muted-foreground mb-4">
                                  {getMilestoneDescription(currentMilestone)}
                                </p>
                                <div className="flex gap-2 justify-center">
                                  <Button 
                                    onClick={() => {
                                      // Try to load a sample YouTube video for demonstration
                                      const sampleYouTubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
                                      setCurrentVideo(sampleYouTubeUrl);
                                      toast({
                                        title: "YouTube Video Loading",
                                        description: `Loading sample YouTube video for Milestone ${currentMilestone}`
                                      });
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <Play className="w-4 h-4" />
                                    Load Sample YouTube Video
                                  </Button>
                                  <Button 
                                    onClick={() => {
                                      setCurrentVideo(`/videos/milestone-${currentMilestone}/video-${currentMilestone}.mp4`);
                                      toast({
                                        title: "Video Loading",
                                        description: `Attempting to load direct video for Milestone ${currentMilestone}`
                                      });
                                    }}
                                    className="flex items-center gap-2"
                                    variant="outline"
                                  >
                                    <Play className="w-4 h-4" />
                                    Load Direct Video
                                  </Button>
                                  <Button variant="outline" className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    View Transcript
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg">
                              <h4 className="font-semibold mb-2">Lesson Summary:</h4>
                              <p className="text-sm text-muted-foreground">
                                {getMilestoneDescription(currentMilestone)}
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>



                    {/* Milestone System */}
                    <MilestoneSystem 
                      currentMilestone={currentMilestone}
                      onMilestoneSelect={handleMilestoneSelect}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Ready to Start Learning?</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Begin your Telugu learning journey with structured video lessons and interactive content.
                    </p>
                    <Button onClick={handleStartLearning} className="px-8 py-3">
                      <Play className="w-5 h-5 mr-2" />
                      Start Structured Learning
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="telugu-reading" className="space-y-4">
                <TeluguReading currentMilestone={currentMilestone} />
              </TabsContent>



              <TabsContent value="telugu-dictation" className="space-y-4">
                <TeluguDictation />
              </TabsContent>



              <TabsContent value="telugu-sentence-formation" className="space-y-4">
                <TeluguSentenceFormation />
              </TabsContent>

              <TabsContent value="telugu-spelling" className="space-y-4">
                <TeluguSpelling />
              </TabsContent>

              <TabsContent value="voice-examinations" className="space-y-4">
                {showVoiceExamination && selectedVoiceExamination ? (
                  <VoiceExaminationInterface
                    examination={selectedVoiceExamination}
                    onComplete={handleVoiceExaminationComplete}
                    onBack={handleVoiceExaminationBack}
                  />
                ) : (
                  <div className="space-y-6">
                    {/* Voice Examination Statistics */}
                    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-primary">Voice Examination Progress</h3>
                          <Button 
                            onClick={fetchVoiceExaminations}
                            variant="outline" 
                            size="sm"
                            className="border-primary/30 hover:bg-primary/10"
                          >
                            🔄 Refresh
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-primary">
                              {voiceExaminations.length}
                            </div>
                            <div className="text-sm text-muted-foreground">Available</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {voiceExaminations.filter(exam => exam.isPassed).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Passed</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              {voiceExaminations.filter(exam => exam.submissionStatus === 'not_started').length}
                            </div>
                            <div className="text-sm text-muted-foreground">Not Started</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-orange-600">
                              {voiceExaminations.filter(exam => exam.submissionStatus === 'evaluated' && !exam.isPassed).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Needs Improvement</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Voice Examinations List */}
                    <div className="grid gap-4">
                      {voiceExaminations.length === 0 ? (
                        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                          <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Volume2 className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No Voice Examinations Available</h3>
                            <p className="text-muted-foreground mb-4">
                              Check back later for voice reading examinations from your trainers.
                            </p>
                            <Button onClick={fetchVoiceExaminations} variant="outline">
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Refresh
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        voiceExaminations.map((examination) => (
                          <Card key={examination._id} className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-primary">{examination.title}</h3>
                                    <Badge variant={examination.isPassed ? "default" : examination.submissionStatus === 'evaluated' ? "destructive" : "secondary"}>
                                      {examination.isPassed ? "PASSED" : examination.submissionStatus === 'evaluated' ? "NEEDS IMPROVEMENT" : examination.submissionStatus === 'not_started' ? "NOT STARTED" : examination.submissionStatus.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <p className="text-primary font-medium mb-2">{examination.teluguTitle}</p>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {Math.floor(examination.timeLimit / 60)}:{(examination.timeLimit % 60).toString().padStart(2, '0')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Target className="w-4 h-4" />
                                      {examination.wordCount} words
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Award className="w-4 h-4" />
                                      {examination.maxScore} points
                                    </span>
                                  </div>
                                  {examination.bestScore && (
                                    <div className="text-sm">
                                      <span className="text-muted-foreground">Best Score: </span>
                                      <span className="font-semibold text-primary">{examination.bestScore}%</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    onClick={() => handleVoiceExaminationStart(examination)}
                                    disabled={examination.isPassed}
                                    className="min-w-[120px]"
                                  >
                                    {examination.isPassed ? (
                                      <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Completed
                                      </>
                                    ) : (
                                      <>
                                        <Volume2 className="w-4 h-4 mr-2" />
                                        Start Exam
                                      </>
                                    )}
                                  </Button>
                                  {examination.attemptCount > 0 && (
                                    <Button variant="outline" size="sm" className="min-w-[120px]">
                                      <RefreshCw className="w-4 h-4 mr-2" />
                                      Attempt {examination.attemptCount}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>



            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LearnerDashboard; 
