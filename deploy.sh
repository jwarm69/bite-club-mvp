#!/bin/bash

# Bite Club MVP Deployment Script
# This script handles production deployment with Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="backups"

print_header() {
    echo -e "${BLUE}"
    echo "================================"
    echo "  BITE CLUB MVP DEPLOYMENT"
    echo "================================"
    echo -e "${NC}"
}

print_step() {
    echo -e "${GREEN}▶ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

check_dependencies() {
    print_step "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

check_environment() {
    print_step "Checking environment configuration..."
    
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Production environment file ($ENV_FILE) not found"
        echo "Please copy .env.production.template to $ENV_FILE and configure it"
        exit 1
    fi
    
    # Check for required environment variables
    source "$ENV_FILE"
    
    required_vars=(
        "DATABASE_URL"
        "JWT_SECRET"
        "NODE_ENV"
        "FRONTEND_URL"
        "REACT_APP_API_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    if [ ${#JWT_SECRET} -lt 32 ]; then
        print_error "JWT_SECRET must be at least 32 characters long"
        exit 1
    fi
    
    print_success "Environment configuration is valid"
}

backup_data() {
    print_step "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="$BACKUP_DIR/backup_$timestamp.sql"
    
    # This would require database access - skip if not available
    if command -v pg_dump &> /dev/null && [ -n "$DATABASE_URL" ]; then
        pg_dump "$DATABASE_URL" > "$backup_file"
        print_success "Database backup created: $backup_file"
    else
        print_warning "Skipping database backup (pg_dump not available or DATABASE_URL not set)"
    fi
}

build_images() {
    print_step "Building Docker images..."
    
    # Build images
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    
    print_success "Docker images built successfully"
}

deploy_application() {
    print_step "Deploying application..."
    
    # Stop existing containers
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    
    # Start new containers
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    print_success "Application deployed successfully"
}

run_health_checks() {
    print_step "Running health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        show_logs
        exit 1
    fi
    
    # Check frontend
    if curl -f http://localhost/ > /dev/null 2>&1; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        show_logs
        exit 1
    fi
}

show_logs() {
    print_step "Showing recent logs..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail=50
}

show_status() {
    print_step "Deployment status..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
}

cleanup_old_images() {
    print_step "Cleaning up old Docker images..."
    docker image prune -f
    print_success "Cleanup completed"
}

print_success_message() {
    echo -e "${GREEN}"
    echo "================================"
    echo "   DEPLOYMENT SUCCESSFUL! 🎉"
    echo "================================"
    echo -e "${NC}"
    echo "Application is running at:"
    echo "• Frontend: http://localhost/"
    echo "• Backend API: http://localhost:3001/"
    echo ""
    echo "To view logs: ./deploy.sh logs"
    echo "To check status: ./deploy.sh status"
    echo "To stop: ./deploy.sh stop"
}

# Main deployment function
deploy() {
    print_header
    check_dependencies
    check_environment
    backup_data
    build_images
    deploy_application
    run_health_checks
    cleanup_old_images
    print_success_message
}

# Command handling
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "logs")
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
        ;;
    "status")
        show_status
        ;;
    "stop")
        print_step "Stopping application..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
        print_success "Application stopped"
        ;;
    "restart")
        print_step "Restarting application..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart
        print_success "Application restarted"
        ;;
    "build")
        check_dependencies
        check_environment
        build_images
        ;;
    "health")
        run_health_checks
        ;;
    "cleanup")
        print_step "Cleaning up Docker resources..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down -v
        docker system prune -f
        print_success "Cleanup completed"
        ;;
    "help")
        echo "Bite Club MVP Deployment Script"
        echo ""
        echo "Usage: ./deploy.sh [command]"
        echo ""
        echo "Commands:"
        echo "  deploy    Full deployment (default)"
        echo "  logs      Show application logs"
        echo "  status    Show container status"
        echo "  stop      Stop the application"
        echo "  restart   Restart the application"
        echo "  build     Build Docker images only"
        echo "  health    Run health checks"
        echo "  cleanup   Clean up Docker resources"
        echo "  help      Show this help message"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use './deploy.sh help' for available commands"
        exit 1
        ;;
esac