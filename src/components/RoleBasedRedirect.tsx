import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface RoleBasedRedirectProps {
  children: React.ReactNode;
}

const RoleBasedRedirect = ({ children }: RoleBasedRedirectProps) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const currentPath = window.location.pathname;
      
      // If user is on login page and authenticated, redirect to appropriate dashboard
      if (currentPath === "/login") {
        if (user.role === "trainer") {
          navigate("/trainer");
        } else if (user.role === "evaluator") {
          navigate("/evaluator");
        } else if (user.role === "learner") {
          navigate("/learner");
        }
        return;
      }
      
      // If user is on root or tutorial page, redirect to appropriate dashboard
      if (currentPath === "/" || currentPath === "/tutorial" || currentPath === "/dashboard") {
        if (user.role === "trainer") {
          navigate("/trainer");
        } else if (user.role === "evaluator") {
          navigate("/evaluator");
        } else if (user.role === "learner") {
          navigate("/learner");
        }
      }
    }
  }, [user, isAuthenticated, navigate]);

  return <>{children}</>;
};

export default RoleBasedRedirect; 