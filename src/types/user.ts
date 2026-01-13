export type UserRole = 'admin' | 'manager' | 'employee' | 'developer';

export interface User {
  id: string;
  username: string;
  profile: string | null;
  firstname: string;
  lastname: string;
  nickname: string;
  lineUserId: string | null;
  tel: string;
  address: string;
  birthDate: Date;
  position: string;
  contract: string;
  contractDateStart: Date;
  contractDateEnd: Date;
  employeeType: string;
  employeeDateStart: Date;
  employeeStatus: string | null;
  role: UserRole;
  isActive: boolean;
  lastLogin: Date;
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserMeResponse {
  status: 'success';
  data: {
    user: User;
  };
}

export interface UserSummary {
  id: string;
  name: string;
  role: UserRole;
  position?: string;
  isActive?: boolean;
}

export interface UserListParams {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
}