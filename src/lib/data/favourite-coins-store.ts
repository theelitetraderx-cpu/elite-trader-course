import { readJsonFile, writeJsonFile } from "@/lib/data/persist";
import type { FavouriteCoin } from "@/types";
import { broadcastToStudents } from "@/lib/data/notification-store";

const FAVOURITES_FILE = "favourite-coins.json";

const DEFAULT_COINS = ["BTC/USDT", "ETH/USDT", "NQ", "ES", "XAU/USD", "EUR/USD"];

declare global {
  // eslint-disable-next-line no-var
  var __eliteFavouriteCoinsStore: FavouriteCoin[] | undefined;
}

function buildDefaults(): FavouriteCoin[] {
  const now = new Date().toISOString();
  return DEFAULT_COINS.map((pair, index) => ({
    id: `fav-default-${index}`,
    pair,
    published: index < 3,
    created_at: now,
    updated_at: now,
  }));
}

function loadStore(): FavouriteCoin[] {
  const saved = readJsonFile<FavouriteCoin[]>(FAVOURITES_FILE);
  if (saved?.length) return saved;
  const initial = buildDefaults();
  writeJsonFile(FAVOURITES_FILE, initial);
  return initial;
}

function getStore(): FavouriteCoin[] {
  if (!global.__eliteFavouriteCoinsStore) {
    global.__eliteFavouriteCoinsStore = loadStore();
  }
  return global.__eliteFavouriteCoinsStore;
}

function saveStore() {
  writeJsonFile(FAVOURITES_FILE, getStore());
}

export function uid(prefix = "fav") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function ensureFavouriteCoinsLoaded(): Promise<void> {
  if (!global.__eliteFavouriteCoinsStore) {
    global.__eliteFavouriteCoinsStore = loadStore();
  }
}

export function listFavouriteCoins(): FavouriteCoin[] {
  return [...getStore()].sort((a, b) => a.pair.localeCompare(b.pair));
}

export function listPublishedFavouriteCoins(): FavouriteCoin[] {
  return listFavouriteCoins().filter((coin) => coin.published);
}

export function addFavouriteCoin(pair: string, label?: string): FavouriteCoin {
  const normalized = pair.trim().toUpperCase();
  if (!normalized) throw new Error("Pair is required");

  const store = getStore();
  if (store.some((coin) => coin.pair === normalized)) {
    throw new Error("This coin is already in favourites");
  }

  const now = new Date().toISOString();
  const coin: FavouriteCoin = {
    id: uid(),
    pair: normalized,
    label: label?.trim() || undefined,
    published: false,
    created_at: now,
    updated_at: now,
  };

  store.push(coin);
  saveStore();
  return coin;
}

export function setFavouriteCoinPublished(
  id: string,
  published: boolean,
  notifyStudents = true
): FavouriteCoin {
  const coin = getStore().find((item) => item.id === id);
  if (!coin) throw new Error("Favourite coin not found");

  const wasPublished = coin.published;
  coin.published = published;
  coin.updated_at = new Date().toISOString();
  saveStore();

  if (published && !wasPublished && notifyStudents) {
    broadcastToStudents({
      title: `Now Watching: ${coin.pair}`,
      message: `${coin.pair} has been added to your favourite coins on the student portal.`,
      type: "general",
      reference_id: coin.id,
    });
  }

  return coin;
}

export function deleteFavouriteCoin(id: string): void {
  const store = getStore();
  const index = store.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Favourite coin not found");
  store.splice(index, 1);
  saveStore();
}
