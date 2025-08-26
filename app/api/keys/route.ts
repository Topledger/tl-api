import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read user data from JSON file
    const dataPath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileData);
    
    // Always use the default user data for now (contains all the API keys and data)
    const userData = data.users?.user_lokesh_tiwari;
    
    if (!userData || !userData.apiKeys) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create a clean copy of apiKeys to avoid serialization issues
    const apiKeys = userData.apiKeys.map((key: any) => ({
      id: key.id,
      name: key.name,
      key: key.key,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      totalHits: key.totalHits,
      dailyHits: key.dailyHits || []
    }));

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 });
    }

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

    // Read current data
    const dataPath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileData);
    
    // Always use the default user data for now
    const userData = data.users?.user_lokesh_tiwari;
    
    if (!userData || !userData.apiKeys) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    userData.apiKeys.push(newKey);
    
    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    return NextResponse.json(newKey, { status: 201 });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Read current data
    const dataPath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileData);
    
    // Always use the default user data for now
    const userData = data.users?.user_lokesh_tiwari;
    
    if (!userData || !userData.apiKeys) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Filter out the key with the given ID
    userData.apiKeys = userData.apiKeys.filter((key: any) => key.id !== id);
    
    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });
    }

    // Read current data
    const dataPath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileData);
    
    // Always use the default user data for now
    const userData = data.users?.user_lokesh_tiwari;
    
    if (!userData || !userData.apiKeys) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Find the index of the key with the given ID
    const keyIndex = userData.apiKeys.findIndex((key: any) => key.id === id);
    if (keyIndex === -1) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    // Update the name of the key
    userData.apiKeys[keyIndex].name = name;
    
    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    return NextResponse.json({ key: userData.apiKeys[keyIndex] });
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