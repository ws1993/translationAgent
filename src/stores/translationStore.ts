import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TranslationTask, TranslationMode, OutputFormat, Language } from '../types';
import { nanoid } from 'nanoid';

export interface TranslationProgress {
  stage: 'direct' | 'issues' | 'final' | 'idle';
  progress: number;
  directTranslation?: string;
  issues?: string[];
  finalTranslation?: string;
}

interface TranslationStore {
  tasks: TranslationTask[];
  currentTask: TranslationTask | null;
  isTranslating: boolean;
  progress: TranslationProgress;
  
  createTask: (sourceText: string, mode: TranslationMode, outputFormat: OutputFormat, domainId?: string) => TranslationTask;
  updateTaskResult: (taskId: string, result: any) => void;
  setCurrentTask: (task: TranslationTask | null) => void;
  setIsTranslating: (isTranslating: boolean) => void;
  updateProgress: (progress: TranslationProgress) => void;
  clearHistory: () => void;
}

export const useTranslationStore = create<TranslationStore>()(
  persist(
    (set) => ({
      tasks: [],
      currentTask: null,
      isTranslating: false,
      progress: { stage: 'idle', progress: 0 },

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
        set((state) => ({
          tasks: [task, ...state.tasks],
          currentTask: task,
          progress: { stage: 'idle', progress: 0 },
        }));
        return task;
      },

      updateTaskResult: (taskId, result) => {
        console.log('[Store] updateTaskResult called with:', { taskId, result });
        set((state) => {
          const updatedTasks = state.tasks.map((task) =>
            task.id === taskId ? { ...task, result } : task
          );
          const updatedCurrentTask = state.currentTask?.id === taskId
            ? { ...state.currentTask, result }
            : state.currentTask;
          
          console.log('[Store] Updated currentTask:', updatedCurrentTask);
          
          return {
            tasks: updatedTasks,
            currentTask: updatedCurrentTask,
          };
        });
      },

      setCurrentTask: (task) => set({ currentTask: task }),
      setIsTranslating: (isTranslating) => set({ isTranslating }),
      updateProgress: (progress) => set({ progress }),
      clearHistory: () => set({ tasks: [], progress: { stage: 'idle', progress: 0 } }),
    }),
    {
      name: 'translation-storage',
      // 只持久化 tasks，不持久化运行时状态
      partialize: (state) => ({
        tasks: state.tasks,
      }),
      // 自定义 merge 策略，确保运行时状态始终重置
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        tasks: persistedState?.tasks || [],
        // 强制重置运行时状态
        currentTask: null,
        isTranslating: false,
        progress: { stage: 'idle', progress: 0 },
      }),
    }
  )
);
