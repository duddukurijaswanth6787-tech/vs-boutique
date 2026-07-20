import {
  UserType,
  AccountStatus,
  RoleScope,
  PermissionScope,
  LoginProvider,
} from './identity.enums';

export interface AuthenticatedUser {
  id: string;
  email: string;
  userType: UserType;
  accountStatus: AccountStatus;
  roles: string[];
  permissions: string[];
  staffId?: string;
  customerId?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  userType: UserType;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface RoleDefinition {
  name: string;
  displayName: string;
  description: string;
  scope: RoleScope;
  hierarchy: number;
  permissions: string[];
  isSystem: boolean;
}

export interface PermissionDefinition {
  code: string;
  name: string;
  description: string;
  module: string;
  scope: PermissionScope;
}

export interface SessionContext {
  sessionId: string;
  userId: string;
  ip: string;
  userAgent: string;
  loginProvider: LoginProvider;
  loginAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
}

export interface UserContext {
  userId: string;
  email: string;
  userType: UserType;
  accountStatus: AccountStatus;
}

export interface IdentityContext {
  authenticatedUser: AuthenticatedUser | null;
  session: SessionContext | null;
  impersonator?: AuthenticatedUser;
}
