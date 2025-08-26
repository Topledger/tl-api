import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

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

// Get or create user
function getOrCreateUser(profile: { sub?: string; email: string; name: string; picture?: string }): UserData {
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
        remaining: 44000,
        total: 44000,
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
  ],
  callbacks: {
    async signIn({ profile }) {
      // Store or update user in JSON file
      if (profile) {
        getOrCreateUser(profile as { sub?: string; email: string; name: string; picture?: string });
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
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
      return session;
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.userData = getOrCreateUser(profile as { sub?: string; email: string; name: string; picture?: string });
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

// Helper function to get user by email
export function getUserByEmail(email: string): UserData | null {
  const database = readUserDatabase();
  const userKey = email.replace(/[^a-zA-Z0-9]/g, '_');
  return database.users[userKey] || null;
}

// Helper function to update user data
export function updateUserData(email: string, updates: Partial<UserData>): UserData | null {
  const database = readUserDatabase();
  const userKey = email.replace(/[^a-zA-Z0-9]/g, '_');
  
  if (!database.users[userKey]) return null;
  
  database.users[userKey] = { ...database.users[userKey], ...updates };
  database.globalStats.lastUpdated = new Date().toISOString();
  writeUserDatabase(database);
  return database.users[userKey];
} 