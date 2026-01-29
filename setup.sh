#!/bin/bash

# FOURBYTE Development Setup Script
# This script automates the setup process for local development

echo "🔷 FOURBYTE Setup Script"
echo "========================="
echo ""

# Check Node.js installation
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js version is $NODE_VERSION. Version 18+ is recommended."
else
    echo "✅ Node.js $(node -v) detected"
fi

echo ""

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server || exit
if npm install; then
    echo "✅ Server dependencies installed"
else
    echo "❌ Failed to install server dependencies"
    exit 1
fi
cd ..

echo ""

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client || exit
if npm install; then
    echo "✅ Client dependencies installed"
else
    echo "❌ Failed to install client dependencies"
    exit 1
fi
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start development:"
echo ""
echo "   Terminal 1 (Server):"
echo "   $ cd server && npm start"
echo ""
echo "   Terminal 2 (Client):"
echo "   $ cd client && npx ng serve"
echo ""
echo "   Then open http://localhost:4200"
echo ""
