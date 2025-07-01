import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Aurora from './Aurora';
import { Github } from "lucide-react";
import ConnectionLoader from "../components/ConnectionLoader";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false); // State to control the loader
  const [error, setError] = useState(null); // State to handle errors

  useEffect(() => {
    // Extract query parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      // Save the token to localStorage
      localStorage.setItem("access_token", token);

      // Remove the query parameters from the URL
      window.history.replaceState({}, document.title, "/#/");

      // Redirect to the homepage
      navigate("/");
    } else {
      // Check if the user is already logged in
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) {
        fetch("https://subseral.onrender.com/auth/validate-token", {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.valid) {
              navigate("/"); // Redirect to the homepage
            } else {
              setError("Session expired. Please log in again.");
              localStorage.removeItem("access_token");
            }
          })
          .catch((err) => {
            console.error("Token validation error:", err);
            setError("An error occurred. Please try logging in again.");
          });
      }
    }
  }, [navigate]);

  const handleLogin = () => {
    setIsLoading(true); // Show the loader
    setTimeout(() => {
      // Redirect to GitHub login
      window.location.href = "https://subseral.onrender.com/auth/github";
    }, 5000); // 5-second delay
  };

  if (isLoading) {
    return <ConnectionLoader />; // Show the loader while waiting
  }

  return (
    <div className="h-screen relative overflow-hidden flex items-center justify-center">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>

      {/* Main Content */}
      <div className="relative z-20 text-center px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-wide">
          Welcome
        </h1>
        <p className="text-lg sm:text-xl text-white/80 font-light max-w-md mx-auto">
          Deploy your projects with seamless GitHub integration
        </p>

        <button
          onClick={handleLogin}
          className="group relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 hover:from-purple-700 hover:via-pink-600 hover:to-red-600 px-8 py-4 sm:px-10 sm:py-5 rounded-2xl text-lg sm:text-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 backdrop-blur-sm border border-white/20"
        >
          <div className="relative flex items-center justify-center space-x-3">
            <Github className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform duration-300" />
            <span>Login with GitHub</span>
          </div>
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Additional subtle text */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p className="text-white/60 text-sm sm:text-base">
            Secure • Fast • Reliable
          </p>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Login;