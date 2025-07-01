import { useEffect, useState } from "react";
import { Rocket, CheckCircle, AlertCircle, Code, Server, Cloud } from "lucide-react";
import MaintenanceScreen from "./MaintenceScreen";
// const DeploymentModal = ({ repo, isOpen, onClose }) => {
//   const [deploymentStatus, setDeploymentStatus] = useState('idle'); // idle, detecting, building, deploying, success, error
//   const [detectedFramework, setDetectedFramework] = useState(null);
//   const [deploymentUrl, setDeploymentUrl] = useState('');
//   const [errorMessage, setErrorMessage] = useState('');
//   const [deploymentStage, setDeploymentStage] = useState('');

//   if (!isOpen || !repo) return null;

//   const deploymentOptions = [
//     {
//       name: "Local",
//       description: "Deploy locally with auto-detection",
//       icon: "💻",
//       color: "from-blue-600 to-blue-800",
//       coming: false,
//       platform: "local"
//     },
//     {
//       name: "AWS EC2",
//       description: "Deploy to your AWS EC2 instance",
//       icon: "☁️",
//       color: "from-orange-600 to-yellow-600",
//       coming: false,
//       platform: "aws"
//     },
//     {
//       name: "Vercel",
//       description: "Perfect for React, Next.js, and static sites",
//       icon: "🔺",
//       color: "from-black to-gray-800",
//       coming: false,
//       platform: "vercel"
//     },
//     {
//       name: "Netlify",
//       description: "Great for JAMstack and static sites",
//       icon: "🌐",
//       color: "from-teal-600 to-cyan-600",
//       coming: true,
//       platform: "netlify"
//     },
//     {
//       name: "Railway",
//       description: "Deploy backend services and databases",
//       icon: "🚂",
//       color: "from-purple-600 to-pink-600",
//       coming: true,
//       platform: "railway"
//     },
//     {
//       name: "Render",
//       description: "Full-stack web services",
//       icon: "🎨",
//       color: "from-blue-600 to-indigo-600",
//       coming: true,
//       platform: "render"
//     },
//   ];

//   const resetModal = () => {
//     setDeploymentStatus('idle');
//     setDetectedFramework(null);
//     setDeploymentUrl('');
//     setErrorMessage('');
//     setDeploymentStage('');
//   };

//   const handleDeployClick = async (platform) => {
//     setDeploymentStatus('detecting');
//     setDeploymentStage('Initializing deployment...');
    
//     try {
//       const token = localStorage.getItem("access_token");
//       if (!token) {
//         throw new Error("Authentication required");
//       }

//       const response = await fetch("http://localhost:4000/deploy", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           platform,
//           repoName: repo.name,
//           cloneUrl: repo.clone_url,
//           owner: repo.owner.login,
//         }),
//       });

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.details || result.error || 'Deployment failed');
//       }

//       if (result.success) {
//         setDeploymentStatus('success');
//         setDetectedFramework(result.projectType);
//         setDeploymentUrl(result.url);
//         setDeploymentStage('Deployment completed successfully!');
//       } else {
//         throw new Error(result.message || 'Unknown deployment error');
//       }
//     } catch (err) {
//       console.error('Deployment error:', err);
//       setDeploymentStatus('error');
//       setErrorMessage(err.message);
//       setDeploymentStage('Deployment failed');
//     }
//   };

//   const handleOpenUrl = () => {
//     if (deploymentUrl) {
//       window.open(deploymentUrl, "_blank");
//     }
//   };

//   const handleClose = () => {
//     resetModal();
//     onClose();
//   };

//   const renderDeploymentStatus = () => {
//     switch (deploymentStatus) {
//       case 'detecting':
//       case 'building':
//       case 'deploying':
//         return (
//           <div className="text-center py-8">
//             <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
//             <h3 className="text-xl font-semibold text-white mb-2">Deploying...</h3>
//             <p className="text-gray-300">{deploymentStage}</p>
//             <div className="mt-4 space-y-2">
//               <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
//                 <Code size={16} />
//                 <span>Auto-detecting framework</span>
//               </div>
//               <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
//                 <Server size={16} />
//                 <span>Building Docker image</span>
//               </div>
//               <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
//                 <Cloud size={16} />
//                 <span>Deploying to server</span>
//               </div>
//             </div>
//           </div>
//         );

