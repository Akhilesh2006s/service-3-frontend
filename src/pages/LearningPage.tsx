import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  BookOpen, 
  Play, 
  Lock, 
  CheckCircle,
  Clock,
  Target,
  GraduationCap,
  TrendingUp,
  Star
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { curriculumService, type Lesson } from "@/services/curriculum";
import LearningContent from "@/components/LearningContent";

interface LearningPageProps {
  lessonId?: string;
}

const LearningPage = ({ lessonId: propLessonId }: LearningPageProps) => {
  const { lessonId: urlLessonId } = useParams<{ lessonId: string }>();
  const lessonId = propLessonId || urlLessonId;
  
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [showLearningContent, setShowLearningContent] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>("curriculum");
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (lessonId) {
      const lesson = curriculumService.getLessonById(lessonId);
      if (lesson) {
        setSelectedLesson(lesson);
        if (lesson.isUnlocked) {
          setShowLearningContent(true);
        }
      }
    }
    
    // Load all lessons and completed lessons
    const lessons = curriculumService.getAllLessons();
    setAllLessons(lessons);
    
    // Load completed lessons from localStorage
    const savedCompleted = localStorage.getItem('telugu-completed-lessons');
    if (savedCompleted) {
      setCompletedLessons(JSON.parse(savedCompleted));
    }
  }, [lessonId]);

  const handleLessonSelect = (lesson: Lesson) => {
    if (!lesson.isUnlocked) {
      toast({
        title: "Lesson Locked",
        description: "Complete prerequisite lessons to unlock this lesson.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedLesson(lesson);
    setShowLearningContent(true);
    navigate(`/learning/${lesson.id}`);
  };

  const handleLessonComplete = (results: any) => {
    if (selectedLesson) {
      // Update lesson progress
      curriculumService.updateLessonProgress(selectedLesson.id, 100);
      
      // Add to completed lessons
      const newCompleted = [...completedLessons, selectedLesson.id];
      setCompletedLessons(newCompleted);
      localStorage.setItem('telugu-completed-lessons', JSON.stringify(newCompleted));
      
      // Unlock next lessons
      allLessons.forEach(lesson => {
        if (!lesson.isUnlocked) {
          curriculumService.unlockLesson(lesson.id, newCompleted);
        }
      });
      
      toast({
        title: "Lesson Completed!",
        description: `Great job completing "${selectedLesson.title}"!`,
      });
      
      // Return to curriculum view
      setShowLearningContent(false);
      setSelectedLesson(null);
      navigate('/learning');
    }
  };

  const handleBackToCurriculum = () => {
    setShowLearningContent(false);
    setSelectedLesson(null);
    navigate('/learning');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800";
      case "Intermediate": return "bg-yellow-100 text-yellow-800";
      case "Advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Vowels": return "bg-blue-100 text-blue-800";
      case "Consonants": return "bg-purple-100 text-purple-800";
      case "Guninthalu": return "bg-orange-100 text-orange-800";
      case "Special Characters": return "bg-pink-100 text-pink-800";
      case "Advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const stats = curriculumService.getCurriculumStats();
  const nextRecommended = curriculumService.getNextRecommendedLesson(completedLessons);

  if (showLearningContent && selectedLesson) {
    return (
      <LearningContent
        lessonId={selectedLesson.id}
        title={selectedLesson.title}
        teluguTitle={selectedLesson.teluguTitle}
        description={selectedLesson.description}
        videoUrl={selectedLesson.videoUrl}
        trainerName={selectedLesson.trainerName}
        duration={selectedLesson.duration}
        difficulty={selectedLesson.difficulty}
        milestone={selectedLesson.milestone}
        onComplete={handleLessonComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Telugu Learning Journey</h1>
            <p className="text-muted-foreground">
              Master Telugu with Mr. Bhaskar Raja's structured curriculum
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {stats.completedLessons}/{stats.totalLessons} completed
            </Badge>
            <Badge variant="outline">
              {Math.round(stats.overallProgress)}% overall
            </Badge>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Lessons</p>
                  <p className="text-2xl font-bold">{stats.totalLessons}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completedLessons}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Target className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unlocked</p>
                  <p className="text-2xl font-bold">{stats.unlockedLessons}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold">{Math.round(stats.overallProgress)}%</p>
                </div>
              </div>
              <Progress value={stats.overallProgress} className="mt-3" />
            </CardContent>
          </Card>
        </div>

        {/* Next Recommended Lesson */}
        {nextRecommended && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Recommended Next Lesson
              </CardTitle>
              <CardDescription>
                Continue your learning journey with this lesson
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="font-medium">{nextRecommended.title}</h3>
                  <p className="text-sm text-primary font-medium">{nextRecommended.teluguTitle}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(nextRecommended.duration)}
                    </span>
                    <Badge className={getDifficultyColor(nextRecommended.difficulty)}>
                      {nextRecommended.difficulty}
                    </Badge>
                    <Badge className={getCategoryColor(nextRecommended.category)}>
                      {nextRecommended.category}
                    </Badge>
                  </div>
                </div>
                <Button onClick={() => handleLessonSelect(nextRecommended)}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Lesson
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Curriculum Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="curriculum" className="space-y-6">
            {/* Category Sections */}
            {Object.entries(stats.categoryProgress).map(([category, progress]) => {
              const categoryLessons = allLessons.filter(lesson => lesson.category === category);
              if (categoryLessons.length === 0) return null;

              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{category}</h2>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="w-24" />
                      <span className="text-sm text-muted-foreground">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {categoryLessons.map((lesson) => (
                      <Card 
                        key={lesson.id} 
                        className={`relative hover:shadow-md transition-shadow ${
                          lesson.isUnlocked ? 'cursor-pointer' : 'opacity-60'
                        }`}
                        onClick={() => lesson.isUnlocked && handleLessonSelect(lesson)}
                      >
                        {!lesson.isUnlocked && (
                          <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                            <Lock className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                {lesson.completed ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : lesson.isUnlocked ? (
                                  <Play className="w-4 h-4 text-primary" />
                                ) : (
                                  <Lock className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              
                              <div className="space-y-1">
                                <h3 className="font-medium">{lesson.title}</h3>
                                <p className="text-sm text-primary font-medium">{lesson.teluguTitle}</p>
                                <p className="text-sm text-muted-foreground">{lesson.description}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(lesson.duration)}
                                  </span>
                                  <Badge className={getDifficultyColor(lesson.difficulty)}>
                                    {lesson.difficulty}
                                  </Badge>
                                  <span className="flex items-center gap-1">
                                    <GraduationCap className="w-3 h-3" />
                                    {lesson.trainerName}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right space-y-2">
                              {lesson.completed && (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                              {lesson.progress > 0 && lesson.progress < 100 && (
                                <div className="text-sm">
                                  <div className="text-muted-foreground">Progress</div>
                                  <div className="font-medium">{Math.round(lesson.progress)}%</div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {lesson.progress > 0 && lesson.progress < 100 && (
                            <Progress value={lesson.progress} className="mt-3" />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
                <CardDescription>
                  Track your progress across different categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.categoryProgress).map(([category, progress]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{category}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>
                  Celebrate your learning milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {stats.completedLessons >= 1 && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-medium">First Lesson Complete</div>
                        <div className="text-sm text-muted-foreground">Started your Telugu journey</div>
                      </div>
                    </div>
                  )}
                  
                  {stats.completedLessons >= 3 && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Star className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="font-medium">Dedicated Learner</div>
                        <div className="text-sm text-muted-foreground">Completed 3 lessons</div>
                      </div>
                    </div>
                  )}
                  
                  {stats.overallProgress >= 50 && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Target className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="font-medium">Halfway There</div>
                        <div className="text-sm text-muted-foreground">50% curriculum complete</div>
                      </div>
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

export default LearningPage; 
