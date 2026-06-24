import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TranslationTask, TranslationMode, OutputFormat, Language } from '../types';
import { nanoid } from 'nanoid';

interface TranslationStore {
  tasks: TranslationTask[];
  currentTask: TranslationTask | null;
  isTranslating: boolean;
  
  createTask: (sourceText: string, mode: TranslationMode, outputFormat: OutputFormat, domainId?: string) => void;
  updateTaskResult: (taskId: string, result: any) => void;
  setCurrentTask: (task: TranslationTask | null) => void;
  setIsTranslating: (isTranslating: boolean) => void;
  clearHistory: () => void;
}

export const useTranslationStore = create<TranslationStore>()(
  persist(
    (set) => ({
      tasks: [],
      currentTask: null,
      isTranslating: false,

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
        }));
      },

      updateTaskResult: (taskId, result) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, result } : task
          ),
          currentTask:
            state.currentTask?.id === taskId
              ? { ...state.currentTask, result }
              : state.currentTask,
        }));
      },

      setCurrentTask: (task) => set({ currentTask: task }),
      setIsTranslating: (isTranslating) => set({ isTranslating }),
      clearHistory: () => set({ tasks: [] }),
    }),
    {
      name: 'translation-storage',
    }
  )
);
