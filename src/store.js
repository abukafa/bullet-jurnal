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
  layoutMode: 'fluid', // 'fluid' | 'zen'
  cycleLayoutMode: () => set((state) => {
    const modes = ['fluid', 'zen'];
    const nextIndex = (modes.indexOf(state.layoutMode) + 1) % modes.length;
    return { layoutMode: modes[nextIndex] };
  }),

  // Theme State
  theme: 'light', // 'light' | 'dark'
  setTheme: (theme) => set({ theme }),
  // Global Confirm Dialog
  confirmDialog: null,
  showConfirm: (message, onConfirm, onCancel) => set({ confirmDialog: { message, onConfirm, onCancel } }),
  hideConfirm: () => set({ confirmDialog: null }),

  // Global Prompt Dialog
  promptDialog: null,
  showPrompt: (message, defaultValue, onSubmit) => set({ promptDialog: { message, defaultValue, onSubmit } }),
  hidePrompt: () => set({ promptDialog: null }),

  // PWA Install Prompt State
  deferredPrompt: null,
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
  isInstallModalOpen: false,
  setInstallModalOpen: (isOpen) => set({ isInstallModalOpen: isOpen }),

  // Auth & Sync State
  user: JSON.parse(localStorage.getItem('bujo_user')) || null,
  setUser: (user) => {
    if (user) {
      localStorage.setItem('bujo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bujo_user');
    }
    set({ user });
  },
  syncStatus: 'idle', // 'idle' | 'syncing' | 'error'
  setSyncStatus: (status) => set({ syncStatus: status }),
  lastSyncTime: null,
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  
  // Auto Sync Setting
  isAutoSyncEnabled: localStorage.getItem('autoSync') === 'true',
  setAutoSyncEnabled: (val) => {
    localStorage.setItem('autoSync', val);
    set({ isAutoSyncEnabled: val });
  }
}));
