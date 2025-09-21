#!/bin/bash
echo "� MStress Platform Setup"
echo "========================="
echo "Setting up development environment..."

# Check Node.js
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js found: $(node --version)"
else
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check Python
if command -v python3 >/dev/null 2>&1; then
    echo "✅ Python found: $(python3 --version)"
else
    echo "❌ Python 3 not found. Please install Python 3.9+"
    exit 1
fi

# Create environment files
echo "� Creating environment files..."
[ ! -f frontend/.env ] && cp frontend/.env.example frontend/.env 2>/dev/null || echo "VITE_API_URL=http://localhost:5000" > frontend/.env
[ ! -f backend/.env ] && cp backend/.env.example backend/.env 2>/dev/null || echo "PORT=5000" > backend/.env
[ ! -f ai-services/.env ] && cp ai-services/.env.example ai-services/.env 2>/dev/null || echo "PORT=8000" > ai-services/.env

# Install dependencies
echo "� Installing dependencies..."
npm install 2>/dev/null || echo "Root npm install skipped"
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
cd ai-services && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && deactivate && cd ..

echo "� Setup complete!"
echo "Run 'npm run dev' to start all services"
