#!/bin/bash

# Flux Development Environment Setup Script
# This script starts all required services for local development

set -e  # Exit on any error

echo "🚀 Setting up Flux development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[Flux Setup]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Bun
    if ! command -v bun &> /dev/null; then
        print_error "Bun is not installed. Please install it from https://bun.sh"
        exit 1
    fi
    print_success "Bun is installed"
    
    # Check Supabase CLI
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it from https://supabase.com/docs/guides/cli"
        exit 1
    fi
    print_success "Supabase CLI is installed"
    
    # Check Redis
    if ! command -v redis-server &> /dev/null; then
        print_warning "Redis is not installed. Installing via Homebrew..."
        brew install redis
    fi
    print_success "Redis is installed"
    
    # Check Docker (for Supabase)
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop"
        exit 1
    fi
    print_success "Docker is installed"
}

# Start Supabase local instance
start_supabase() {
    print_status "Starting Supabase local instance..."
    
    # Check if already running
    if supabase status 2>/dev/null | grep -q "API URL: http://127.0.0.1:54321"; then
        print_success "Supabase is already running"
        return
    fi
    
    # Start Supabase
    if supabase start; then
        print_success "Supabase started successfully"
        
        # Wait for services to be ready
        sleep 5
        
        # Show connection details
        echo ""
        print_status "Supabase connection details:"
        supabase status
    else
        print_error "Failed to start Supabase"
        exit 1
    fi
}

# Start Redis local instance
start_redis() {
    print_status "Starting Redis local instance..."
    
    # Check if already running
    if redis-cli -p 54379 ping 2>/dev/null | grep -q "PONG"; then
        print_success "Redis is already running on port 54379"
        return
    fi
    
    # Start Redis on custom port
    if redis-server --port 54379 --daemonize yes; then
        print_success "Redis started on port 54379"
        
        # Test connection
        if redis-cli -p 54379 ping | grep -q "PONG"; then
            print_success "Redis connection test passed"
        else
            print_warning "Redis started but connection test failed"
        fi
    else
        print_error "Failed to start Redis"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."
    
    if bun install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if bun run migrate; then
        print_success "Database migrations completed"
    else
        print_warning "Database migrations failed - this might be expected on first run"
    fi
}

# Validate environment
validate_environment() {
    print_status "Validating environment configuration..."
    
    # Set environment for validation
    export FLUX_ENVIRONMENT=local
    
    if bun run config:show; then
        print_success "Environment configuration validated"
    else
        print_error "Environment configuration validation failed"
        exit 1
    fi
}

# Main setup function
main() {
    echo ""
    echo "🎯 Flux Backend Development Setup"
    echo "================================="
    echo ""
    
    check_dependencies
    echo ""
    
    install_dependencies
    echo ""
    
    start_supabase
    echo ""
    
    start_redis
    echo ""
    
    run_migrations
    echo ""
    
    validate_environment
    echo ""
    
    print_success "Development environment setup complete!"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Run 'bun run dev:local' to start the development server"
    echo "  2. Visit http://localhost:3000/api/health to test the API"
    echo "  3. Visit http://127.0.0.1:54321 for Supabase Studio"
    echo ""
    echo "📚 Available commands:"
    echo "  bun run dev:local     - Start with local Supabase + PostgreSQL"
    echo "  bun run dev:cloud     - Start with cloud Supabase + local PostgreSQL"
    echo "  bun run config:show   - Show current environment configuration"
    echo "  bun run setup:stop    - Stop all local services"
    echo ""
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT

# Run main function
main "$@" 