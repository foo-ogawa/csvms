// アプリ全体状態管理

import { create } from 'zustand';
import { datasetsApi } from '@/api';
import type { ConfigResponse, DatasetSummary } from '@/api/types';

interface AppState {
  config: ConfigResponse | null;
  datasets: DatasetSummary[];
  isReadOnly: boolean;
  isLoading: boolean;
  error: Error | null;
  sidebarCollapsed: boolean;
  // 単独モード
  singleMode: boolean;
  singleDataset: { id: string; title: string } | null;

  // Actions
  loadConfig: () => Promise<void>;
  loadDatasets: () => Promise<void>;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setReadOnly: (readOnly: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  config: null,
  datasets: [],
  isReadOnly: false,
  isLoading: false,
  error: null,
  sidebarCollapsed: false,
  singleMode: false,
  singleDataset: null,

  loadConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await datasetsApi.getConfig();
      if (response.ok) {
        set({
          config: response.data,
          isReadOnly: !response.data.workspace.allowWrite,
          singleMode: response.data.singleMode,
          singleDataset: response.data.singleDataset || null,
          isLoading: false,
        });
      }
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },

  loadDatasets: async () => {
    try {
      const response = await datasetsApi.getDatasets();
      if (response.ok) {
        set({ datasets: response.data.datasets });
      }
    } catch (error) {
      console.error('Failed to load datasets:', error);
    }
  },

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setReadOnly: (readOnly) => set({ isReadOnly: readOnly }),
}));
