// アプリ全体状態管理

import { create } from 'zustand';
import type { Config } from '@/types';
import { mockConfig } from '@/mocks/data';

interface AppState {
  config: Config | null;
  isReadOnly: boolean;
  isLoading: boolean;
  error: Error | null;
  sidebarCollapsed: boolean;

  // Actions
  loadConfig: () => Promise<void>;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setReadOnly: (readOnly: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  config: null,
  isReadOnly: false,
  isLoading: false,
  error: null,
  sidebarCollapsed: false,

  loadConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      // モックデータを使用（本番ではAPIコール）
      await new Promise((resolve) => setTimeout(resolve, 300));
      set({
        config: mockConfig,
        isReadOnly: !mockConfig.workspace.allowWrite,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setReadOnly: (readOnly) => set({ isReadOnly: readOnly }),
}));

