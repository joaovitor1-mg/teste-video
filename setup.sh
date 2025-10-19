#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_info "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        print_info "Please install Docker from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    print_status "Docker is installed: $(docker --version)"
}

# Check if Docker Compose is installed
check_docker_compose() {
    print_info "Checking Docker Compose installation..."
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        print_info "Please install Docker Compose from: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_status "Docker Compose is installed: $(docker-compose --version)"
}

# Create .env file from .env.example
setup_env_file() {
    print_info "Setting up environment file..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_status "Created .env file from .env.example"
            print_warning "Please edit .env with your configuration"
        else
            print_error ".env.example not found"
            exit 1
        fi
    else
        print_status ".env file already exists"
    fi
}

# Create necessary directories
setup_directories() {
    print_info "Creating necessary directories..."
    
    mkdir -p uploads
    mkdir -p outputs
    mkdir -p logs
    mkdir -p certs
    
    print_status "Directories created"
}

# Generate JWT Secret if not set
generate_jwt_secret() {
    print_info "Checking JWT_SECRET..."
    
    if grep -q "JWT_SECRET=your-super-secret" .env; then
        JWT_SECRET=$(openssl rand -base64 32)
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        print_status "Generated JWT_SECRET"
    else
        print_status "JWT_SECRET already configured"
    fi
}

# Build Docker images
build_images() {
    print_info "Building Docker images..."
    
    docker-compose build
    
    if [ $? -eq 0 ]; then
        print_status "Docker images built successfully"
    else
        print_error "Failed to build Docker images"
        exit 1
    fi
}

# Start services
start_services() {
    print_info "Starting services..."
    
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        print_status "Services started successfully"
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Wait for services to be ready
wait_for_services() {
    print_info "Waiting for services to be ready..."
    
    # Wait for database
    print_info "Waiting for database..."
    for i in {1..30}; do
        if docker-compose exec -T db mysqladmin ping -h localhost &> /dev/null; then
            print_status "Database is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Database did not start in time"
            exit 1
        fi
        sleep 1
    done
    
    # Wait for app
    print_info "Waiting for application..."
    for i in {1..30}; do
        if docker-compose exec -T app curl -f http://localhost:3000/health &> /dev/null; then
            print_status "Application is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Application did not start in time"
            exit 1
        fi
        sleep 1
    done
}

# Run database migrations
run_migrations() {
    print_info "Running database migrations..."
    
    docker-compose exec -T app pnpm db:push
    
    if [ $? -eq 0 ]; then
        print_status "Database migrations completed"
    else
        print_warning "Database migrations may have issues"
    fi
}

# Display summary
display_summary() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Setup completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Application is running at: http://localhost:3000"
    echo ""
    echo "Useful commands:"
    echo "  docker-compose logs -f app     # View application logs"
    echo "  docker-compose logs -f db      # View database logs"
    echo "  docker-compose down            # Stop all services"
    echo "  docker-compose up -d           # Start all services"
    echo ""
    echo "Database connection:"
    echo "  Host: db"
    echo "  Port: 3306"
    echo "  User: video_user"
    echo "  Password: (check .env file)"
    echo ""
}

# Main execution
main() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Video Editor App - Setup Script${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    check_docker
    check_docker_compose
    setup_env_file
    setup_directories
    generate_jwt_secret
    build_images
    start_services
    wait_for_services
    run_migrations
    display_summary
}

# Run main function
main

