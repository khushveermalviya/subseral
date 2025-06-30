// routes/dashboard.js
import express from "express";
import deploymentLogger from "../Services/Dashboardlogger.js";
import { exec } from "child_process";
import { promisify } from "util";

const router = express.Router();
const execAsync = promisify(exec);

// Middleware to verify authentication
const verifyAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // Extract GitHub token for user identification
  req.githubToken = authHeader.split(' ')[1];
  next();
};

// Get user's deployment history
router.get("/deployments", verifyAuth, async (req, res) => {
  try {
    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${req.githubToken}` },
    });
    
    if (!userResponse.ok) {
      return res.status(401).json({ error: "Invalid GitHub token" });
    }
    
    const userData = await userResponse.json();
    const owner = userData.login;
    
    const limit = parseInt(req.query.limit) || 50;
    const deployments = await deploymentLogger.getDeployments(owner, limit);
    
    res.json({ deployments, total: deployments.length });
  } catch (error) {
    console.error("Failed to get deployments:", error);
    res.status(500).json({ error: "Failed to retrieve deployments" });
  }
});

// Get user's deployment statistics
router.get("/stats", verifyAuth, async (req, res) => {
  try {
    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${req.githubToken}` },
    });
    
    if (!userResponse.ok) {
      return res.status(401).json({ error: "Invalid GitHub token" });
    }
    
    const userData = await userResponse.json();
    const owner = userData.login;
    
    const stats = await deploymentLogger.getStats(owner);
    
    // Add additional system stats for admin users
    const systemStats = await getSystemStats();
    
    res.json({ 
      userStats: stats,
      systemStats: userData.login === process.env.ADMIN_USER ? systemStats : null
    });
  } catch (error) {
    console.error("Failed to get stats:", error);
    res.status(500).json({ error: "Failed to retrieve statistics" });
  }
});

// Get active deployments
router.get("/active", verifyAuth, async (req, res) => {
  try {
    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${req.githubToken}` },
    });
    
    if (!userResponse.ok) {
      return res.status(401).json({ error: "Invalid GitHub token" });
    }
    
    const userData = await userResponse.json();
    const owner = userData.login;
    
    const activeDeployments = await deploymentLogger.getActiveDeployments(owner);
    
    // Check if containers are still running
    const runningDeployments = [];
    for (const deployment of activeDeployments) {
      if (deployment.containerName) {
        try {
          await execAsync(`docker ps --filter "name=${deployment.containerName}" --format "{{.Names}}"`);
          runningDeployments.push({
            ...deployment,
            isRunning: true
          });
        } catch (error) {
          runningDeployments.push({
            ...deployment,
            isRunning: false
          });
        }
      } else {
        runningDeployments.push({
          ...deployment,
          isRunning: true // Assume external deployments are running
        });
      }
    }
    
    res.json({ deployments: runningDeployments });
  } catch (error) {
    console.error("Failed to get active deployments:", error);
    res.status(500).json({ error: "Failed to retrieve active deployments" });
  }
});

// Stop a deployment
router.post("/stop/:deploymentId", verifyAuth, async (req, res) => {
  try {
    const { deploymentId } = req.params;
    
    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${req.githubToken}` },
    });
    
    if (!userResponse.ok) {
      return res.status(401).json({ error: "Invalid GitHub token" });
    }
    
    const userData = await userResponse.json();
    const owner = userData.login;
    
    // Get deployment details
    const deployments = await deploymentLogger.getDeployments(owner, 1000);
    const deployment = deployments.find(d => d.id === deploymentId);
    
    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }
    
    if (deployment.owner !== owner) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    // Stop and remove container
    if (deployment.containerName) {
      try {
        await execAsync(`docker stop ${deployment.containerName}`);
        await execAsync(`docker rm ${deployment.containerName}`);
        
        // Update deployment status
        await deploymentLogger.updateDeploymentStatus(deploymentId, 'stopped', {
          stoppedAt: new Date().toISOString()
        });
        
        res.json({ message: "Deployment stopped successfully" });
      } catch (error) {
        console.error("Failed to stop container:", error);
        res.status(500).json({ error: "Failed to stop deployment" });
      }
    } else {
      res.status(400).json({ error: "Cannot stop external deployment" });
    }
  } catch (error) {
    console.error("Failed to stop deployment:", error);
    res.status(500).json({ error: "Failed to stop deployment" });
  }
});

