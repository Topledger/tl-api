# Top Ledger API Platform

A comprehensive Next.js application for managing and accessing Top Ledger's Solana blockchain APIs with Google authentication.

## Features

- **Google Authentication**: Secure login with Google OAuth
- **Real API Integration**: Access to Top Ledger's Instruction, Discriminator, and Verify IDL APIs
- **User Management**: Persistent user data stored in JSON files
- **API Key Management**: Create, edit, and manage API keys
- **Usage Analytics**: Track API usage with interactive charts
- **Billing History**: View billing cycles and payment history
- **Responsive Design**: Modern UI with Tailwind CSS

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Google OAuth

1. Go to the [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## API Endpoints

The application proxies requests to the following Top Ledger APIs:

- **Instruction API**: `POST /api/instruction` - Analyze Solana instruction data
- **Discriminator API**: `POST /api/discriminator` - Resolve instruction discriminators
- **Verify IDL API**: `POST /api/verify-idl` - Validate Anchor IDL files

### Example Usage

```bash
# Using the Instruction API
curl -X POST https://localhost:3000/api/instruction \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "sample_instruction_data",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "network": "mainnet-beta"
  }'
```

## User Data Storage

User data is automatically stored in `data/users.json` when users sign in with Google. Each user gets:

- 44,000 API credits upon registration
- Basic plan by default
- 30-day billing cycle
- Automatic last login tracking

## Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Authentication**: NextAuth.js with Google provider
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Heroicons
- **Data Storage**: JSON files (development) - easily extendable to databases

## File Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── (pages)/           # Application pages
├── components/            # React components
│   ├── Layout/           # Layout components
│   └── UI/               # Reusable UI components
├── lib/                  # Utilities and configurations
├── types/                # TypeScript type definitions
└── data/                 # User data storage (auto-generated)
```

## Development

### Adding New APIs

1. Create a new route in `app/api/`
2. Add the API endpoint to `lib/mockData.ts`
3. Update the proxy configuration if needed

### Customizing Authentication

The authentication configuration is in `lib/auth.ts`. You can:

- Add new OAuth providers
- Customize user data structure
- Modify session handling
- Change redirect URLs

## Deployment

1. Set up environment variables in your hosting platform
2. Configure Google OAuth redirect URIs for production
3. Deploy using Vercel, Netlify, or your preferred platform

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
