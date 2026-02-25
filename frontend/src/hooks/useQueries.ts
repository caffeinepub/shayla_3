import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Product, ProductInput, Affiliate, AppSettings } from '../backend';
import type { ContentHistoryEntry } from '../types/history';

// ─── Products ────────────────────────────────────────────────────────────────

export function useGetProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProduct(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Product | null>({
    queryKey: ['product', id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getProduct(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddOrUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productInput: ProductInput) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addOrUpdateProduct(productInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ─── Affiliates ───────────────────────────────────────────────────────────────

export function useGetAffiliates() {
  const { actor, isFetching } = useActor();

  return useQuery<Affiliate[]>({
    queryKey: ['affiliates'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAffiliates();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAffiliate(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Affiliate | null>({
    queryKey: ['affiliate', id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAffiliate(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddOrUpdateAffiliate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (affiliate: Affiliate) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addOrUpdateAffiliate(affiliate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
    },
  });
}

export function useDeleteAffiliate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteAffiliate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
    },
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function useGetSettings() {
  const { actor, isFetching } = useActor();

  return useQuery<AppSettings | null>({
    queryKey: ['settings'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: AppSettings) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

// ─── Content History (localStorage) ──────────────────────────────────────────

const HISTORY_KEY = 'shylaa_content_history';

function loadHistory(): ContentHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ContentHistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: ContentHistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // storage quota exceeded or unavailable
  }
}

export function useGetHistory() {
  return useQuery<ContentHistoryEntry[]>({
    queryKey: ['history'],
    queryFn: () => loadHistory(),
    staleTime: 0,
  });
}

interface AddHistoryInput {
  url: string;
  content: {
    title: string;
    purchasePrice: number;
    salePrice: number;
    description: string;
    specs: string;
    tags: string[];
  };
  notes: string;
}

export function useAddHistoryEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddHistoryInput) => {
      const history = loadHistory();

      // Always create a NEW entry with a unique ID and current timestamp
      const newEntry: ContentHistoryEntry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        url: input.url,
        timestamp: Date.now(),
        content: {
          title: input.content.title,
          purchasePrice: input.content.purchasePrice,
          salePrice: input.content.salePrice,
          description: input.content.description,
          specs: input.content.specs,
          tags: input.content.tags,
        },
        notes: input.notes,
      };

      // Prepend new entry (most recent first), keep last 50
      const updated = [newEntry, ...history].slice(0, 50);
      saveHistory(updated);
      return newEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useDeleteHistoryEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const history = loadHistory();
      const updated = history.filter(e => e.id !== id);
      saveHistory(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useClearHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      saveHistory([]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}
