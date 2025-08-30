# Database Setup Guide

## Problem: "Invalid API keys" Error

If you're getting "invalid API keys" errors after cloning the repo and setting up `.env.local`, it's likely because the **database connection** is missing. This application uses PostgreSQL to store users and API keys.

## Required Environment Variables

Your `.env.local` file **must** include:

```env
# Database Configuration - REQUIRED
DATABASE_URL="postgresql://username:password@host:port/database_name"

# NextAuth Configuration - REQUIRED
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth Configuration - REQUIRED for authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AWS S3 Configuration - OPTIONAL
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=your-aws-region
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

## Database Setup Options

### Option 1: Local PostgreSQL (Recommended for Development)

1. **Install PostgreSQL locally:**
   ```bash
   # macOS (using Homebrew)
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download from: https://www.postgresql.org/download/windows/
   ```

2. **Create a database:**
   ```bash
   # Connect to PostgreSQL
   psql postgres
   
   # Create database and user
   CREATE DATABASE tl_api_db;
   CREATE USER tl_api_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE tl_api_db TO tl_api_user;
   \q
   ```

3. **Update your `.env.local`:**
   ```env
   DATABASE_URL="postgresql://tl_api_user:your_password@localhost:5432/tl_api_db"
   ```

### Option 2: Cloud Database (Easiest for Any Computer)

#### Using Neon (Free PostgreSQL hosting)
1. Go to [Neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Copy the connection string
4. Add to `.env.local`:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/database?sslmode=require"
   ```

#### Using Supabase (Free PostgreSQL hosting)
1. Go to [Supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database > Connection string
4. Add to `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres.xxx:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
   ```

#### Using Railway (Free PostgreSQL hosting)
1. Go to [Railway.app](https://railway.app)
2. Create a new project with PostgreSQL
3. Copy the DATABASE_URL from the Connect tab
4. Add to `.env.local`

## Setup Steps After Database Configuration

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

3. **Run database migrations:**
   ```bash
   npx prisma db push
   ```

4. **Seed the database (optional):**
   ```bash
   npx prisma db seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## Verification Steps

1. **Test database connection:**
   Visit `http://localhost:3000/api/debug-db` to check if the database is connected properly.

2. **Login and create an API key:**
   - Login with Google OAuth
   - Go to `/keys` page
   - Create a new API key
   - Test the API key with an API call

## Troubleshooting

### "Invalid API keys" Error
- **Cause:** Database connection is missing or API keys aren't created yet
- **Solution:** Ensure DATABASE_URL is set and create API keys after logging in

### "Database connection failed"
- **Cause:** Wrong DATABASE_URL or database server is down
- **Solution:** Check your DATABASE_URL format and ensure the database server is running

### "Prisma client not generated"
- **Cause:** Prisma client needs to be generated after schema changes
- **Solution:** Run `npx prisma generate`

### "Migration needed"
- **Cause:** Database schema is out of sync
- **Solution:** Run `npx prisma db push`

## Quick Setup Script

Run this script to quickly set up everything:

```bash
#!/bin/bash
echo "Setting up TL-API project..."

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed database (optional)
npx prisma db seed

echo "Setup complete! Make sure to:"
echo "1. Set up your DATABASE_URL in .env.local"
echo "2. Set up Google OAuth credentials"
echo "3. Run 'npm run dev' to start the server"
```

## Database Schema

The application uses these main tables:
- **users**: Store user information and credits
- **api_keys**: Store user-generated API keys
- **api_logs**: Track API usage and analytics
- **api_endpoints**: Store available API endpoints

All API key validation happens through the database, so a working database connection is essential for the application to function.


