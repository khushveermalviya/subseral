// routes/deploy.js
import express from "express";
import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { promisify } from "util";

const router = express.Router();
const execAsync = promisify(exec);

const DEFAULT_PORTS = {
  nodejs: 3000,
  react: 80,
  nextjs: 3000,
  python: 8000,
  django: 8000,
  flask: 5000,
  java: 8080,
  springboot: 8080,
  php: 80,
  laravel: 8000,
  go: 8080,
  rust: 8080
};

const DOCKERFILE_TEMPLATES = {
  nodejs: `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`,

  react: `FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`,

  nextjs: `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]`,

  python: `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "app.py"]`,

  django: `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]`,

  flask: `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]`,

  java: `FROM openjdk:17-jdk-slim
WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests
EXPOSE 8080
CMD ["java", "-jar", "target/*.jar"]`,

  springboot: `FROM openjdk:17-jdk-slim
WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests
EXPOSE 8080
CMD ["java", "-jar", "target/*.jar"]`,

  php: `FROM php:8.2-apache
COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html
EXPOSE 80`,

  laravel: `FROM php:8.2-fpm
WORKDIR /var/www
COPY . .
RUN apt-get update && apt-get install -y \\
    git curl libpng-dev libonig-dev libxml2-dev zip unzip
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --optimize-autoloader --no-dev
EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]`,

  go: `FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]`,

  rust: `FROM rust:1.75 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/target/release/app /usr/local/bin/app
EXPOSE 8080
CMD ["app"]`
};

const DETECTION_PATTERNS = {
  nodejs: {
    files: ['package.json'],
    patterns: [/node_modules/, /npm/, /yarn/],
    priority: 1
  },
  react: {
    files: ['package.json'],
    patterns: [/"react"/, /"@types\/react"/, /create-react-app/],
    priority: 2
  },
  nextjs: {
    files: ['package.json', 'next.config.js', 'next.config.ts'],
    patterns: [/"next"/, /next\.config/],
    priority: 3
  },
  python: {
    files: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'],
    patterns: [/\.py$/, /__pycache__/, /\.pyc$/],
    priority: 1
  },
  django: {
    files: ['manage.py', 'requirements.txt'],
    patterns: [/django/, /manage\.py/],
    priority: 2
  },
  flask: {
    files: ['app.py', 'main.py', 'requirements.txt'],
    patterns: [/flask/, /from flask/],
    priority: 2
  },
  java: {
    files: ['pom.xml', 'build.gradle', 'gradle.properties'],
    patterns: [/\.java$/, /\.jar$/, /\.class$/],
    priority: 1
  },
  springboot: {
    files: ['pom.xml', 'build.gradle'],
    patterns: [/spring-boot/, /@SpringBootApplication/],
    priority: 2
  },
  php: {
    files: ['composer.json', 'index.php'],
    patterns: [/\.php$/, /<?php/],
    priority: 1
  },
  laravel: {
    files: ['artisan', 'composer.json'],
    patterns: [/laravel/, /artisan/],
    priority: 2
  },
  go: {
    files: ['go.mod', 'go.sum', 'main.go'],
    patterns: [/\.go$/, /package main/],
    priority: 1
  },
  rust: {
    files: ['Cargo.toml', 'Cargo.lock'],
    patterns: [/\.rs$/, /cargo/],
    priority: 1
  }
};

