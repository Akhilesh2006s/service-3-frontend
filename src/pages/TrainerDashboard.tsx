import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, CheckCircle, XCircle, Play, Eye, LogOut, Upload, Video, FileText, ClipboardCheck, BookOpen, Youtube, Type, Volume2, Clock, Target, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { isYouTubeUrl, getYouTubeVideoInfo } from "@/utils/youtubeUtils";
import TeluguStoryManager from "@/components/TeluguStoryManager";
import TeluguUnitManager from "@/components/TeluguUnitManager";
import VoiceExaminationCreator from "@/components/VoiceExaminationCreator";
import DictationExerciseManager from "@/components/DictationExerciseManager";



interface Evaluator {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
}

interface ExamQuestion {
  id: string;
  question: string;
  teluguQuestion: string;
  options: string[];
  correctAnswer: number;
}

interface VideoLecture {
  _id: string;
  title: string;
  description: string;
  milestone: number;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
  status: "draft" | "published";
  createdBy: string;
  isYouTubeVideo: boolean;
  youtubeVideoId?: string;
  embedUrl?: string;
}



const TrainerDashboard = () => {
  // All hooks must be called at the top level, in the same order every time
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();


  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [existingExams, setExistingExams] = useState<any[]>([]);
  const [videoLectures, setVideoLectures] = useState<VideoLecture[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  const [voiceExaminations, setVoiceExaminations] = useState<any[]>([]);
  const [showVoiceExaminationCreator, setShowVoiceExaminationCreator] = useState(false);

  const [newQuestion, setNewQuestion] = useState({
    question: "",
    teluguQuestion: "",
    options: ["", "", "", ""],
    correctAnswer: 0
  });
  const [examDetails, setExamDetails] = useState({
    title: "",
    description: "",
    timeLimit: 30,
    passingScore: 70,
    milestone: 1
  });
  const [examType, setExamType] = useState<"mcq" | "descriptive">("mcq");
  const [descriptiveQuestions, setDescriptiveQuestions] = useState<Array<{
    question: string;
    instructions: string;
    maxPoints: number;
    wordLimit?: number;
  }>>([]);
  const [examDeadlines, setExamDeadlines] = useState({
    openDate: "",
    timeLimit: 60 // Default 60 minutes for descriptive exams
  });
  const [newDescriptiveQuestion, setNewDescriptiveQuestion] = useState({
    question: "",
    instructions: "",
    maxPoints: 10,
    wordLimit: undefined as number | undefined
  });
  const [newVideoLecture, setNewVideoLecture] = useState({
    title: "",
    description: "",
    milestone: 1,
    videoUrl: "",
    thumbnailUrl: ""
  });

  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [showAddEvaluator, setShowAddEvaluator] = useState(false);
  const [newEvaluator, setNewEvaluator] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  // Define functions before useEffect calls
  const loadEvaluators = async () => {
    // Check authentication first
    if (!apiService.isAuthenticated()) {
      console.log('Cannot load evaluators: not authenticated');
      return;
    }

    try {
      const response = await apiService.getEvaluators();
      setEvaluators(response.data);
    } catch (error) {
      console.error('Error loading evaluators:', error);
      // Don't show error toast, just log it
      // This prevents the dashboard from breaking if evaluators fail to load
    }
  };

  const loadStudents = async () => {
    // Check authentication first
    if (!apiService.isAuthenticated()) {
      console.log('Cannot load students: not authenticated');
      return;
    }

    try {
      const response = await apiService.getStudents();
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
      // Don't show error toast, just log it
      // This prevents the dashboard from breaking if students fail to load
    }
  };

  const loadExams = async () => {
    // Check authentication first
    if (!apiService.isAuthenticated()) {
      console.log('Cannot load exams: not authenticated');
      return;
    }

    try {
      console.log('Loading exams...');
      // Use the proper API service instead of hardcoded fetch
      const response = await apiService.getExams();
      console.log('Exams response:', response);
      if (response.success) {
        console.log('Setting exams:', response.data);
        setExistingExams(response.data);
      } else {
        console.log('Exams response not successful:', response);
      }
    } catch (error) {
      console.error('Error loading exams:', error);
      // Don't show error toast, just log it
      // This prevents the dashboard from breaking if exams fail to load
    }
  };

  const fetchVoiceExaminations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/voice-examinations/trainer', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setVoiceExaminations(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching voice examinations:', error);
    }
  };

  const handleVoiceExaminationCreated = (examination: any) => {
    setShowVoiceExaminationCreator(false);
    fetchVoiceExaminations(); // Refresh the list
    toast({
      title: "Voice Examination Created",
      description: "The voice examination has been created successfully!",
    });
  };

  const handleVoiceExaminationCancel = () => {
    setShowVoiceExaminationCreator(false);
  };

  const loadVideoLectures = async () => {
    if (!apiService.isAuthenticated()) {
      console.log('Cannot load video lectures: not authenticated');
      return;
    }

    try {
      setIsLoadingVideos(true);
      console.log('Loading video lectures...');
      const response = await fetch('http://localhost:5000/api/video-lectures', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('Setting video lectures:', result.data);
          setVideoLectures(result.data);
        } else {
          console.error('Failed to load video lectures:', result.message);
        }
      } else {
        console.error('Failed to load video lectures:', response.status);
      }
    } catch (error) {
      console.error('Error loading video lectures:', error);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // Function to restore authentication (for development/testing)


  // Load data on component mount (only if user is a trainer)
  useEffect(() => {
    if (user && user.role === 'trainer') {
      loadEvaluators();
      loadStudents();
      loadExams();
      loadVideoLectures();
    }
  }, [user]);

  // Check authentication on component mount
  useEffect(() => {
    // Wait for authentication to load
    if (isLoading) {
      return;
    }
    
    // Debug authentication state
    console.log('TrainerDashboard - Auth state:', {
      isAuthenticated,
      user: user?.role,
      hasToken: apiService.isAuthenticated(),
      tokenInStorage: localStorage.getItem('telugu-basics-token') ? 'Present' : 'Missing'
    });
    
    // Add a small delay to prevent immediate redirect
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        console.log('TrainerDashboard - User not authenticated, redirecting to login');
        navigate('/login');
        return;
      }
      
      // Check if token exists in localStorage
      if (!apiService.isAuthenticated()) {
        console.log('TrainerDashboard - No token found, logging out');
        logout();
        navigate('/login');
        return;
      }

      // If we're authenticated and have a trainer role, load data
      if (user && user.role === 'trainer') {
        console.log('TrainerDashboard - Loading data after authentication...');
        loadEvaluators();
        loadStudents();
        loadExams();
        loadVideoLectures();
        fetchVoiceExaminations();
      }
    }, 100); // Small delay to prevent race conditions

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, navigate, logout]);

  // Check user role and redirect if not a trainer
  useEffect(() => {
    if (!isLoading && user && user.role !== 'trainer') {
      console.log(`Access denied: User role ${user.role} cannot access trainer dashboard`);
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the Trainer Dashboard.",
        variant: "destructive"
      });
      
      // Redirect to appropriate dashboard based on role
      switch (user.role) {
        case 'evaluator':
          navigate('/evaluator');
          break;
        case 'learner':
          navigate('/learner');
          break;
        default:
          navigate('/');
      }
      return;
    }
  }, [user, isLoading, navigate, toast]);

  // Debug: Log when existingExams changes
  useEffect(() => {
    console.log('TrainerDashboard - existingExams state changed:', {
      length: existingExams.length,
      exams: existingExams.map(e => ({ id: e._id, title: e.title, milestone: e.milestone, published: e.isPublished }))
    });
  }, [existingExams]);

  // Show loading while authentication is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user has trainer role
  if (!user || user.role !== 'trainer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access the Trainer Dashboard.</p>
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





  const addQuestion = () => {
    if (!newQuestion.question || !newQuestion.teluguQuestion || newQuestion.options.some(opt => !opt)) {
      toast({
        title: "Incomplete Question",
        description: "Please fill all fields before adding the question.",
        variant: "destructive"
      });
      return;
    }

    const question: ExamQuestion = {
      id: Date.now().toString(),
      ...newQuestion
    };

    setExamQuestions(prev => [...prev, question]);
    setNewQuestion({
      question: "",
      teluguQuestion: "",
      options: ["", "", "", ""],
      correctAnswer: 0
    });

    toast({
      title: "Question Added",
      description: "Question has been added to the exam."
    });
  };

  const addDescriptiveQuestion = () => {
    if (!newDescriptiveQuestion.question.trim()) {
      toast({
        title: "Missing Question",
        description: "Please fill in the question.",
        variant: "destructive"
      });
      return;
    }

    const question = {
      question: newDescriptiveQuestion.question,
      instructions: newDescriptiveQuestion.instructions,
      maxPoints: newDescriptiveQuestion.maxPoints,
      wordLimit: newDescriptiveQuestion.wordLimit
    };

    setDescriptiveQuestions(prev => [...prev, question]);
    setNewDescriptiveQuestion({
      question: "",
      instructions: "",
      maxPoints: 10,
      wordLimit: undefined
    });

    toast({
      title: "Descriptive Question Added",
      description: "Descriptive question has been added to the exam."
    });
  };

  const createExam = async () => {
    if (!examDetails.title.trim() || !examDetails.description.trim()) {
      toast({
        title: "Missing Exam Details",
        description: "Please fill in the exam title and description.",
        variant: "destructive"
      });
      return;
    }

    if (examType === "mcq" && examQuestions.length === 0) {
      toast({
        title: "No Questions",
        description: "Please add at least one question to create an exam.",
        variant: "destructive"
      });
      return;
    }

    if (examType === "descriptive" && descriptiveQuestions.length === 0) {
      toast({
        title: "No Descriptive Questions",
        description: "Please add at least one descriptive question to create an exam.",
        variant: "destructive"
      });
      return;
    }

    if (examType === "descriptive" && !examDeadlines.openDate) {
      toast({
        title: "Missing Open Date",
        description: "Please set an open date for the descriptive exam.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Creating exam with data:', { examQuestions, examDetails });
      
      // Convert frontend questions to backend format
      const mcqQuestions = examQuestions.map(q => ({
        question: q.question,
        teluguQuestion: q.teluguQuestion,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: `Correct answer: ${q.options[q.correctAnswer]}`,
        points: 1
      }));

      // Convert descriptive questions to backend format
      const descriptiveQuestionsData = descriptiveQuestions.map(q => ({
        question: q.question,
        instructions: q.instructions,
        maxPoints: q.maxPoints,
        wordLimit: q.wordLimit
      }));

      // Create open date and time limit for descriptive exams
      const openDate = examType === "descriptive" && examDeadlines.openDate 
        ? new Date(`${examDeadlines.openDate}T00:00:00`).toISOString() 
        : undefined;
      const descriptiveTimeLimit = examType === "descriptive" ? examDeadlines.timeLimit : undefined;

      const examData = {
        title: examDetails.title || `Telugu Milestone ${examDetails.milestone} Assessment`,
        description: examDetails.description || `${examType === "descriptive" ? "Descriptive" : "Multiple choice"} questions for Milestone ${examDetails.milestone}`,
        type: examType,
        category: 'comprehensive',
        difficulty: 'beginner',
        milestone: examDetails.milestone,
        timeLimit: examDetails.timeLimit,
        passingScore: examDetails.passingScore,
        mcqQuestions: examType === "mcq" ? mcqQuestions : [],
        descriptiveQuestions: examType === "descriptive" ? descriptiveQuestionsData : [],
        openDate: openDate,
        descriptiveTimeLimit: descriptiveTimeLimit,
        isActive: true,
        isPublished: true,
        allowRetakes: true,
        maxAttempts: 3
      };

      console.log('Sending exam data to API:', examData);

      // Use the proper API service instead of hardcoded fetch
      const response = await apiService.createExam(examData);
      const result = response;
      
      // Clear questions and exam details after successful creation
      setExamQuestions([]);
      setDescriptiveQuestions([]);
      setExamDetails({
        title: "",
        description: "",
        timeLimit: 30,
        passingScore: 70,
        milestone: 1
      });
      setExamDeadlines({
        openDate: "",
        timeLimit: 60
      });
      setExamType("mcq");
      
      // Refresh the existing exams list
      await loadExams();
      
      toast({
        title: "Exam Created Successfully",
        description: `Exam "${examData.title}" has been created and published.`
      });

    } catch (error) {
      console.error('Create exam error:', error);
      toast({
        title: "Exam Creation Failed",
        description: "Failed to create exam. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleVideoUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setNewVideoLecture(prev => ({ ...prev, videoUrl: url }));
    if (url) {
      toast({
        title: "Video URL Added",
        description: "Video URL has been set successfully."
      });
    }
  };

  const handleThumbnailUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setNewVideoLecture(prev => ({ ...prev, thumbnailUrl: url }));
    if (url) {
      toast({
        title: "Thumbnail URL Added",
        description: "Thumbnail URL has been set successfully."
      });
    }
  };

  const uploadVideoLecture = async () => {
    if (!newVideoLecture.title || !newVideoLecture.description || !newVideoLecture.videoUrl) {
      toast({
        title: "Incomplete Information",
        description: "Please fill all required fields and provide a video URL.",
        variant: "destructive"
      });
      return;
    }

    if (!apiService.isAuthenticated()) {
      toast({
        title: "Authentication Required",
        description: "Please login again to upload video lectures.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/video-lectures', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newVideoLecture.title,
          description: newVideoLecture.description,
          milestone: newVideoLecture.milestone,
          videoUrl: newVideoLecture.videoUrl,
          thumbnailUrl: newVideoLecture.thumbnailUrl || ""
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Add the new lecture to the list
          setVideoLectures(prev => [...prev, result.data]);
          
          // Reset form
          setNewVideoLecture({
            title: "",
            description: "",
            milestone: 1,
            videoUrl: "",
            thumbnailUrl: ""
          });

          toast({
            title: "Video Lecture Added",
            description: "Video lecture has been added successfully and saved to database."
          });
        } else {
          toast({
            title: "Upload Failed",
            description: result.message || "Failed to add video lecture.",
            variant: "destructive"
          });
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Upload Failed",
          description: errorData.message || "Failed to add video lecture. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error uploading video lecture:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to add video lecture. Please try again.",
        variant: "destructive"
      });
    }
  };

  const publishVideoLecture = async (id: string) => {
    if (!apiService.isAuthenticated()) {
      toast({
        title: "Authentication Required",
        description: "Please login again to publish video lectures.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/video-lectures/${id}/publish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update the lecture in the list
          setVideoLectures(prev => 
            prev.map(lecture => 
              lecture._id === id 
                ? { ...lecture, status: "published" as const }
                : lecture
            )
          );
          toast({
            title: "Lecture Published",
            description: "Video lecture has been published successfully and saved to database."
          });
        } else {
          toast({
            title: "Publish Failed",
            description: result.message || "Failed to publish video lecture.",
            variant: "destructive"
          });
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Publish Failed",
          description: errorData.message || "Failed to publish video lecture.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error publishing video lecture:', error);
      toast({
        title: "Publish Failed",
        description: "Failed to publish video lecture. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out"
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMilestoneTitle = (milestone: number) => {
    const titles = {
      1: "Vowels A to AH",
      2: "Consonants K to RA",
      3: "Special Characters",
      4: "Guninthalu Method 1",
      5: "Guninthalu Method 2",
      6: "Guninthalu Method 3",
      7: "Three Consonant Combinations",
      8: "Two Consonant Combinations",
      9: "Simple Words (50 Words)",
      10: "Four Step Method - Stage One",
      11: "Four Step Method - Stage Two",
      12: "Double Letter Words",
      13: "Compound Letter Words",
      14: "Two Double Letter Words",
      15: "Two Compound Letter Words",
      16: "Complex Combination Words",
      17: "Complete Letter Modification",
      18: "Removing Headmarks",
      19: "Natural Emphasis"
    };
    return titles[milestone as keyof typeof titles] || `Milestone ${milestone}`;
  };

  // Evaluator Management Functions
  const addEvaluator = async () => {
    if (!newEvaluator.name || !newEvaluator.email || !newEvaluator.phone || !newEvaluator.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
              await apiService.addEvaluator(newEvaluator);
      setNewEvaluator({ name: "", email: "", phone: "", password: "" });
      setShowAddEvaluator(false);
      loadEvaluators(); // Reload evaluators

      toast({
        title: "Evaluator Added",
        description: `${newEvaluator.name} has been added as an evaluator.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add evaluator",
        variant: "destructive"
      });
    }
  };

    const removeEvaluator = async (id: string) => {
    // Check authentication first
    if (!apiService.isAuthenticated()) {
      toast({
        title: "Authentication Required",
        description: "Please restore authentication or re-login to remove evaluators.",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiService.removeEvaluator(id);
      loadEvaluators(); // Reload evaluators

      toast({
        title: "Evaluator Removed",
        description: "Evaluator has been removed successfully."
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove evaluator";
      
      // Check if it's an authentication error
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Access denied')) {
        toast({
          title: "Authentication Failed",
          description: "Your session has expired. Please restore authentication or re-login.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

  const toggleEvaluatorStatus = async (id: string) => {
    const evaluator = evaluators.find(e => e._id === id);
    if (!evaluator) return;

    try {
              await apiService.updateEvaluatorStatus(id, !evaluator.isActive);
      loadEvaluators(); // Reload evaluators

      toast({
        title: "Status Updated",
        description: `Evaluator ${!evaluator.isActive ? 'activated' : 'deactivated'} successfully.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update evaluator status",
        variant: "destructive"
      });
    }
  };

  // Student Management Functions
  const addStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.phone || !newStudent.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiService.addStudent(newStudent);
      setNewStudent({ name: "", email: "", phone: "", password: "" });
      setShowAddStudent(false);
      loadStudents(); // Reload students

      toast({
        title: "Student Added",
        description: `${newStudent.name} has been added as a student.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add student",
        variant: "destructive"
      });
    }
  };

  const removeStudent = async (id: string) => {
    // Check authentication first
    if (!apiService.isAuthenticated()) {
      toast({
        title: "Authentication Required",
        description: "Please restore authentication or re-login to remove students.",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiService.removeStudent(id);
      loadStudents(); // Reload students

      toast({
        title: "Student Removed",
        description: "Student has been removed successfully."
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove student";
      
      // Check if it's an authentication error
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Access denied')) {
        toast({
          title: "Authentication Failed",
          description: "Your session has expired. Please restore authentication or re-login.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

  const toggleStudentStatus = async (id: string) => {
    const student = students.find(s => s._id === id);
    if (!student) return;

    try {
      await apiService.updateStudentStatus(id, !student.isActive);
      loadStudents(); // Reload students

      toast({
        title: "Status Updated",
        description: `Student ${!student.isActive ? 'activated' : 'deactivated'} successfully.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update student status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug button removed for live deployment */}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trainer Dashboard</h1>
              <p className="text-gray-600">Manage students, create content, and oversee learning activities.</p>
            </div>
            <div className="flex items-center gap-4">

              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="video-upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="video-upload" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Upload Videos
          </TabsTrigger>
          <TabsTrigger value="create-exam" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Create Exam
          </TabsTrigger>

                  <TabsTrigger value="telugu-stories" className="flex items-center gap-2">
          <Type className="w-4 h-4" />
          Telugu Stories
        </TabsTrigger>
        <TabsTrigger value="telugu-units" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Telugu Units
        </TabsTrigger>
                  <TabsTrigger value="voice-examinations" className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Voice Examinations
          </TabsTrigger>
          <TabsTrigger value="dictation-exercises" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Dictation Exercises
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="evaluators" className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            Evaluators
          </TabsTrigger>
        </TabsList>

        <TabsContent value="video-upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Video Lecture
              </CardTitle>
              <CardDescription>
                Add video lecture URLs for each milestone with title, description, and milestone tag
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Video Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Vowels A to AH - Complete Guide"
                    value={newVideoLecture.title}
                    onChange={(e) => setNewVideoLecture(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="milestone">Milestone</Label>
                  <Select 
                    value={newVideoLecture.milestone.toString()} 
                    onValueChange={(value) => setNewVideoLecture(prev => ({ ...prev, milestone: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select milestone" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 19 }, (_, i) => i + 1).map((milestone) => (
                        <SelectItem key={milestone} value={milestone.toString()}>
                          Milestone {milestone}: {getMilestoneTitle(milestone)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the video content, learning objectives, and key points covered..."
                  value={newVideoLecture.description}
                  onChange={(e) => setNewVideoLecture(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="video">Video URL (YouTube or Direct Video)</Label>
                  <Input
                    id="video"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://example.com/video.mp4"
                    value={newVideoLecture.videoUrl}
                    onChange={handleVideoUrlChange}
                  />
                  {newVideoLecture.videoUrl && (
                    <div className="flex items-center gap-2">
                      {isYouTubeUrl(newVideoLecture.videoUrl) ? (
                        <>
                          <Youtube className="w-4 h-4 text-red-500" />
                          <p className="text-sm text-green-600">
                            ✅ Valid YouTube URL - Will be embedded in the website
                          </p>
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 text-blue-500" />
                          <p className="text-sm text-blue-600">
                            📹 Direct video URL - Will be played directly
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail URL (Optional)</Label>
                  <Input
                    id="thumbnail"
                    type="url"
                    placeholder="https://example.com/thumbnail.jpg"
                    value={newVideoLecture.thumbnailUrl}
                    onChange={handleThumbnailUrlChange}
                  />
                  {newVideoLecture.thumbnailUrl && (
                    <p className="text-sm text-muted-foreground">
                      Thumbnail URL set successfully
                    </p>
                  )}
                </div>
              </div>

              <Button onClick={uploadVideoLecture} className="w-full" disabled={!newVideoLecture.videoUrl}>
                <Upload className="w-4 h-4 mr-2" />
                Add Video Lecture
              </Button>
            </CardContent>
          </Card>

          {/* Video Lectures List */}
          {videoLectures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Video Lectures</CardTitle>
                <CardDescription>
                  Manage your uploaded video lectures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {videoLectures.map((lecture) => (
                    <div key={lecture._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{lecture.title}</h3>
                            <Badge variant={lecture.status === "published" ? "default" : "secondary"}>
                              {lecture.status}
                            </Badge>
                            <Badge variant="outline">
                              Milestone {lecture.milestone}
                            </Badge>
                            {lecture.isYouTubeVideo && (
                              <Badge variant="outline" className="text-red-600 border-red-300">
                                <Youtube className="w-3 h-3 mr-1" />
                                YouTube
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{lecture.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Created: {new Date(lecture.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {lecture.status === "draft" && (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => publishVideoLecture(lecture._id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>



        <TabsContent value="create-exam" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Exam</CardTitle>
              <CardDescription>
                {examType === "descriptive" 
                  ? "Design descriptive questions for PDF submission assessment"
                  : "Design MCQ questions for student assessment"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Exam Details Form */}
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exam-title">Exam Title</Label>
                    <Input
                      id="exam-title"
                      placeholder="Enter exam title"
                      value={examDetails.title}
                      onChange={(e) => setExamDetails(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exam-description">Description</Label>
                    <Input
                      id="exam-description"
                      placeholder="Enter exam description"
                      value={examDetails.description}
                      onChange={(e) => setExamDetails(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                    <Input
                      id="time-limit"
                      type="number"
                      min="5"
                      max="120"
                      placeholder="30"
                      value={examDetails.timeLimit}
                      onChange={(e) => setExamDetails(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passing-score">Passing Score (%)</Label>
                    <Input
                      id="passing-score"
                      type="number"
                      min="50"
                      max="100"
                      placeholder="70"
                      value={examDetails.passingScore}
                      onChange={(e) => setExamDetails(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="milestone">Milestone</Label>
                    <Select 
                      value={examDetails.milestone.toString()} 
                      onValueChange={(value) => setExamDetails(prev => ({ ...prev, milestone: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select milestone" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 19 }, (_, i) => i + 1).map((milestone) => (
                          <SelectItem key={milestone} value={milestone.toString()}>
                            Milestone {milestone}: {getMilestoneTitle(milestone)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exam-type">Exam Type</Label>
                    <Select 
                      value={examType} 
                      onValueChange={(value) => setExamType(value as "mcq" | "descriptive")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select exam type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                        <SelectItem value="descriptive">Descriptive (PDF Submission)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Descriptive Exam Schedule Fields */}
                {examType === "descriptive" && (
                  <div className="grid gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900">📅 Exam Schedule</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="open-date">Open Date</Label>
                        <Input
                          id="open-date"
                          type="date"
                          value={examDeadlines.openDate}
                          onChange={(e) => setExamDeadlines(prev => ({ ...prev, openDate: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="descriptive-time-limit">Time Limit (minutes)</Label>
                        <Input
                          id="descriptive-time-limit"
                          type="number"
                          min="15"
                          max="480"
                          placeholder="60"
                          value={examDeadlines.timeLimit}
                          onChange={(e) => setExamDeadlines(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 60 }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* MCQ Question Form */}
              {examType === "mcq" && (
                <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Question (English)</Label>
                    <Textarea
                      id="question"
                      placeholder="Enter your question in English"
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telugu-question">Question (Telugu)</Label>
                    <Textarea
                      id="telugu-question"
                      placeholder="తెలుగులో మీ ప్రశ్న రాయండి"
                      value={newQuestion.teluguQuestion}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, teluguQuestion: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Answer Options</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="space-y-1">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options];
                            newOptions[index] = e.target.value;
                            setNewQuestion(prev => ({ ...prev, options: newOptions }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Select 
                    value={newQuestion.correctAnswer.toString()} 
                    onValueChange={(value) => setNewQuestion(prev => ({ ...prev, correctAnswer: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {newQuestion.options.map((option, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          Option {index + 1}: {option || `Option ${index + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={addQuestion} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
              )}

              {/* Descriptive Question Form */}
              {examType === "descriptive" && (
                <div className="grid gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900">📝 Descriptive Question</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="descriptive-question">Question</Label>
                      <Textarea
                        id="descriptive-question"
                        placeholder="Enter your descriptive question..."
                        value={newDescriptiveQuestion.question}
                        onChange={(e) => setNewDescriptiveQuestion(prev => ({ ...prev, question: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descriptive-instructions">Instructions</Label>
                      <Textarea
                        id="descriptive-instructions"
                        placeholder="Provide instructions for students (optional)..."
                        value={newDescriptiveQuestion.instructions}
                        onChange={(e) => setNewDescriptiveQuestion(prev => ({ ...prev, instructions: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="max-points">Maximum Points</Label>
                        <Input
                          id="max-points"
                          type="number"
                          min="1"
                          max="100"
                          placeholder="10"
                          value={newDescriptiveQuestion.maxPoints}
                          onChange={(e) => setNewDescriptiveQuestion(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 10 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="word-limit">Word Limit (optional)</Label>
                        <Input
                          id="word-limit"
                          type="number"
                          min="50"
                          placeholder="500"
                          value={newDescriptiveQuestion.wordLimit || ''}
                          onChange={(e) => setNewDescriptiveQuestion(prev => ({ ...prev, wordLimit: e.target.value ? parseInt(e.target.value) : undefined }))}
                        />
                      </div>
                    </div>
                    <Button onClick={addDescriptiveQuestion} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Descriptive Question
                    </Button>
                  </div>
                </div>
              )}

              {/* Questions Preview */}
              {examType === "mcq" && examQuestions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">MCQ Questions ({examQuestions.length})</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {examQuestions.map((q, index) => (
                      <div key={q.id} className="border rounded-lg p-3">
                        <div className="space-y-2">
                          <h4 className="font-medium">Q{index + 1}: {q.question}</h4>
                          <p className="text-sm text-primary">{q.teluguQuestion}</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {q.options.map((option, optIndex) => (
                              <div 
                                key={optIndex} 
                                className={`p-2 rounded ${optIndex === q.correctAnswer ? 'bg-green-100 border border-green-300' : 'bg-gray-50'}`}
                              >
                                {optIndex + 1}. {option}
                                {optIndex === q.correctAnswer && " ✓"}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button onClick={createExam} className="w-full" variant="default">
                    Create MCQ Exam for Milestone {examDetails.milestone} with {examQuestions.length} Questions
                  </Button>
                </div>
              )}

              {/* Descriptive Questions Preview */}
              {examType === "descriptive" && descriptiveQuestions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Descriptive Questions ({descriptiveQuestions.length})</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {descriptiveQuestions.map((q, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-green-50">
                        <div className="space-y-2">
                          <h4 className="font-medium">Q{index + 1}: {q.question}</h4>
                          {q.instructions && (
                            <p className="text-sm text-gray-600">📋 {q.instructions}</p>
                          )}
                          <div className="flex gap-2 text-sm">
                            <Badge variant="outline">{q.maxPoints} points</Badge>
                            {q.wordLimit && (
                              <Badge variant="outline">{q.wordLimit} words max</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button onClick={createExam} className="w-full" variant="default">
                    Create Descriptive Exam for Milestone {examDetails.milestone} with {descriptiveQuestions.length} Questions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing Exams Display */}
          {existingExams.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Your Created Exams</CardTitle>
                <CardDescription>
                  Manage and monitor your existing exams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {existingExams.map((exam) => (
                    <div key={exam._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{exam.title}</h3>
                            <Badge variant={exam.isPublished ? "default" : "secondary"}>
                              {exam.isPublished ? "Published" : "Draft"}
                            </Badge>
                            <Badge variant="outline">
                              Milestone {exam.milestone}
                            </Badge>
                            <Badge variant="outline">
                              {(exam.mcqQuestions?.length || 0) + (exam.descriptiveQuestions?.length || 0) + (exam.voiceQuestions?.length || 0)} Questions
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{exam.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Time Limit: {exam.timeLimit} min</span>
                            <span>Passing Score: {exam.passingScore}%</span>
                            <span>Created: {new Date(exam.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // TODO: Implement edit functionality
                              toast({
                                title: "Edit Feature",
                                description: "Edit functionality will be implemented soon.",
                                variant: "default"
                              });
                            }}
                          >
                            <Eye className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button 
                            variant={exam.isPublished ? "secondary" : "default"} 
                            size="sm"
                            onClick={async () => {
                              try {
                                // Check authentication first
                                if (!apiService.isAuthenticated()) {
                                  toast({
                                    title: "Authentication Required",
                                    description: "Please restore authentication or re-login to manage exams.",
                                    variant: "destructive"
                                  });
                                  return;
                                }

                                await apiService.publishExam(exam._id);
                                await loadExams(); // Refresh the list
                                toast({
                                  title: "Exam Status Updated",
                                  description: `Exam ${exam.isPublished ? 'unpublished' : 'published'} successfully.`
                                });
                              } catch (error) {
                                console.error('Error updating exam status:', error);
                                toast({
                                  title: "Error",
                                  description: "Failed to update exam status.",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            {exam.isPublished ? "Unpublish" : "Publish"}
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
                                try {
                                  // Check authentication first
                                  if (!apiService.isAuthenticated()) {
                                    toast({
                                      title: "Authentication Required",
                                      description: "Please restore authentication or re-login to manage exams.",
                                      variant: "destructive"
                                    });
                                    return;
                                  }

                                  await apiService.deleteExam(exam._id);
                                  await loadExams(); // Refresh the list
                                  toast({
                                    title: "Exam Deleted",
                                    description: "Exam has been deleted successfully."
                                  });
                                } catch (error) {
                                  console.error('Error deleting exam:', error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to delete exam.",
                                    variant: "destructive"
                                  });
                                }
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Exams Created Yet</CardTitle>
                <CardDescription>
                  Create your first exam to get started. Exams you create will appear here for management.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Start Creating Exams</h3>
                  <p className="text-muted-foreground mb-4">
                    Use the form above to create your first exam with MCQ questions.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>



              <TabsContent value="telugu-stories" className="space-y-4">
        <TeluguStoryManager currentMilestone={1} />
      </TabsContent>
      <TabsContent value="telugu-units" className="space-y-4">
        <TeluguUnitManager currentMilestone={1} />
      </TabsContent>

      <TabsContent value="voice-examinations" className="space-y-4">
        {showVoiceExaminationCreator ? (
          <VoiceExaminationCreator
            onCreated={handleVoiceExaminationCreated}
            onCancel={handleVoiceExaminationCancel}
          />
        ) : (
          <div className="space-y-6">
            {/* Voice Examination Statistics */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-primary">Voice Examination Overview</h3>
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
                    <div className="text-sm text-muted-foreground">Total Created</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {voiceExaminations.filter(exam => exam.isPublished).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Published</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {voiceExaminations.filter(exam => !exam.isPublished).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Drafts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {voiceExaminations.filter(exam => exam.stats?.totalSubmissions > 0).length}
                    </div>
                    <div className="text-sm text-muted-foreground">With Submissions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Create New Voice Examination Button */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Voice Examination</h3>
                <p className="text-muted-foreground mb-4">
                  Create a new voice examination for students to practice reading and pronunciation
                </p>
                <Button onClick={() => setShowVoiceExaminationCreator(true)} className="px-8">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Examination
                </Button>
              </CardContent>
            </Card>

            {/* Voice Examinations List */}
            {voiceExaminations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Your Voice Examinations</h3>
                <div className="grid gap-4">
                  {voiceExaminations.map((examination) => (
                    <Card key={examination._id} className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-primary">{examination.title}</h3>
                              <Badge variant={examination.isPublished ? "default" : "secondary"}>
                                {examination.isPublished ? "PUBLISHED" : "DRAFT"}
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
                            {examination.stats && (
                              <div className="text-sm text-muted-foreground">
                                <span>Submissions: {examination.stats.totalSubmissions} | </span>
                                <span>Average Score: {examination.stats.averageScore}% | </span>
                                <span>Pass Rate: {examination.stats.passRate}%</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => {
                                // TODO: Add edit functionality
                                toast({
                                  title: "Edit Feature",
                                  description: "Edit functionality will be added soon!",
                                });
                              }}
                              variant="outline"
                              size="sm"
                              className="min-w-[100px]"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            <Button
                              onClick={async () => {
                                try {
                                  const response = await fetch(`http://localhost:5000/api/voice-examinations/trainer/${examination._id}/publish`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                      isPublished: !examination.isPublished
                                    })
                                  });

                                  if (response.ok) {
                                    fetchVoiceExaminations();
                                    toast({
                                      title: examination.isPublished ? "Unpublished" : "Published",
                                      description: `Voice examination has been ${examination.isPublished ? 'unpublished' : 'published'} successfully.`,
                                    });
                                  }
                                } catch (error) {
                                  console.error('Error publishing examination:', error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to update examination status.",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              variant={examination.isPublished ? "destructive" : "default"}
                              size="sm"
                              className="min-w-[100px]"
                            >
                              {examination.isPublished ? "Unpublish" : "Publish"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="dictation-exercises" className="space-y-4">
        <DictationExerciseManager />
      </TabsContent>

        <TabsContent value="students" className="space-y-4">
          {/* Authentication Error Alert */}
          {!apiService.isAuthenticated() && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800">Authentication Required</h3>
                    <p className="text-sm text-red-700">You need to be authenticated to manage students. Please re-login.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled
                    className="border-red-200 text-red-700 hover:bg-red-100"
                  >
                    Disabled
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Manage Students
              </CardTitle>
              <CardDescription>
                Add and manage students who will learn Telugu
              </CardDescription>
            </CardHeader>
            <CardContent>
              
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Student Management
              </CardTitle>
              <CardDescription>
                Add and manage students who will learn Telugu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Student Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Add New Student</h3>
                  <Button 
                    onClick={() => setShowAddStudent(!showAddStudent)}
                    variant={showAddStudent ? "outline" : "default"}
                  >
                    {showAddStudent ? "Cancel" : "Add Student"}
                  </Button>
                </div>

                {showAddStudent && (
                  <Card className="border-2 border-dashed">
                    <CardContent className="pt-6">
                      <form onSubmit={(e) => { e.preventDefault(); addStudent(); }} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="student-name">Full Name *</Label>
                            <Input
                              id="student-name"
                              placeholder="Enter student's full name"
                              value={newStudent.name}
                              onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="student-email">Email Address *</Label>
                            <Input
                              id="student-email"
                              type="email"
                              placeholder="Enter student's email"
                              value={newStudent.email}
                              onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="student-phone">Phone Number *</Label>
                            <Input
                              id="student-phone"
                              type="tel"
                              placeholder="Enter student's phone number"
                              value={newStudent.phone}
                              onChange={(e) => setNewStudent(prev => ({ ...prev, phone: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="student-password">Password *</Label>
                            <Input
                              id="student-password"
                              type="password"
                              placeholder="Set initial password"
                              value={newStudent.password}
                              onChange={(e) => setNewStudent(prev => ({ ...prev, password: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full">
                          Add Student
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Students List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Current Students</h3>
                {students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No students added yet</p>
                    <p className="text-sm">Add students to start their Telugu learning journey</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {students.map((student) => (
                      <Card key={student._id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div>
                                  <h4 className="font-semibold">{student.name}</h4>
                                  <p className="text-sm text-muted-foreground">{student.email}</p>
                                  <p className="text-sm text-muted-foreground">{student.phone}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant={student.isActive ? "default" : "secondary"}>
                                    {student.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                Added on {new Date(student.createdAt).toLocaleDateString()}
                              </p>
                              

                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleStudentStatus(student._id)}
                              >
                                {student.isActive ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeStudent(student._id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluators" className="space-y-4">
          {/* Authentication Error Alert */}
          {!apiService.isAuthenticated() && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800">Authentication Required</h3>
                    <p className="text-sm text-red-700">You need to be authenticated to manage evaluators. Please re-login.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled
                    className="border-red-200 text-red-700 hover:bg-red-100"
                  >
                    Disabled
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Manage Evaluators
              </CardTitle>
              <CardDescription>
                Add and manage evaluators who will review student submissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Evaluator Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Add New Evaluator</h3>
                  <Button 
                    onClick={() => setShowAddEvaluator(!showAddEvaluator)}
                    variant={showAddEvaluator ? "outline" : "default"}
                  >
                    {showAddEvaluator ? "Cancel" : "Add Evaluator"}
                  </Button>
                </div>

                {showAddEvaluator && (
                  <Card className="border-2 border-dashed">
                    <CardContent className="pt-6">
                      <form onSubmit={(e) => { e.preventDefault(); addEvaluator(); }} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="evaluator-name">Full Name *</Label>
                            <Input
                              id="evaluator-name"
                              placeholder="Enter evaluator's full name"
                              value={newEvaluator.name}
                              onChange={(e) => setNewEvaluator(prev => ({ ...prev, name: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="evaluator-email">Email Address *</Label>
                            <Input
                              id="evaluator-email"
                              type="email"
                              placeholder="Enter evaluator's email"
                              value={newEvaluator.email}
                              onChange={(e) => setNewEvaluator(prev => ({ ...prev, email: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="evaluator-phone">Phone Number *</Label>
                            <Input
                              id="evaluator-phone"
                              type="tel"
                              placeholder="Enter evaluator's phone number"
                              value={newEvaluator.phone}
                              onChange={(e) => setNewEvaluator(prev => ({ ...prev, phone: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="evaluator-password">Password *</Label>
                            <Input
                              id="evaluator-password"
                              type="password"
                              placeholder="Set initial password"
                              value={newEvaluator.password}
                              onChange={(e) => setNewEvaluator(prev => ({ ...prev, password: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full">
                          Add Evaluator
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Evaluators List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Current Evaluators</h3>
                {evaluators.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No evaluators added yet</p>
                    <p className="text-sm">Add evaluators to start reviewing student submissions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {evaluators.map((evaluator) => (
                      <Card key={evaluator._id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div>
                                  <h4 className="font-semibold">{evaluator.name}</h4>
                                  <p className="text-sm text-muted-foreground">{evaluator.email}</p>
                                  <p className="text-sm text-muted-foreground">{evaluator.phone}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant={evaluator.isActive ? "default" : "secondary"}>
                                    {evaluator.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                Added on {new Date(evaluator.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleEvaluatorStatus(evaluator._id)}
                              >
                                {evaluator.isActive ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeEvaluator(evaluator._id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>
  );
};

export default TrainerDashboard;
