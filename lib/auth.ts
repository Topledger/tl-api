import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import DiscordProvider from 'next-auth/providers/discord';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verify } from 'jsonwebtoken';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { prisma } from './db';

// Path to store user data
const USER_DATA_PATH = join(process.cwd(), 'data', 'users.json');

// Interface for user data
interface UserData {
  id: string;
  email: string;
  name: string;
  image?: string;
  plan: string;
  credits: {
    used: number;
    remaining: number;
    total: number;
  };
  billingCycle: {
    start: string;
    end: string;
  };
  createdAt: string;
  lastLogin: string;
}

// Interface for the JSON file structure
interface UserDatabase {
  users: {
    [key: string]: UserData;
  };
  globalStats: {
    totalUsers: number;
    totalApiCalls: number;
    totalRevenue: number;
    lastUpdated: string;
  };
}

// Ensure data directory exists and initialize users file
function ensureUserDataFile() {
  const dataDir = join(process.cwd(), 'data');
  
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  
  if (!existsSync(USER_DATA_PATH)) {
    const initialData: UserDatabase = {
      users: {},
      globalStats: {
        totalUsers: 0,
        totalApiCalls: 0,
        totalRevenue: 0,
        lastUpdated: new Date().toISOString()
      }
    };
    writeFileSync(USER_DATA_PATH, JSON.stringify(initialData, null, 2));
  }
}

// Read users from JSON file
function readUserDatabase(): UserDatabase {
  ensureUserDataFile();
  try {
    const data = readFileSync(USER_DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return {
      users: {},
      globalStats: {
        totalUsers: 0,
        totalApiCalls: 0,
        totalRevenue: 0,
        lastUpdated: new Date().toISOString()
      }
    };
  }
}

// Write users to JSON file
function writeUserDatabase(database: UserDatabase) {
  ensureUserDataFile();
  try {
    writeFileSync(USER_DATA_PATH, JSON.stringify(database, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
  }
}

// Get or create user in database
async function getOrCreateUser(profile: { sub?: string; email: string; name: string; picture?: string }): Promise<UserData> {
  try {
    // First try to find existing user in database
    let user = await prisma.user.findUnique({
      where: { email: profile.email }
    });

    if (!user) {
      // Create new user in database
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          plan: 'Basic',
          credits: 30000 // Default credits
        }
      });

      console.log(`✅ Created new user in database: ${user.email} with ${user.credits} credits`);
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: profile.name,
          picture: profile.picture,
          updatedAt: new Date()
        }
      });

      console.log(`🔄 Updated existing user: ${user.email} (${user.credits} credits remaining)`);
    }

    // Convert database user to UserData format for compatibility
    const userData: UserData = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.picture || undefined,
      plan: user.plan,
      credits: {
        used: 0, // We don't track this separately in the new system
        remaining: user.credits,
        total: user.credits, // For now, use current credits as total
      },
      billingCycle: {
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      createdAt: user.createdAt.toISOString(),
      lastLogin: new Date().toISOString(),
    };

    // Also maintain JSON file for backward compatibility
    try {
      const database = readUserDatabase();
      const userKey = profile.email.replace(/[^a-zA-Z0-9]/g, '_');
      database.users[userKey] = userData;
      database.globalStats.totalUsers = Object.keys(database.users).length;
      database.globalStats.lastUpdated = new Date().toISOString();
      writeUserDatabase(database);
    } catch (jsonError) {
      console.error('Error updating JSON file (non-critical):', jsonError);
    }

    return userData;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    
    // Fallback to JSON file system
    console.log('Falling back to JSON file system...');
    return getOrCreateUserFromJSON(profile);
  }
}

