export interface LeadPatient {
  fullname: string;
  tel?: string;
  nickname?: string;
  lineId?: string;
  email?: string;
}

export interface LeadClinic {
  clinicId: number;
  name: string;
  branch: string;
}

export interface LeadAppointment {
  status: 'pending' | 'scheduled' | 'rescheduled' | 'arrived' | 'cancelled';
  date?: string;
  time?: string;
  note?: string;
}

export interface LeadInterest {
  name: string;
  category?: string;
}

export interface LeadProcedure {
  name: string;
  price?: number;
  commissionRate?: number;
  commissionAmount?: number;
  depositUsed?: number;
}

export interface LeadPayment {
  amount: number;
  method?: string;
  serviceCharge?: {
    amount: number;
    netAmount: number;
  };
  commission?: {
    totalAmount: number;
    details?: Array<{
      procedureName: string;
      baseAmount: number;
      rate: number;
      amount: number;
    }>;
  };
}

export interface LeadDeposit {
  amount?: number;
  slipUrls?: string[];
}

export interface Lead {
  _id: string;
  patientId?: string;
  clinic: LeadClinic;
  patient: LeadPatient;
  appointments: LeadAppointment;
  interests?: LeadInterest[];
  procedures?: LeadProcedure[];
  payments?: LeadPayment;
  deposit?: LeadDeposit;
  receiptUrl?: string;
  receiptUrls?: string[];
  referralChannel?: string;
  note?: string;
  arrivedNote?: string;
  createdBy: string;
  previousAppointmentId?: string;
  nextAppointmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadListParams {
  status?: string;
  clinic_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreateLeadDTO {
  clinic: LeadClinic;
  patient: LeadPatient;
  appointments?: LeadAppointment;
  interests?: LeadInterest[];
  procedures?: LeadProcedure[];
  deposit?: number | LeadDeposit;
  receiptUrl?: string;
  receiptUrls?: string[];
  referralChannel?: string;
  note?: string;
  createdBy: string;
  previousAppointmentId?: string;
}

export interface UpdateLeadDTO {
  patient?: Partial<LeadPatient>;
  appointments?: Partial<LeadAppointment>;
  interests?: LeadInterest[];
  procedures?: LeadProcedure[];
  payments?: Partial<LeadPayment>;
  deposit?: number | LeadDeposit;
  receiptUrl?: string;
  receiptUrls?: string[];
  referralChannel?: string;
  note?: string;
}

// ==================== Clinic User Types ====================

export interface ClinicUser {
  _id: string;
  clinicId: number;
  username: string;
  clinicName: string;
  branch: string;
  expired?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicUserListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreateClinicUserDTO {
  username: string;
  password: string;
  clinicName: string;
  branch: string;
  expired?: string;
}

export interface UpdateClinicUserDTO {
  username?: string;
  password?: string;
  clinicName?: string;
  branch?: string;
  expired?: string;
}

// ==================== Stats Types ====================

export interface LeadOverviewStats {
  total: number;
  byStatus: Record<string, number>;
  pending: number;
  scheduled: number;
  rescheduled: number;
  arrived: number;
  cancelled: number;
}

export interface LeadFinanceStats {
  totalRevenue: number;
  totalNetRevenue: number;
  totalCommission: number;
  totalServiceCharge: number;
  transactionCount: number;
  avgTransaction: number;
}

export interface LeadInterestStat {
  name: string;
  count: number;
}

export interface LeadTrendStat {
  year: number;
  month: number;
  period: string;
  total: number;
  arrived: number;
  revenue: number;
  conversionRate: number;
}

export interface LeadClinicStat {
  clinicId: number;
  clinicName: string;
  branch: string;
  total: number;
  arrived: number;
  revenue: number;
  conversionRate: number;
}

export interface StatsParams {
  clinic_id?: number;
  start_date?: string;
  end_date?: string;
  months?: number;
  status?: string;
}

// ==================== Activity Types ====================

export type ActivityAction = 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'export' | 'import';
export type ActivityResource = 'lead' | 'user' | 'setting' | 'clinic' | 'report' | 'api_key' | 'patient' | 'patient_deposit' | 'patient_balance';

export interface Activity {
  _id: string;
  userId: string;
  userName: string;
  action: ActivityAction;
  resource: ActivityResource;
  resourceId?: string;
  resourceName?: string;
  description: string;
  changes?: Record<string, { from: any; to: any }>;
  metadata?: Record<string, any>;
  clinicId?: number;
  clinicName?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ActivityListParams {
  user_id?: string;
  action?: ActivityAction;
  resource?: ActivityResource;
  resource_id?: string;
  clinic_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreateActivityDTO {
  userId: string;
  userName: string;
  action: ActivityAction;
  resource: ActivityResource;
  resourceId?: string;
  resourceName?: string;
  description: string;
  changes?: Record<string, { from: any; to: any }>;
  metadata?: Record<string, any>;
  clinicId?: number;
  clinicName?: string;
}

export interface ActivityStats {
  totalActivities: number;
  byAction: Record<string, number>;
  byResource: Record<string, number>;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
}

// ==================== Options Types ====================

// จาก GET /options/clinics
export interface ClinicOption {
  value: number;
  label: string;
  clinicId: number;
  clinicName: string;
  branch: string;
  expired?: string;
  isExpired: boolean;
}

// จาก GET /options/clinics/:clinicId → options.admins, branches, channels, interests
export interface SelectOption {
  value: string;
  label: string;
  id: string;
  name: string;
}

// จาก GET /options/clinics/:clinicId → options.statuses
export interface StatusOption {
  value: string;
  label: string;
}

// จาก GET /options/clinics/:clinicId
export interface ClinicOptionsData {
  clinic: {
    clinicId: number;
    clinicName: string;
    branch: string;
  };
  options: {
    admins: SelectOption[];
    branches: SelectOption[];
    channels: SelectOption[];
    interests: SelectOption[];
    statuses: StatusOption[];
  };
}

// จาก GET /options/all
export interface AllOptionsData {
  clinics: Array<{
    clinic: ClinicOption;
    options: {
      admin: SelectOption[];
      branch: SelectOption[];
      channel: SelectOption[];
      interest: SelectOption[];
    };
  }>;
  statuses: StatusOption[];
}

// Form Schema Field
export interface FormSchemaField {
  name: string;
  type: 'text' | 'tel' | 'select' | 'multiselect' | 'textarea' | 'datetime';
  label: string;
  required: boolean;
  options?: StatusOption[];
  optionsEndpoint?: string;
  optionsFrom?: string;
  default?: string;
  showWhen?: { field: string; value: string };
}

export interface FormSchema {
  fields: FormSchemaField[];
  submitEndpoint: string;
  submitMethod: string;
}

// ==================== Patient Types ====================

export interface Patient {
  _id: string;
  clinicId: number;
  fullname: string;
  nickname?: string;
  tel?: string;
  socialMedia?: string;
  note?: string;
  interest?: string;
  referralChannel?: string;
  branch?: string;
  balance: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientListParams {
  clinic_id: number;
  page?: number;
  limit?: number;
  search?: string;
  has_balance?: boolean;
}

export interface CreatePatientDTO {
  clinic_id: number;
  fullname: string;
  nickname?: string;
  tel?: string;
  socialMedia?: string;
  note?: string;
  interest?: string;
  referralChannel?: string;
  branch?: string;
  createdBy?: string;
}

export interface UpdatePatientDTO {
  clinic_id: number;
  fullname?: string;
  nickname?: string;
  tel?: string;
  socialMedia?: string;
  note?: string;
  interest?: string;
  referralChannel?: string;
  branch?: string;
}

export interface PatientTransaction {
  _id: string;
  patientId: string;
  clinicId: number;
  type: 'deposit' | 'use' | 'refund' | 'adjust';
  amount: number;
  balance: number;
  description?: string;
  appointmentId?: string;
  createdBy: string;
  createdAt: string;
}

export interface DepositDTO {
  clinic_id: number;
  amount: number;
  description?: string;
  appointmentId?: string;
  slipUrl?: string;
  createdBy?: string;
}

export interface UseDepositDTO {
  clinic_id: number;
  amount: number;
  description?: string;
  appointmentId?: string;
  createdBy?: string;
}

export interface RefundDTO {
  clinic_id: number;
  amount: number;
  description?: string;
  appointmentId?: string;
  createdBy?: string;
}

export interface AdjustBalanceDTO {
  clinic_id: number;
  amount: number;
  description: string;
  createdBy?: string;
}

// ==================== API Response Types ====================

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  pagination?: Pagination;
  count?: number;
}