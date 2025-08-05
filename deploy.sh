#!/bin/bash

# ===========================================
# KEYFORY PLATFORM - DEPLOYMENT SCRIPT
# ===========================================

echo "🚀 Starting Keyfory Platform deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker and Docker Compose are installed
check_requirements() {
    print_status "Checking requirements..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    print_success "Requirements check passed"
}

# Create .env file if it doesn't exist
setup_environment() {
    print_status "Setting up environment..."

    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.example .env
        print_warning "Please edit .env file with your actual configuration before proceeding."
        read -p "Press Enter to continue after editing .env file..."
    fi

    print_success "Environment setup completed"
}

# Build and start services
deploy_services() {
    print_status "Building and starting services..."

    # Stop existing containers
    docker-compose down

    # Build new images
    print_status "Building Docker images..."
    docker-compose build --no-cache

    # Start services
    print_status "Starting services..."
    docker-compose up -d

    print_success "Services deployment completed"
}

# Check service health
check_health() {
    print_status "Checking service health..."

    sleep 10  # Wait for services to start

    # Check backend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_warning "Backend health check failed"
    fi

    # Check frontend
    if curl -f http://localhost > /dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_warning "Frontend health check failed"
    fi

    # Show container status
    print_status "Container status:"
    docker-compose ps
}

# Show logs
show_logs() {
    print_status "Showing service logs..."
    docker-compose logs --tail=50
}

# Main deployment flow
main() {
    check_requirements
    setup_environment
    deploy_services
    check_health

    print_success "🎉 Keyfory Platform deployment completed!"
    print_status "Access URLs:"
    echo "  - Frontend (Admin Panel): http://localhost"
    echo "  - Backend API: http://localhost:3000"
    echo "  - Database: localhost:5432"

    print_status "Useful commands:"
    echo "  - View logs: docker-compose logs -f"
    echo "  - Stop services: docker-compose down"
    echo "  - Restart services: docker-compose restart"

    read -p "Show logs? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        show_logs
    fi
}

# Run main function
main
