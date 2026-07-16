import { readJsonFile, writeJsonFile } from "@/lib/data/persist";
import type { SignalDirection, SignalStatus, TradingSignal } from "@/types";
import { broadcastToStudents } from "@/lib/data/notification-store";

const SIGNALS_FILE = "signals.json";

declare global {
  // eslint-disable-next-line no-var
  var __eliteSignalStore: TradingSignal[] | undefined;
}

function loadStore(): TradingSignal[] {
  return readJsonFile<TradingSignal[]>(SIGNALS_FILE) ?? [];
}

function getStore(): TradingSignal[] {
  if (!global.__eliteSignalStore) {
    global.__eliteSignalStore = loadStore();
  }
  return global.__eliteSignalStore;
}

function saveStore() {
  writeJsonFile(SIGNALS_FILE, getStore());
}

export function uid(prefix = "signal") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function ensureSignalsLoaded(): Promise<void> {
  if (!global.__eliteSignalStore) {
    global.__eliteSignalStore = loadStore();
  }
}

export function listSignals(): TradingSignal[] {
  return [...getStore()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function listActiveSignals(): TradingSignal[] {
  return listSignals().filter((signal) => signal.status === "active");
}

export function getSignalById(id: string): TradingSignal | null {
  return getStore().find((signal) => signal.id === id) ?? null;
}

export interface CreateSignalInput {
  pair: string;
  direction: SignalDirection;
  entry?: string;
  target?: string;
  stop_loss?: string;
  notes?: string;
  created_by: string;
  created_by_name: string;
  notify_students?: boolean;
}

export function createSignal(input: CreateSignalInput): {
  signal: TradingSignal;
  notifiedCount: number;
} {
  const signal: TradingSignal = {
    id: uid(),
    pair: input.pair.trim().toUpperCase(),
    direction: input.direction,
    entry: input.entry?.trim() || undefined,
    target: input.target?.trim() || undefined,
    stop_loss: input.stop_loss?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    status: "active",
    created_by: input.created_by,
    created_by_name: input.created_by_name,
    created_at: new Date().toISOString(),
  };

  getStore().unshift(signal);
  saveStore();

  let notifiedCount = 0;
  if (input.notify_students !== false) {
    const directionLabel = input.direction.toUpperCase();
    const notifications = broadcastToStudents({
      title: `New ${directionLabel} Signal: ${signal.pair}`,
      message: [
        signal.entry && `Entry: ${signal.entry}`,
        signal.target && `Target: ${signal.target}`,
        signal.stop_loss && `SL: ${signal.stop_loss}`,
        signal.notes,
      ]
        .filter(Boolean)
        .join(" · "),
      type: "signal",
      reference_id: signal.id,
    });
    notifiedCount = notifications.length;
  }

  return { signal, notifiedCount };
}

export function updateSignalStatus(
  id: string,
  status: SignalStatus
): TradingSignal {
  const signal = getStore().find((item) => item.id === id);
  if (!signal) throw new Error("Signal not found");

  signal.status = status;
  if (status === "closed" || status === "cancelled") {
    signal.closed_at = new Date().toISOString();
  }

  saveStore();
  return signal;
}

export function deleteSignal(id: string): void {
  const store = getStore();
  const index = store.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Signal not found");
  store.splice(index, 1);
  saveStore();
}