// Restart a deployment
router.post("/restart/:deploymentId", verifyAuth, async (req, res) => {
  try {
    const { deploymentId } = req.params;
    
    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${req.githubToken}` },
    });
    
    if (!userResponse.ok) {
      return res.status(401).json({ error: "Invalid GitHub token" });
    }
    
    const userData = await userResponse.json();
    const owner = userData.login;
    
    // Get deployment details
    const deployments = await deploymentLogger.getDeployments(owner, 1000);
    const deployment = deployments.find(d => d.id === deploymentId);
    
    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }
    
    if (deployment.owner !== owner) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    // Restart container
    if (deployment.containerName && deployment.imageName) {
      try {
        // Stop and remove existing container
        await execAsync(`docker stop ${deployment.containerName} || true`);
        await execAsync(`docker rm ${deployment.containerName} || true`);
        
        // Start new container
        const port = deployment.port || Math.floor(Math.random() * (65000 - 3000) + 3000);
        await execAsync(`docker run -d --name ${deployment.containerName} -p ${port}:${deployment.port || 3000} ${deployment.imageName}`);
        
        // Update deployment status
        await deploymentLogger.updateDeploymentStatus(deploymentId, 'success', {
          restartedAt: new Date().toISOString(),
          port
        });
        
        res.json({ 
          message: "Deployment restarted successfully",
          url: `http://localhost:${port}`
        });
      } catch (error) {
        console.error("Failed to restart container:", error);
        res.status(500).json({ error: "Failed to restart deployment" });
      }
    } else {
      res.status(400).json({ error: "Cannot restart external deployment" });
    }
  } catch (error) {
    console.error("Failed to restart deployment:", error);
    res.status(500).json({ error: "Failed to restart deployment" });
  }
});

// Get deployment logs
router.get("/logs/:deploymentId", verifyAuth, async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const lines = parseInt(req.query.lines) || 100;
    
    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${req.githubToken}` },
    });
    
    if (!userResponse.ok) {
      return res.status(401).json({ error: "Invalid GitHub token" });
    }
    
    const userData = await userResponse.json();
    const owner = userData.login;
    
    // Get deployment details
    const deployments = await deploymentLogger.getDeployments(owner, 1000);
    const deployment = deployments.find(d => d.id === deploymentId);
    
    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }
    
    if (deployment.owner !== owner) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    // Get container logs
    if (deployment.containerName) {
      try {
        const { stdout } = await execAsync(`docker logs --tail ${lines} ${deployment.containerName}`);
        res.json({ logs: stdout.split('\n') });
      } catch (error) {
        console.error("Failed to get logs:", error);
        res.status(500).json({ error: "Failed to retrieve logs" });
      }
    } else {
      res.status(400).json({ error: "Logs not available for external deployment" });
    }
  } catch (error) {
    console.error("Failed to get deployment logs:", error);
    res.status(500).json({ error: "Failed to retrieve logs" });
  }
});

// Delete a deployment
router.delete("/:deploymentId", verifyAuth, async (req, res) => {
  try {
    const { deploymentId } = req.params;
    
    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${req.githubToken}` },
    });
    
    if (!userResponse.ok) {
      return res.status(401).json({ error: "Invalid GitHub token" });
    }
    
    const userData = await userResponse.json();
    const owner = userData.login;
    
    // Get deployment details
    const deployments = await deploymentLogger.getDeployments(owner, 1000);
    const deployment = deployments.find(d => d.id === deploymentId);
    
    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }
    
    if (deployment.owner !== owner) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    // Stop and remove container, and remove image
    if (deployment.containerName) {
      try {
        await execAsync(`docker stop ${deployment.containerName} || true`);
        await execAsync(`docker rm ${deployment.containerName} || true`);
        if (deployment.imageName) {
          await execAsync(`docker rmi ${deployment.imageName} || true`);
        }
      } catch (error) {
        console.warn("Failed to clean up Docker resources:", error.message);
      }
    }
    
    // Update deployment status
    await deploymentLogger.updateDeploymentStatus(deploymentId, 'deleted', {
      deletedAt: new Date().toISOString()
    });
    
    res.json({ message: "Deployment deleted successfully" });
  } catch (error) {
    console.error("Failed to delete deployment:", error);
    res.status(500).json({ error: "Failed to delete deployment" });
  }
});

// Helper function to get system stats
async function getSystemStats() {
  try {
    const dockerStats = await execAsync("docker system df --format json");
    const containerCount = await execAsync("docker ps -a --format json | wc -l");
    const runningCount = await execAsync("docker ps --format json | wc -l");
    
    return {
      docker: JSON.parse(dockerStats.stdout),
      containers: {
        total: parseInt(containerCount.stdout.trim()),
        running: parseInt(runningCount.stdout.trim())
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Failed to get system stats:", error);
    return null;
  }
}

export default router;