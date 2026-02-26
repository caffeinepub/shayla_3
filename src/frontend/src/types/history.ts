// Frontend-only type for content history entries stored in localStorage.
// The backend does not persist history; this is managed entirely client-side.

export interface ContentHistoryEntry {
  id: string;
  url: string;
  timestamp: number;
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
