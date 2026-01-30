#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { prisma } from '../lib/db';

async function addHeliumOracleApis() {
  try {
    console.log('🚀 Adding Helium Oracle APIs to database...');

    const heliumOracleApis = [
      // IoT Oracle APIs
      {
        title: 'Helium IoT Entropy Oracle',
        subtitle: 'IoT entropy data from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/iot/entropy',
        wrapperUrl: '/api/helium/oracle/iot/entropy',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'IoT Entropy',
        method: 'POST',
        isActive: true,
      },
      {
        title: 'Helium IoT Gateway Reward Share',
        subtitle: 'IoT gateway reward share data from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/iot/gatewayrewardshare',
        wrapperUrl: '/api/helium/oracle/iot/gatewayrewardshare',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'IoT Gateway Rewards',
        method: 'POST',
        isActive: true,
      },
      {
        title: 'Helium IoT Beaconing Report',
        subtitle: 'IoT beaconing ingest report data from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/iot/beaconingreport',
        wrapperUrl: '/api/helium/oracle/iot/beaconingreport',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'IoT Beaconing',
        method: 'POST',
        isActive: true,
      },
      {
        title: 'Helium IoT Invalid Beacon Report',
        subtitle: 'IoT invalid beacon report data from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/iot/invalidbeaconreport',
        wrapperUrl: '/api/helium/oracle/iot/invalidbeaconreport',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'IoT Invalid Beacon',
        method: 'POST',
        isActive: true,
      },
      {
        title: 'Helium IoT Invalid Witness Report',
        subtitle: 'IoT invalid witness report data from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/iot/invalidwitnessreport',
        wrapperUrl: '/api/helium/oracle/iot/invalidwitnessreport',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'IoT Invalid Witness',
        method: 'POST',
        isActive: true,
      },
      {
        title: 'Helium IoT Proof of Coverage',
        subtitle: 'IoT proof of coverage data from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/iot/poc',
        wrapperUrl: '/api/helium/oracle/iot/poc',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'IoT PoC',
        method: 'POST',
        isActive: true,
      },
      {
        title: 'Helium IoT Reward Share',
        subtitle: 'IoT reward share data from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/iot/rewardshare',
        wrapperUrl: '/api/helium/oracle/iot/rewardshare',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'IoT Reward Share',
        method: 'POST',
        isActive: true,
      },
      {
        title: 'Helium IoT Witnessing Report',
        subtitle: 'IoT witnessing ingest report data from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/iot/witnessingreport',
        wrapperUrl: '/api/helium/oracle/iot/witnessingreport',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'IoT Witnessing',
        method: 'POST',
        isActive: true,
      },
      {
        title: 'Helium IoT Packet Report',
        subtitle: 'IoT packet report data from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/iot/packetreport',
        wrapperUrl: '/api/helium/oracle/iot/packetreport',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'IoT Packet Report',
        method: 'POST',
        isActive: true,
      },
      {
        title: 'Helium IoT Reward Manifest',
        subtitle: 'IoT reward manifest data from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/iot/rewardmanifest',
        wrapperUrl: '/api/helium/oracle/iot/rewardmanifest',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'IoT Reward Manifest',
        method: 'POST',
        isActive: true,
      },
      
      // Mobile Oracle APIs
      {
        title: 'Helium Mobile Cell Speed Test',
        subtitle: 'Mobile cell speed test ingest report from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/mobile/cellspeedtest',
        wrapperUrl: '/api/helium/oracle/mobile/cellspeedtest',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'Mobile Cell Speed',
        method: 'POST',
        isActive: true,
      },
      {
        title: 'Helium Mobile Data Transfer Session',
        subtitle: 'Mobile data transfer session ingest report from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/mobile/datatransfer',
        wrapperUrl: '/api/helium/oracle/mobile/datatransfer',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'Mobile Data Transfer',
        method: 'POST',
        isActive: true,
      },
      {
        title: 'Helium Mobile Reward Share',
        subtitle: 'Mobile reward share data from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/mobile/rewardshare',
        wrapperUrl: '/api/helium/oracle/mobile/rewardshare',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'Mobile Reward Share',
        method: 'POST',
        isActive: true,
      },
      {
        title: 'Helium Mobile Reward Manifest',
        subtitle: 'Mobile reward manifest data from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/mobile/rewardmanifest',
        wrapperUrl: '/api/helium/oracle/mobile/rewardmanifest',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'Mobile Reward Manifest',
        method: 'POST',
        isActive: true,
      },
      {
        title: 'Helium Mobile Speed Test Average',
        subtitle: 'Mobile speed test average data from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/mobile/speedtestavg',
        wrapperUrl: '/api/helium/oracle/mobile/speedtestavg',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'Mobile Speed Test Avg',
        method: 'POST',
        isActive: true,
      },
      {
        title: 'Helium Mobile Validated Heartbeat',
        subtitle: 'Mobile validated heartbeat data from Helium Oracle (block_date parameter)',
        path: '/api/helium/oracle/mobile/heartbeat',
        wrapperUrl: '/api/helium/oracle/mobile/heartbeat',
        originalUrl: 'https://analytics.topledger.xyz/helium/api/queries/14746/results',
        menuName: 'Helium',
        pageName: 'Mobile Heartbeat',
        method: 'POST',
        isActive: true,
      },
    ];

    for (const api of heliumOracleApis) {
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

    console.log('🎉 Helium Oracle APIs added to database successfully!');
  } catch (error) {
    console.error('❌ Error adding Helium Oracle APIs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addHeliumOracleApis()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });