// Shared in-memory scan store
// In production, replace with Redis or a database

export type ScanEntry = {
  status: "PENDING" | "RUNNING" | "COMPLETE" | "FAILED";
  report?: unknown;
  events: unknown[];
};

// Module-level singleton store
export const scanStore = new Map<string, ScanEntry>();
