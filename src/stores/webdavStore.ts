import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WebDAVConfig } from '../types';

interface WebDAVStore {
  config: WebDAVConfig | null;
  isSyncing: boolean;
  lastSyncStatus: 'success' | 'error' | null;
  
  setConfig: (config: WebDAVConfig) => void;
  updateConfig: (updates: Partial<WebDAVConfig>) => void;
  setIsSyncing: (isSyncing: boolean) => void;
  setLastSyncStatus: (status: 'success' | 'error' | null) => void;
}

export const useWebDAVStore = create<WebDAVStore>()(
  persist(
    (set) => ({
      config: null,
      isSyncing: false,
      lastSyncStatus: null,

      setConfig: (config) => set({ config }),
      
      updateConfig: (updates) => {
        set((state) => ({
          config: state.config ? { ...state.config, ...updates } : null,
        }));
      },

      setIsSyncing: (isSyncing) => set({ isSyncing }),
      setLastSyncStatus: (status) => set({ lastSyncStatus: status }),
    }),
    {
      name: 'webdav-storage',
    }
  )
);
