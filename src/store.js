import { create } from 'zustand';

export const useAppStore = create((set) => ({
  activeTab: 'daily', // 'daily' | 'monthly' | 'future' | 'index'
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // Custom Collection View State
  activeCollectionId: null,
  setActiveCollectionId: (id) => set({ activeCollectionId: id, activeTab: id ? 'custom' : 'index' }),

  // Task Detail View State
  activeBulletId: null,
  setActiveBulletId: (id) => set({ activeBulletId: id }),

  // Layout State (3-mode cycle)
  layoutMode: 'fluid', // 'fluid' | 'fixed' | 'zen'
  cycleLayoutMode: () => set((state) => {
    const modes = ['fluid', 'fixed', 'zen'];
    const nextIndex = (modes.indexOf(state.layoutMode) + 1) % modes.length;
    return { layoutMode: modes[nextIndex] };
  }),

  // Theme State
  theme: 'light', // 'light' | 'dark'
  setTheme: (theme) => set({ theme }),
  // Global Confirm Dialog
  confirmDialog: null,
  showConfirm: (message, onConfirm) => set({ confirmDialog: { message, onConfirm } }),
  hideConfirm: () => set({ confirmDialog: null }),

  // Global Prompt Dialog
  promptDialog: null,
  showPrompt: (message, defaultValue, onSubmit) => set({ promptDialog: { message, defaultValue, onSubmit } }),
  hidePrompt: () => set({ promptDialog: null }),
}));
