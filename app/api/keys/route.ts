import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isS3Configured, getUserApiKeysFromS3, saveUserApiKeysToS3 } from '@/lib/s3';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔑 Loading API keys for user: ${session.user.email}`);

    // Try database first (primary)
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { apiKeys: true }
      });

      if (user && user.apiKeys.length > 0) {
        console.log(`✅ Loaded ${user.apiKeys.length} API keys from database`);
        const cleanApiKeys = user.apiKeys.map(key => ({
          id: key.id,
          name: key.name,
          key: key.key,
          description: key.description,
          createdAt: key.createdAt.toISOString().split('T')[0],
          lastUsed: key.lastUsed?.toISOString().split('T')[0] || null,
          totalHits: key.totalHits,
          dailyHits: [] // Could be calculated from API logs if needed
        }));
        return NextResponse.json(cleanApiKeys);
      }
    } catch (dbError) {
      console.error('❌ Database query failed, falling back to S3/local:', dbError);
    }

    // Fallback to S3 if database fails or has no data
    const userId = session.user.email.replace('@', '_').replace('.', '_');
    let apiKeys: any[] = [];

    if (isS3Configured()) {
      try {
        console.log('📡 Falling back to S3...');
        apiKeys = await getUserApiKeysFromS3(userId);
        console.log(`✅ Loaded ${apiKeys.length} API keys from S3`);
      } catch (error) {
        console.error('❌ Failed to load from S3, falling back to local storage:', error);
        apiKeys = await getApiKeysFromLocal(userId);
      }
    } else {
      console.log('📁 S3 not configured, loading from local storage');
      apiKeys = await getApiKeysFromLocal(userId);
    }

    // Clean the API keys data
    const cleanApiKeys = apiKeys.map((key: any) => ({
      id: key.id,
      name: key.name,
      key: key.key,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      totalHits: key.totalHits,
      dailyHits: key.dailyHits || []
    }));

    return NextResponse.json(cleanApiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper function to get API keys from local storage
async function getApiKeysFromLocal(userId: string): Promise<any[]> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileData);
    
    const userData = data.users?.[userId];
    if (!userData || !userData.apiKeys) {
      console.log(`📁 No local API keys found for user: ${userId}`);
      return [];
    }

    console.log(`📁 Loaded ${userData.apiKeys.length} API keys from local storage`);
    return userData.apiKeys;
  } catch (error) {
    console.error('Error reading local API keys:', error);
    return [];
  }
}

// Helper function to save API keys to local storage
async function saveApiKeysToLocal(userId: string, apiKeys: any[]): Promise<void> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'users.json');
    
    // Read existing data or create new structure
    let data: any = { users: {} };
    try {
      const fileData = fs.readFileSync(dataPath, 'utf8');
      data = JSON.parse(fileData);
    } catch (error) {
      console.log('Creating new users.json file');
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(dataPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    }

    // Ensure users object exists
    if (!data.users) {
      data.users = {};
    }

    // Update user's API keys
    if (!data.users[userId]) {
      data.users[userId] = {};
    }
    
    data.users[userId].apiKeys = apiKeys;
    
    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log(`📁 Saved ${apiKeys.length} API keys to local storage for user: ${userId}`);
  } catch (error) {
    console.error('Error saving local API keys:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 });
    }

    console.log(`🔑 Creating new API key for user: ${session.user.email}`);

    // Generate unique API key
    const apiKey = await generateUniqueApiKey();

    // Try database first (primary)
    try {
      // Ensure user exists in database
      const user = await prisma.user.upsert({
        where: { email: session.user.email },
        update: {},
        create: {
          email: session.user.email,
          name: session.user.name || 'Unknown User'
        }
      });

      // Create API key in database
      const newKey = await prisma.apiKey.create({
        data: {
          name,
          key: apiKey,
          description: description || null,
          userId: user.id
        }
      });

      console.log(`✅ Created API key in database: ${name}`);

      // Also sync to S3 as backup (if configured)
      if (isS3Configured()) {
        try {
          const userId = session.user.email.replace('@', '_').replace('.', '_');
          const s3Keys = await getUserApiKeysFromS3(userId).catch(() => []);
          s3Keys.push({
            id: newKey.id,
            name: newKey.name,
            key: newKey.key,
            description: newKey.description,
            createdAt: newKey.createdAt.toISOString().split('T')[0],
            lastUsed: null,
            totalHits: 0,
            dailyHits: []
          });
          await saveUserApiKeysToS3(userId, s3Keys);
          console.log('✅ Synced to S3 as backup');
        } catch (s3Error) {
          console.error('⚠️  Failed to sync to S3 backup:', s3Error);
          // Don't fail the request if S3 sync fails
        }
      }

      return NextResponse.json({
        id: newKey.id,
        name: newKey.name,
        key: newKey.key,
        description: newKey.description,
        createdAt: newKey.createdAt.toISOString().split('T')[0],
        lastUsed: null,
        totalHits: 0,
        dailyHits: []
      }, { status: 201 });

    } catch (dbError) {
      console.error('❌ Database creation failed, falling back to S3/local:', dbError);
      
      // Fallback to original S3/local approach
      const userId = session.user.email.replace('@', '_').replace('.', '_');
      
      // Generate a new unique API key
      const newKey = {
        id: `key_${Date.now()}`,
        name,
        key: apiKey,
        description: description || null,
        createdAt: new Date().toISOString().split('T')[0],
        lastUsed: null,
        totalHits: 0,
        dailyHits: []
      };

      // Get existing API keys
      let apiKeys: any[] = [];
      
      if (isS3Configured()) {
        try {
          console.log('📡 Loading existing API keys from S3...');
          apiKeys = await getUserApiKeysFromS3(userId);
        } catch (error) {
          console.error('❌ Failed to load from S3, falling back to local storage:', error);
          apiKeys = await getApiKeysFromLocal(userId);
        }
      } else {
        console.log('📁 S3 not configured, loading from local storage');
        apiKeys = await getApiKeysFromLocal(userId);
      }

      // Add new key
      apiKeys.push(newKey);

      // Save updated API keys
      if (isS3Configured()) {
        try {
          console.log('📡 Saving API keys to S3...');
          await saveUserApiKeysToS3(userId, apiKeys);
          console.log('✅ API keys saved to S3');
        } catch (error) {
          console.error('❌ Failed to save to S3, falling back to local storage:', error);
          await saveApiKeysToLocal(userId, apiKeys);
        }
      } else {
        console.log('📁 Saving API keys to local storage');
        await saveApiKeysToLocal(userId, apiKeys);
      }

      return NextResponse.json(newKey, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const userId = session.user.email.replace('@', '_').replace('.', '_');
    console.log(`🔑 Deleting API key ${id} for user: ${userId}`);

    // Get existing API keys
    let apiKeys: any[] = [];
    
    if (isS3Configured()) {
      try {
        console.log('📡 Loading existing API keys from S3...');
        apiKeys = await getUserApiKeysFromS3(userId);
      } catch (error) {
        console.error('❌ Failed to load from S3, falling back to local storage:', error);
        apiKeys = await getApiKeysFromLocal(userId);
      }
    } else {
      console.log('📁 S3 not configured, loading from local storage');
      apiKeys = await getApiKeysFromLocal(userId);
    }

    // Check if key exists and belongs to user
    const keyExists = apiKeys.find(key => key.id === id);
    if (!keyExists) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Filter out the key with the given ID
    const updatedApiKeys = apiKeys.filter((key: any) => key.id !== id);

    // Save updated API keys
    if (isS3Configured()) {
      try {
        console.log('📡 Saving updated API keys to S3...');
        await saveUserApiKeysToS3(userId, updatedApiKeys);
        console.log('✅ API key deleted and saved to S3');
      } catch (error) {
        console.error('❌ Failed to save to S3, falling back to local storage:', error);
        await saveApiKeysToLocal(userId, updatedApiKeys);
      }
    } else {
      console.log('📁 Saving updated API keys to local storage');
      await saveApiKeysToLocal(userId, updatedApiKeys);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });
    }

    const userId = session.user.email.replace('@', '_').replace('.', '_');
    console.log(`🔑 Updating API key ${id} for user: ${userId}`);

    // Get existing API keys
    let apiKeys: any[] = [];
    
    if (isS3Configured()) {
      try {
        console.log('📡 Loading existing API keys from S3...');
        apiKeys = await getUserApiKeysFromS3(userId);
      } catch (error) {
        console.error('❌ Failed to load from S3, falling back to local storage:', error);
        apiKeys = await getApiKeysFromLocal(userId);
      }
    } else {
      console.log('📁 S3 not configured, loading from local storage');
      apiKeys = await getApiKeysFromLocal(userId);
    }

    // Find the key with the given ID
    const keyIndex = apiKeys.findIndex((key: any) => key.id === id);
    if (keyIndex === -1) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Update the name of the key
    apiKeys[keyIndex].name = name;

    // Save updated API keys
    if (isS3Configured()) {
      try {
        console.log('📡 Saving updated API keys to S3...');
        await saveUserApiKeysToS3(userId, apiKeys);
        console.log('✅ API key updated and saved to S3');
      } catch (error) {
        console.error('❌ Failed to save to S3, falling back to local storage:', error);
        await saveApiKeysToLocal(userId, apiKeys);
      }
    } else {
      console.log('📁 Saving updated API keys to local storage');
      await saveApiKeysToLocal(userId, apiKeys);
    }

    return NextResponse.json({ key: apiKeys[keyIndex] });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper function to get all API keys across all users for uniqueness check
async function getAllApiKeysAcrossUsers(): Promise<string[]> {
  const allKeys: string[] = [];
  
  try {
    if (isS3Configured()) {
      // For S3, we'd need to implement a way to list all user keys
      // For now, we'll use a simpler approach with local storage
      console.log('📡 S3 configured, but using local storage for uniqueness check');
    }
    
    // Check local storage for all existing keys
    const dataPath = path.join(process.cwd(), 'data', 'users.json');
    try {
      const fileData = fs.readFileSync(dataPath, 'utf8');
      const data = JSON.parse(fileData);
      
      if (data.users) {
        Object.values(data.users).forEach((userData: any) => {
          if (userData.apiKeys && Array.isArray(userData.apiKeys)) {
            userData.apiKeys.forEach((key: any) => {
              if (key.key) {
                allKeys.push(key.key);
              }
            });
          }
        });
      }
    } catch (error) {
      console.log('No existing users.json file found, starting fresh');
    }
  } catch (error) {
    console.error('Error getting all API keys:', error);
  }
  
  return allKeys;
}

async function generateUniqueApiKey(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const existingKeys = await getAllApiKeysAcrossUsers();
  
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loop
  
  while (attempts < maxAttempts) {
    let result = 'tl_'; // Prefix for Top Ledger
    
    // Generate 32 characters for a more unique key
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if this key already exists
    if (!existingKeys.includes(result)) {
      console.log(`✅ Generated unique API key after ${attempts + 1} attempts`);
      return result;
    }
    
    attempts++;
  }
  
  // Fallback with timestamp if we can't generate unique key
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 15);
  return `tl_${timestamp}_${randomSuffix}`;
} 