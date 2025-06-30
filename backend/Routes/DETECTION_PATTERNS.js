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
  export default DETECTION_PATTERNS;