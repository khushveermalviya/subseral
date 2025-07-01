import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Aurora from './Aurora';
import { Github } from "lucide-react";
import ConnectionLoader from "../components/ConnectionLoader";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false); // State to control the loader

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetch("http://localhost:4000/auth/validate-token", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            navigate("/");
          }
        });
    }
  }, [navigate]);

  const handleLogin = () => {
    setIsLoading(true); // Show the loader
    setTimeout(() => {
      // Redirect to GitHub login after 5 seconds
      window.location.href = "http://localhost:4000/auth/github";
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

      {/* Floating particles */}
      <div className="absolute inset-0 z-10">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-20 text-center px-4 sm:px-6 lg:px-8">
        {/* Subtitle Text */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-wide">
            Welcome
          </h1>
          <p className="text-lg sm:text-xl text-white/80 font-light max-w-md mx-auto">
            Deploy your projects with seamless GitHub integration
          </p>
        </div>

        {/* Login Button with Aurora-inspired styling */}
        <button
          onClick={handleLogin}
          className="group relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 hover:from-purple-700 hover:via-pink-600 hover:to-red-600 px-8 py-4 sm:px-10 sm:py-5 rounded-2xl text-lg sm:text-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 backdrop-blur-sm border border-white/20"
        >
          {/* Button shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
          
          {/* Button content */}
          <div className="relative flex items-center justify-center space-x-3">
            <Github className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform duration-300" />
            <span>Login with GitHub</span>
          </div>
        </button>

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