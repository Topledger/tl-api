#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { PrismaClient } from '../lib/generated/prisma';
import { isS3Configured } from '../lib/s3';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();

interface ApiItem {
  endpoint: string;
  apiKey: string;
  title: string;
  subtitle: string;
  page: string;
  pageName: string;
  menuId: string;
  menuName: string;
  responseColumns?: Array<{
    name: string;
    type: string;
    description?: string;
    example?: string;
  }>;
  description?: string;
}

interface ApiData {
  totalApis: number;
  extractedAt: string;
  apis: ApiItem[];
}

// Custom S3 function for this script
async function getApiDataFromS3WithCorrectRegion() {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  // Create S3 client with correct region
  const s3Client = new S3Client({
    region: 'ap-southeast-2', // The correct region for your bucket
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: 'admin/api-data/api-data.json',
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('No data returned from S3');
    }

    // Convert stream to string
    const bodyString = await response.Body.transformToString();
    
    // Parse JSON
    const data = JSON.parse(bodyString);
    
    return data as ApiData;
  } catch (error) {
    console.error('Error fetching data from S3:', error);
    throw new Error(`Failed to fetch data from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function populateApiEndpoints() {
  console.log('🚀 Starting API endpoints population from S3...');
  
  // Check S3 configuration
  if (!isS3Configured()) {
    console.error('❌ S3 is not configured. Please check your environment variables:');
    console.error('- AWS_ACCESS_KEY_ID');
    console.error('- AWS_SECRET_ACCESS_KEY');
    console.error('- AWS_S3_BUCKET_NAME');
    console.error('- AWS_REGION');
    process.exit(1);
  }
  
  console.log('✅ S3 is configured');
  
  // Override the region if needed based on error message
  if (!process.env.AWS_REGION) {
    console.log('🔧 Setting AWS region to ap-southeast-2 based on bucket location');
    process.env.AWS_REGION = 'ap-southeast-2';
  }
  
  try {
    // Fetch data from S3
    console.log('📡 Fetching API data from S3 (admin/api-data/api-data.json)...');
    const apiData: ApiData = await getApiDataFromS3WithCorrectRegion();
    
    console.log(`✅ Successfully fetched ${apiData.apis.length} APIs from S3`);
    console.log(`📅 Data extracted at: ${apiData.extractedAt}`);
    
    // Clear existing data
    console.log('🗑️  Clearing existing API endpoints...');
    await prisma.apiEndpoint.deleteMany();
    console.log('✅ Cleared existing data');
    
    // Prepare data for insertion
    const endpointsToInsert = apiData.apis.map((api: ApiItem) => {
      const originalUrl = api.endpoint;
      let pathFromUrl: string;
      
      try {
        pathFromUrl = new URL(originalUrl).pathname;
      } catch (error) {
        console.warn(`⚠️  Invalid URL for API "${api.title}": ${originalUrl}`);
        pathFromUrl = `/unknown/${Math.random().toString(36).substring(7)}`;
      }
      
      return {
        title: api.title || 'Unknown API',
        subtitle: api.subtitle || '',
        path: pathFromUrl,
        wrapperUrl: `/api/tl${pathFromUrl}`,
        originalUrl: originalUrl,
        menuName: api.menuName || 'General',
        pageName: api.pageName || 'Default',
        method: 'GET', // Default method for Top Ledger APIs
        isActive: true,
      };
    });
    
    // Insert data in batches to avoid overwhelming the database
    const batchSize = 50;
    console.log(`📝 Inserting ${endpointsToInsert.length} endpoints in batches of ${batchSize}...`);
    
    for (let i = 0; i < endpointsToInsert.length; i += batchSize) {
      const batch = endpointsToInsert.slice(i, i + batchSize);
      
      await prisma.apiEndpoint.createMany({
        data: batch,
        skipDuplicates: true, // Skip if path already exists
      });
      
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(endpointsToInsert.length / batchSize);
      console.log(`✅ Inserted batch ${batchNumber}/${totalBatches}`);
    }
    
    // Verify insertion
    const totalInserted = await prisma.apiEndpoint.count();
    console.log(`🎉 Successfully populated api_endpoints table with ${totalInserted} records!`);
    
    // Show some sample data
    const sampleEndpoints = await prisma.apiEndpoint.findMany({
      take: 3,
      select: {
        title: true,
        path: true,
        menuName: true,
        pageName: true,
      },
    });
    
    console.log('\n📋 Sample inserted data:');
    sampleEndpoints.forEach((endpoint, index) => {
      console.log(`${index + 1}. ${endpoint.title}`);
      console.log(`   Path: ${endpoint.path}`);
      console.log(`   Category: ${endpoint.menuName} > ${endpoint.pageName}`);
    });
    
  } catch (error) {
    console.error('❌ Error populating API endpoints:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateApiEndpoints()
  .then(() => {
    console.log('\n🏁 Population script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Population script failed:', error);
    process.exit(1);
  });
