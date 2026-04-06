export type UserRole = 'admin' | 'manager' | 'employee';
export type UserType = 'permanent' | 'probation' | 'freelance';

// Position object (populated from backend)
export interface UserPosition {
  id: string;
  name: string;
}

// Full user (matches backend UserDetailResponseDTO)
export interface User {
  id: string;
  username: string;
  profile?: string | null;
  firstname: string;
  lastname: string;
  nickname: string;
  lineUserId?: string | null;
  tel?: string | null;
  address?: string | null;
  birthDate?: string | null;
  position?: UserPosition;       // Changed: now object {id, name}
  salary?: string | null;
  contract?: string | null;
  contractDateStart?: string | null;
  contractDateEnd?: string | null;
  employeeType: UserType;
  employeeDateStart: string;
  employeeStatus?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// List item user (matches backend UserListResponseDTO)
export interface UserListItem {
  id: string;
  username: string;
  profile?: string | null;
  firstname: string;
  lastname: string;
  nickname: string;
  position?: UserPosition;
  role: UserRole;
  isActive: boolean;
}

// Summary for dropdowns / selectors
export interface UserSummary {
  id: string;
  name: string;
  role: UserRole;
  position?: string;
  isActive?: boolean;
}

// API Response types
export interface UserMeResponse {
  status: 'success';
  data: {
    user: User;
  };
}

export interface UserListResponse {
  status: 'success';
  results: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: {
    users: UserListItem[];
  };
}

export interface UserDetailResponse {
  status: 'success';
  data: {
    user: User;
  };
}

// Query params for listing
export interface UserListParams {
  search?: string;
  role?: UserRole;
  positionId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// Create user DTO (matches backend createUserSchema)
export interface CreateUserDTO {
  firstname: string;
  lastname: string;
  nickname: string;
  tel?: string;
  address?: string;
  birthDate?: string;
  positionId?: string;
  salary?: string;
  contract?: string;
  contractDateStart?: string;
  contractDateEnd?: string;
  employeeType: UserType;
  employeeDateStart: string;
  employeeStatus?: string;
  role: UserRole;
}

// Update user DTO (matches backend updateUserSchema, all partial)
export interface UpdateUserDTO {
  firstname?: string;
  lastname?: string;
  nickname?: string;
  tel?: string;
  address?: string;
  birthDate?: string;
  positionId?: string;
  salary?: string;
  contract?: string;
  contractDateStart?: string;
  contractDateEnd?: string;
  employeeType?: UserType;
  employeeDateStart?: string;
  employeeStatus?: string;
  role?: UserRole;
  password?: string;
  confirmPassword?: string;
  isActive?: boolean;
}