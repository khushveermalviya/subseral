
import { useEffect, useState } from "react";
import { Rocket, CheckCircle, AlertCircle, Code, Server, Cloud, Wrench, Clock, ArrowLeft } from "lucide-react";

// Maintenance Screen Component
export const MaintenanceScreen = ({ onClose }) => {
  const [countdown, setCountdown] = useState(5);
  const [dots, setDots] = useState("");

  useEffect(() => {
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Animated dots for loading effect
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(dotsInterval);
    };
  }, [onClose]);

  return (
    <div className="p-8 text-center">
      {/* Icon with pulse animation */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
        <div className="relative bg-blue-500/30 rounded-full p-4 inline-block">
          <Wrench className="w-12 h-12 text-blue-300" />
        </div>
      </div>

      {/* Main heading */}
      <h1 className="text-3xl font-bold text-white mb-4">
        Under Maintenance
      </h1>

      {/* Description */}
      <p className="text-gray-300 mb-6 leading-relaxed">
        Our backend services are currently being deployed with exciting new updates{dots}
      </p>

      {/* Status indicator */}
      <div className="bg-black/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
          <Clock className="w-5 h-5" />
          <span className="font-medium">Deployment in Progress</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse w-3/4"></div>
        </div>
      </div>

      {/* Countdown */}
      <div className="bg-blue-500/20 rounded-lg p-4 mb-6">
        <p className="text-blue-200 text-sm mb-1">Closing in</p>
        <div className="text-4xl font-bold text-blue-300">
          {countdown}s
        </div>
      </div>

      {/* Manual close button */}
      <button
        onClick={onClose}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-5 h-5" />
        Go Back Now
      </button>

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          We appreciate your patience while we improve your experience
        </p>
      </div>
    </div>
  );
};
export default MaintenanceScreen