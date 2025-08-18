import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  ClipboardList, 
  CheckCircle, 
  XCircle, 
  Play, 
  Eye, 
  Download,
  BarChart3,
  FileText,
  Star,
  AlertCircle,
  TrendingUp,
  Award,
  Filter,
  LogOut,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Volume2,
  Trash2,
  Grid3X3,
  PieChart,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DescriptiveEvaluationInterface from "@/components/DescriptiveEvaluationInterface";

interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  activityTitle?: string;
  examTitle?: string;
  examType?: string;
  submissionType: "voice" | "mcq" | "mixed" | "descriptive";
  status: "pending" | "evaluated" | "approved" | "rejected";
  submittedAt: Date;
  recordingDuration?: number;
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  pronunciationScore?: number;
  clarityScore?: number;
  toneScore?: number;
  contentScore?: number;
  grammarScore?: number;
  structureScore?: number;
  feedback?: string;
  tags?: string[];
  milestone?: number;
  examId?: string;
  activityId?: string;
  stepTitle?: string;
  lessonId?: string;
  lessonTitle?: string;

  wordPuzzle?: {
    correctSelections: string[];
    incorrectSelections: string[];
    missedSelections: string[];
    score: number;
    passed: boolean;
    totalGreenBoxes: number;
    selectedCount: number;
    submittedAt: Date;
  };
  descriptiveAnswers?: Array<{
    questionIndex: number;
    pdfUrl: string;
    fileName: string;
    fileSize: number;
    submittedAt: Date;
    question?: string;
    textAnswer?: string;
  }>;
  examMaxMarks?: number;
  examQuestions?: Array<{
    _id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    questionType: "mcq" | "descriptive";
  }>;
}

interface EvaluationReport {
  id: string;
  studentName: string;
  totalSubmissions: number;
  averageScore: number;
  improvementTrend: "positive" | "negative" | "stable";
  strengths: string[];
  areasForImprovement: string[];
  lastEvaluation: Date;
}

const EvaluatorDashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [evaluationReports, setEvaluationReports] = useState<EvaluationReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("students");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [submissionFilter, setSubmissionFilter] = useState<"all" | "mcq" | "descriptive">("all");

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showDescriptiveEvaluation, setShowDescriptiveEvaluation] = useState(false);
  const [evaluationForm, setEvaluationForm] = useState({
    pronunciationScore: 0,
    clarityScore: 0,
    toneScore: 0,
    contentScore: 0,
    grammarScore: 0,
    structureScore: 0,
    overallScore: 0,
    feedback: "",
    tags: [] as string[],
    suggestions: [] as string[],
    status: "pending" as "pending" | "approved" | "rejected"
  });

  // Fetch submissions from API
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching submissions...');
      
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/submissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        }
      });

      console.log('📡 Submissions response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('📋 Raw submissions data:', result.data);
        console.log('📋 Raw submissions count:', result.data?.length || 0);
        console.log('📋 Raw submissions response:', result);
        
        // Transform API data to match our interface
        const transformedSubmissions = result.data.map((submission: any) => ({
          id: submission._id,
          studentName: submission.student?.name || submission.studentName || 'Unknown Student',
          studentId: submission.student?._id || submission.studentId || 'Unknown',
          activityTitle: submission.activity?.title,
          examTitle: submission.exam?.title,
          examType: submission.exam?.type,
          submissionType: submission.submissionType,
          status: submission.status,
          submittedAt: new Date(submission.submittedAt),
  
          score: submission.score,
          totalQuestions: submission.totalQuestions,
          correctAnswers: submission.correctAnswers,
          pronunciationScore: submission.pronunciationScore || submission.evaluation?.scores?.pronunciation,
          clarityScore: submission.clarityScore || submission.evaluation?.scores?.clarity,
          toneScore: submission.toneScore || submission.evaluation?.scores?.tone,
          feedback: submission.feedback || submission.evaluation?.feedback,
          tags: submission.tags || submission.evaluation?.errorTags || [],
          milestone: submission.milestone || submission.exam?.milestone || submission.activity?.milestone,
          examId: submission.exam?._id,
          activityId: submission.activity?._id,
          stepTitle: submission.stepTitle,
          lessonId: submission.lessonId,
          lessonTitle: submission.lessonTitle,
  
          descriptiveAnswers: submission.descriptiveAnswers || [],
          examQuestions: submission.exam?.descriptiveQuestions || [],
          examMaxMarks: submission.exam?.totalMaxMarks || 100
        }));
        
        console.log('📋 Transformed submissions:', transformedSubmissions);
        


        // Debug: Log submission types breakdown
        const typeBreakdown = transformedSubmissions.reduce((acc: any, sub: any) => {
          acc[sub.submissionType] = (acc[sub.submissionType] || 0) + 1;
          return acc;
        }, {});
        console.log('📊 Submission types breakdown:', typeBreakdown);
        console.log('📊 Total submissions fetched:', transformedSubmissions.length);
        
        // Debug: Check if there are more than 10 submissions
        if (transformedSubmissions.length > 10) {
          console.log('📊 Found more than 10 submissions!');
          console.log('📊 All submission IDs:', transformedSubmissions.map(s => s.id));
        } else {
          console.log('⚠️ Only found', transformedSubmissions.length, 'submissions');
        }
        
        setSubmissions(transformedSubmissions);
      } else {
        console.error('❌ Failed to fetch submissions:', response.status);
        const errorText = await response.text();
        console.error('❌ Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch submissions on component mount
  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleEvaluateSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    
    if (submission.submissionType === "descriptive") {
      setShowDescriptiveEvaluation(true);
    } else {
      setShowDescriptiveEvaluation(false);
      setEvaluationForm({
        pronunciationScore: submission.pronunciationScore || 0,
        clarityScore: submission.clarityScore || 0,
        toneScore: submission.toneScore || 0,
        contentScore: submission.contentScore || 0,
        grammarScore: submission.grammarScore || 0,
        structureScore: submission.structureScore || 0,
        overallScore: submission.score || 0,
        feedback: submission.feedback || "",
        tags: submission.tags || [],
        suggestions: [],
        status: submission.status
      });
    }
  };

  const handleSaveEvaluation = async () => {
    if (!selectedSubmission) return;

    try {
      console.log('🔍 Starting regular evaluation...');
      
      // Calculate overall score
      const overallScore = Math.round(
        (evaluationForm.pronunciationScore + evaluationForm.clarityScore + evaluationForm.toneScore) / 3
      );

      console.log('📋 Evaluation data:', {
        pronunciationScore: evaluationForm.pronunciationScore,
        clarityScore: evaluationForm.clarityScore,
        toneScore: evaluationForm.toneScore,
        overallScore: overallScore,
        feedback: evaluationForm.feedback,
        tags: evaluationForm.tags,
        status: evaluationForm.status
      });

      // Send evaluation to backend
      const response = await fetch(`https://service-3-backend-production.up.railway.app/api/submissions/${selectedSubmission.id}/evaluate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pronunciationScore: evaluationForm.pronunciationScore,
          clarityScore: evaluationForm.clarityScore,
          toneScore: evaluationForm.toneScore,
          overallScore: overallScore,
          feedback: evaluationForm.feedback,
          tags: evaluationForm.tags,
          status: evaluationForm.status
        })
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ API Response data:', result);

      // IMMEDIATELY update local state with the saved evaluation
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === selectedSubmission.id 
            ? { 
                ...sub, 
                status: evaluationForm.status,
                pronunciationScore: evaluationForm.pronunciationScore,
                clarityScore: evaluationForm.clarityScore,
                toneScore: evaluationForm.toneScore,
                score: overallScore,
                feedback: evaluationForm.feedback,
                tags: evaluationForm.tags
              }
            : sub
        )
      );

      toast({
        title: "Evaluation Saved",
        description: `Evaluation for ${selectedSubmission.studentName} has been saved successfully. Marks: ${overallScore}`,
      });

      setSelectedSubmission(null);
      setEvaluationForm({
        pronunciationScore: 0,
        clarityScore: 0,
        toneScore: 0,
        overallScore: 0,
        feedback: "",
        tags: [],
        status: "pending"
      });

      // Force refresh submissions after a short delay
      console.log('🔄 Refreshing submissions...');
      setTimeout(() => {
        fetchSubmissions();
      }, 500);

    } catch (error) {
      console.error('❌ Error saving evaluation:', error);
      toast({
        title: "Evaluation Failed",
        description: error.message || "Failed to save evaluation. Please try again.",
        variant: "destructive"
      });
    }
  };



  const handleDescriptiveEvaluation = async (evaluation: any) => {
    if (!selectedSubmission) return;

    try {
      console.log('🔍 Starting descriptive evaluation...');
      console.log('📋 Evaluation data:', evaluation);
      console.log('📋 Selected submission:', selectedSubmission);
      console.log('📋 Descriptive answers:', selectedSubmission.descriptiveAnswers);

      // Send evaluation to backend
      const response = await fetch(`https://service-3-backend-production.up.railway.app/api/submissions/${selectedSubmission.id}/evaluate-descriptive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          overallScore: evaluation.overallScore,
          feedback: evaluation.feedback
        })
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ API Response data:', result);

      // IMMEDIATELY update local state with the saved evaluation
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === selectedSubmission.id 
            ? { 
                ...sub, 
                status: "evaluated",
                score: evaluation.overallScore,
                feedback: evaluation.feedback,
                evaluation: {
                  evaluatedBy: result.data?.evaluation?.evaluatedBy || 'evaluator',
                  evaluatedAt: new Date(),
                  overallScore: evaluation.overallScore,
                  feedback: evaluation.feedback
                }
              }
            : sub
        )
      );

      toast({
        title: "Descriptive Evaluation Saved",
        description: `Evaluation for ${selectedSubmission.studentName} has been saved successfully. Marks: ${evaluation.overallScore}`,
      });

      setSelectedSubmission(null);
      setShowDescriptiveEvaluation(false);

      // Force refresh submissions after a short delay
      console.log('🔄 Refreshing submissions...');
      setTimeout(() => {
        fetchSubmissions();
      }, 500);

    } catch (error) {
      console.error('❌ Error submitting evaluation:', error);
      toast({
        title: "Evaluation Failed",
        description: error.message || "Failed to save evaluation. Please try again.",
        variant: "destructive"
      });
    }
  };





  const handleGenerateReport = (studentId: string) => {
    toast({
      title: "Report Generated",
      description: "Student evaluation report has been generated and is ready for download."
    });
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    try {
      console.log('🗑️ Deleting submission:', submissionId);
      
      const response = await fetch(`https://service-3-backend-production.up.railway.app/api/submissions/${submissionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error deleting submission:', errorText);
        throw new Error(`Failed to delete submission: ${response.status}`);
      }

      // Remove from local state
      setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
      
      toast({
        title: "Submission Deleted",
        description: "The evaluated submission has been successfully deleted.",
      });

      console.log('✅ Submission deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting submission:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete submission. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "evaluated": return "bg-blue-100 text-blue-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "positive":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "negative":
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-500" />;
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

  // Helper function to get unique students from submissions
  const getUniqueStudents = () => {
    const studentMap = new Map<string, { name: string; id: string; submissions: Submission[] }>();
    
    submissions.forEach(submission => {
      if (!studentMap.has(submission.studentId)) {
        studentMap.set(submission.studentId, {
          name: submission.studentName,
          id: submission.studentId,
          submissions: []
        });
      }
      studentMap.get(submission.studentId)!.submissions.push(submission);
    });
    
    return Array.from(studentMap.values());
  };

  // Helper function to get submissions for a specific student
  const getStudentSubmissions = (studentId: string) => {
    return submissions.filter(submission => submission.studentId === studentId);
  };

  // Helper function to get filtered submissions for a student
  const getFilteredStudentSubmissions = (studentId: string) => {
    const studentSubmissions = getStudentSubmissions(studentId);
    
    console.log(`🔍 Filtering submissions for student ${studentId}:`);
    console.log(`   Total student submissions: ${studentSubmissions.length}`);
    console.log(`   Current filter: ${submissionFilter}`);
    
    const filtered = (() => {
      switch (submissionFilter) {
        case "mcq":
          return studentSubmissions.filter(sub => sub.submissionType === "mcq");

        case "descriptive":
          return studentSubmissions.filter(sub => sub.submissionType === "descriptive");
        default:
          return studentSubmissions;
      }
    })();
    
    console.log(`   Filtered submissions: ${filtered.length}`);
    console.log(`   Submission types in filtered results:`, filtered.map(sub => sub.submissionType));
    
    return filtered;
  };

  return (
    <div className="min-h-screen bg-gradient-primary p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Evaluator Dashboard</h1>
            <p className="text-muted-foreground">
              {user?.name ? `Welcome back, ${user.name}!` : "Welcome to the Evaluator Dashboard!"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Evaluator
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchSubmissions}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Reports
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Log Out
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="mcq" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              MCQ
            </TabsTrigger>

            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Students
                </CardTitle>
                <CardDescription>
                  Click on a student to view their submissions and evaluations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <p>Loading students...</p>
                    </div>
                  ) : getUniqueStudents().length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No Students Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        When students submit their work, they will appear here for evaluation.
                      </p>
                    </div>
                  ) : (
                    getUniqueStudents().map((student) => (
                      <div key={student.id} className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => {
                        setSelectedStudent(student.id);
                        setActiveTab("student-submissions");
                      }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                            <div>
                              <h3 className="font-semibold">{student.name}</h3>
                              <p className="text-sm text-muted-foreground">ID: {student.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <ClipboardList className="w-3 h-3" />
                              {student.submissions.length} submissions
                            </Badge>
                            {student.submissions.length > 0 && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {Math.round(student.submissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / student.submissions.length)}% avg
                              </Badge>
                            )}
                            <Button variant="outline" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudent(student.id);
                              setActiveTab("student-submissions");
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Submissions
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MCQ Submissions Tab */}
          <TabsContent value="mcq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  MCQ Submissions
                </CardTitle>
                <CardDescription>
                  Review and manage MCQ exam submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <p>Loading MCQ submissions...</p>
                    </div>
                  ) : submissions.filter(sub => sub.submissionType === "mcq").length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No MCQ Submissions Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        When students complete MCQ exams, they will appear here.
                      </p>
                    </div>
                  ) : (
                    submissions.filter(sub => sub.submissionType === "mcq").map((submission) => (
                      <div key={submission.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{submission.studentName}</h3>
                              <p className="text-sm text-muted-foreground">ID: {submission.studentId}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-blue-600 bg-blue-100">
                              ✓ Auto-Evaluated
                            </Badge>
                            {submission.score !== undefined && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {submission.score}%
                              </Badge>
                            )}
                            {submission.examTitle && (
                              <Badge variant="outline">
                                {submission.examTitle}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">
                            <span className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              {submission.examTitle || "MCQ Exam"}
                              <Badge variant="secondary" className="text-xs">
                                MCQ
                              </Badge>
                            </span>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Submitted: {submission.submittedAt.toLocaleDateString()}
                            {submission.totalQuestions && submission.correctAnswers && (
                              <span className="ml-2">
                                • {submission.correctAnswers}/{submission.totalQuestions} correct
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteSubmission(submission.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student Submissions Tab - Shows when a student is selected */}
          <TabsContent value="student-submissions" className="space-y-6" style={{ display: selectedStudent ? 'block' : 'none' }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        {getUniqueStudents().find(s => s.id === selectedStudent)?.name}'s Submissions
                      </CardTitle>
                      <CardDescription>
                        Review and evaluate submissions for this student
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedStudent(null)}
                    >
                      ← Back to Students
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Navigation Tabs for Student Submissions */}
                  <div className="mb-6">
                    <Tabs value={submissionFilter} onValueChange={(value) => setSubmissionFilter(value as any)} className="space-y-4">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all" className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4" />
                          ALL ({getStudentSubmissions(selectedStudent).length})
                        </TabsTrigger>
                        <TabsTrigger value="mcq" className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          MCQ ({getStudentSubmissions(selectedStudent).filter(sub => sub.submissionType === "mcq").length})
                        </TabsTrigger>

                        <TabsTrigger value="descriptive" className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          DESCRIPTIVE ({getStudentSubmissions(selectedStudent).filter(sub => sub.submissionType === "descriptive").length})
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="space-y-4">
                    {getFilteredStudentSubmissions(selectedStudent).map((submission) => (
                      <div key={submission.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              {submission.wordPuzzle ? (
                                <Grid3X3 className="w-5 h-5 text-primary" />

                              ) : submission.submissionType === "mcq" ? (
                                <FileText className="w-5 h-5 text-primary" />
                              ) : (
                                <ClipboardList className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {submission.wordPuzzle && submission.milestone ? (
                                  <span className="flex items-center gap-2">
                                    {getMilestoneTitle(submission.milestone)}
                                    <Badge variant="secondary" className="text-xs">
                                      WORD PUZZLE
                                    </Badge>
                                  </span>

                                ) : submission.examTitle ? (
                                  <span className="flex items-center gap-2">
                                    {submission.examTitle}
                                    {submission.examType && (
                                      <Badge variant="secondary" className="text-xs">
                                        {submission.examType.toUpperCase()}
                                      </Badge>
                                    )}
                                  </span>
                                ) : (
                                  submission.activityTitle || "Unknown Activity"
                                )}
                              </h3>
                        <p className="text-sm text-muted-foreground">
                          Submitted: {submission.submittedAt.toLocaleDateString()}
                          {submission.wordPuzzle && (
                            <span className="ml-2">
                              • Score: {submission.wordPuzzle.score}% • {submission.wordPuzzle.passed ? "Perfect Score" : "Need Improvement"}
                            </span>
                          )}

                          {submission.totalQuestions && submission.correctAnswers && (
                            <span className="ml-2">
                              • {submission.correctAnswers}/{submission.totalQuestions} correct
                            </span>
                          )}
                        </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(submission.status)}>
                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                            </Badge>
                            {submission.score !== undefined && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {submission.score}%
                              </Badge>
                            )}
                            {submission.milestone && (
                              <Badge variant="outline">
                                {getMilestoneTitle(submission.milestone)}
                              </Badge>
                            )}
                          </div>
                      </div>

                      {submission.feedback && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-800">{submission.feedback}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {submission.wordPuzzle ? (
                          <Badge variant="outline" className="text-green-600 bg-green-100">
                            ✓ Auto-Evaluated
                          </Badge>
                        ) : submission.submissionType === "mcq" ? (
                          <Badge variant="outline" className="text-blue-600 bg-blue-100">
                            ✓ Auto-Evaluated
                          </Badge>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEvaluateSubmission(submission)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Evaluate
                          </Button>
                        )}
                        {submission.submissionType === "descriptive" && submission.descriptiveAnswers && submission.descriptiveAnswers.length > 0 ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const answer = submission.descriptiveAnswers[0];
                                if (answer && answer.pdfUrl) {
                                  // Check if the URL already has a protocol
                                  const url = answer.pdfUrl.startsWith('http') 
                                    ? answer.pdfUrl 
                                    : `https://service-3-backend-production.up.railway.app${answer.pdfUrl}`;
                                  window.open(url, '_blank');
                                }
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View PDF
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const answer = submission.descriptiveAnswers[0];
                                if (answer && answer.pdfUrl) {
                                  const link = document.createElement('a');
                                  // Check if the URL already has a protocol
                                  const url = answer.pdfUrl.startsWith('http') 
                                    ? answer.pdfUrl 
                                    : `https://service-3-backend-production.up.railway.app${answer.pdfUrl}`;
                                  link.href = url;
                                  link.download = answer.fileName;
                                  link.click();
                                }
                              }}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </Button>
                          </>
                        ) : null}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteSubmission(submission.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Student Reports
                </CardTitle>
                <CardDescription>
                  Generate and view comprehensive evaluation reports for students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const evaluatedSubmissions = submissions.filter(sub => sub.status === "evaluated");
                    return evaluatedSubmissions.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Evaluated Submissions Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Evaluated submissions will appear here once evaluations are completed.
                        </p>
                      </div>
                    ) : (
                      evaluatedSubmissions.map((submission) => (
                        <Card key={submission.id} className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{submission.studentName}</h3>
                                <p className="text-sm text-muted-foreground">ID: {submission.studentId}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800">
                                ✓ Evaluated
                              </Badge>
                              {submission.score !== undefined && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Star className="w-3 h-3" />
                                  {submission.score}%
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium">
                                {submission.milestone ? (
                                  <span className="flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    {submission.milestone}
                                  </span>
                                ) : submission.examTitle ? (
                                  <span className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    {submission.examTitle}
                                  </span>
                                ) : (
                                  "Submission"
                                )}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                              </p>
                            </div>

                            {submission.feedback && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">Feedback:</h4>
                                <p className="text-sm bg-gray-50 p-3 rounded-md">
                                  {submission.feedback}
                                </p>
                              </div>
                            )}

                            {submission.tags && submission.tags.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">Tags:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {submission.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleGenerateReport(submission.id)}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Generate Report
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteSubmission(submission.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Submissions</p>
                      <p className="text-2xl font-bold">{submissions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Evaluated</p>
                      <p className="text-2xl font-bold">{submissions.filter(s => s.status === 'evaluated').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Star className="w-8 h-8 text-yellow-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Score</p>
                      <p className="text-2xl font-bold">
                        {submissions.length > 0 
                          ? Math.round(submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Award className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Active Students</p>
                      <p className="text-2xl font-bold">
                        {new Set(submissions.map(s => s.studentId)).size}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comprehensive Analytics Dashboard */}
            <div className="space-y-6">
              {/* Overall Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Overall Statistics
                </CardTitle>
                <CardDescription>
                    Complete overview of all submission types and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Total Submissions */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <Label className="text-sm font-medium">Total Submissions</Label>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{submissions.length}</p>
                    </div>

                    {/* Evaluated Submissions */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <Label className="text-sm font-medium">Evaluated</Label>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {submissions.filter(s => s.status === 'evaluated').length}
                      </p>
                    </div>

                    {/* Pending Submissions */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <Label className="text-sm font-medium">Pending</Label>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">
                        {submissions.filter(s => s.status === 'pending').length}
                      </p>
                    </div>

                    {/* Average Score */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <Label className="text-sm font-medium">Avg Score</Label>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {submissions.filter(s => s.score !== undefined).length > 0 
                          ? Math.round(submissions.filter(s => s.score !== undefined).reduce((sum, s) => sum + (s.score || 0), 0) / submissions.filter(s => s.score !== undefined).length)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submission Type Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Submission Type Breakdown
                  </CardTitle>
                  <CardDescription>
                    Detailed statistics for each submission type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* MCQ Submissions */}
                    <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-800">MCQ Submissions</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total:</span>
                          <span className="font-semibold">{submissions.filter(s => s.submissionType === 'mcq').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Evaluated:</span>
                          <span className="font-semibold text-green-600">
                            {submissions.filter(s => s.submissionType === 'mcq' && s.status === 'evaluated').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Avg Score:</span>
                          <span className="font-semibold">
                            {(() => {
                              const mcqSubs = submissions.filter(s => s.submissionType === 'mcq' && s.score !== undefined);
                              return mcqSubs.length > 0 
                                ? Math.round(mcqSubs.reduce((sum, s) => sum + (s.score || 0), 0) / mcqSubs.length)
                                : 0;
                            })()}%
                          </span>
                        </div>
                      </div>
                    </div>



                    {/* Descriptive Submissions */}
                    <div className="space-y-3 p-4 border rounded-lg bg-purple-50">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-purple-800">Descriptive</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total:</span>
                          <span className="font-semibold">{submissions.filter(s => s.submissionType === 'descriptive').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Evaluated:</span>
                          <span className="font-semibold text-green-600">
                            {submissions.filter(s => s.submissionType === 'descriptive' && s.status === 'evaluated').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Avg Score:</span>
                          <span className="font-semibold">
                            {(() => {
                              const descSubs = submissions.filter(s => s.submissionType === 'descriptive' && s.score !== undefined);
                              return descSubs.length > 0 
                                ? Math.round(descSubs.reduce((sum, s) => sum + (s.score || 0), 0) / descSubs.length)
                                : 0;
                            })()}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Word Puzzle Submissions */}
                    <div className="space-y-3 p-4 border rounded-lg bg-orange-50">
                      <div className="flex items-center gap-2">
                        <Grid3X3 className="w-5 h-5 text-orange-600" />
                        <h3 className="font-semibold text-orange-800">Word Puzzles</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total:</span>
                          <span className="font-semibold">{submissions.filter(s => s.submissionType === 'wordpuzzle').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Evaluated:</span>
                          <span className="font-semibold text-green-600">
                            {submissions.filter(s => s.submissionType === 'wordpuzzle' && s.status === 'evaluated').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Avg Score:</span>
                          <span className="font-semibold">
                            {(() => {
                              const puzzleSubs = submissions.filter(s => s.submissionType === 'wordpuzzle' && s.score !== undefined);
                              return puzzleSubs.length > 0 
                                ? Math.round(puzzleSubs.reduce((sum, s) => sum + (s.score || 0), 0) / puzzleSubs.length)
                                : 0;
                            })()}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Student Performance Bar Graph */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Student Performance Overview
                  </CardTitle>
                  <CardDescription>
                    Individual student performance across all submission types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                      {(() => {
                      // Get unique students and their performance data
                      const studentPerformance = getUniqueStudents().map(student => {
                        const studentSubs = getStudentSubmissions(student.id);
                        const evaluatedSubs = studentSubs.filter(s => s.status === 'evaluated' && s.score !== undefined);
                        const avgScore = evaluatedSubs.length > 0 
                          ? Math.round(evaluatedSubs.reduce((sum, s) => sum + (s.score || 0), 0) / evaluatedSubs.length)
                          : 0;
                        
                        return {
                          id: student.id,
                          name: student.name,
                          totalSubmissions: studentSubs.length,
                          evaluatedSubmissions: evaluatedSubs.length,
                          averageScore: avgScore,
                          mcqCount: studentSubs.filter(s => s.submissionType === 'mcq').length,
                          voiceCount: studentSubs.filter(s => s.submissionType === 'voice' || s.submissionType === 'mixed').length,
                          descriptiveCount: studentSubs.filter(s => s.submissionType === 'descriptive').length,
                          wordPuzzleCount: studentSubs.filter(s => s.submissionType === 'wordpuzzle').length
                        };
                      }).sort((a, b) => b.averageScore - a.averageScore); // Sort by average score descending

                      return studentPerformance.map((student, index) => (
                        <div key={student.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                                {index + 1}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{student.name}</h3>
                                <p className="text-sm text-gray-500">
                                  {student.totalSubmissions} submissions • {student.evaluatedSubmissions} evaluated
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">{student.averageScore}%</p>
                              <p className="text-xs text-gray-500">Average Score</p>
                            </div>
                          </div>
                          
                          {/* Performance Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>0%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${student.averageScore}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Submission Type Breakdown */}
                          <div className="flex gap-2 mt-2">
                            {student.mcqCount > 0 && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                MCQ: {student.mcqCount}
                          </Badge>
                            )}
                            {student.voiceCount > 0 && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                Voice: {student.voiceCount}
                              </Badge>
                            )}
                            {student.descriptiveCount > 0 && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                Descriptive: {student.descriptiveCount}
                              </Badge>
                            )}
                            {student.wordPuzzleCount > 0 && (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                Puzzles: {student.wordPuzzleCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        ));
                      })()}
                </div>
              </CardContent>
            </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Evaluation Modal */}
        {selectedSubmission && selectedSubmission.submissionType !== "voice" && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Evaluate Submission</CardTitle>
                <CardDescription>
                  Provide detailed evaluation for {selectedSubmission.studentName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {showDescriptiveEvaluation ? (
                  <DescriptiveEvaluationInterface
                    submission={{
                      _id: selectedSubmission.id,
                      student: {
                        _id: selectedSubmission.studentId,
                        name: selectedSubmission.studentName,
                        email: ""
                      },
                      exam: {
                        _id: selectedSubmission.examId || "",
                        title: selectedSubmission.examTitle || "",
                        type: selectedSubmission.examType || "",
                        milestone: selectedSubmission.milestone || 1
                      },
                      descriptiveAnswers: (selectedSubmission.descriptiveAnswers || []).map(answer => ({
                        ...answer,
                        question: answer.question || `Question ${answer.questionIndex + 1}`,
                        textAnswer: answer.textAnswer || ""
                      })),
                      status: selectedSubmission.status,
                      submittedAt: selectedSubmission.submittedAt,
                      evaluation: selectedSubmission.status === "evaluated" ? {
                        evaluatedBy: "",
                        evaluatedAt: new Date(),
                        contentScore: selectedSubmission.contentScore || 0,
                        grammarScore: selectedSubmission.grammarScore || 0,
                        structureScore: selectedSubmission.structureScore || 0,
                        overallScore: selectedSubmission.score || 0,
                        feedback: selectedSubmission.feedback || "",
                        tags: selectedSubmission.tags || [],
                        suggestions: []
                      } : undefined
                    }}
                    questions={selectedSubmission.examQuestions || []} // Questions from exam data
                    onEvaluate={handleDescriptiveEvaluation}
                    onClose={() => {
                      setShowDescriptiveEvaluation(false);
                      setSelectedSubmission(null);
                    }}
                    isEvaluated={selectedSubmission.status === "evaluated"}
                    examMaxMarks={selectedSubmission.examMaxMarks || 100}
                  />
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Pronunciation Score</Label>
                        <Select 
                          value={evaluationForm.pronunciationScore.toString()} 
                          onValueChange={(value) => setEvaluationForm(prev => ({ ...prev, pronunciationScore: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                              <SelectItem key={score} value={score.toString()}>
                                {score}/10
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Clarity Score</Label>
                        <Select 
                          value={evaluationForm.clarityScore.toString()} 
                          onValueChange={(value) => setEvaluationForm(prev => ({ ...prev, clarityScore: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                              <SelectItem key={score} value={score.toString()}>
                                {score}/10
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Tone Score</Label>
                        <Select 
                          value={evaluationForm.toneScore.toString()} 
                          onValueChange={(value) => setEvaluationForm(prev => ({ ...prev, toneScore: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                              <SelectItem key={score} value={score.toString()}>
                                {score}/10
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select 
                        value={evaluationForm.status} 
                        onValueChange={(value) => setEvaluationForm(prev => ({ ...prev, status: value as "pending" | "approved" | "rejected" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Detailed Feedback</Label>
                      <Textarea 
                        placeholder="Provide detailed feedback and suggestions for improvement..."
                        value={evaluationForm.feedback}
                        onChange={(e) => setEvaluationForm(prev => ({ ...prev, feedback: e.target.value }))}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Error Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {["pronunciation", "tone", "clarity", "speed", "grammar"].map((tag) => (
                          <Button
                            key={tag}
                            variant={evaluationForm.tags.includes(tag) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const newTags = evaluationForm.tags.includes(tag)
                                ? evaluationForm.tags.filter(t => t !== tag)
                                : [...evaluationForm.tags, tag];
                              setEvaluationForm(prev => ({ ...prev, tags: newTags }));
                            }}
                          >
                            {tag.charAt(0).toUpperCase() + tag.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedSubmission(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}


      </div>
    </div>
  );
};

export default EvaluatorDashboard; 