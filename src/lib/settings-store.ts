'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  location: {
    latitude: string | null;
    longitude: string | null;
  };
  hydrated: boolean;
  setLocation: (latitude: string, longitude: string) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useSettingsStore = create(
  persist<SettingsState>(
    (set) => ({
      location: {
        latitude: null,
        longitude: null,
      },
      hydrated: false,
      setLocation: (latitude, longitude) =>
        set(() => ({
          location: { latitude, longitude },
        })),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
       onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      }
    }
  )
);
