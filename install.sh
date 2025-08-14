#!/bin/bash

# WhatsApp Bot Installation Script
# Auto-install dependencies dan setup untuk production

set -e  # Exit on any error

echo "🚀 WhatsApp Bot Installation Script"
echo "=================================="

# Function untuk logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function untuk error handling
handle_error() {
    log "❌ Error occurred on line $1"
    exit 1
}

trap 'handle_error $LINENO' ERR

# Check Node.js
log "🔍 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    log "❌ Node.js not found. Please install Node.js 18+ first"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log "❌ Node.js version $NODE_VERSION detected. Need Node.js 18+"
    exit 1
fi

log "✅ Node.js $(node -v) detected"

# Check npm
log "🔍 Checking npm installation..."
if ! command -v npm &> /dev/null; then
    log "❌ npm not found"
    exit 1
fi

log "✅ npm $(npm -v) detected"

# Create required directories
log "📁 Creating required directories..."
mkdir -p logs
mkdir -p temp
mkdir -p session

# Check if package.json exists
if [ ! -f "package.json" ]; then
    log "❌ package.json not found in current directory"
    exit 1
fi

# Install dependencies
log "📦 Installing Node.js dependencies..."
npm install --production

# Verify critical files
log "🔍 Verifying critical files..."
REQUIRED_FILES=("bot.js" "server.js" "main.js" "start.js")

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        log "❌ Required file missing: $file"
        exit 1
    fi
    log "✅ Found: $file"
done

# Make scripts executable
log "🔧 Setting permissions..."
chmod +x start.js
chmod +x main.js
chmod +x install.sh

# Create .env from example if not exists
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    log "📄 Creating .env from .env.example..."
    cp .env.example .env
    log "⚠️  Please edit .env file with your configuration"
fi

# Health check
log "🏥 Running health check..."
node -e "
try {
    const pkg = require('./package.json');
    console.log('✅ package.json loaded');
    
    const fs = require('fs');
    if (fs.existsSync('./bot.js')) console.log('✅ bot.js exists');
    if (fs.existsSync('./start.js')) console.log('✅ start.js exists');
    if (fs.existsSync('./main.js')) console.log('✅ main.js exists');
    
    console.log('✅ Health check passed');
} catch (err) {
    console.error('❌ Health check failed:', err.message);
    process.exit(1);
}
"

log "✅ Installation completed successfully!"
echo ""
echo "🎯 Next Steps:"
echo "1. Edit .env file with your configuration (GEMINI_API_KEY, PHONE_NUMBER, etc.)"
echo "2. Start bot with: npm start"
echo "3. For 24/7 operation: node start.js"
echo ""
echo "📚 Available commands:"
echo "  npm start      - Start with auto-restart manager"
echo "  node main.js   - Start bot directly"  
echo "  node server.js - Development mode"
echo ""