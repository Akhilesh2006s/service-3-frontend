import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const Index = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const rolePaths = {
        learner: "/learner",
        trainer: "/trainer",
        evaluator: "/evaluator"
      };
      navigate(rolePaths[user.role]);
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Simple Hero Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Telugu Basics
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Master Telugu language with interactive lessons, voice practice, and AI-powered assessments
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/register")}>
              Start Learning
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          </div>
        </div>
      </section>
      
      {/* Simple Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Telugu Basics?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform combines traditional learning methods with modern technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">Interactive Videos</h3>
              <p className="text-muted-foreground">Learn with advanced video controls and navigation</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">Voice Practice</h3>
              <p className="text-muted-foreground">Record and practice pronunciation with feedback</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">Smart Assessments</h3>
              <p className="text-muted-foreground">AI-powered evaluations and progress tracking</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
