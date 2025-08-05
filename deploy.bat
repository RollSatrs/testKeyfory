@echo off
REM ===========================================
REM KEYFORY PLATFORM - WINDOWS DEPLOYMENT SCRIPT
REM ===========================================

echo 🚀 Starting Keyfory Platform deployment...

REM Check if Docker and Docker Compose are installed
echo [INFO] Checking requirements...

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo [SUCCESS] Requirements check passed

REM Create .env file if it doesn't exist
echo [INFO] Setting up environment...

if not exist .env (
    echo [WARNING] .env file not found. Creating from template...
    copy .env.example .env
    echo [WARNING] Please edit .env file with your actual configuration before proceeding.
    pause
)

echo [SUCCESS] Environment setup completed

REM Build and start services
echo [INFO] Building and starting services...

REM Stop existing containers
docker-compose down

REM Build new images
echo [INFO] Building Docker images...
docker-compose build --no-cache

REM Start services
echo [INFO] Starting services...
docker-compose up -d

echo [SUCCESS] Services deployment completed

REM Wait for services to start
echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check service health
echo [INFO] Checking service health...

curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Backend is healthy
) else (
    echo [WARNING] Backend health check failed
)

curl -f http://localhost >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Frontend is healthy
) else (
    echo [WARNING] Frontend health check failed
)

REM Show container status
echo [INFO] Container status:
docker-compose ps

echo.
echo [SUCCESS] 🎉 Keyfory Platform deployment completed!
echo.
echo [INFO] Access URLs:
echo   - Frontend (Admin Panel): http://localhost
echo   - Backend API: http://localhost:3000
echo   - Database: localhost:5432
echo.
echo [INFO] Useful commands:
echo   - View logs: docker-compose logs -f
echo   - Stop services: docker-compose down
echo   - Restart services: docker-compose restart
echo.

set /p "choice=Show logs? (y/n): "
if /i "%choice%"=="y" (
    docker-compose logs --tail=50
)

pause