// Enhanced logging function
function logStep(step, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${step}: ${message}`);
  if (data) {
    console.log(`[${timestamp}] Data:`, JSON.stringify(data, null, 2));
  }
}

// Execute SSH command on remote server
async function executeSSHCommand(command, description) {
  const awsConfig = {
    host: process.env.AWS_EC2_HOST,
    username: process.env.AWS_USERNAME,
    keyPath: process.env.SSH_KEY_PATH
  };

  const sshCommand = `ssh -o StrictHostKeyChecking=no -i ${awsConfig.keyPath} ${awsConfig.username}@${awsConfig.host} "${command}"`;
  
  logStep('SSH_EXEC', `Executing: ${description}`, { command });
  
  try {
    const { stdout, stderr } = await execAsync(sshCommand);
    if (stderr) {
      logStep('SSH_WARN', `Warning in ${description}`, { stderr });
    }
    logStep('SSH_SUCCESS', `Completed: ${description}`);
    return { stdout, stderr };
  } catch (error) {
    logStep('SSH_ERROR', `Failed: ${description}`, { error: error.message });
    throw error;
  }
}

// Auto-detect project type on remote server
async function detectProjectTypeRemote(projectRemoteDir) {
  logStep('DETECT_REMOTE', 'Starting remote project type detection', { projectRemoteDir });
  
  try {
    // Create detection script on remote server
    const detectionScript = `
#!/bin/bash
cd ${projectRemoteDir}

# Initialize scores
declare -A scores
scores[nodejs]=0
scores[react]=0
scores[nextjs]=0
scores[python]=0
scores[django]=0
scores[flask]=0
scores[java]=0
scores[springboot]=0
scores[php]=0
scores[laravel]=0
scores[go]=0
scores[rust]=0

# Check for key files and patterns
if [ -f "package.json" ]; then
  scores[nodejs]=$((scores[nodejs] + 2))
  
  if grep -q '"react"' package.json 2>/dev/null; then
    scores[react]=$((scores[react] + 4))
  fi
  
  if grep -q '"next"' package.json 2>/dev/null || [ -f "next.config.js" ] || [ -f "next.config.ts" ]; then
    scores[nextjs]=$((scores[nextjs] + 6))
  fi
fi

if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ] || [ -f "Pipfile" ]; then
  scores[python]=$((scores[python] + 2))
  
  if [ -f "manage.py" ] || grep -q "django" requirements.txt 2>/dev/null; then
    scores[django]=$((scores[django] + 4))
  fi
  
  if [ -f "app.py" ] || [ -f "main.py" ] || grep -q "flask" requirements.txt 2>/dev/null; then
    scores[flask]=$((scores[flask] + 4))
  fi
fi

if [ -f "pom.xml" ] || [ -f "build.gradle" ]; then
  scores[java]=$((scores[java] + 2))
  
  if grep -q "spring-boot" pom.xml 2>/dev/null || grep -q "spring-boot" build.gradle 2>/dev/null; then
    scores[springboot]=$((scores[springboot] + 4))
  fi
fi

if [ -f "composer.json" ] || [ -f "index.php" ]; then
  scores[php]=$((scores[php] + 2))
  
  if [ -f "artisan" ] || grep -q "laravel" composer.json 2>/dev/null; then
    scores[laravel]=$((scores[laravel] + 4))
  fi
fi

if [ -f "go.mod" ] || [ -f "go.sum" ] || [ -f "main.go" ]; then
  scores[go]=$((scores[go] + 2))
fi

if [ -f "Cargo.toml" ] || [ -f "Cargo.lock" ]; then
  scores[rust]=$((scores[rust] + 2))
fi

# Find the highest score
max_score=0
detected_type="nodejs"
for type in "\${!scores[@]}"; do
  if [ "\${scores[\$type]}" -gt "\$max_score" ]; then
    max_score="\${scores[\$type]}"
    detected_type="\$type"
  fi
done

