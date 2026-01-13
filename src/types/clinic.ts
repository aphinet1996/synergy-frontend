// import type { UserSummary } from '@/types/user'; // สำหรับ assignedTo (lite user)

// export type ClinicStatus = 'active' | 'inactive' | 'pending'; // จาก response
// export type ClinicLevel = 'premium' | 'standard' | 'basic'; // สมมติจาก example
// export type ContractType = 'yearly' | 'monthly' | 'one-time'; // จาก response
// export type SortBy = 'newest' | 'name' | 'contract'; // จาก query param

// export interface ServiceSection {
//   name: string;
//   amount: number;
// }

// export interface SetupService {
//   requirement: boolean;
//   socialMedia: boolean;
//   adsManager: boolean;
// }

// export interface Service {
//   setup: SetupService;
//   coperateIdentity: ServiceSection[];
//   website: ServiceSection[];
//   socialMedia: ServiceSection[];
//   training: ServiceSection[];
// }

// export interface Clinic {
//   id: string;
//   logo: string;
//   name: {
//     en: string;
//     th: string;
//   };
//   clinicProfile: string;
//   clinicLevel: ClinicLevel;
//   contractType: ContractType;
//   contractDateStart: Date; // Parse จาก ISO string
//   contractDateEnd: Date;
//   status: ClinicStatus;
//   assignedTo: UserSummary[]; // Array ของ users
//   note: string;
//   service: Service;
//   createdBy: string; // User ID
//   updatedBy: string | null;
//   clinicName?: string; // Computed: name.th สำหรับ UI
// }

// // Request types (dates เป็น string "MM/DD/YYYY" สำหรับ body)
// export interface CreateClinicRequest {
//   name: {
//     en: string;
//     th: string;
//   };
//   clinicProfile: string;
//   clinicLevel: ClinicLevel;
//   contractType: ContractType;
//   contractDateStart: string; // "MM/DD/YYYY"
//   contractDateEnd: string;
//   status: ClinicStatus;
//   assignedTo: string[]; // Array ของ user IDs
//   note: string;
//   service: Service;
//   createdBy: string; // Current user ID
// }

// export interface UpdateClinicRequest {
//   name?: {
//     en: string;
//     th: string;
//   };
//   clinicProfile?: string;
//   clinicLevel?: ClinicLevel;
//   contractType?: ContractType;
//   contractDateStart?: string;
//   contractDateEnd?: string;
//   status?: ClinicStatus;
//   assignedTo?: string[];
//   note?: string;
//   service?: Service;
//   updatedBy?: string;
// }

// // Query params สำหรับ GET list
// export interface ClinicListParams {
//   search?: string;
//   sort?: SortBy;
//   page?: number;
//   limit?: number;
// }

// // Response types
// export interface ClinicListResponse {
//   status: 'success';
//   results: number;
//   pagination: {
//     page: number;
//     limit: number;
//     total: number;
//     totalPages: number;
//   };
//   data: {
//     clinics: Clinic[];
//   };
// }

// export interface ClinicDetailResponse {
//   status: 'success';
//   data: {
//     clinic: Clinic;
//   };
// }

// src/types/clinic.ts

// src/types/clinic.ts

import type { UserSummary } from '@/types/user';

export type ClinicStatus = 'active' | 'inactive' | 'pending';
export type ClinicLevel = 'premium' | 'standard' | 'basic';
export type ContractType = 'yearly' | 'monthly' | 'project'; // แก้จาก 'one-time' เป็น 'project' ตาม backend
export type SortBy = 'newest' | 'name' | 'contract';

export interface ServiceSection {
  name: string;
  amount: number;
  weekStart?: number;
  weekEnd?: number;
}

export interface SetupService {
  requirement: boolean;
  socialMedia: boolean;
  adsManager: boolean;
}

export interface Service {
  setup: SetupService;
  coperateIdentity: ServiceSection[];
  website: ServiceSection[];
  socialMedia: ServiceSection[];
  training: ServiceSection[];
}

// Timeline item interface (matching backend)
export interface TimelineItem {
  _id?: string;
  serviceType: 'setup' | 'coperateIdentity' | 'website' | 'socialMedia' | 'training';
  serviceName: string;
  serviceAmount: string;
  weekStart: number;
  weekEnd: number;
  updatedBy?: string;
  updatedAt?: Date;
}

// Procedure reference (simplified for clinic)
export interface ProcedureRef {
  id: string;
  name: string;
}

export interface Clinic {
  id: string;
  logo?: string;
  name: {
    en: string;
    th: string;
  };
  clinicProfile?: string;
  clinicLevel: ClinicLevel;
  contractType: ContractType;
  contractDateStart: Date;
  contractDateEnd: Date;
  status: ClinicStatus;
  assignedTo: UserSummary[];
  note?: string;
  service: Service;
  procedures: string[] | ProcedureRef[]; // Array of procedure IDs or populated refs
  timeline?: TimelineItem[];
  totalWeeks?: number;
  createdBy: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  clinicName?: string; // Computed: name.th for UI
}

// Request types (dates as string "MM/DD/YYYY" for body)
export interface CreateClinicRequest {
  name: {
    en: string;
    th: string;
  };
  clinicProfile?: string;
  clinicLevel: ClinicLevel;
  contractType: ContractType;
  contractDateStart: string;
  contractDateEnd: string;
  status: ClinicStatus;
  assignedTo: string[]; // Array of user IDs
  note?: string;
  service: Service;
  procedures?: string[]; // Array of procedure IDs
}

export interface UpdateClinicRequest {
  name?: {
    en: string;
    th: string;
  };
  clinicProfile?: string;
  clinicLevel?: ClinicLevel;
  contractType?: ContractType;
  contractDateStart?: string;
  contractDateEnd?: string;
  status?: ClinicStatus;
  assignedTo?: string[];
  note?: string;
  service?: Service;
  procedures?: string[];
}

// Query params for GET list
export interface ClinicListParams {
  search?: string;
  sort?: SortBy;
  page?: number;
  limit?: number;
}

// Response types
export interface ClinicListResponse {
  status: 'success';
  results: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: {
    clinics: Clinic[];
  };
}

export interface ClinicDetailResponse {
  status: 'success';
  data: {
    clinic: Clinic;
  };
}