import { addDays, format } from 'date-fns';
import { ApiEndpoint, ApiKey, UsageData, BillingHistory, User } from './store';

export const mockUser: User = {
  id: 'user_1',
  email: 'abc.bcd3@gmail.com',
  plan: 'Basic',
  credits: {
    used: 19000,
    remaining: 25000,
    total: 44000,
  },
  billingCycle: {
    start: '2024-09-24',
    end: '2024-10-23',
  },
};

export const mockApiKeys: ApiKey[] = [
  {
    id: 'key_1',
    name: 'Largegrove',
    key: 'AAohjJhtsyggedgavpjn',
    createdAt: '2024-09-25',
    lastUsed: '2024-09-25',
  },
  {
    id: 'key_2',
    name: 'Production Key',
    key: 'BBohjJhtsyggedgavpjn',
    createdAt: '2024-09-20',
    lastUsed: '2024-09-25',
  },
  {
    id: 'key_3',
    name: 'Development Key',
    key: 'CCohjJhtsyggedgavpjn',
    createdAt: '2024-09-15',
    lastUsed: undefined,
  },
];

export const mockApiEndpoints: ApiEndpoint[] = [
  {
    id: 'api_1',
    name: 'Instruction API',
    path: '/api/instruction',
    description: 'Get instruction data and metadata for Solana program analysis and debugging',
    method: 'POST',
    requestSchema: {
      instruction: 'string',
      programId: 'string (optional)',
      network: 'string (optional, default: mainnet-beta)'
    },
    responseSchema: {
      instruction: 'object',
      programId: 'string',
      instructionName: 'string',
      args: 'object',
      accounts: 'array'
    },
  },
  {
    id: 'api_2',
    name: 'Discriminator API',
    path: '/api/discriminator',
    description: 'Resolve instruction discriminators to human-readable instruction names and metadata',
    method: 'POST',
    requestSchema: {
      discriminator: 'string',
      programId: 'string (optional)',
      network: 'string (optional, default: mainnet-beta)'
    },
    responseSchema: {
      discriminator: 'string',
      instructionName: 'string',
      programId: 'string',
      programName: 'string',
      description: 'string'
    },
  },
  {
    id: 'api_3',
    name: 'Verify IDL API',
    path: '/api/verify-idl',
    description: 'Verify and validate Anchor IDL files for Solana programs with comprehensive error checking',
    method: 'POST',
    requestSchema: {
      idl: 'object',
      programId: 'string (optional)',
      strict: 'boolean (optional, default: false)'
    },
    responseSchema: {
      valid: 'boolean',
      errors: 'array',
      warnings: 'array',
      programId: 'string',
      version: 'string',
      metadata: 'object'
    },
  },
];

// Generate usage data for the last 30 days
export const mockUsageData: UsageData[] = Array.from({ length: 30 }, (_, i) => {
  const date = addDays(new Date(), -29 + i);
  return {
    date: format(date, 'yyyy-MM-dd'),
    requests: Math.floor(Math.random() * 1000) + 200,
  };
});

export const mockBillingHistory: BillingHistory[] = [
  {
    id: 'bill_1',
    date: '2024-09-25',
    amount: 50,
    currency: 'USD',
    status: 'paid',
    invoiceUrl: '/invoices/bill_1.pdf',
  },
  {
    id: 'bill_2',
    date: '2024-09-25',
    amount: 50,
    currency: 'USD',
    status: 'paid',
    invoiceUrl: '/invoices/bill_2.pdf',
  },
  {
    id: 'bill_3',
    date: '2024-09-25',
    amount: 50,
    currency: 'USD',
    status: 'paid',
    invoiceUrl: '/invoices/bill_3.pdf',
  },
  {
    id: 'bill_4',
    date: '2024-09-25',
    amount: 50,
    currency: 'USD',
    status: 'paid',
    invoiceUrl: '/invoices/bill_4.pdf',
  },
];

// API endpoint specific usage data
export const getApiEndpointUsage = (apiId: string): UsageData[] => {
  return Array.from({ length: 30 }, (_, i) => {
    const date = addDays(new Date(), -29 + i);
    // Generate values in the hundreds of millions to match the chart scale (200M, 400M, 600M, 800M)
    const baseValue = 300000000; // 300M base
    const variation = Math.floor(Math.random() * 400000000); // +/- 400M variation
    return {
      date: format(date, 'yyyy-MM-dd'),
      requests: Math.max(100000000, baseValue + variation), // Minimum 100M, maximum ~700M
    };
  });
}; 