#!/bin/bash

echo "🚀 Setting up TL-API project..."
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "📝 Please create .env.local file first. You can use env.example as a template:"
    echo "   cp env.example .env.local"
    echo ""
    echo "⚠️  Make sure to set these REQUIRED variables:"
    echo "   - DATABASE_URL (PostgreSQL connection string)"
    echo "   - NEXTAUTH_SECRET (random secret key)"
    echo "   - GOOGLE_CLIENT_ID (from Google Console)"
    echo "   - GOOGLE_CLIENT_SECRET (from Google Console)"
    echo ""
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "^DATABASE_URL=" .env.local; then
    echo "❌ DATABASE_URL not found in .env.local!"
    echo "📝 Please add DATABASE_URL to your .env.local file."
    echo "   Example: DATABASE_URL=\"postgresql://username:password@localhost:5432/tl_api_db\""
    echo ""
    echo "💡 See SETUP_DATABASE.md for detailed database setup instructions."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "🔧 Generating Prisma client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "🗄️  Setting up database schema..."
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Failed to setup database schema"
    echo "💡 Make sure your DATABASE_URL is correct and the database server is running"
    echo "   Test connection: npx prisma db pull"
    exit 1
fi

echo "🌱 Seeding database with sample data..."
npx prisma db seed

if [ $? -ne 0 ]; then
    echo "⚠️  Database seeding failed (this is optional)"
    echo "   You can manually seed later with: npx prisma db seed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎉 Your TL-API project is ready!"
echo ""
echo "Next steps:"
echo "1. 🔑 Make sure your .env.local has all required variables set"
echo "2. 🌐 Run 'npm run dev' to start the development server"
echo "3. 🔐 Visit http://localhost:3000 and login with Google"
echo "4. 📋 Go to /keys page to create your first API key"
echo "5. 🧪 Test your setup by visiting /api/debug-db"
echo ""
echo "📚 For database setup help, see SETUP_DATABASE.md"
echo "🐛 If you get 'invalid API keys' errors, check that:"
echo "   - DATABASE_URL is correctly set"
echo "   - You've logged in and created API keys"
echo "   - Database is running and accessible"


