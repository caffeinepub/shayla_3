import { create } from 'zustand';
import { useActor } from './useActor';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { AppSettings } from '../backend';

interface SettingsStore {
  settings: AppSettings | null;
  setSettings: (s: AppSettings) => void;
  applySettings: (s: AppSettings) => void;
}

const defaultSettings: AppSettings = {
  theme: { accentColor: '#D4AF37', darkMode: true, fontSize: BigInt(16) },
  contentPrefs: { tone: 'professional', language: 'fa', style: 'detailed' },
  defaultPlatform: 'website',
  autoSave: true,
  technical: '',
};

function applySettingsToDom(s: AppSettings) {
  const root = document.documentElement;

  // Dark mode
  if (s.theme.darkMode) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Font size
  const fs = Number(s.theme.fontSize);
  if (fs >= 12 && fs <= 24) {
    root.style.setProperty('--user-font-size', `${fs}px`);
  }

  // Accent color — update the --gold CSS variable and related tokens
  const accent = s.theme.accentColor;
  if (accent && /^#[0-9A-Fa-f]{3,8}$/.test(accent)) {
    root.style.setProperty('--gold', accent);
    // Derive a lighter and muted variant by adjusting opacity via rgba
    root.style.setProperty('--neon-color', accent);
    root.style.setProperty('--neon-glow', `${accent}99`);
  }
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  setSettings: (s: AppSettings) => {
    set({ settings: s });
    applySettingsToDom(s);
  },
  applySettings: (s: AppSettings) => {
    applySettingsToDom(s);
  },
}));

export function useGetSettings() {
  const { actor, isFetching } = useActor();
  const { setSettings } = useSettingsStore();

  const query = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      if (!actor) return defaultSettings;
      const result = await actor.getSettings();
      return result ?? defaultSettings;
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });

  // Apply settings to DOM and store whenever query data changes
  useEffect(() => {
    if (query.data) {
      setSettings(query.data);
    }
  }, [query.data, setSettings]);

  return query;
}

export function useUpdateSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { setSettings } = useSettingsStore();

  return useMutation({
    mutationFn: async (newSettings: AppSettings) => {
      if (!actor) throw new Error('Actor not ready');
      await actor.updateSettings(newSettings);
      return newSettings;
    },
    onSuccess: (newSettings) => {
      // Update store and apply to DOM immediately
      setSettings(newSettings);
      // Update React Query cache so re-opening settings shows saved values
      queryClient.setQueryData(['settings'], newSettings);
    },
  });
}
