export type MobileUserRole = 'field_reporter';

export interface MobileUser {
  email: string;
  name: string;
  role: MobileUserRole;
  uuid: string;
}

export interface MobileSession {
  expiresAt: string | null;
  token: string;
  user: MobileUser;
}

export interface MobileLoginInput {
  deviceName: string;
  email: string;
  password: string;
}

export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';
export type SessionVerificationStatus =
  | 'idle'
  | 'pending'
  | 'verified'
  | 'unavailable';
