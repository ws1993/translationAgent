import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WebDAVConfig } from '../types';

interface WebDAVStore {
  config: WebDAVConfig | null;
  isSyncing: boolean;
  lastSyncStatus: 'success' | 'error' | null;
  lastSyncMessage: string | null;
  lastSyncAt: string | null;
  
  setConfig: (config: WebDAVConfig) => void;
  updateConfig: (updates: Partial<WebDAVConfig>) => void;
  setIsSyncing: (isSyncing: boolean) => void;
  setSyncResult: (status: 'success' | 'error' | null, message: string | null) => void;
  updateLastSyncAt: () => void;
}

export const useWebDAVStore = create<WebDAVStore>()(
  persist(
    (set) => ({
      config: null,
      isSyncing: false,
      lastSyncStatus: null,
      lastSyncMessage: null,
      lastSyncAt: null,

      setConfig: (config) => set({ config }),
      
      updateConfig: (updates) => {
        set((state) => ({
          config: state.config ? { ...state.config, ...updates } : null,
        }));
      },

      setIsSyncing: (isSyncing) => set({ isSyncing }),
      
      setSyncResult: (status, message) => set({ 
        lastSyncStatus: status,
        lastSyncMessage: message,
      }),

      updateLastSyncAt: () => set({ 
        lastSyncAt: new Date().toISOString() 
      }),
    }),
    {
      name: 'webdav-storage',
    }
  )
);
