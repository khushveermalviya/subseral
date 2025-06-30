import { 
   
    Code,
    Globe,
   Star,
   GitFork
  } from "lucide-react";
const StatsOverview = ({ repos, user }) => {
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
    const languages = [...new Set(repos.map(repo => repo.language).filter(Boolean))];
  
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Repos</p>
              <p className="text-3xl font-bold">{repos.length}</p>
            </div>
            <Code size={32} className="text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Total Stars</p>
              <p className="text-3xl font-bold">{totalStars}</p>
            </div>
            <Star size={32} className="text-yellow-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Total Forks</p>
              <p className="text-3xl font-bold">{totalForks}</p>
            </div>
            <GitFork size={32} className="text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Languages</p>
              <p className="text-3xl font-bold">{languages.length}</p>
            </div>
            <Globe size={32} className="text-purple-200" />
          </div>
        </div>
      </div>
    );
  };
  export default StatsOverview;