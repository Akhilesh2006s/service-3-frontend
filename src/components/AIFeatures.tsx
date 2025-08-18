import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mic, 
  Volume2, 
  Brain, 
  BarChart3, 
  Users, 
  BookOpen, 
  Target,
  Zap
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Voice-Based Practice",
    description: "AI-powered speech recognition analyzes your pronunciation in real-time",
    badge: "AI Powered",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    icon: Volume2,
    title: "Forward-Backward Training",
    description: "Unique bidirectional pronunciation method to strengthen memory recall",
    badge: "Innovative",
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    icon: BarChart3,
    title: "Speech Analysis",
    description: "Real-time corrections with detailed feedback on pronunciation accuracy",
    badge: "Real-time",
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    icon: Brain,
    title: "Four-Step Learning",
    description: "Scientifically designed method for deeper understanding and retention",
    badge: "Pedagogical",
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  {
    icon: BookOpen,
    title: "Expert Video Lessons",
    description: "Learn from Telugu language experts with structured curriculum",
    badge: "Expert Led",
    color: "text-red-600",
    bgColor: "bg-red-50"
  },
  {
    icon: Users,
    title: "Triple Role System",
    description: "Student, Trainer, and Corrector roles for comprehensive learning",
    badge: "Personalized",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50"
  }
];

const AIFeatures = () => {
  return (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary">
            AI-Powered Learning
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Revolutionary Learning Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the future of language learning with our cutting-edge AI technology, 
            designed specifically for Telugu language mastery
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="relative group hover:shadow-card transition-all duration-300">
                <CardHeader>
                  <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <IconComponent className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Special Focus on Google Translate Integration */}
        <Card className="bg-gradient-learning border-primary/20 shadow-learning">
          <CardContent className="p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <Badge className="bg-primary/20 text-primary">
                    Google Translate Integration
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  Precision Speech Recognition
                </h3>
                <p className="text-muted-foreground text-lg mb-6">
                  Powered by Google Translate Speech API, our platform ensures the highest 
                  accuracy in pronunciation analysis and real-time translation support.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    <span>99.5% pronunciation accuracy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    <span>Instant translation and feedback</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    <span>Native speaker comparison</span>
                  </li>
                </ul>
                <Button variant="hero" size="lg">
                  Try Speech Recognition
                </Button>
              </div>
              <div className="relative">
                <Card className="p-6 bg-white/80 backdrop-blur">
                  <div className="text-center space-y-4">
                    <div className="text-4xl font-bold text-primary">అ</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full w-3/4 transition-all duration-500"></div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Pronunciation accuracy: 87%
                    </p>
                    <Badge className="bg-accent/10 text-accent">
                      Great! Try speaking slower
                    </Badge>
                  </div>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold mb-4">
            Ready to Experience AI-Powered Telugu Learning?
          </h3>
          <Button variant="hero" size="lg" className="text-lg px-8">
            Start Your Free Trial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIFeatures;