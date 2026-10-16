import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LLMConfig } from '../types';
import { nanoid } from 'nanoid';

interface LLMConfigStore {
  configs: LLMConfig[];
  activeConfigId: string | null;
  
  addConfig: (config: Omit<LLMConfig, 'id'>) => string;
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

        set((state) => {
          // 没有使用中的配置时，新配置直接生效，避免保存后顶栏仍显示「未配置模型」
          const shouldActivate = state.activeConfigId === null;
          return {
            configs: [
              ...state.configs,
              shouldActivate ? { ...newConfig, isActive: true } : newConfig,
            ],
            activeConfigId: shouldActivate ? newConfig.id : state.activeConfigId,
          };
        });

        return newConfig.id;
      },

      updateConfig: (id, updates) => {
        set((state) => ({
          configs: state.configs.map((cfg) =>
            cfg.id === id ? { ...cfg, ...updates } : cfg
          ),
        }));
      },

      deleteConfig: (id) => {
        set((state) => {
          const configs = state.configs.filter((cfg) => cfg.id !== id);
          const wasActive = state.activeConfigId === id;
          // 删掉使用中的配置后自动切到剩余第一个，避免顶栏回落成「未配置模型」
          const nextActiveId = wasActive ? (configs[0]?.id ?? null) : state.activeConfigId;
          return {
            configs: configs.map((cfg) => ({ ...cfg, isActive: cfg.id === nextActiveId })),
            activeConfigId: nextActiveId,
          };
        });
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
      // 修复历史数据：有配置但 activeConfigId 为空（旧版本保存后从不激活）时，顶栏会一直显示「未配置模型」
      onRehydrateStorage: () => (state) => {
        if (!state || state.configs.length === 0) return;
        if (state.configs.some((cfg) => cfg.id === state.activeConfigId)) return;
        state.setActiveConfig(state.configs[0].id);
      },
    }
  )
);
