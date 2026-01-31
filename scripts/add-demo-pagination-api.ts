#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { prisma } from '../lib/db';

async function addDemoPaginationApi() {
  try {
    console.log('🚀 Adding Demo Pagination API to database...');

    const demoApi = {
      title: 'Demo Large Dataset (Pagination)',
      subtitle: 'Demonstrates pagination with different dataset sizes (offset=1,2,3...)',
      path: '/api/demo-large-dataset',
      wrapperUrl: '/api/demo-large-dataset',
      originalUrl: 'http://localhost:3000/api/demo-large-dataset',
      menuName: 'Demo',
      pageName: 'Pagination Demo',
      method: 'GET',
      isActive: true,
    };

    const result = await prisma.apiEndpoint.upsert({
      where: { path: demoApi.path },
      update: {
        title: demoApi.title,
        subtitle: demoApi.subtitle,
        wrapperUrl: demoApi.wrapperUrl,
        originalUrl: demoApi.originalUrl,
        menuName: demoApi.menuName,
        pageName: demoApi.pageName,
        method: demoApi.method,
        isActive: demoApi.isActive,
      },
      create: demoApi,
    });

    console.log(`✅ ${demoApi.title}: ${result.id}`);
    console.log('🎉 Demo Pagination API added to database successfully!');
  } catch (error) {
    console.error('❌ Error adding Demo Pagination API:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addDemoPaginationApi()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });