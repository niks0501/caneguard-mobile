export type MobileNotificationAdvisoryStatus = 'validated';

export interface MobileNotificationAdvisory {
  uuid: string;
  code: string;
  title: string;
  content: string;
  status: MobileNotificationAdvisoryStatus;
  selectedAt: string;
}

export interface MobileNotification {
  id: string;
  ownerIdentity: string;
  eventType: string;
  title: string;
  message: string;
  caseUuid: string | null;
  referenceCode: string | null;
  assignmentUuid: string | null;
  content: string | null;
  advisory: MobileNotificationAdvisory | null;
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
  content: string | null;
  advisory: MobileNotificationAdvisory | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string | null;
}
