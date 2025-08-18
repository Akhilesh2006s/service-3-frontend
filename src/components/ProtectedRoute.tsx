import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'learner' | 'trainer' | 'evaluator';
  fallbackPath: string;
}

const ProtectedRoute = ({ children, requiredRole, fallbackPath }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        // User not authenticated, redirect to login
        navigate('/login');
        return;
      }

      if (user.role !== requiredRole) {
        // User doesn't have the required role, redirect to appropriate dashboard
        console.log(`Access denied: User role ${user.role} cannot access ${requiredRole} dashboard`);
        
        switch (user.role) {
          case 'trainer':
            navigate('/trainer');
            break;
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
    }
  }, [user, isAuthenticated, isLoading, requiredRole, navigate]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated or doesn't have the required role, don't render children
  if (!isAuthenticated || !user || user.role !== requiredRole) {
    return null;
  }

  // User is authenticated and has the required role, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
