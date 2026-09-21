import type { CaneGuardDatabase } from '@/database/database';
import { listCachedMobileNotifications, replaceCachedMobileNotifications } from '@/features/notifications/data/notificationCacheRepository';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import { fetchAllMobileNotifications } from '@/features/notifications/api/mobileNotificationsApi';

export interface MobileNotificationsRefreshResult {
  notifications: MobileNotification[];
  fetchedAt: string;
  syncBefore: string;
  partial: boolean;
}

interface ActiveRefresh {
  promise: Promise<MobileNotificationsRefreshResult>;
  token: string;
}

const activeRefreshes = new WeakMap<CaneGuardDatabase, Map<string, ActiveRefresh>>();
const refreshGenerations = new WeakMap<CaneGuardDatabase, Map<string, number>>();

export function refreshMobileNotifications(options: {
  database: CaneGuardDatabase;
  ownerIdentity: string;
  token: string;
}): Promise<MobileNotificationsRefreshResult> {
  const owner = options.ownerIdentity.trim();
  let databaseRefreshes = activeRefreshes.get(options.database);
  if (!databaseRefreshes) {
    databaseRefreshes = new Map();
    activeRefreshes.set(options.database, databaseRefreshes);
  }

  const active = databaseRefreshes.get(owner);
  if (active?.token === options.token) return active.promise;

  let databaseGenerations = refreshGenerations.get(options.database);
  if (!databaseGenerations) {
    databaseGenerations = new Map();
    refreshGenerations.set(options.database, databaseGenerations);
  }
  const generation = (databaseGenerations.get(owner) ?? 0) + 1;
  databaseGenerations.set(owner, generation);

  const operation = executeRefresh({
    ...options,
    ownerIdentity: owner,
    isCurrent: () => databaseGenerations?.get(owner) === generation,
  });
  const promise = operation.finally(() => {
    if (databaseRefreshes?.get(owner)?.promise === promise) {
      databaseRefreshes.delete(owner);
    }
  });
  databaseRefreshes.set(owner, { promise, token: options.token });
  return promise;
}

async function executeRefresh(options: {
  database: CaneGuardDatabase;
  ownerIdentity: string;
  token: string;
  isCurrent: () => boolean;
}): Promise<MobileNotificationsRefreshResult> {
  const response = await fetchAllMobileNotifications({ token: options.token });
  if (!options.isCurrent()) throw new Error('The notification refresh was superseded.');

  const fetchedAt = new Date().toISOString();
  await replaceCachedMobileNotifications(
    options.database,
    options.ownerIdentity,
    response.notifications,
    fetchedAt,
  );
  const notifications = await listCachedMobileNotifications(
    options.database,
    options.ownerIdentity,
  );
  return {
    notifications,
    fetchedAt,
    syncBefore: response.syncBefore,
    partial: response.partial,
  };
}
