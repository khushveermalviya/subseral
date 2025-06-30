import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Filter, 
  Star, 
  GitFork, 
  Eye, 
  Calendar, 
  ExternalLink, 
  Rocket, 
  Settings, 
  LogOut,
  Code,
  Globe,
  Download
} from "lucide-react";
const RepoCard = ({ repo, onDeploy }) => {
    const [showActions, setShowActions] = useState(false);
    
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
  
    return (
      <div 
        className="bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 group"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {repo.name}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {repo.description || "No description available"}
              </p>
            </div>
            
            {repo.language && (
              <span className="ml-4 px-3 py-1 bg-blue-600 text-blue-100 text-xs rounded-full font-medium">
                {repo.language}
              </span>
            )}
          </div>
          
          {/* Repository Stats */}
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Star size={14} />
              <span>{repo.stargazers_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork size={14} />
              <span>{repo.forks_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye size={14} />
              <span>{repo.watchers_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formatDate(repo.updated_at)}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className={`transition-all duration-300 ${showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="flex flex-wrap gap-2">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                <ExternalLink size={14} />
                View Code
              </a>
              
              <button
                onClick={() => onDeploy(repo)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all text-sm"
              >
                <Rocket size={14} />
                Deploy
              </button>
              
              <a
                href={`${repo.html_url}/archive/refs/heads/${repo.default_branch}.zip`}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
              >
                <Download size={14} />
                Download
              </a>
              
              {repo.homepage && (
                <a
                  href={repo.homepage}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Globe size={14} />
                  Live Demo
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
export default RepoCard;  