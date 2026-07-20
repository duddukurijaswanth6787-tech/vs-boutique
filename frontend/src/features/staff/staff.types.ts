export type StaffDepartment =
  | 'MANAGEMENT' | 'SALES' | 'MARKETING' | 'WAREHOUSE' | 'PACKING'
  | 'CUSTOMER_SUPPORT' | 'INVENTORY' | 'ACCOUNTING' | 'IT';

export type StaffDesignation =
  | 'MANAGER' | 'SUPERVISOR' | 'EXECUTIVE' | 'ASSOCIATE' | 'TRAINEE';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'ROTATING';

export interface CreateStaffDto {
  email: string;
  password?: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  department: StaffDepartment;
  designation: StaffDesignation;
  employeeId: string;
  jobTitle?: string;
  reportingManagerId?: string;
  employmentType?: EmploymentType;
  shift?: ShiftType;
  joinedAt?: string;
  dateOfBirth?: string;
  salary?: number;
  emergencyContact?: string;
  address?: string;
  roleIds?: string[];
  sendInvite?: boolean;
}

export interface UpdateStaffDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: StaffDepartment;
  designation?: StaffDesignation;
  jobTitle?: string;
  reportingManagerId?: string;
  employmentType?: EmploymentType;
  shift?: ShiftType;
  joinedAt?: string;
  dateOfBirth?: string;
  salary?: number;
  emergencyContact?: string;
  address?: string;
  profileImage?: string;
}

export interface StaffQueryDto {
  search?: string;
  department?: StaffDepartment;
  designation?: StaffDesignation;
  employmentStatus?: string;
  role?: string;
  employmentType?: string;
  shift?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  deleted?: boolean;
}

export interface StaffResponse {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName?: string;
  department: StaffDepartment;
  designation: StaffDesignation;
  employeeId: string;
  jobTitle?: string;
  reportingManagerId?: string;
  employmentType?: string;
  shift?: string;
  joinedAt?: string;
  dateOfBirth?: string;
  salary?: number;
  employmentStatus: string;
  accountStatus: string;
  phone?: string;
  profileImage?: string;
  gender?: string;
  emergencyContact?: string;
  address?: string;
  lastLoginAt?: string;
  roles: string[];
  permissions: string[];
  createdAt: string;
}

export interface StaffDetailResponse extends StaffResponse {
  forcePasswordChange?: boolean;
  createdBy?: string;
}

export interface InviteStaffDto {
  email: string;
  firstName: string;
  lastName?: string;
  department: StaffDepartment;
  designation: StaffDesignation;
  employeeId: string;
  roleIds?: string[];
}

export interface AcceptInviteDto {
  token: string;
  password: string;
  phone?: string;
}

export interface StaffInvitation {
  id: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  invitedBy: string;
  staffId?: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface PermissionOverride {
  id: string;
  userId: string;
  permissionCode: string;
  isGranted: boolean;
  createdAt: string;
}
