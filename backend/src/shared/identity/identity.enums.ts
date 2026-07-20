export enum UserType {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  LOCKED = 'LOCKED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  DELETED = 'DELETED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum LoginProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
}

export enum RoleScope {
  GLOBAL = 'GLOBAL',
  DOMAIN = 'DOMAIN',
  CUSTOM = 'CUSTOM',
}

export enum PermissionScope {
  GLOBAL = 'GLOBAL',
  MODULE = 'MODULE',
  DOMAIN = 'DOMAIN',
  SELF = 'SELF',
}

export enum StaffDepartment {
  MANAGEMENT = 'MANAGEMENT',
  SALES = 'SALES',
  MARKETING = 'MARKETING',
  WAREHOUSE = 'WAREHOUSE',
  PACKING = 'PACKING',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  INVENTORY = 'INVENTORY',
  ACCOUNTING = 'ACCOUNTING',
  IT = 'IT',
}

export enum StaffDesignation {
  MANAGER = 'MANAGER',
  SUPERVISOR = 'SUPERVISOR',
  EXECUTIVE = 'EXECUTIVE',
  ASSOCIATE = 'ASSOCIATE',
  TRAINEE = 'TRAINEE',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
}

export enum ShiftType {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  NIGHT = 'NIGHT',
  ROTATING = 'ROTATING',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}
