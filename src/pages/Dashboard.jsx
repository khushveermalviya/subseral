
import DashboardHeader from "../components/DashboardHeader.jsx";
import RepoCard from "../components/RepoCard.jsx";
import StatsOverview from "../components/StatsOverview.jsx"
import DeploymentModal from "../components/DeploymentModal.jsx";
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



const Dashboard = () => {
    const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("updated");
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [showDeployModal, setShowDeployModal] = useState(false);

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get("token");
    if (urlToken) {
      localStorage.setItem("access_token", urlToken);
      setToken(urlToken);
      window.history.replaceState({}, "", "/dashboard");
    } else {
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) {
        setToken(storedToken);
      } else {
        navigate("/");
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
        try {
          const userRes = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const userData = await userRes.json();
          setUser(userData);
  
          const repoRes = await fetch("https://api.github.com/user/repos", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const repoData = await repoRes.json();
          setRepos(repoData);
        } catch (err) {
          console.error("Error fetching data:", err);
          localStorage.removeItem("access_token");
          navigate("/");
        } finally {
          setLoading(false);
        }
      };

    fetchData();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    console.log("User logged out");
    navigate("/login");
    window.location.reload(); // optional: full refresh
  };
  
  const handleDeploy = (repo) => {
    setSelectedRepo(repo);
    setShowDeployModal(true);
  };

  const filteredAndSortedRepos = repos
    .filter(repo => 
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "stars":
          return b.stargazers_count - a.stargazers_count;
        case "created":
          return new Date(b.created_at) - new Date(a.created_at);
        case "updated":
        default:
          return new Date(b.updated_at) - new Date(a.updated_at);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <DashboardHeader
        user={user}
        onLogout={handleLogout}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      
      <div className="max-w-7xl mx-auto p-6">
        <StatsOverview repos={repos} user={user} />
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Your Repositories ({filteredAndSortedRepos.length})
          </h2>
          <p className="text-gray-400">
            Manage and deploy your projects with ease
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedRepos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              onDeploy={handleDeploy}
            />
          ))}
        </div>
        
        {filteredAndSortedRepos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              No repositories found matching your search.
            </p>
          </div>
        )}
      </div>
      
      <DeploymentModal
        repo={selectedRepo}
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(false)}
      />
    </div>
  );
};

export default Dashboard;