import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  GraduationCap, 
  Award, 
  CheckCircle, 
  Circle, 
  Play,
  Lock,
  Unlock,
  Eye,
  AlertCircle
} from "lucide-react";

export interface Milestone {
  id: number;
  title: string;
  teluguTitle: string;
  description: string;
  category: "alphabets" | "guninthalu" | "vocabulary" | "pronunciation";
  isCompleted: boolean;
  isLocked: boolean;
  progress: number;
  estimatedTime: number; // in minutes
}

interface MilestoneSystemProps {
  currentMilestone?: number;
  onMilestoneSelect: (milestoneId: number) => void;
}

const MilestoneSystem = ({ currentMilestone, onMilestoneSelect }: MilestoneSystemProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("alphabets");

  // All 19 milestones as per PRD
  const milestones: Milestone[] = [
    // Basic Telugu Alphabets (Milestones 1-3)
    {
      id: 1,
      title: "ఆ నుంచి అహ వరకు",
      teluguTitle: "Vowels (Forward & Backward)",
      description: "Learn Telugu vowels from ఆ to అహ with forward and backward recitation",
      category: "alphabets",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 30
    },
    {
      id: 2,
      title: "క నుంచి బండి ర వరకు",
      teluguTitle: "Basic Consonants (Forward & Backward)",
      description: "Master basic consonants from క to బండి ర with forward and backward recitation",
      category: "alphabets",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 45
    },
    {
      id: 3,
      title: "తలకట్టు to విసర్గమ్",
      teluguTitle: "Special Characters and Modifiers",
      description: "Learn special characters, modifiers, and their usage in Telugu script",
      category: "alphabets",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 40
    },

    // Guninthalu (Composite Letters) - Milestones 4-8
    {
      id: 4,
      title: "గుణింతాలు మొదటి పద్దతి",
      teluguTitle: "First Method (5 Examples)",
      description: "Learn the first method of guninthalu with 5 examples forward and backward",
      category: "guninthalu",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 60
    },
    {
      id: 5,
      title: "గుణింతాలు రెండవ పద్దతి",
      teluguTitle: "Second Method (5 Examples)",
      description: "Master the second method of guninthalu with 5 examples forward and backward",
      category: "guninthalu",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 60
    },
    {
      id: 6,
      title: "గుణింతాలు మూడవ పద్దతి",
      teluguTitle: "Third Method (5 Examples)",
      description: "Learn the third method of guninthalu with 5 examples forward and backward",
      category: "guninthalu",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 60
    },
    {
      id: 7,
      title: "మూడు హల్లుల మిళితమైన గుణింతాలు",
      teluguTitle: "Three Consonant Combinations",
      description: "Practice three consonant combinations in guninthalu formation",
      category: "guninthalu",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 75
    },
    {
      id: 8,
      title: "రెండు హల్లుల మిళితమైన గుణింతాలు",
      teluguTitle: "Two Consonant Combinations",
      description: "Master two consonant combinations in guninthalu formation",
      category: "guninthalu",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 75
    },

    // Vocabulary & Word Formation - Milestones 9-16
    {
      id: 9,
      title: "సరళ పదాలు",
      teluguTitle: "Simple Words Explanation (50 Words)",
      description: "Learn 50 simple Telugu words with proper pronunciation and meaning",
      category: "vocabulary",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 90
    },
    {
      id: 10,
      title: "Four Step Method - Stage One",
      teluguTitle: "Foundational Methodology",
      description: "Master the foundational four-step methodology for word formation",
      category: "vocabulary",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 120
    },
    {
      id: 11,
      title: "Four Step Method - Stage Two",
      teluguTitle: "Advanced Methodology",
      description: "Learn advanced four-step methodology for complex word formation",
      category: "vocabulary",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 120
    },
    {
      id: 12,
      title: "10 ద్విత్వాక్షర పదాలు",
      teluguTitle: "Double Letter Words (Four Step Method)",
      description: "Practice 10 double letter words using the four-step method",
      category: "vocabulary",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 90
    },
    {
      id: 13,
      title: "10 సంయుక్తాక్షర పదాలు",
      teluguTitle: "Compound Letter Words (Four Step Method)",
      description: "Learn 10 compound letter words using the four-step method",
      category: "vocabulary",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 90
    },
    {
      id: 14,
      title: "10 రెండు ద్విత్వాక్షార పదాలు",
      teluguTitle: "Two Double Letter Words",
      description: "Master 10 words with two double letters using advanced techniques",
      category: "vocabulary",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 105
    },
    {
      id: 15,
      title: "10 రెండు సంయుక్తాక్షార పదాలు",
      teluguTitle: "Two Compound Letter Words",
      description: "Practice 10 words with two compound letters using advanced techniques",
      category: "vocabulary",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 105
    },
    {
      id: 16,
      title: "10 సంశ్లేష అక్షరపదాలు",
      teluguTitle: "Complex Combination Words",
      description: "Learn 10 complex combination words with multiple letter modifications",
      category: "vocabulary",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 120
    },

    // Advanced Pronunciation - Milestones 17-19
    {
      id: 17,
      title: "హాల్లు ను పూర్తిగా మార్చడం ద్వారా ఒత్తు వచ్చే వాటిని చెప్పగలరా?",
      teluguTitle: "Complete Letter Modification",
      description: "Can you tell me about those that get 'otthu' by completely changing the consonant?",
      category: "pronunciation",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 90
    },
    {
      id: 18,
      title: "హాల్లు కు వున్న తలకట్టు తీసివేయడం ద్వారా ఒత్తు వచ్చే వాటిని చెప్పగలరా?",
      teluguTitle: "Removing Headmarks",
      description: "Can you tell me about those that get 'otthu' by removing the 'talakattu' from the consonant?",
      category: "pronunciation",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 90
    },
    {
      id: 19,
      title: "హల్లులో ఎలాంటి మార్పు అవసరంలేకుండా ఒత్తు వచ్చే వాటిని చెప్పగలరా?",
      teluguTitle: "Natural Emphasis",
      description: "Can you tell me about those that get 'otthu' without any change in the consonant?",
      category: "pronunciation",
      isCompleted: false,
      isLocked: false,
      progress: 0,
      estimatedTime: 90
    }
  ];

  const categories = [
    { id: "alphabets", name: "Basic Alphabets", icon: BookOpen, count: 3 },
    { id: "guninthalu", name: "Guninthalu", icon: GraduationCap, count: 5 },
    { id: "vocabulary", name: "Vocabulary & Words", icon: Award, count: 8 },
    { id: "pronunciation", name: "Advanced Pronunciation", icon: Play, count: 3 }
  ];

  const filteredMilestones = milestones.filter(m => m.category === selectedCategory);
  const completedCount = milestones.filter(m => m.isCompleted).length;
  const totalProgress = (completedCount / milestones.length) * 100;

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || BookOpen;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleMilestoneClick = (milestone: Milestone) => {
    if (milestone.isLocked) {
      // Show a message that this milestone is not yet available
      alert(`This milestone is not yet available. Please complete the previous milestones first.`);
      return;
    }
    onMilestoneSelect(milestone.id);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Telugu Basics Curriculum
        </CardTitle>
        <CardDescription>
          Complete all 19 milestones to master Telugu language fundamentals
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} of {milestones.length} completed
            </span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {category.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              <div className="grid gap-4">
                {filteredMilestones.map((milestone) => {
                  const Icon = getCategoryIcon(milestone.category);
                  return (
                    <Card 
                      key={milestone.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        currentMilestone === milestone.id ? 'ring-2 ring-primary' : ''
                      } ${milestone.isLocked ? 'opacity-80 bg-muted/50' : ''}`}
                      onClick={() => handleMilestoneClick(milestone)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 mt-1">
                              {milestone.isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-primary" />
                              ) : milestone.isLocked ? (
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <Circle className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{milestone.title}</h4>
                                {milestone.isCompleted && (
                                  <Badge variant="secondary" className="text-xs">
                                    Completed
                                  </Badge>
                                )}
                                {milestone.isLocked && (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">
                                    Coming Soon
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-primary font-medium">{milestone.teluguTitle}</p>
                              <p className="text-sm text-muted-foreground">{milestone.description}</p>
                              
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Icon className="w-3 h-3" />
                                  {formatTime(milestone.estimatedTime)}
                                </div>
                                {!milestone.isLocked && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Play className="w-3 h-3" />
                                    {milestone.progress}% complete
                                  </div>
                                )}
                                {milestone.isLocked && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <AlertCircle className="w-3 h-3" />
                                    Complete previous milestones to unlock
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={milestone.isLocked}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMilestoneClick(milestone);
                            }}
                          >
                            {milestone.isCompleted ? "Review" : milestone.isLocked ? "Locked" : "Start"}
                          </Button>
                        </div>
                        
                        {!milestone.isLocked && milestone.progress > 0 && (
                          <Progress value={milestone.progress} className="mt-3 h-1" />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MilestoneSystem; 