echo "\$detected_type"
`;

    // Write and execute detection script
    await executeSSHCommand(`cat > /tmp/detect_project.sh << 'EOF'\n${detectionScript}\nEOF`, 'Create detection script');
    await executeSSHCommand('chmod +x /tmp/detect_project.sh', 'Make detection script executable');
    
    const result = await executeSSHCommand('/tmp/detect_project.sh', 'Execute project detection');
    const projectType = result.stdout.trim() || 'nodejs';
    
    logStep('DETECT_REMOTE', `Detected project type: ${projectType}`);
    return projectType;
    
  } catch (error) {
    logStep('DETECT_REMOTE', 'Detection failed, defaulting to nodejs', { error: error.message });
    return 'nodejs';
  }
}

// Generate Dockerfile on remote server
async function generateDockerfileRemote(projectRemoteDir, projectType) {
  logStep('DOCKERFILE_REMOTE', `Generating Dockerfile for ${projectType}`, { projectRemoteDir });
  
  // Check if Dockerfile already exists
  try {
    await executeSSHCommand(`test -f ${projectRemoteDir}/Dockerfile`, 'Check existing Dockerfile');
    logStep('DOCKERFILE_REMOTE', 'Dockerfile already exists, using existing one');
    return true;
  } catch (error) {
    logStep('DOCKERFILE_REMOTE', 'No existing Dockerfile found, creating new one');
  }
  
  const template = DOCKERFILE_TEMPLATES[projectType];
  if (!template) {
    const error = `No Dockerfile template for project type: ${projectType}`;
    logStep('DOCKERFILE_REMOTE', 'Template not found', { projectType, error });
    throw new Error(error);
  }
  
  // Create Dockerfile on remote server
  const createDockerfileCommand = `cat > ${projectRemoteDir}/Dockerfile << 'EOF'\n${template}\nEOF`;
  await executeSSHCommand(createDockerfileCommand, `Create Dockerfile for ${projectType}`);
  
  logStep('DOCKERFILE_REMOTE', `Successfully generated Dockerfile for ${projectType}`);
  return true;
}

// Complete AWS EC2 Remote Deployment Function
async function deployToAWSRemote(imageName, port, projectType, repoName, cloneUrl, githubToken) {
  const awsConfig = {
    host: process.env.AWS_EC2_HOST,
    username: process.env.AWS_USERNAME,
    keyPath: process.env.SSH_KEY_PATH
  };

  const projectRemoteDir = `/home/${awsConfig.username}/apps/${imageName}`;
  
  logStep('DEPLOY_REMOTE', 'Starting complete remote deployment', { 
    imageName, port, projectType, projectRemoteDir 
  });

  try {
    // Step 1: Prepare remote directory
    await executeSSHCommand(`mkdir -p ${projectRemoteDir}`, 'Create project directory');
    
    // Step 2: Clone repository on remote server
    const cloneCommand = `cd ${projectRemoteDir} && rm -rf * .* 2>/dev/null || true && git clone https://x-access-token:${githubToken}@${cloneUrl.replace('https://', '')} . 2>/dev/null`;
    await executeSSHCommand(cloneCommand, 'Clone repository on remote server');
    
    // Step 3: Auto-detect project type on remote server
    const detectedProjectType = await detectProjectTypeRemote(projectRemoteDir);
    const finalProjectType = detectedProjectType || projectType;
    
    // Step 4: Generate Dockerfile on remote server
    await generateDockerfileRemote(projectRemoteDir, finalProjectType);
    
    // Step 5: Stop and remove existing container
    // await executeSSHCommand(`docker stop ${imageName} 2>/dev/null || true`, 'Stop existing container');
    // await executeSSHCommand(`docker rm ${imageName} 2>/dev/null || true`, 'Remove existing container');
    // await executeSSHCommand(`docker rmi ${imageName} 2>/dev/null || true`, 'Remove existing image');
    
    // Step 6: Build Docker image on remote server
    await executeSSHCommand(`cd ${projectRemoteDir} && docker build -t ${imageName} .`, 'Build Docker image');
    
    // Step 7: Run Docker container
    const runCommand = `docker run -d --name ${imageName} -p ${port}:${DEFAULT_PORTS[finalProjectType] || 3000} --restart unless-stopped ${imageName}`;
    await executeSSHCommand(runCommand, 'Run Docker container');
    
    // Step 8: Verify deployment
    await executeSSHCommand(`docker ps | grep ${imageName}`, 'Verify container is running');
    
    // Step 9: Cleanup repository files (optional, keep for debugging)
    // await executeSSHCommand(`rm -rf ${projectRemoteDir}/.git`, 'Cleanup git files');
    
    const deploymentUrl = `http://${awsConfig.host}:${port}`;
    logStep('DEPLOY_REMOTE', 'Remote deployment completed successfully', { 
      deploymentUrl, finalProjectType 
    });
    
    return {
      url: deploymentUrl,
      projectType: finalProjectType,
      port: port
    };
    
  } catch (error) {
    logStep('DEPLOY_REMOTE', 'Remote deployment failed', { error: error.message });
    
    // Cleanup on error
    try {
      await executeSSHCommand(`docker stop ${imageName} 2>/dev/null || true && docker rm ${imageName} 2>/dev/null || true`, 'Cleanup on error');
    } catch (cleanupError) {
      logStep('DEPLOY_REMOTE', 'Cleanup failed', { error: cleanupError.message });
    }
    
    throw error;
  }
}

