#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function addTradingApis() {
  try {
    console.log('🚀 Adding Trading APIs to database...');

    const tradingApis = [
      {
        title: 'Top Traders',
        subtitle: 'Top traders for a mint',
        path: '/api/top-traders/{mint}',
        wrapperUrl: '/api/top-traders/{mint}', // No /api/tl prefix for trading APIs
        originalUrl: 'http://34.107.31.9/api/top-traders/{mint}',
        menuName: 'Trading',
        pageName: 'Traders',
        method: 'GET',
        isActive: true,
      },
      {
        title: 'Top Holders',
        subtitle: 'Top holders for a mint',
        path: '/api/top-holders/{mint}',
        wrapperUrl: '/api/top-holders/{mint}', // No /api/tl prefix for trading APIs
        originalUrl: 'http://34.107.31.9/api/top-holders/{mint}',
        menuName: 'Trading',
        pageName: 'Holders',
        method: 'GET',
        isActive: true,
      },
      {
        title: 'Trending Pairs',
        subtitle: 'Trending pairs data',
        path: '/api/trending-pairs',
        wrapperUrl: '/api/trending-pairs', // No /api/tl prefix for trading APIs
        originalUrl: 'http://34.107.31.9/api/trending-pairs',
        menuName: 'Trading',
        pageName: 'Pairs',
        method: 'GET',
        isActive: true,
      },
    ];

    for (const api of tradingApis) {
      const result = await prisma.apiEndpoint.upsert({
        where: { path: api.path },
        update: {
          title: api.title,
          subtitle: api.subtitle,
          wrapperUrl: api.wrapperUrl,
          originalUrl: api.originalUrl,
          menuName: api.menuName,
          pageName: api.pageName,
          method: api.method,
          isActive: api.isActive,
        },
        create: api,
      });
      console.log(`✅ ${api.title}: ${result.id}`);
    }

    console.log('🎉 Trading APIs added to database successfully!');
  } catch (error) {
    console.error('❌ Error adding trading APIs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addTradingApis()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