// Fallback function for JSON file system
function getOrCreateUserFromJSON(profile: { sub?: string; email: string; name: string; picture?: string }): UserData {
  const database = readUserDatabase();
  const userKey = profile.email.replace(/[^a-zA-Z0-9]/g, '_'); // Safe key for object
  let user = database.users[userKey];
  
  if (!user) {
    // Create new user with default credits
    user = {
      id: profile.sub || `user_${Date.now()}`,
      email: profile.email,
      name: profile.name,
      image: profile.picture,
      plan: 'Basic',
      credits: {
        used: 0,
        remaining: 30000, // Default credits
        total: 30000,
      },
      billingCycle: {
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    
    database.users[userKey] = user;
    database.globalStats.totalUsers = Object.keys(database.users).length;
    database.globalStats.lastUpdated = new Date().toISOString();
  } else {
    // Update last login
    user.lastLogin = new Date().toISOString();
    user.name = profile.name; // Update name in case it changed
    user.image = profile.picture; // Update image in case it changed
    database.users[userKey] = user;
  }
  
  writeUserDatabase(database);
  return user;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: 'solana',
      name: 'Solana Wallet',
      credentials: {
        token: { label: 'Token', type: 'text' },
        publicKey: { label: 'Public Key', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.token || !credentials?.publicKey) {
          return null;
        }

        try {
          // Verify the token (this token was already created by our /api/auth/verify endpoint)
          const decoded = verify(credentials.token, process.env.NEXTAUTH_SECRET!) as any;
          
          if (decoded.publicKey !== credentials.publicKey) {
            return null;
          }

          // Get user data from our database
          const userData = await getOrCreateSolanaUser(credentials.publicKey);

          return {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            image: userData.image,
            publicKey: credentials.publicKey,
          };
        } catch (error) {
          console.error('Solana auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ profile, account, user }) {
      // For OAuth providers (Google, Discord), store or update user in database
      if (profile && account?.type === 'oauth') {
        await getOrCreateUser(profile as { sub?: string; email: string; name: string; picture?: string });
      }
      // For Solana credentials provider, the user is already handled in authorize()
      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          // Try to get user from database first
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email }
          });

          if (dbUser) {
            session.user = {
              ...session.user,
              id: dbUser.id,
              plan: dbUser.plan,
              publicKey: dbUser.publicKey || undefined,
              credits: {
                used: 0,
                remaining: dbUser.credits,
                total: dbUser.credits,
              },
              billingCycle: {
                start: new Date().toISOString().split('T')[0],
                end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              },
            };
          } else {
            // Fallback to JSON file
            const database = readUserDatabase();
            const userKey = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
            const userData = database.users[userKey];
            if (userData) {
              session.user = {
                ...session.user,
                id: userData.id,
                plan: userData.plan,
                credits: userData.credits,
                billingCycle: userData.billingCycle,
              };
            }
          }
        } catch (error) {
          console.error('Error getting user session data:', error);
          // Fallback to JSON file
          const database = readUserDatabase();
          const userKey = session.user.email?.replace(/[^a-zA-Z0-9]/g, '_');
          const userData = userKey ? database.users[userKey] : null;
          if (userData) {
            session.user = {
              ...session.user,
              id: userData.id,
              plan: userData.plan,
              credits: userData.credits,
              billingCycle: userData.billingCycle,
            };
          }
        }
      }
      return session;
    },
    async jwt({ token, profile, user }) {
      if (profile) {
        token.userData = await getOrCreateUser(profile as { sub?: string; email: string; name: string; picture?: string });
      }
      // For Solana users, copy user data to token
      if (user && (user as any).publicKey) {
        token.publicKey = (user as any).publicKey;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
};

// Helper function to get user by email (database first, fallback to JSON)
export async function getUserByEmail(email: string): Promise<UserData | null> {
  try {
    // Try database first
    const dbUser = await prisma.user.findUnique({
      where: { email }
    });

    if (dbUser) {
      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.picture || undefined,
        plan: dbUser.plan,
        credits: {
          used: 0,
          remaining: dbUser.credits,
          total: dbUser.credits,
        },
        billingCycle: {
          start: new Date().toISOString().split('T')[0],
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        createdAt: dbUser.createdAt.toISOString(),
        lastLogin: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error('Error getting user from database:', error);
  }

  // Fallback to JSON
  const database = readUserDatabase();
  const userKey = email.replace(/[^a-zA-Z0-9]/g, '_');
  return database.users[userKey] || null;
}

// Helper function to update user data (database first, fallback to JSON)
export async function updateUserData(email: string, updates: Partial<UserData>): Promise<UserData | null> {
  try {
    // Try updating in database first
    const dbUser = await prisma.user.findUnique({
      where: { email }
    });

    if (dbUser) {
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.image && { picture: updates.image }),
          ...(updates.plan && { plan: updates.plan }),
          ...(updates.credits?.remaining && { credits: updates.credits.remaining }),
        }
      });

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.picture || undefined,
        plan: updatedUser.plan,
        credits: {
          used: 0,
          remaining: updatedUser.credits,
          total: updatedUser.credits,
        },
        billingCycle: {
          start: new Date().toISOString().split('T')[0],
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        createdAt: updatedUser.createdAt.toISOString(),
        lastLogin: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error('Error updating user in database:', error);
  }

  // Fallback to JSON file
  const database = readUserDatabase();
  const userKey = email.replace(/[^a-zA-Z0-9]/g, '_');
  
  if (!database.users[userKey]) return null;
  
  database.users[userKey] = { ...database.users[userKey], ...updates };
  database.globalStats.lastUpdated = new Date().toISOString();
  writeUserDatabase(database);
  return database.users[userKey];
}

// Get or create user for Solana wallet authentication
export async function getOrCreateSolanaUser(publicKey: string): Promise<UserData> {
  try {
    // Use publicKey as a unique identifier (like email for other providers)
    const solanaEmail = `${publicKey}@solana.wallet`;
    
    // First try to find existing user in database by publicKey
    let user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: solanaEmail },
          { publicKey: publicKey }
        ]
      }
    });

    if (!user) {
      // Create new user in database
      user = await prisma.user.create({
        data: {
          email: solanaEmail,
          name: `Solana User (${publicKey.slice(0, 8)}...)`,
          publicKey: publicKey,
          plan: 'Basic',
          credits: 30000 // Default credits
        }
      });

      console.log(`✅ Created new Solana user in database: ${publicKey} with ${user.credits} credits`);
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          publicKey: publicKey, // Ensure publicKey is set
          updatedAt: new Date()
        }
      });

      console.log(`🔄 Updated existing Solana user: ${publicKey} (${user.credits} credits remaining)`);
    }

    // Convert database user to UserData format for compatibility
    const userData: UserData = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: undefined, // Solana wallets don't have profile pictures
      plan: user.plan,
      credits: {
        used: 0,
        remaining: user.credits,
        total: user.credits,
      },
      billingCycle: {
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      createdAt: user.createdAt.toISOString(),
      lastLogin: new Date().toISOString(),
    };

    // Also maintain JSON file for backward compatibility
    try {
      const database = readUserDatabase();
      const userKey = solanaEmail.replace(/[^a-zA-Z0-9]/g, '_');
      database.users[userKey] = userData;
      database.globalStats.totalUsers = Object.keys(database.users).length;
      database.globalStats.lastUpdated = new Date().toISOString();
      writeUserDatabase(database);
    } catch (jsonError) {
      console.error('Error updating JSON file (non-critical):', jsonError);
    }

    return userData;
  } catch (error) {
    console.error('Error in getOrCreateSolanaUser:', error);
    
    // Fallback to JSON file system
    console.log('Falling back to JSON file system...');
    return getOrCreateSolanaUserFromJSON(publicKey);
  }
}

// Fallback function for JSON file system (Solana users)
function getOrCreateSolanaUserFromJSON(publicKey: string): UserData {
  const database = readUserDatabase();
  const solanaEmail = `${publicKey}@solana.wallet`;
  const userKey = solanaEmail.replace(/[^a-zA-Z0-9]/g, '_');
  let user = database.users[userKey];
  
  if (!user) {
    // Create new Solana user with default credits
    user = {
      id: `solana_${Date.now()}`,
      email: solanaEmail,
      name: `Solana User (${publicKey.slice(0, 8)}...)`,
      image: undefined,
      plan: 'Basic',
      credits: {
        used: 0,
        remaining: 30000, // Default credits
        total: 30000,
      },
      billingCycle: {
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    
    database.users[userKey] = user;
    database.globalStats.totalUsers = Object.keys(database.users).length;
    database.globalStats.lastUpdated = new Date().toISOString();
  } else {
    // Update last login
    user.lastLogin = new Date().toISOString();
    database.users[userKey] = user;
  }
  
  writeUserDatabase(database);
  return user;
} 