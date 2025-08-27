import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, BookOpen, Users, TrendingUp } from "lucide-react";
import heroImage from "@/assets/telugu-hero.jpg";

const TeluguHero = () => {
  return (
    <div className="relative min-h-screen bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 text-6xl text-primary-foreground font-bold">అ</div>
        <div className="absolute top-40 right-20 text-4xl text-primary-foreground font-bold">క</div>
        <div className="absolute bottom-40 left-20 text-5xl text-primary-foreground font-bold">హ</div>
        <div className="absolute bottom-20 right-10 text-3xl text-primary-foreground font-bold">ఆ</div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
                <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  Telugu Basics
                </span>
              </h1>
              <p className="text-xl text-primary-foreground/90 max-w-lg">
                Unlock the Beauty of Telugu – Speak, Understand, and Master the Language with Confidence!
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-primary-foreground/80 text-lg">
                AI-powered interactive learning platform for mastering Telugu from alphabet to advanced constructions
              </p>
              
              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-3 text-primary-foreground/90">
                  <Mic className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm">AI Voice Practice</span>
                </div>
                <div className="flex items-center gap-3 text-primary-foreground/90">
                  <BookOpen className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm">Expert Video Lessons</span>
                </div>
                <div className="flex items-center gap-3 text-primary-foreground/90">
                  <Users className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm">Personalized Learning</span>
                </div>
                <div className="flex items-center gap-3 text-primary-foreground/90">
                  <TrendingUp className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm">Progress Tracking</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="text-lg px-8">
                Start Learning Now
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 bg-white/10 border-white/30 text-primary-foreground hover:bg-white/20">
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-glow">
              <img 
                src={heroImage} 
                alt="Telugu Learning Experience" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            </div>
            
            {/* Floating Cards */}
            <Card className="absolute -top-4 -left-4 p-4 bg-white/95 backdrop-blur shadow-card">
              <div className="text-2xl font-bold text-primary">అ</div>
              <div className="text-xs text-muted-foreground">Start Here</div>
            </Card>
            
            <Card className="absolute -bottom-4 -right-4 p-4 bg-white/95 backdrop-blur shadow-card">
              <div className="text-lg font-semibold text-accent">19</div>
              <div className="text-xs text-muted-foreground">Learning Activities</div>
            </Card>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="p-6 text-center bg-white/10 backdrop-blur border-white/20">
            <div className="text-3xl font-bold text-primary-foreground">50+</div>
            <div className="text-sm text-primary-foreground/80">Video Lessons</div>
          </Card>
          <Card className="p-6 text-center bg-white/10 backdrop-blur border-white/20">
            <div className="text-3xl font-bold text-primary-foreground">AI</div>
            <div className="text-sm text-primary-foreground/80">Speech Analysis</div>
          </Card>
          <Card className="p-6 text-center bg-white/10 backdrop-blur border-white/20">
            <div className="text-3xl font-bold text-primary-foreground">3</div>
            <div className="text-sm text-primary-foreground/80">Learning Roles</div>
          </Card>
          <Card className="p-6 text-center bg-white/10 backdrop-blur border-white/20">
            <div className="text-3xl font-bold text-primary-foreground">19</div>
            <div className="text-sm text-primary-foreground/80">Activities</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeluguHero;
