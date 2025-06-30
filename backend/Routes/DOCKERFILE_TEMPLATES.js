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
export default DOCKERFILE_TEMPLATES;  