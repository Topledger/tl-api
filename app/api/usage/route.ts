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

    // Calculate total usage for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const currentMonthUsage = (userData.usageData || [])
      .filter((usage: any) => usage.date.startsWith(currentMonth))
      .reduce((total: number, usage: any) => total + usage.requests, 0);

    // Get last 30 days of usage data
    const last30Days = (userData.usageData || []).slice(-30);

    return NextResponse.json({
      totalUsage: userData.credits?.used || 0,
      currentMonthUsage,
      remainingCredits: userData.credits?.remaining || 0,
      dailyUsage: last30Days,
      usageByEndpoint: userData.apiUsageByEndpoint || {}
    });
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 