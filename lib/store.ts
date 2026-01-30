import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  plan: 'Basic' | 'Pro' | 'Enterprise';
  credits: {
    used: number;
    remaining: number;
    total: number;
  };
  billingCycle: {
    start: string;
    end: string;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
}

export interface ApiEndpoint {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  wrapperUrl: string;
  originalUrl?: string;
  menuName: string;
  pageName?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  responseColumns?: Array<{
    name: string;
    type: string;
    description?: string;
    example?: string;
  }>;
  description?: string;
  dailyRequests?: { date: string; requests: number }[];
}

export interface UsageData {
  date: string;
  requests: number;
}

export interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
}

interface AppState {
  user: User | null;
  apiKeys: ApiKey[];
  apiEndpoints: ApiEndpoint[];
  usageData: UsageData[];
  billingHistory: BillingHistory[];
  selectedApiKey: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setApiKeys: (keys: ApiKey[]) => void;
  addApiKey: (key: ApiKey) => void;
  deleteApiKey: (id: string) => void;
  updateApiKey: (id: string, updates: Partial<ApiKey>) => void;
  setApiEndpoints: (endpoints: ApiEndpoint[]) => void;
  setUsageData: (data: UsageData[]) => void;
  setBillingHistory: (history: BillingHistory[]) => void;
  setSelectedApiKey: (keyId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      user: null,
      apiKeys: [],
      apiEndpoints: [],
      usageData: [],
      billingHistory: [],
      selectedApiKey: null,
      isLoading: false,
      isHydrated: false,

      setUser: (user: User | null) => set({ user }),
      
      setApiKeys: (apiKeys: ApiKey[]) => set({ apiKeys }),
      
      addApiKey: (key: ApiKey) =>
        set((state) => ({ apiKeys: [...state.apiKeys, key] })),
      
      deleteApiKey: (id: string) =>
        set((state) => ({
          apiKeys: state.apiKeys.filter((key) => key.id !== id),
          selectedApiKey: state.selectedApiKey === id ? null : state.selectedApiKey,
        })),
      
      updateApiKey: (id: string, updates: Partial<ApiKey>) =>
        set((state) => ({
          apiKeys: state.apiKeys.map((key) =>
            key.id === id ? { ...key, ...updates } : key
          ),
        })),
      
      setApiEndpoints: (apiEndpoints: ApiEndpoint[]) => set({ apiEndpoints }),
      setUsageData: (usageData: UsageData[]) => set({ usageData }),
      setBillingHistory: (billingHistory: BillingHistory[]) => set({ billingHistory }),
      setSelectedApiKey: (selectedApiKey: string | null) => set({ selectedApiKey }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    { name: 'app-store' }
  )
); 