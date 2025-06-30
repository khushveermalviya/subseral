// services/deploymentLogger.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeploymentLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.deploymentFile = path.join(this.logDir, 'deployments.json');
    this.statsFile = path.join(this.logDir, 'stats.json');
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      
      // Initialize deployment log file if it doesn't exist
      try {
        await fs.access(this.deploymentFile);
      } catch {
        await fs.writeFile(this.deploymentFile, JSON.stringify([]));
      }

      // Initialize stats file if it doesn't exist
      try {
        await fs.access(this.statsFile);
      } catch {
        await fs.writeFile(this.statsFile, JSON.stringify({
          totalDeployments: 0,
          successfulDeployments: 0,
          failedDeployments: 0,
          frameworkStats: {},
          platformStats: {},
          userStats: {}
        }));
      }
    } catch (error) {
      console.error('Failed to initialize deployment logger:', error);
    }
  }

  async logDeployment(deploymentData) {
    try {
      const deployment = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        repoName: deploymentData.repoName,
        owner: deploymentData.owner,
        platform: deploymentData.platform,
        projectType: deploymentData.projectType,
        status: deploymentData.status, // 'success', 'failed', 'in-progress'
        url: deploymentData.url || null,
        port: deploymentData.port || null,
        buildTime: deploymentData.buildTime || null,
        errorMessage: deploymentData.errorMessage || null,
        containerName: deploymentData.containerName || null,
        imageName: deploymentData.imageName || null
      };

      // Read existing deployments
      const deploymentsData = await fs.readFile(this.deploymentFile, 'utf8');
      const deployments = JSON.parse(deploymentsData);

      // Add new deployment
      deployments.push(deployment);

      // Keep only last 1000 deployments
      if (deployments.length > 1000) {
        deployments.splice(0, deployments.length - 1000);
      }

      // Write back to file
      await fs.writeFile(this.deploymentFile, JSON.stringify(deployments, null, 2));

      // Update stats
      await this.updateStats(deployment);

      return deployment;
    } catch (error) {
      console.error('Failed to log deployment:', error);
      throw error;
    }
  }

  async updateStats(deployment) {
    try {
      const statsData = await fs.readFile(this.statsFile, 'utf8');
      const stats = JSON.parse(statsData);

      // Update total deployments
      stats.totalDeployments++;

      // Update success/failure counts
      if (deployment.status === 'success') {
        stats.successfulDeployments++;
      } else if (deployment.status === 'failed') {
        stats.failedDeployments++;
      }

      // Update framework stats
      if (deployment.projectType) {
        stats.frameworkStats[deployment.projectType] = 
          (stats.frameworkStats[deployment.projectType] || 0) + 1;
      }

      // Update platform stats
      if (deployment.platform) {
        stats.platformStats[deployment.platform] = 
          (stats.platformStats[deployment.platform] || 0) + 1;
      }

      // Update user stats
      if (deployment.owner) {
        if (!stats.userStats[deployment.owner]) {
          stats.userStats[deployment.owner] = { deployments: 0, successes: 0, failures: 0 };
        }
        stats.userStats[deployment.owner].deployments++;
        if (deployment.status === 'success') {
          stats.userStats[deployment.owner].successes++;
        } else if (deployment.status === 'failed') {
          stats.userStats[deployment.owner].failures++;
        }
      }

      // Add timestamp for last update
      stats.lastUpdated = new Date().toISOString();

      await fs.writeFile(this.statsFile, JSON.stringify(stats, null, 2));
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  async getDeployments(owner = null, limit = 50) {
    try {
      const deploymentsData = await fs.readFile(this.deploymentFile, 'utf8');
      let deployments = JSON.parse(deploymentsData);

      // Filter by owner if provided
      if (owner) {
        deployments = deployments.filter(d => d.owner === owner);
      }

      // Sort by timestamp (newest first) and limit
      return deployments
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get deployments:', error);
      return [];
    }
  }

  async getStats(owner = null) {
    try {
      const statsData = await fs.readFile(this.statsFile, 'utf8');
      const stats = JSON.parse(statsData);

      if (owner && stats.userStats[owner]) {
        // Return user-specific stats
        return {
          ...stats.userStats[owner],
          frameworkStats: await this.getUserFrameworkStats(owner),
          platformStats: await this.getUserPlatformStats(owner)
        };
      }

      return stats;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        totalDeployments: 0,
        successfulDeployments: 0,
        failedDeployments: 0,
        frameworkStats: {},
        platformStats: {},
        userStats: {}
      };
    }
  }

  async getUserFrameworkStats(owner) {
    try {
      const deployments = await this.getDeployments(owner, 1000);
      const frameworkStats = {};
      
      deployments.forEach(deployment => {
        if (deployment.projectType) {
          frameworkStats[deployment.projectType] = 
            (frameworkStats[deployment.projectType] || 0) + 1;
        }
      });

      return frameworkStats;
    } catch (error) {
      console.error('Failed to get user framework stats:', error);
      return {};
    }
  }

  async getUserPlatformStats(owner) {
    try {
      const deployments = await this.getDeployments(owner, 1000);
      const platformStats = {};
      
      deployments.forEach(deployment => {
        if (deployment.platform) {
          platformStats[deployment.platform] = 
            (platformStats[deployment.platform] || 0) + 1;
        }
      });

      return platformStats;
    } catch (error) {
      console.error('Failed to get user platform stats:', error);
      return {};
    }
  }

  async getActiveDeployments(owner = null) {
    try {
      const deployments = await this.getDeployments(owner, 1000);
      return deployments.filter(d => d.status === 'success' && d.url);
    } catch (error) {
      console.error('Failed to get active deployments:', error);
      return [];
    }
  }

  async updateDeploymentStatus(deploymentId, status, additionalData = {}) {
    try {
      const deploymentsData = await fs.readFile(this.deploymentFile, 'utf8');
      const deployments = JSON.parse(deploymentsData);

      const deploymentIndex = deployments.findIndex(d => d.id === deploymentId);
      if (deploymentIndex !== -1) {
        deployments[deploymentIndex] = {
          ...deployments[deploymentIndex],
          status,
          ...additionalData,
          updatedAt: new Date().toISOString()
        };

        await fs.writeFile(this.deploymentFile, JSON.stringify(deployments, null, 2));
        return deployments[deploymentIndex];
      }

      return null;
    } catch (error) {
      console.error('Failed to update deployment status:', error);
      return null;
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Clean up old logs
  async cleanup(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deploymentsData = await fs.readFile(this.deploymentFile, 'utf8');
      const deployments = JSON.parse(deploymentsData);

      const filteredDeployments = deployments.filter(
        d => new Date(d.timestamp) > cutoffDate
      );

      await fs.writeFile(this.deploymentFile, JSON.stringify(filteredDeployments, null, 2));

      console.log(`Cleaned up ${deployments.length - filteredDeployments.length} old deployment logs`);
    } catch (error) {
      console.error('Failed to cleanup logs:', error);
    }
  }
}

// Export singleton instance
const deploymentLogger = new DeploymentLogger();
export default deploymentLogger;

// Additional utility functions
export const logDeploymentStart = (deploymentData) => {
  return deploymentLogger.logDeployment({
    ...deploymentData,
    status: 'in-progress'
  });
};

export const logDeploymentSuccess = (deploymentId, successData) => {
  return deploymentLogger.updateDeploymentStatus(deploymentId, 'success', successData);
};

export const logDeploymentFailure = (deploymentId, errorMessage) => {
  return deploymentLogger.updateDeploymentStatus(deploymentId, 'failed', { errorMessage });
};