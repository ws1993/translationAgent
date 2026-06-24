import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LLMConfig } from '../types';
import { nanoid } from 'nanoid';

interface LLMConfigStore {
  configs: LLMConfig[];
  activeConfigId: string | null;
  
  addConfig: (config: Omit<LLMConfig, 'id'>) => void;
  updateConfig: (id: string, updates: Partial<LLMConfig>) => void;
  deleteConfig: (id: string) => void;
  setActiveConfig: (id: string) => void;
  getActiveConfig: () => LLMConfig | undefined;
}

export const useLLMConfigStore = create<LLMConfigStore>()(
  persist(
    (set, get) => ({
      configs: [],
      activeConfigId: null,

      addConfig: (config) => {
        const newConfig: LLMConfig = {
          ...config,
          id: nanoid(),
          isActive: false,
        };
        
        set((state) => ({
          configs: [...state.configs, newConfig],
        }));
      },

      updateConfig: (id, updates) => {
        set((state) => ({
          configs: state.configs.map((cfg) =>
            cfg.id === id ? { ...cfg, ...updates } : cfg
          ),
        }));
      },

      deleteConfig: (id) => {
        set((state) => ({
          configs: state.configs.filter((cfg) => cfg.id !== id),
          activeConfigId: state.activeConfigId === id ? null : state.activeConfigId,
        }));
      },

      setActiveConfig: (id) => {
        set((state) => ({
          configs: state.configs.map((cfg) => ({
            ...cfg,
            isActive: cfg.id === id,
          })),
          activeConfigId: id,
        }));
      },

      getActiveConfig: () => {
        const activeId = get().activeConfigId;
        return get().configs.find((cfg) => cfg.id === activeId);
      },
    }),
    {
      name: 'llm-config-storage',
    }
  )
);