//       case 'success':
//         return (
//           <div className="text-center py-8">
//             <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-white mb-2">Deployment Successful!</h3>
//             {detectedFramework && (
//               <p className="text-gray-300 mb-4">
//                 Detected framework: <span className="font-mono bg-gray-700 px-2 py-1 rounded">{detectedFramework}</span>
//               </p>
//             )}
//             <div className="bg-gray-800 rounded-lg p-4 mb-4">
//               <p className="text-sm text-gray-400 mb-2">Your application is live at:</p>
//               <div className="flex items-center justify-center gap-2">
//                 <code className="bg-gray-700 px-3 py-2 rounded text-green-400 font-mono text-sm">
//                   {deploymentUrl}
//                 </code>
//                 <button
//                   onClick={handleOpenUrl}
//                   className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white text-sm transition-colors"
//                 >
//                   Open
//                 </button>
//               </div>
//             </div>
//           </div>
//         );

//       case 'error':
//         return (
//           <div className="text-center py-8">
//             <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-white mb-2">Deployment Failed</h3>
//             <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-4">
//               <p className="text-red-300 text-sm">{errorMessage}</p>
//             </div>
//             <button
//               onClick={resetModal}
//               className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white transition-colors"
//             >
//               Try Again
//             </button>
//           </div>
//         );

//       default:
//         return (
//           <div className="p-6 space-y-4">
//             <div className="mb-4">
//               <h3 className="text-lg font-semibold text-white mb-2">🤖 Auto-Detection Features</h3>
//               <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300">
//                 <p>Our system automatically detects:</p>
//                 <ul className="list-disc list-inside mt-2 space-y-1">
//                   <li>Node.js, React, Next.js applications</li>
//                   <li>Python (Django, Flask) projects</li>
//                   <li>Java (Spring Boot) applications</li>
//                   <li>PHP (Laravel) projects</li>
//                   <li>Go and Rust applications</li>
//                 </ul>
//               </div>
//             </div>
            
//             {deploymentOptions.map((option) => (
//               <div
//                 key={option.name}
//                 onClick={() => !option.coming && handleDeployClick(option.platform)}
//                 className={`relative p-4 rounded-lg bg-gradient-to-r ${option.color} ${
//                   option.coming ? "opacity-60" : "hover:shadow-lg cursor-pointer transform hover:scale-[1.02]"
//                 } transition-all duration-200`}
//               >
//                 <div className="flex items-center gap-4">
//                   <div className="text-2xl">{option.icon}</div>
//                   <div className="flex-1">
//                     <h4 className="text-lg font-semibold text-white">
//                       {option.name}
//                       {option.coming && (
//                         <span className="ml-2 px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded-full">
//                           Coming Soon
//                         </span>
//                       )}
//                     </h4>
//                     <p className="text-gray-200 text-sm">{option.description}</p>
//                   </div>
//                   {!option.coming && <Rocket className="text-white" size={20} />}
//                 </div>
//               </div>
//             ))}
//           </div>
//         );
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//         <div className="p-6 border-b border-gray-700">
//           <div className="flex items-center justify-between">
//             <h2 className="text-2xl font-bold text-white">
//               {deploymentStatus === 'idle' ? `Deploy ${repo.name}` : 'Deployment Status'}
//             </h2>
//             <button
//               onClick={handleClose}
//               className="text-gray-400 hover:text-white text-2xl"
//             >
//               ×
//             </button>
//           </div>
//           {deploymentStatus === 'idle' && (
//             <p className="text-gray-400 mt-2">Choose a deployment platform with auto-detection</p>
//           )}
//         </div>

//         {renderDeploymentStatus()}

