'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SessionState {
  sessionId: string | null;
  tableId: string | null;
  startTime: number | null;
  isValid: boolean;
  hydrated: boolean;
  startSession: (tableId: string) => void;
  endSession: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useSessionStore = create(
  persist<SessionState>(
    (set) => ({
      sessionId: null,
      tableId: null,
      startTime: null,
      isValid: false,
      hydrated: false,
      startSession: (tableId) => {
        const startTime = Date.now();
        set({
          sessionId: `${tableId}-${startTime}`,
          tableId,
          startTime,
          isValid: true,
        });
      },
      endSession: () => {
        set({
          sessionId: null,
          tableId: null,
          startTime: null,
          isValid: false,
        });
      },
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'session-storage',
      storage: createJSONStorage(() => localStorage),
       onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      }
    }
  )
);
