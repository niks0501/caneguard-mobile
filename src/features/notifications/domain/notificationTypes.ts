export interface MobileNotification {
  id: string;
  ownerIdentity: string;
  eventType: string;
  title: string;
  message: string;
  caseUuid: string | null;
  referenceCode: string | null;
  assignmentUuid: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string | null;
  cachedAt: string;
}

export interface MobileNotificationUpdate {
  id: string;
  eventType: string;
  title: string;
  message: string;
  caseUuid: string | null;
  referenceCode: string | null;
  assignmentUuid: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string | null;
}