//         {deploymentStatus === 'idle' && (
//           <div className="p-6 border-t border-gray-700 bg-gray-900 rounded-b-xl">
//             <p className="text-gray-400 text-sm">
//               💡 Our system automatically detects your project type and generates the appropriate Docker configuration. 
//               You'll get a live preview URL once deployed.
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default DeploymentModal;
const DeploymentModal = ({ repo, isOpen, onClose }) => {
  const [deploymentStatus, setDeploymentStatus] = useState('idle'); // idle, detecting, building, deploying, success, error, maintenance
  const [detectedFramework, setDetectedFramework] = useState(null);
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [deploymentStage, setDeploymentStage] = useState('');

  if (!isOpen || !repo) return null;

  const deploymentOptions = [
    {
      name: "Local",
      description: "Deploy locally with auto-detection",
      icon: "💻",
      color: "from-blue-600 to-blue-800",
      coming: false,
      platform: "local"
    },
    {
      name: "AWS EC2",
      description: "Deploy to your AWS EC2 instance",
      icon: "☁️",
      color: "from-orange-600 to-yellow-600",
      coming: false,
      platform: "aws"
    },
    {
      name: "Vercel",
      description: "Perfect for React, Next.js, and static sites",
      icon: "🔺",
      color: "from-black to-gray-800",
      coming: false,
      platform: "vercel"
    },
    {
      name: "Netlify",
      description: "Great for JAMstack and static sites",
      icon: "🌐",
      color: "from-teal-600 to-cyan-600",
      coming: true,
      platform: "netlify"
    },
    {
      name: "Railway",
      description: "Deploy backend services and databases",
      icon: "🚂",
      color: "from-purple-600 to-pink-600",
      coming: true,
      platform: "railway"
    },
    {
      name: "Render",
      description: "Full-stack web services",
      icon: "🎨",
      color: "from-blue-600 to-indigo-600",
      coming: true,
      platform: "render"
    },
  ];

  const resetModal = () => {
    setDeploymentStatus('idle');
    setDetectedFramework(null);
    setDeploymentUrl('');
    setErrorMessage('');
    setDeploymentStage('');
  };

  const handleDeployClick = async (platform) => {
    // Show maintenance screen for Local and AWS
    if (platform === "local" || platform === "aws") {
      setDeploymentStatus('maintenance');
      return;
    }

    setDeploymentStatus('detecting');
    setDeploymentStage('Initializing deployment...');
    
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("http://localhost:4000/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          platform,
          repoName: repo.name,
          cloneUrl: repo.clone_url,
          owner: repo.owner.login,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Deployment failed');
      }

      if (result.success) {
        setDeploymentStatus('success');
        setDetectedFramework(result.projectType);
        setDeploymentUrl(result.url);
        setDeploymentStage('Deployment completed successfully!');
      } else {
        throw new Error(result.message || 'Unknown deployment error');
      }
    } catch (err) {
      console.error('Deployment error:', err);
      setDeploymentStatus('error');
      setErrorMessage(err.message);
      setDeploymentStage('Deployment failed');
    }
  };

  const handleOpenUrl = () => {
    if (deploymentUrl) {
      window.open(deploymentUrl, "_blank");
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleMaintenanceClose = () => {
    setDeploymentStatus('idle');
  };

  const renderDeploymentStatus = () => {
    switch (deploymentStatus) {
      case 'maintenance':
        return <MaintenanceScreen onClose={handleMaintenanceClose} />;

      case 'detecting':
      case 'building':
      case 'deploying':
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Deploying...</h3>
            <p className="text-gray-300">{deploymentStage}</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Code size={16} />
                <span>Auto-detecting framework</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Server size={16} />
                <span>Building Docker image</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Cloud size={16} />
                <span>Deploying to server</span>
              </div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Deployment Successful!</h3>
            {detectedFramework && (
              <p className="text-gray-300 mb-4">
                Detected framework: <span className="font-mono bg-gray-700 px-2 py-1 rounded">{detectedFramework}</span>
              </p>
            )}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400 mb-2">Your application is live at:</p>
              <div className="flex items-center justify-center gap-2">
                <code className="bg-gray-700 px-3 py-2 rounded text-green-400 font-mono text-sm">
                  {deploymentUrl}
                </code>
                <button
                  onClick={handleOpenUrl}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white text-sm transition-colors"
                >
                  Open
                </button>
              </div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Deployment Failed</h3>
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-4">
              <p className="text-red-300 text-sm">{errorMessage}</p>
            </div>
            <button
              onClick={resetModal}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return (
          <div className="p-6 space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">🤖 Auto-Detection Features</h3>
              <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300">
                <p>Our system automatically detects:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Node.js, React, Next.js applications</li>
                  <li>Python (Django, Flask) projects</li>
                  <li>Java (Spring Boot) applications</li>
                  <li>PHP (Laravel) projects</li>
                  <li>Go and Rust applications</li>
                </ul>
              </div>
            </div>
            
            {deploymentOptions.map((option) => (
              <div
                key={option.name}
                onClick={() => !option.coming && handleDeployClick(option.platform)}
                className={`relative p-4 rounded-lg bg-gradient-to-r ${option.color} ${
                  option.coming ? "opacity-60" : "hover:shadow-lg cursor-pointer transform hover:scale-[1.02]"
                } transition-all duration-200`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{option.icon}</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white">
                      {option.name}
                      {option.coming && (
                        <span className="ml-2 px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </h4>
                    <p className="text-gray-200 text-sm">{option.description}</p>
                  </div>
                  {!option.coming && <Rocket className="text-white" size={20} />}
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {deploymentStatus === 'idle' ? `Deploy ${repo.name}` : deploymentStatus === 'maintenance' ? 'Service Status' : 'Deployment Status'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          {deploymentStatus === 'idle' && (
            <p className="text-gray-400 mt-2">Choose a deployment platform with auto-detection</p>
          )}
        </div>

        {renderDeploymentStatus()}

        {deploymentStatus === 'idle' && (
          <div className="p-6 border-t border-gray-700 bg-gray-900 rounded-b-xl">
            <p className="text-gray-400 text-sm">
              💡 Our system automatically detects your project type and generates the appropriate Docker configuration. 
              You'll get a live preview URL once deployed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeploymentModal;
