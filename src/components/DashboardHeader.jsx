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

const DashboardHeader = ({ user, onLogout, searchTerm, onSearchChange, sortBy, onSortChange }) => {
    return (
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {user?.name?.[0] || user?.login?.[0] || 'U'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome, {user?.name || user?.login}
                </h1>
                <p className="text-gray-400">{user?.bio || 'GitHub Developer'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Settings size={20} />
              </button>
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="updated">Recently Updated</option>
                <option value="name">Name</option>
                <option value="stars">Stars</option>
                <option value="created">Created Date</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };
  export default DashboardHeader