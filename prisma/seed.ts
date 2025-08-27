import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'lokesh.tiwari@gmail.com' },
    update: {},
    create: {
      email: 'lokesh.tiwari@gmail.com',
      name: 'Lokesh Tiwari',
      plan: 'Basic',
    },
  });

  console.log('✅ Created user:', user.email);

  // Create API keys for the user
  const apiKeys = [
    {
      name: 'Production API',
      key: 'BBohjJhtsyggedgavpjn',
      description: 'Main production API key',
      userId: user.id,
    },
    {
      name: 'Development Key',
      key: 'CCohjJhtsyggedgavpjn',
      description: 'Development and testing',
      userId: user.id,
    },
    {
      name: 'Final Test Key',
      key: 'MuLdI5h7rj1SOAdagz8J',
      description: 'Test key for final testing',
      userId: user.id,
    },
  ];

  for (const keyData of apiKeys) {
    const apiKey = await prisma.apiKey.upsert({
      where: { key: keyData.key },
      update: {},
      create: keyData,
    });
    console.log('✅ Created API key:', apiKey.name);
  }

  // Load and create API endpoints from the JSON file
  try {
    const fs = require('fs');
    const path = require('path');
    const apisPath = path.join(process.cwd(), 'public', 'apis_list.json');
    
    if (fs.existsSync(apisPath)) {
      const fileData = fs.readFileSync(apisPath, 'utf8');
      const apiData = JSON.parse(fileData);
      
      console.log(`📡 Found ${apiData.apis.length} APIs to seed...`);
      
      // Create endpoints in batches to avoid overwhelming the database
      const batchSize = 50;
      for (let i = 0; i < apiData.apis.length; i += batchSize) {
        const batch = apiData.apis.slice(i, i + batchSize);
        
        const endpointPromises = batch.map((api: any) => {
          const pathFromUrl = new URL(api.endpoint).pathname;
          return prisma.apiEndpoint.upsert({
            where: { path: pathFromUrl },
            update: {},
            create: {
              title: api.title || 'Unknown API',
              subtitle: api.subtitle || '',
              path: pathFromUrl,
              wrapperUrl: `/api/tl${pathFromUrl}`,
              originalUrl: api.endpoint,
              menuName: api.menuName || 'General',
              pageName: api.pageName || 'Default',
              method: 'GET', // Default method
            },
          });
        });
        
        await Promise.all(endpointPromises);
        console.log(`✅ Seeded batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(apiData.apis.length/batchSize)}`);
      }
      
      console.log('✅ Seeded all API endpoints');
    } else {
      console.log('⚠️  No APIs list file found, skipping endpoint seeding');
    }
  } catch (error) {
    console.error('❌ Error seeding API endpoints:', error);
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
