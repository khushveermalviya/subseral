import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = () => {
      // Check if token is in URL first
      const searchParams = new URLSearchParams(location.search);
      const urlToken = searchParams.get("token");
      
      if (urlToken) {
        // Save token to localStorage
        localStorage.setItem("access_token", urlToken);
        setIsAuthenticated(true);
        
        // Clean up URL by removing token parameter
        const newUrl = location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } else {
        // Check localStorage for existing token
        const storedToken = localStorage.getItem("access_token");
        setIsAuthenticated(!!storedToken);
      }
      
      setIsLoading(false);
    };

    checkAuthentication();
  }, [location]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return children;
};

export default PrivateRoute;