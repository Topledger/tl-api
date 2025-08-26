import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read user data from JSON file
    const dataPath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileData);
    
    // Always use the default user data for now
    const userData = data.users?.user_lokesh_tiwari;
    
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 