// Main deployment route
router.post("/", async (req, res) => {
  const { platform, repoName, cloneUrl, owner } = req.body;
  const authHeader = req.headers.authorization;
  
  logStep('DEPLOY_START', 'New remote deployment request received', { 
    platform, repoName, owner, cloneUrl: cloneUrl ? 'PROVIDED' : 'MISSING' 
  });
  
  // Validation
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logStep('DEPLOY_ERROR', 'Missing or invalid authorization token');
    return res.status(401).json({ error: "Missing or invalid authorization token" });
  }
  
  const githubToken = authHeader.split(' ')[1];
  
  if (!repoName || !cloneUrl || !owner) {
    logStep('DEPLOY_ERROR', 'Missing required data', { 
      repoName: !!repoName, cloneUrl: !!cloneUrl, owner: !!owner 
    });
    return res.status(400).json({ error: "Missing required data" });
  }

  // Validate AWS configuration
  if (!process.env.AWS_EC2_HOST || !process.env.AWS_USERNAME || !process.env.SSH_KEY_PATH) {
    logStep('DEPLOY_ERROR', 'Missing AWS configuration');
    return res.status(500).json({ 
      error: "AWS configuration missing", 
      details: "Please set AWS_EC2_HOST, AWS_USERNAME, and SSH_KEY_PATH environment variables" 
    });
  }
  
  try {
    // Generate unique image name and random port
    const imageName = `${owner}-${repoName}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const port = Math.floor(Math.random() * (65000 - 3000) + 3000);
    
    logStep('DEPLOY_PARAMS', 'Deployment parameters generated', { imageName, port });
    
    // Deploy everything remotely on AWS EC2
    const deploymentResult = await deployToAWSRemote(
      imageName, 
      port, 
      'nodejs', // Default, will be auto-detected remotely
      repoName, 
      cloneUrl, 
      githubToken
    );
    
    logStep('DEPLOY_SUCCESS', 'Complete remote deployment successful', deploymentResult);
    
    return res.json({
      success: true,
      url: deploymentResult.url,
      port: deploymentResult.port,
      projectType: deploymentResult.projectType,
      platform: 'aws-remote',
      message: `Successfully deployed ${deploymentResult.projectType} project remotely on AWS EC2`,
      logs: `All operations performed on remote AWS EC2 server`,
      containerName: imageName
    });
    
  } catch (err) {
    logStep('DEPLOY_ERROR', 'Remote deployment failed', { 
      error: err.message, 
      stack: err.stack.split('\n').slice(0, 5).join('\n') 
    });
    
    return res.status(500).json({
      error: "Remote deployment failed",
      details: err.message,
      stage: 'aws_remote_deployment'
    });
  }
});

// Get deployment status
router.get("/status/:containerName", async (req, res) => {
  const { containerName } = req.params;
  
  try {
    const result = await executeSSHCommand(
      `docker ps -a --filter name=${containerName} --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"`,
      'Check container status'
    );
    
    res.json({
      success: true,
      containerName,
      status: result.stdout || 'Container not found'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check status',
      details: error.message
    });
  }
});

// Stop deployment
router.delete("/:containerName", async (req, res) => {
  const { containerName } = req.params;
  
  try {
    await executeSSHCommand(`docker stop ${containerName}`, 'Stop container');
    await executeSSHCommand(`docker rm ${containerName}`, 'Remove container');
    
    res.json({
      success: true,
      message: `Container ${containerName} stopped and removed`
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to stop deployment',
      details: error.message
    });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  logStep('HEALTH_CHECK', 'Health check requested');
  res.json({ 
    status: "Remote Deploy service is running",
    timestamp: new Date().toISOString(),
    mode: "AWS_REMOTE_DEPLOYMENT",
    environment: {
      AWS_EC2_HOST: process.env.AWS_EC2_HOST ? 'SET' : 'NOT_SET',
      AWS_USERNAME: process.env.AWS_USERNAME ? 'SET' : 'NOT_SET',
      SSH_KEY_PATH: process.env.SSH_KEY_PATH ? 'SET' : 'NOT_SET'
    }
  });
});

// Get supported frameworks
router.get("/frameworks", (req, res) => {
  const frameworks = Object.keys(DOCKERFILE_TEMPLATES).map(type => ({
    type,
    port: DEFAULT_PORTS[type],
    hasTemplate: true
  }));
  
  logStep('FRAMEWORKS_REQUEST', 'Frameworks list requested');
  res.json({ frameworks });
});

// List active deployments
router.get("/deployments", async (req, res) => {
  try {
    const result = await executeSSHCommand(
      'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}\\t{{.Image}}"',
      'List active deployments'
    );
    
    res.json({
      success: true,
      deployments: result.stdout
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list deployments',
      details: error.message
    }); 
  }
});

export default router; 