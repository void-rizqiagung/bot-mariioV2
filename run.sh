#!/bin/bash

# Quick start script untuk WhatsApp Bot
# Auto install dependencies dan start bot 24/7

echo "🚀 WhatsApp Bot Quick Start"
echo "=========================="

# Run installation
echo "📦 Running installation..."
./install.sh

echo ""
echo "🎯 Starting bot with main.js..."
echo "Press Ctrl+C to stop the bot"
echo ""

# Start bot dengan main.js yang memanggil server.js
node main.js