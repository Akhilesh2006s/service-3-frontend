import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Mic, CheckCircle, Lock, Star, Grid3X3 } from "lucide-react";
import { useState } from "react";

interface Activity {
  id: number;
  title: string;
  teluguTitle: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  progress: number;
  isUnlocked: boolean;
  category: "Alphabets" | "Guninthalu" | "Words" | "Advanced";
  milestone: number;
}

const activities: Activity[] = [
  {
    id: 1,
    title: "Vowels Forward & Backward",
    teluguTitle: "ఆ నుంచి అహ వరకు ఫార్వర్డ్, బాక్వర్డ్ చెప్పగలరా?",
    description: "Master Telugu vowels in both directions",
    difficulty: "Beginner",
    progress: 85,
    isUnlocked: true,
    category: "Alphabets",
    milestone: 1
  },
  {
    id: 2,
    title: "Consonants Forward & Backward",
    teluguTitle: "క నుంచి బండి ర వరకు ఫార్వర్డ్, బాక్వర్డ్ చెప్పగలరా?",
    description: "Practice consonants pronunciation",
    difficulty: "Beginner",
    progress: 65,
    isUnlocked: true,
    category: "Alphabets",
    milestone: 2
  },
  {
    id: 3,
    title: "Special Characters",
    teluguTitle: "తలకట్టు to విసర్గమ్ ఫార్వర్డ్, బాక్వర్డ్ చెప్పగలరా?",
    description: "Learn special Telugu characters",
    difficulty: "Beginner",
    progress: 40,
    isUnlocked: true,
    category: "Alphabets",
    milestone: 3
  },
  {
    id: 4,
    title: "Guninthalu Method 1",
    teluguTitle: "గుణింతాలు మొదటి పద్ధతిలో ఏవైనా 5 (forward & backward) చెప్పగలరా?",
    description: "First method of Guninthalu practice",
    difficulty: "Intermediate",
    progress: 20,
    isUnlocked: true,
    category: "Guninthalu",
    milestone: 4
  },
  {
    id: 5,
    title: "Guninthalu Method 2",
    teluguTitle: "గుణింతాలు రెండవ పద్ధతిలో ఏవైనా 5 చెప్పగలరా?",
    description: "Second method of Guninthalu",
    difficulty: "Intermediate",
    progress: 0,
    isUnlocked: false,
    category: "Guninthalu",
    milestone: 5
  },
  {
    id: 6,
    title: "Guninthalu Method 3",
    teluguTitle: "గుణింతాలు మూడవ పద్ధతిలో ఏవైనా 5 చెప్పగలరా?",
    description: "Third method of Guninthalu",
    difficulty: "Intermediate",
    progress: 0,
    isUnlocked: false,
    category: "Guninthalu",
    milestone: 6
  },
  {
    id: 7,
    title: "Three Consonant Combinations",
    teluguTitle: "మూడు హల్లుల మిళితమైన గుణింతాలు చెప్పగలరా?",
    description: "Complex three-letter combinations",
    difficulty: "Advanced",
    progress: 0,
    isUnlocked: false,
    category: "Advanced",
    milestone: 7
  },
  {
    id: 8,
    title: "Two Consonant Combinations",
    teluguTitle: "రెండు హల్లుల మిళితమైన గుణింతాలు చెప్పగలరా?",
    description: "Two-letter combinations practice",
    difficulty: "Intermediate",
    progress: 0,
    isUnlocked: false,
    category: "Guninthalu",
    milestone: 8
  },
  {
    id: 9,
    title: "50 Simple Words",
    teluguTitle: "50 సరળ పదాలు వివరించి చెప్పగలరా?",
    description: "Practice basic Telugu vocabulary",
    difficulty: "Intermediate",
    progress: 0,
    isUnlocked: false,
    category: "Words",
    milestone: 9
  },
  {
    id: 10,
    title: "Four-Step Method Stage 1",
    teluguTitle: "four step method stage one చెప్పగలరా?",
    description: "Learn the foundational four-step approach",
    difficulty: "Advanced",
    progress: 0,
    isUnlocked: false,
    category: "Advanced",
    milestone: 10
  },
  {
    id: 11,
    title: "Four-Step Method Stage 2",
    teluguTitle: "four step method stage two చెప్పగలరా?",
    description: "Advanced four-step method",
    difficulty: "Advanced",
    progress: 0,
    isUnlocked: false,
    category: "Advanced",
    milestone: 11
  },
  {
    id: 12,
    title: "10 Dvithvakshara Words",
    teluguTitle: "10 ద్విత్వాక్షర పదాలు ఫోర్ స్టెప్ method లో చెప్పగలరా?",
    description: "Double consonant words with four-step method",
    difficulty: "Advanced",
    progress: 0,
    isUnlocked: false,
    category: "Advanced",
    milestone: 12
  },
  {
    id: 13,
    title: "10 Samyuktakshara Words",
    teluguTitle: "10 సంయుక్తాక్షర పదాలు ఫోర్ స్టెప్ method లో చెప్పగలరా?",
    description: "Compound consonant words practice",
    difficulty: "Advanced",
    progress: 0,
    isUnlocked: false,
    category: "Advanced",
    milestone: 13
  },
  {
    id: 14,
    title: "10 Two Dvithvakshara Words",
    teluguTitle: "10 రెండు ద్విత్వాక్షార పదాలు ఫోర్ స్టెప్ method లో చెప్పగలరా?",
    description: "Complex double consonant combinations",
    difficulty: "Advanced",
    progress: 0,
    isUnlocked: false,
    category: "Advanced",
    milestone: 14
  },
  {
    id: 15,
    title: "10 Two Samyuktakshara Words",
    teluguTitle: "10 రెండు సంయుక్తాక్షార పదాలు ఫోర్ స్టెప్ method లో చెప్పగలరా?",
    description: "Advanced compound consonant words",
    difficulty: "Advanced",
    progress: 0,
    isUnlocked: false,
    category: "Advanced",
    milestone: 15
  },
  {
    id: 16,
    title: "10 Samslesha Words",
    teluguTitle: "10 సంశ్లేష అక్షరపదాలు ఫోర్ స్టెప్ method లో చెప్పగలరా?",
    description: "Complex compound letter words",
    difficulty: "Advanced",
    progress: 0,
    isUnlocked: false,
    category: "Advanced",
    milestone: 16
  },
  {
    id: 17,
    title: "Consonant Transformation Stress",
    teluguTitle: "హాల్లు ను పూర్తిగా మార్చడం ద్వారా ఒత్తు వచ్చే వాటిని చెప్పగలరా?",
    description: "Stress patterns through consonant changes",
    difficulty: "Advanced",
    progress: 0,
    isUnlocked: false,
    category: "Advanced",
    milestone: 17
  },
  {
    id: 18,
    title: "Talakattu Removal Stress",
    teluguTitle: "హాల్లు కు వున్న తలకట్టు తీసివేయడం ద్వారా ఒత్తు వచ్చే వాటిని చెప్పగలరా?",
    description: "Stress patterns by removing talakattu",
    difficulty: "Advanced",
    progress: 0,
    isUnlocked: false,
    category: "Advanced",
    milestone: 18
  },
  {
    id: 19,
    title: "Natural Stress Patterns",
    teluguTitle: "హల్లులో ఎలాంటి మార్పు అవసరంలేకుండా ఒత్తు వచ్చే వాటిని చెప్పగలరా?",
    description: "Natural stress without consonant changes",
    difficulty: "Advanced",
    progress: 0,
    isUnlocked: false,
    category: "Advanced",
    milestone: 19
  }
];

