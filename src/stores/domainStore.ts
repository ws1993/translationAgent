import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DomainCategory } from '../types';
import { nanoid } from 'nanoid';

interface DomainStore {
  categories: DomainCategory[];
  selectedCategoryId: string | null;
  
  addCategory: (name: string, parentId: string | null) => void;
  updateCategory: (id: string, updates: Partial<DomainCategory>) => void;
  deleteCategory: (id: string) => void;
  selectCategory: (id: string | null) => void;
  getCategoryById: (id: string) => DomainCategory | undefined;
  getChildCategories: (parentId: string | null) => DomainCategory[];
}

export const useDomainStore = create<DomainStore>()(
  persist(
    (set, get) => ({
      categories: [
        {
          id: 'general',
          name: '通用领域',
          parentId: null,
          level: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      selectedCategoryId: null,

      addCategory: (name, parentId) => {
        const parent = parentId ? get().getCategoryById(parentId) : null;
        const level = parent ? 2 : 1;
        
        const newCategory: DomainCategory = {
          id: nanoid(),
          name,
          parentId,
          level: level as 1 | 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id
              ? { ...cat, ...updates, updatedAt: new Date().toISOString() }
              : cat
          ),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter(
            (cat) => cat.id !== id && cat.parentId !== id
          ),
          selectedCategoryId:
            state.selectedCategoryId === id ? null : state.selectedCategoryId,
        }));
      },

      selectCategory: (id) => set({ selectedCategoryId: id }),

      getCategoryById: (id) => {
        return get().categories.find((cat) => cat.id === id);
      },

      getChildCategories: (parentId) => {
        return get().categories.filter((cat) => cat.parentId === parentId);
      },
    }),
    {
      name: 'domain-storage',
    }
  )
);
