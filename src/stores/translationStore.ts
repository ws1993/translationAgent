import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TranslationTask, TranslationMode, OutputFormat, Language } from '../types';
import { nanoid } from 'nanoid';

export interface TranslationProgress {
  stage: 'domain' | 'terminology' | 'direct' | 'issues' | 'final' | 'idle';
  progress: number;
  domainInfo?: any;
  terminology?: any[];
  directTranslation?: string;
  issues?: string[];
  finalTranslation?: string;
}

interface ModeState {
  currentTask: TranslationTask | null;
  isTranslating: boolean;
  progress: TranslationProgress;
}

interface TranslationStore {
  tasks: TranslationTask[];
  quickMode: ModeState;
  professionalMode: ModeState;
  domainAdaptiveMode: ModeState;
  
  createTask: (sourceText: string, mode: TranslationMode, outputFormat: OutputFormat, domainId?: string) => TranslationTask;
  updateTaskResult: (mode: TranslationMode, taskId: string, result: any) => void;
  setIsTranslating: (mode: TranslationMode, isTranslating: boolean) => void;
  updateProgress: (mode: TranslationMode, progress: TranslationProgress) => void;
  getModeState: (mode: TranslationMode) => ModeState;
  resetMode: (mode: TranslationMode) => void;
  resetAllModes: () => void;
  clearHistory: () => void;
}

const initialModeState: ModeState = {
  currentTask: null,
  isTranslating: false,
  progress: { stage: 'idle', progress: 0 },
};

export const useTranslationStore = create<TranslationStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      quickMode: { ...initialModeState },
      professionalMode: { ...initialModeState },
      domainAdaptiveMode: { ...initialModeState },

      getModeState: (mode: TranslationMode) => {
        const state = get();
        switch (mode) {
          case TranslationMode.QUICK:
            return state.quickMode;
          case TranslationMode.PROFESSIONAL:
            return state.professionalMode;
          case TranslationMode.DOMAIN_ADAPTIVE:
            return state.domainAdaptiveMode;
          default:
            return state.quickMode;
        }
      },

      createTask: (sourceText, mode, outputFormat, domainId) => {
        const task: TranslationTask = {
          id: nanoid(),
          sourceText,
          sourceLang: Language.ZH_CN,
          targetLang: Language.EN,
          mode,
          outputFormat,
          domainId,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => {
          const modeKey = 
            mode === TranslationMode.QUICK ? 'quickMode' :
            mode === TranslationMode.PROFESSIONAL ? 'professionalMode' :
            'domainAdaptiveMode';
          
          return {
            tasks: [task, ...state.tasks],
            [modeKey]: {
              currentTask: task,
              isTranslating: false,
              progress: { stage: 'idle', progress: 0 },
            },
          };
        });
        
        return task;
      },

      updateTaskResult: (mode, taskId, result) => {
        console.log('[Store] updateTaskResult called with:', { mode, taskId, result });
        
        set((state) => {
          const updatedTasks = state.tasks.map((task) =>
            task.id === taskId ? { ...task, result } : task
          );
          
          const modeKey = 
            mode === TranslationMode.QUICK ? 'quickMode' :
            mode === TranslationMode.PROFESSIONAL ? 'professionalMode' :
            'domainAdaptiveMode';
          
          const currentModeState = state[modeKey];
          const updatedModeState = currentModeState.currentTask?.id === taskId
            ? { ...currentModeState, currentTask: { ...currentModeState.currentTask, result } }
            : currentModeState;
          
          console.log('[Store] Updated mode state:', updatedModeState);
          
          return {
            tasks: updatedTasks,
            [modeKey]: updatedModeState,
          };
        });
      },

      setIsTranslating: (mode, isTranslating) => {
        set((state) => {
          const modeKey = 
            mode === TranslationMode.QUICK ? 'quickMode' :
            mode === TranslationMode.PROFESSIONAL ? 'professionalMode' :
            'domainAdaptiveMode';
          
          return {
            [modeKey]: {
              ...state[modeKey],
              isTranslating,
            },
          };
        });
      },

      updateProgress: (mode, progress) => {
        set((state) => {
          const modeKey = 
            mode === TranslationMode.QUICK ? 'quickMode' :
            mode === TranslationMode.PROFESSIONAL ? 'professionalMode' :
            'domainAdaptiveMode';
          
          return {
            [modeKey]: {
              ...state[modeKey],
              progress,
            },
          };
        });
      },

      resetMode: (mode) => {
        set((state) => {
          const modeKey = 
            mode === TranslationMode.QUICK ? 'quickMode' :
            mode === TranslationMode.PROFESSIONAL ? 'professionalMode' :
            'domainAdaptiveMode';
          
          return {
            [modeKey]: { ...initialModeState },
          };
        });
      },

      resetAllModes: () => {
        set({
          quickMode: { ...initialModeState },
          professionalMode: { ...initialModeState },
          domainAdaptiveMode: { ...initialModeState },
        });
      },

      clearHistory: () => set({ 
        tasks: [],
        quickMode: { ...initialModeState },
        professionalMode: { ...initialModeState },
        domainAdaptiveMode: { ...initialModeState },
      }),
    }),
    {
      name: 'translation-storage',
      partialize: (state) => ({
        tasks: state.tasks,
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        tasks: persistedState?.tasks || [],
        quickMode: { ...initialModeState },
        professionalMode: { ...initialModeState },
        domainAdaptiveMode: { ...initialModeState },
      }),
    }
  )
);
