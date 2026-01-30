#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { prisma } from '../lib/db';

async function addHeliumApis() {
  try {
    console.log('🚀 Adding Helium APIs to database...');

    const heliumApis = [
      {
        title: 'L1 Raw Block Data',
        subtitle: 'Raw block data with date filtering (start_date, end_date)',
        path: '/api/helium/queries/14744/results',
        wrapperUrl: '/api/helium/queries/14744/results',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14744/results',
        menuName: 'Helium',
        pageName: 'Block Data',
        method: 'POST',
        isActive: true,
      },
      {
        title: 'L1 Raw Transactions',
        subtitle: 'Raw transactions with block filtering (start_block, end_block)',
        path: '/api/helium/queries/14745/results',
        wrapperUrl: '/api/helium/queries/14745/results',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14745/results',
        menuName: 'Helium',
        pageName: 'Transactions',
        method: 'POST',
        isActive: true,
      },
    ];

    for (const api of heliumApis) {
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

    console.log('🎉 Helium APIs added to database successfully!');
  } catch (error) {
    console.error('❌ Error adding Helium APIs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addHeliumApis()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });