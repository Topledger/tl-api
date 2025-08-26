import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isS3Configured, getUserApiKeysFromS3, saveUserApiKeysToS3 } from '@/lib/s3';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email.replace('@', '_').replace('.', '_');
    console.log(`🔑 Loading API keys for user: ${userId}`);

    let apiKeys: any[] = [];

    // Try S3 first, fallback to local storage
    if (isS3Configured()) {
      try {
        console.log('📡 Loading API keys from S3...');
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

    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 });
    }

    const userId = session.user.email.replace('@', '_').replace('.', '_');
    console.log(`🔑 Creating new API key for user: ${userId}`);

    // Generate a new API key
    const newKey = {
      id: `key_${Date.now()}`,
      name,
      key: generateApiKey(),
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

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
} 