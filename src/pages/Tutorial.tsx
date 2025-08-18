import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Maximize,
  BookOpen,
  Mic,
  FileText
} from "lucide-react";

import WordPuzzle from "@/components/WordPuzzle";
import MilestoneSystem from "@/components/MilestoneSystem";
import { useAuth } from "@/contexts/AuthContext";

const Tutorial = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get("role") || "learner";
  const { user } = useAuth();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(300); // 5 minutes tutorial
  const [isMuted, setIsMuted] = useState(false);
  const [currentTab, setCurrentTab] = useState("video");
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);

  useEffect(() => {
    // Auto-start tutorial video
    setIsPlaying(true);
    
    // Simulate video playback
    const interval = setInterval(() => {
      setCurrentTime(prevTime => {
        const newTime = prevTime + 1;
        return newTime >= duration ? duration : newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [duration]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkip = () => {
    const rolePaths = {
      learner: "/learner",
      trainer: "/trainer",
      evaluator: "/evaluator"
    };
    navigate(rolePaths[role as keyof typeof rolePaths] || "/learner");
  };

  const handleMilestoneSelect = (milestoneId: number) => {
    setSelectedMilestone(milestoneId);
    setCurrentTab("video");
  };

  const handleSkipForward = () => {
    setCurrentTime(Math.min(currentTime + 30, duration));
  };

  const handleSkipBackward = () => {
    setCurrentTime(Math.max(currentTime - 30, 0));
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-primary p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Telugu Basics Tutorial</h1>
            <p className="text-muted-foreground">
              {user?.name ? `Welcome back, ${user.name}!` : "Welcome to Telugu Basics!"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
            {selectedMilestone && (
              <Badge variant="outline">
                Milestone {selectedMilestone}
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Video Tutorial
            </TabsTrigger>
            <TabsTrigger value="milestones" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Curriculum
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Voice Practice
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  {selectedMilestone 
                    ? `Milestone ${selectedMilestone} - Telugu Basics`
                    : "Welcome to Telugu Basics!"
                  }
                </CardTitle>
                <CardDescription>
                  {role === "learner" 
                    ? "Learn the fundamentals of Telugu script and pronunciation"
                    : `${role.charAt(0).toUpperCase() + role.slice(1)} Tutorial - Managing learners and assessments`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enhanced Video Player */}
                <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center text-white relative">
                  <div className="text-center">
                    <div className="text-6xl mb-4">
                      {isPlaying ? "▶️" : "⏸️"}
                    </div>
                    <p className="text-lg">Tutorial Video Playing</p>
                    <p className="text-sm opacity-75">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </p>
                  </div>
                  
                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/50 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handlePlayPause}
                        className="text-white hover:bg-white/20"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleSkipBackward}
                        className="text-white hover:bg-white/20"
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleSkipForward}
                        className="text-white hover:bg-white/20"
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={toggleMute}
                        className="text-white hover:bg-white/20"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-white hover:bg-white/20"
                      >
                        <Maximize className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <Progress value={(currentTime / duration) * 100} className="h-2" />
                </div>

                {/* Additional Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" onClick={handleSkip}>
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip & Continue
                  </Button>
                </div>

                {/* Learning Points */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    What you'll learn:
                  </h3>
                  {role === "learner" ? (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Telugu alphabets (Vowels and Consonants)</li>
                      <li>• Forward and backward recitation</li>
                      <li>• Guninthalu (Consonant combinations)</li>
                      <li>• Interactive learning exercises</li>
                      <li>• Taking exams and assessments</li>
                    </ul>
                  ) : (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Creating and managing exams</li>
                      <li>• Evaluating student submissions</li>
                      <li>• Student assessment evaluation</li>
                      <li>• MCQ question creation</li>
                      <li>• Student progress tracking</li>
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones">
            <MilestoneSystem 
              currentMilestone={selectedMilestone || undefined}
              onMilestoneSelect={handleMilestoneSelect}
            />
          </TabsContent>

          <TabsContent value="practice">
            {selectedMilestone && selectedMilestone >= 9 && selectedMilestone <= 19 ? (
              <WordPuzzle 
                milestone={selectedMilestone}
                title="Telugu Word Puzzle Practice"
                teluguTitle="తెలుగు పద పజిల్ అభ్యాసం"
                description="Practice Telugu vocabulary and letters through interactive puzzles"
              />
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Practice Section</h3>
                <p className="text-muted-foreground">
                  Practice content will be available here for this milestone.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Tutorial;