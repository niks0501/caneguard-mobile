import type { CaneGuardDatabase } from '@/database/database';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import type { ScanRecordListItem } from '@/features/records/domain/recordTypes';

/**
 * The mobile feeds are stale-while-revalidate. Keeping this contract in one
 * place prevents a tab focus from turning into an HTTP request and cache
 * rewrite for every mounted consumer.
 */
export const MOBILE_DATA_REVALIDATE_MS = 45_000;

type CachedValue<T> = {
  value: T;
  fetchedAt: number;
};

export type TimelineSnapshot = {
  data: ScanRecordListItem[];
  hasMore: boolean;
  fetchedAt: number;
};

type RefreshKey = 'assignments' | 'notifications';

export interface OwnerMobileDataStore {
  assignments: CachedValue<FieldValidationAssignment[]> | null;
  notifications: CachedValue<MobileNotification[]> | null;
  timeline: Map<string, TimelineSnapshot>;
  cacheLoads: Partial<Record<RefreshKey, Promise<void>>>;
  refreshes: Partial<Record<RefreshKey, Promise<unknown>>>;
  listeners: Set<() => void>;
}

const stores = new WeakMap<CaneGuardDatabase, Map<string, OwnerMobileDataStore>>();

export function getOwnerMobileDataStore(
  database: CaneGuardDatabase,
  ownerIdentity: string,
): OwnerMobileDataStore {
  let databaseStores = stores.get(database);
  if (!databaseStores) {
    databaseStores = new Map();
    stores.set(database, databaseStores);
  }

  const owner = ownerIdentity.trim();
  let store = databaseStores.get(owner);
  if (!store) {
    store = {
      assignments: null,
      notifications: null,
      timeline: new Map(),
      cacheLoads: {},
      refreshes: {},
      listeners: new Set(),
    };
    databaseStores.set(owner, store);
  }
  return store;
}

export function subscribeOwnerMobileData(
  store: OwnerMobileDataStore,
  listener: () => void,
): () => void {
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

export function setOwnerAssignments(
  store: OwnerMobileDataStore,
  assignments: FieldValidationAssignment[],
  fetchedAt: string | number = Date.now(),
): void {
  store.assignments = {
    value: assignments,
    fetchedAt: toTimestamp(fetchedAt),
  };
  notify(store);
}

export function setOwnerNotifications(
  store: OwnerMobileDataStore,
  notifications: MobileNotification[],
  fetchedAt: string | number = Date.now(),
): void {
  store.notifications = {
    value: notifications,
    fetchedAt: toTimestamp(fetchedAt),
  };
  notify(store);
}

export function setOwnerTimeline(
  store: OwnerMobileDataStore,
  key: string,
  data: ScanRecordListItem[],
  hasMore: boolean,
  fetchedAt: number = Date.now(),
): void {
  store.timeline.set(key, { data, hasMore, fetchedAt });
  notify(store);
}

export function isFresh(
  cached: CachedValue<unknown> | TimelineSnapshot | null | undefined,
  now = Date.now(),
): boolean {
  return Boolean(cached && now - cached.fetchedAt < MOBILE_DATA_REVALIDATE_MS);
}

export function beginOwnerRefresh<T>(
  store: OwnerMobileDataStore,
  key: RefreshKey,
  task: () => Promise<T>,
): Promise<T> {
  const active = store.refreshes[key] as Promise<T> | undefined;
  if (active) return active;

  const promise = task().finally(() => {
    if (store.refreshes[key] === promise) {
      delete store.refreshes[key];
    }
  });
  store.refreshes[key] = promise;
  return promise;
}

export function beginOwnerCacheLoad(
  store: OwnerMobileDataStore,
  key: RefreshKey,
  task: () => Promise<void>,
): Promise<void> {
  const active = store.cacheLoads[key];
  if (active) return active;

  const promise = task().finally(() => {
    if (store.cacheLoads[key] === promise) {
      delete store.cacheLoads[key];
    }
  });
  store.cacheLoads[key] = promise;
  return promise;
}

function notify(store: OwnerMobileDataStore): void {
  for (const listener of store.listeners) listener();
}

function toTimestamp(value: string | number): number {
  if (typeof value === 'number') return value;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Date.now() : timestamp;
}
