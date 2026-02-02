import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  let session;
  try {
    // Check authentication
    session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔑 Loading API keys for user: ${session.user.email}`);

    // Ensure user exists in database
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: {
        email: session.user.email,
        name: session.user.name || 'Unknown User',
        credits: 1000,
        picture: session.user.image || null
      },
      include: { apiKeys: true }
    });

    // If user has no API keys, auto-generate the first one
    if (user.apiKeys.length === 0) {
      console.log(`🔑 No API keys found for user ${session.user.email}, auto-generating first key...`);
      
      const apiKey = await generateUniqueApiKey();
      const newKey = await prisma.apiKey.create({
        data: {
          name: 'Default API Key',
          key: apiKey,
          //description: 'Auto-generated default API key',
          userId: user.id
        }
      });
      
     
      
      // Return the newly created key
      const cleanApiKeys = [{
        id: newKey.id,
        name: newKey.name,
        key: newKey.key,
        //description: newKey.description,
        createdAt: newKey.createdAt.toISOString().split('T')[0],
        lastUsed: null,
        totalHits: 0,
        dailyHits: []
      }];
      return NextResponse.json(cleanApiKeys);
    }

    // Return existing keys
    console.log(`✅ Loaded ${user.apiKeys.length} API keys from database`);
    const cleanApiKeys = user.apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      key: key.key,
      //description: key.description,
      createdAt: key.createdAt.toISOString().split('T')[0],
      lastUsed: key.lastUsed?.toISOString().split('T')[0] || null,
      totalHits: key.totalHits,
      dailyHits: [] // Could be calculated from API logs if needed
    }));
    return NextResponse.json(cleanApiKeys);

  } catch (error) {
    console.error('❌ Error fetching API keys:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      session: session?.user?.email || 'No session'
    });
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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

    // Ensure user exists in database
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: {
        email: session.user.email,
        name: session.user.name || 'Unknown User',
        credits: 1000,
        picture: session.user.image || null
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

  } catch (error) {
    console.error('❌ Error creating API key:', error);
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

    console.log(`🔑 Deleting API key ${id} for user: ${session.user.email}`);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { apiKeys: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if key exists and belongs to user
    const keyExists = user.apiKeys.find(key => key.id === id);
    if (!keyExists) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Delete from database
    await prisma.apiKey.delete({
      where: { 
        id: id,
        userId: user.id // Ensure it belongs to the user
      }
    });

    console.log(`✅ Deleted API key from database: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting API key:', error);
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

    console.log(`🔑 Updating API key ${id} for user: ${session.user.email}`);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { apiKeys: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if key exists and belongs to user
    const keyExists = user.apiKeys.find(key => key.id === id);
    if (!keyExists) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Update the API key
    const updatedKey = await prisma.apiKey.update({
      where: { 
        id: id,
        userId: user.id // Ensure it belongs to the user
      },
      data: { name }
    });

    console.log(`✅ Updated API key in database: ${id}`);

    return NextResponse.json({
      key: {
        id: updatedKey.id,
        name: updatedKey.name,
        key: updatedKey.key,
        description: updatedKey.description,
        createdAt: updatedKey.createdAt.toISOString().split('T')[0],
        lastUsed: updatedKey.lastUsed?.toISOString().split('T')[0] || null,
        totalHits: updatedKey.totalHits,
        dailyHits: []
      }
    });
  } catch (error) {
    console.error('❌ Error updating API key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper function to get all API keys across all users for uniqueness check
async function getAllApiKeysAcrossUsers(): Promise<string[]> {
  try {
    // Get all API keys from database
    const allApiKeys = await prisma.apiKey.findMany({
      select: { key: true }
    });
    
    return allApiKeys.map(apiKey => apiKey.key);
  } catch (error) {
    console.error('Error getting all API keys from database:', error);
    return [];
  }
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