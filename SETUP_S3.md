# S3 Setup Instructions

## Step 1: Create .env.local file

Create a `.env.local` file in the root directory with your AWS credentials:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth Configuration (if needed)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-actual-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-actual-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-actual-s3-bucket-name
```

## Step 2: Upload API Data to S3

Upload your API data file to your S3 bucket at this exact path:
```
admin/api-data/api-data.json
```

The file should have the same structure as `public/apis_list.json`.

## Step 3: Test the Configuration

After setting up the `.env.local` file:

1. Restart your development server: `npm run dev`
2. Check the console logs for "S3 Configuration Check" to see which variables are detected
3. The app will automatically use S3 data if all variables are configured correctly

## Troubleshooting

- Make sure the `.env.local` file is in the root directory (same level as `package.json`)
- Restart the dev server after creating/modifying `.env.local`
- Check console logs for detailed S3 configuration status
- Ensure your AWS credentials have S3 read permissions for the bucket

## Fallback Behavior

If S3 is not configured or fails:
- The app will automatically fall back to `public/apis_list.json`
- No functionality is lost - S3 is purely for dynamic updates