const categoryColors = {
  "Alphabets": "bg-blue-100 text-blue-800",
  "Guninthalu": "bg-orange-100 text-orange-800",
  "Words": "bg-green-100 text-green-800",
  "Advanced": "bg-purple-100 text-purple-800"
};

const LearningActivities = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  const categories = ["All", "Alphabets", "Guninthalu", "Words", "Advanced"];
  
  const filteredActivities = selectedCategory === "All" 
    ? activities 
    : activities.filter(activity => activity.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800";
      case "Intermediate": return "bg-yellow-100 text-yellow-800";
      case "Advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="py-16 bg-gradient-learning">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Learning Activities</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Master Telugu through our structured 19-activity curriculum, designed with pedagogical excellence
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Activities Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => (
            <Card key={activity.id} className="relative overflow-hidden hover:shadow-card transition-all duration-300 group">
              {!activity.isUnlocked && (
                <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm z-10 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={categoryColors[activity.category]}>
                    {activity.category}
                  </Badge>
                  <Badge className={getDifficultyColor(activity.difficulty)}>
                    {activity.difficulty}
                  </Badge>
                </div>
                
                <CardTitle className="text-lg leading-tight">
                  {activity.title}
                </CardTitle>
                
                <CardDescription className="text-sm text-primary font-medium">
                  {activity.teluguTitle}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{activity.progress}%</span>
                  </div>
                  <Progress value={activity.progress} className="h-2" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="learning" 
                    size="sm" 
                    className="flex-1"
                    disabled={!activity.isUnlocked}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Learn
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!activity.isUnlocked}
                    title={activity.milestone >= 9 && activity.milestone <= 19 ? "Word Puzzle" : "Voice Practice"}
                  >
                    {activity.milestone >= 9 && activity.milestone <= 19 ? (
                      <Grid3X3 className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                  {activity.progress === 100 && (
                    <Button variant="success" size="sm">
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>

              {/* Achievement Stars */}
              {activity.progress > 80 && (
                <div className="absolute top-3 right-3">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Overall Progress */}
        <Card className="mt-12 p-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Your Learning Journey</h3>
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-4xl font-bold text-primary">
                {Math.round(activities.reduce((acc, activity) => acc + activity.progress, 0) / activities.length)}%
              </div>
              <Progress 
                value={activities.reduce((acc, activity) => acc + activity.progress, 0) / activities.length} 
                className="h-3"
              />
              <p className="text-muted-foreground">
                Overall completion across all activities
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LearningActivities;