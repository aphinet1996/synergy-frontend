// import type {
//   Lead,
//   LeadListParams,
//   CreateLeadDTO,
//   UpdateLeadDTO,
//   ClinicUser,
//   ClinicUserListParams,
//   CreateClinicUserDTO,
//   UpdateClinicUserDTO,
//   LeadOverviewStats,
//   LeadFinanceStats,
//   LeadInterestStat,
//   LeadTrendStat,
//   LeadClinicStat,
//   StatsParams,
//   Activity,
//   ActivityListParams,
//   CreateActivityDTO,
//   ActivityStats,
//   ApiResponse,
//   Pagination,
//   ClinicOption,
//   ClinicOptionsData,
//   AllOptionsData,
//   FormSchema,
//   Patient,
//   PatientListParams,
//   CreatePatientDTO,
//   UpdatePatientDTO,
//   PatientTransaction,
//   DepositDTO,
//   UseDepositDTO,
//   RefundDTO,
//   AdjustBalanceDTO,
// } from '@/types/externalLeads';
// import { useAuthStore } from '@/stores/authStore';

// // ==================== Config ====================

// // External Leads API base URL
// const EXTERNAL_API_BASE = import.meta.env.VITE_LEADS_API_URL || '/lead/external/v1/api';

// // API Key for external API authentication
// const getApiKey = (): string | null => {
//   return import.meta.env.VITE_LEADS_API_KEY || null;
// };

// // Get access token for internal auth (backup)
// const getAccessToken = (): string | null => {
//   return useAuthStore.getState().tokens?.accessToken || null;
// };

// // ==================== Generic Fetch Helper ====================

// interface FetchOptions extends RequestInit {
//   params?: Record<string, any>;
// }

// const apiFetch = async <T>(
//   endpoint: string,
//   options: FetchOptions = {}
// ): Promise<ApiResponse<T>> => {
//   const apiKey = getApiKey();
//   const accessToken = getAccessToken();

//   if (!apiKey && !accessToken) {
//     return { success: false, error: { code: 'AUTH_ERROR', message: 'No API key or access token available' } };
//   }

//   try {
//     // Build URL with query params
//     let url = `${EXTERNAL_API_BASE}${endpoint}`;
//     if (options.params) {
//       const queryParams = new URLSearchParams();
//       Object.entries(options.params).forEach(([key, value]) => {
//         if (value !== undefined && value !== null && value !== '') {
//           queryParams.append(key, String(value));
//         }
//       });
//       const queryString = queryParams.toString();
//       if (queryString) {
//         url += `?${queryString}`;
//       }
//     }

//     const headers: Record<string, string> = {
//       'Content-Type': 'application/json',
//       ...options.headers as Record<string, string>,
//     };

//     // Prefer API Key for external API
//     if (apiKey) {
//       headers['x-api-key'] = apiKey;
//     } else if (accessToken) {
//       headers['Authorization'] = `Bearer ${accessToken}`;
//     }

//     const response = await fetch(url, {
//       ...options,
//       headers,
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       return {
//         success: false,
//         error: data.error || { code: 'REQUEST_FAILED', message: data.message || response.statusText },
//       };
//     }

//     return data;
//   } catch (error: any) {
//     console.error('External API Error:', error);
//     return {
//       success: false,
//       error: { code: 'NETWORK_ERROR', message: error.message || 'Network error' },
//     };
//   }
// };

// // ==================== Leads API ====================

// export const leadsApi = {
//   // List leads with filters
//   list: async (params?: LeadListParams): Promise<ApiResponse<Lead[]> & { pagination?: Pagination }> => {
//     return apiFetch<Lead[]>('/leads', { params });
//   },

//   // Get single lead by ID
//   getById: async (id: string): Promise<ApiResponse<Lead>> => {
//     return apiFetch<Lead>(`/leads/${id}`);
//   },

//   // Get leads by patient phone
//   getByPhone: async (phone: string): Promise<ApiResponse<Lead[]> & { count?: number }> => {
//     return apiFetch<Lead[]>(`/leads/patient/${phone}`);
//   },

//   // Get leads by clinic
//   getByClinic: async (clinicId: number, params?: { status?: string; limit?: number }): Promise<ApiResponse<Lead[]> & { count?: number }> => {
//     return apiFetch<Lead[]>(`/leads/clinic/${clinicId}`, { params });
//   },

//   // Get appointment history chain
//   getHistory: async (id: string, clinicId: number): Promise<ApiResponse<Lead[]> & { count?: number; currentIndex?: number }> => {
//     return apiFetch<Lead[]>(`/leads/history/${id}`, { params: { clinic_id: clinicId } });
//   },

//   // Create new lead
//   create: async (dto: CreateLeadDTO): Promise<ApiResponse<Lead>> => {
//     return apiFetch<Lead>('/leads', {
//       method: 'POST',
//       body: JSON.stringify(dto),
//     });
//   },

//   // Update lead (requires clinic_id query param)
//   update: async (id: string, clinicId: number, dto: UpdateLeadDTO): Promise<ApiResponse<Lead>> => {
//     return apiFetch<Lead>(`/leads/${id}`, {
//       method: 'PUT',
//       params: { clinic_id: clinicId },
//       body: JSON.stringify(dto),
//     });
//   },

//   // Delete lead (requires clinic_id query param)
//   delete: async (id: string, clinicId: number): Promise<ApiResponse<void>> => {
//     return apiFetch<void>(`/leads/${id}`, {
//       method: 'DELETE',
//       params: { clinic_id: clinicId },
//     });
//   },
// };

// // ==================== Clinic Users API ====================

// export const clinicUsersApi = {
//   // List all users
//   list: async (params?: ClinicUserListParams): Promise<ApiResponse<ClinicUser[]> & { pagination?: Pagination }> => {
//     return apiFetch<ClinicUser[]>('/users', { params });
//   },

//   // Get single user by ID
//   getById: async (id: string): Promise<ApiResponse<ClinicUser>> => {
//     return apiFetch<ClinicUser>(`/users/${id}`);
//   },

//   // Get user by clinic ID
//   getByClinicId: async (clinicId: number): Promise<ApiResponse<ClinicUser>> => {
//     return apiFetch<ClinicUser>(`/users/clinic/${clinicId}`);
//   },

//   // Create new user
//   create: async (dto: CreateClinicUserDTO): Promise<ApiResponse<ClinicUser>> => {
//     return apiFetch<ClinicUser>('/users', {
//       method: 'POST',
//       body: JSON.stringify(dto),
//     });
//   },

//   // Update user
//   update: async (id: string, dto: UpdateClinicUserDTO): Promise<ApiResponse<ClinicUser>> => {
//     return apiFetch<ClinicUser>(`/users/${id}`, {
//       method: 'PUT',
//       body: JSON.stringify(dto),
//     });
//   },

//   // Delete user
//   delete: async (id: string): Promise<ApiResponse<void>> => {
//     return apiFetch<void>(`/users/${id}`, {
//       method: 'DELETE',
//     });
//   },
// };

// // ==================== Stats API ====================

// export const statsApi = {
//   // Get overview statistics
//   getOverview: async (params?: StatsParams): Promise<ApiResponse<LeadOverviewStats>> => {
//     return apiFetch<LeadOverviewStats>('/stats/overview', { params });
//   },

//   // Get financial statistics
//   getFinance: async (params?: StatsParams): Promise<ApiResponse<LeadFinanceStats>> => {
//     return apiFetch<LeadFinanceStats>('/stats/finance', { params });
//   },

//   // Get interest/procedure statistics
//   getInterests: async (params?: StatsParams): Promise<ApiResponse<LeadInterestStat[]>> => {
//     return apiFetch<LeadInterestStat[]>('/stats/interests', { params });
//   },

//   // Get monthly trends
//   getTrends: async (params?: StatsParams): Promise<ApiResponse<LeadTrendStat[]>> => {
//     return apiFetch<LeadTrendStat[]>('/stats/trends', { params });
//   },

//   // Get statistics by clinic
//   getByClinics: async (params?: StatsParams): Promise<ApiResponse<LeadClinicStat[]>> => {
//     return apiFetch<LeadClinicStat[]>('/stats/clinics', { params });
//   },
// };

// // ==================== Activity API ====================

// export const activityApi = {
//   // List activities with filters
//   list: async (params?: ActivityListParams): Promise<ApiResponse<Activity[]> & { pagination?: Pagination }> => {
//     return apiFetch<Activity[]>('/activity', { params });
//   },

//   // Get single activity by ID
//   getById: async (id: string): Promise<ApiResponse<Activity>> => {
//     return apiFetch<Activity>(`/activity/${id}`);
//   },

//   // Get activities by resource
//   getByResource: async (resource: string, resourceId: string, limit?: number): Promise<ApiResponse<Activity[]> & { count?: number }> => {
//     return apiFetch<Activity[]>(`/activity/resource/${resource}/${resourceId}`, { params: { limit } });
//   },

//   // Get activities by user
//   getByUser: async (userId: string, limit?: number): Promise<ApiResponse<Activity[]> & { count?: number }> => {
//     return apiFetch<Activity[]>(`/activity/user/${userId}`, { params: { limit } });
//   },

//   // Get activity statistics
//   getStats: async (params?: StatsParams): Promise<ApiResponse<ActivityStats>> => {
//     return apiFetch<ActivityStats>('/activity/stats', { params });
//   },

//   // Create new activity
//   create: async (dto: CreateActivityDTO): Promise<ApiResponse<Activity>> => {
//     return apiFetch<Activity>('/activity', {
//       method: 'POST',
//       body: JSON.stringify(dto),
//     });
//   },
// };

// // ==================== Options API ====================

// export const optionsApi = {
//   // Get all clinics for dropdown
//   getClinics: async (activeOnly?: boolean): Promise<ApiResponse<ClinicOption[]> & { count?: number }> => {
//     return apiFetch<ClinicOption[]>('/options/clinics', {
//       params: activeOnly ? { active_only: 'true' } : undefined
//     });
//   },

//   // Get clinic options (settings) by clinic ID
//   getClinicOptions: async (clinicId: number): Promise<ApiResponse<ClinicOptionsData>> => {
//     return apiFetch<ClinicOptionsData>(`/options/clinics/${clinicId}`);
//   },

//   // Get all options (for caching)
//   getAllOptions: async (activeOnly?: boolean): Promise<ApiResponse<AllOptionsData> & { count?: number }> => {
//     return apiFetch<AllOptionsData>('/options/all', {
//       params: activeOnly ? { active_only: 'true' } : undefined
//     });
//   },

//   // Get form schema
//   getFormSchema: async (): Promise<ApiResponse<FormSchema>> => {
//     return apiFetch<FormSchema>('/options/form-schema');
//   },
// };

// // ==================== Activity Logger Helper ====================

// // Helper function to log activities from Synergy
// export const logExternalActivity = async (
//   action: CreateActivityDTO['action'],
//   resource: CreateActivityDTO['resource'],
//   description: string,
//   options?: {
//     resourceId?: string;
//     resourceName?: string;
//     changes?: Record<string, { from: any; to: any }>;
//     metadata?: Record<string, any>;
//     clinicId?: number;
//     clinicName?: string;
//   }
// ): Promise<boolean> => {
//   try {
//     // Get current user from auth store
//     const { user } = useAuthStore.getState();

//     if (!user) {
//       console.warn('Cannot log activity: No user logged in');
//       return false;
//     }

//     const dto: CreateActivityDTO = {
//       userId: user.id || 'synergy-system',
//       userName: user.firstname ? `${user.firstname} ${user.lastname}` : 'Synergy System',
//       action,
//       resource,
//       description,
//       ...options,
//     };

//     const result = await activityApi.create(dto);
//     return result.success;
//   } catch (error) {
//     console.error('Failed to log activity:', error);
//     return false;
//   }
// };

// // ==================== Patients API ====================

// export const patientsApi = {
//   // List patients with filters
//   list: async (params: PatientListParams): Promise<ApiResponse<Patient[]> & { pagination?: Pagination }> => {
//     return apiFetch<Patient[]>('/patients', { params });
//   },

//   // Search patients (autocomplete)
//   search: async (clinicId: number, query: string, limit?: number): Promise<ApiResponse<Patient[]>> => {
//     return apiFetch<Patient[]>('/patients/search', {
//       params: { clinic_id: clinicId, q: query, limit },
//     });
//   },

//   // Check duplicate phone
//   checkTel: async (clinicId: number, tel: string, excludeId?: string): Promise<ApiResponse<{ exists: boolean; patient: Patient | null }>> => {
//     return apiFetch<{ exists: boolean; patient: Patient | null }>('/patients/check-tel', {
//       params: { clinic_id: clinicId, tel, exclude_id: excludeId },
//     });
//   },

//   // Get patient by ID
//   getById: async (id: string, clinicId: number): Promise<ApiResponse<Patient>> => {
//     return apiFetch<Patient>(`/patients/${id}`, { params: { clinic_id: clinicId } });
//   },

//   // Create patient
//   create: async (dto: CreatePatientDTO): Promise<ApiResponse<Patient>> => {
//     return apiFetch<Patient>('/patients', {
//       method: 'POST',
//       body: JSON.stringify(dto),
//     });
//   },

//   // Update patient
//   update: async (id: string, dto: UpdatePatientDTO): Promise<ApiResponse<Patient>> => {
//     return apiFetch<Patient>(`/patients/${id}`, {
//       method: 'PUT',
//       body: JSON.stringify(dto),
//     });
//   },

//   // Get patient appointments
//   getAppointments: async (id: string, clinicId: number): Promise<ApiResponse<Lead[]>> => {
//     return apiFetch<Lead[]>(`/patients/${id}/appointments`, { params: { clinic_id: clinicId } });
//   },

//   // Get transaction history
//   getTransactions: async (id: string, clinicId: number): Promise<ApiResponse<PatientTransaction[]>> => {
//     return apiFetch<PatientTransaction[]>(`/patients/${id}/transactions`, { params: { clinic_id: clinicId } });
//   },

//   // Add deposit
//   addDeposit: async (id: string, dto: DepositDTO): Promise<ApiResponse<{ patientId: string; fullname: string; balance: number }>> => {
//     return apiFetch<{ patientId: string; fullname: string; balance: number }>(`/patients/${id}/deposit`, {
//       method: 'POST',
//       body: JSON.stringify(dto),
//     });
//   },

//   // Use deposit
//   useDeposit: async (id: string, dto: UseDepositDTO): Promise<ApiResponse<{ patientId: string; fullname: string; balance: number }>> => {
//     return apiFetch<{ patientId: string; fullname: string; balance: number }>(`/patients/${id}/use-deposit`, {
//       method: 'POST',
//       body: JSON.stringify(dto),
//     });
//   },

//   // Refund deposit
//   refund: async (id: string, dto: RefundDTO): Promise<ApiResponse<{ patientId: string; fullname: string; balance: number }>> => {
//     return apiFetch<{ patientId: string; fullname: string; balance: number }>(`/patients/${id}/refund`, {
//       method: 'POST',
//       body: JSON.stringify(dto),
//     });
//   },

//   // Adjust balance (admin)
//   adjustBalance: async (id: string, dto: AdjustBalanceDTO): Promise<ApiResponse<{ patientId: string; fullname: string; balance: number }>> => {
//     return apiFetch<{ patientId: string; fullname: string; balance: number }>(`/patients/${id}/adjust`, {
//       method: 'POST',
//       body: JSON.stringify(dto),
//     });
//   },
// };

// // ==================== Export ====================

// export const externalLeadsService = {
//   leads: leadsApi,
//   clinicUsers: clinicUsersApi,
//   stats: statsApi,
//   activity: activityApi,
//   options: optionsApi,
//   patients: patientsApi,
//   logActivity: logExternalActivity,
// };

import type {
  Lead,
  LeadListParams,
  CreateLeadDTO,
  UpdateLeadDTO,
  ClinicUser,
  ClinicUserListParams,
  CreateClinicUserDTO,
  UpdateClinicUserDTO,
  LeadOverviewStats,
  LeadFinanceStats,
  LeadInterestStat,
  LeadTrendStat,
  LeadClinicStat,
  StatsParams,
  Activity,
  ActivityListParams,
  CreateActivityDTO,
  ActivityStats,
  ApiResponse,
  Pagination,
  ClinicOption,
  ClinicOptionsData,
  AllOptionsData,
  FormSchema,
  Patient,
  PatientListParams,
  CreatePatientDTO,
  UpdatePatientDTO,
  PatientTransaction,
  DepositDTO,
  UseDepositDTO,
  RefundDTO,
  AdjustBalanceDTO,
} from '@/types/externalLeads';
import { useAuthStore } from '@/stores/authStore';

// ==================== Config ====================

// External Leads API base URL
const EXTERNAL_API_BASE = import.meta.env.VITE_LEADS_API_URL || '/lead/external/v1/api';

// API Key for external API authentication
const getApiKey = (): string | null => {
  return import.meta.env.VITE_LEADS_API_KEY || null;
};

// Get access token for internal auth (backup)
const getAccessToken = (): string | null => {
  return useAuthStore.getState().tokens?.accessToken || null;
};

// ==================== Generic Fetch Helper ====================

interface FetchOptions extends RequestInit {
  params?: Record<string, any>;
}

const apiFetch = async <T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> => {
  const apiKey = getApiKey();
  const accessToken = getAccessToken();

  if (!apiKey && !accessToken) {
    return { success: false, error: { code: 'AUTH_ERROR', message: 'No API key or access token available' } };
  }

  try {
    // Build URL with query params
    let url = `${EXTERNAL_API_BASE}${endpoint}`;
    if (options.params) {
      const queryParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Prefer API Key for external API
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    } else if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || { code: 'REQUEST_FAILED', message: data.message || response.statusText },
      };
    }

    return data;
  } catch (error: any) {
    console.error('External API Error:', error);
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error.message || 'Network error' },
    };
  }
};

// ==================== Leads API ====================

export const leadsApi = {
  // List leads with filters
  list: async (params?: LeadListParams): Promise<ApiResponse<Lead[]> & { pagination?: Pagination }> => {
    return apiFetch<Lead[]>('/leads', { params });
  },

  // Get single lead by ID
  getById: async (id: string): Promise<ApiResponse<Lead>> => {
    return apiFetch<Lead>(`/leads/${id}`);
  },

  // Get leads by patient phone
  getByPhone: async (phone: string): Promise<ApiResponse<Lead[]> & { count?: number }> => {
    return apiFetch<Lead[]>(`/leads/patient/${phone}`);
  },

  // Get leads by clinic
  getByClinic: async (clinicId: number, params?: { status?: string; limit?: number }): Promise<ApiResponse<Lead[]> & { count?: number }> => {
    return apiFetch<Lead[]>(`/leads/clinic/${clinicId}`, { params });
  },

  // Get appointment history chain
  getHistory: async (id: string, clinicId: number): Promise<ApiResponse<Lead[]> & { count?: number; currentIndex?: number }> => {
    return apiFetch<Lead[]>(`/leads/history/${id}`, { params: { clinic_id: clinicId } });
  },

  // Create new lead
  create: async (dto: CreateLeadDTO): Promise<ApiResponse<Lead>> => {
    return apiFetch<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  // Update lead (requires clinic_id query param)
  update: async (id: string, clinicId: number, dto: UpdateLeadDTO): Promise<ApiResponse<Lead>> => {
    return apiFetch<Lead>(`/leads/${id}`, {
      method: 'PUT',
      params: { clinic_id: clinicId },
      body: JSON.stringify(dto),
    });
  },

  // Delete lead (requires clinic_id query param)
  delete: async (id: string, clinicId: number): Promise<ApiResponse<void>> => {
    return apiFetch<void>(`/leads/${id}`, {
      method: 'DELETE',
      params: { clinic_id: clinicId },
    });
  },
};

// ==================== Clinic Users API ====================

export const clinicUsersApi = {
  // List all users
  list: async (params?: ClinicUserListParams): Promise<ApiResponse<ClinicUser[]> & { pagination?: Pagination }> => {
    return apiFetch<ClinicUser[]>('/users', { params });
  },

  // Get single user by ID
  getById: async (id: string): Promise<ApiResponse<ClinicUser>> => {
    return apiFetch<ClinicUser>(`/users/${id}`);
  },

  // Get user by clinic ID
  getByClinicId: async (clinicId: number): Promise<ApiResponse<ClinicUser>> => {
    return apiFetch<ClinicUser>(`/users/clinic/${clinicId}`);
  },

  // Create new user
  create: async (dto: CreateClinicUserDTO): Promise<ApiResponse<ClinicUser>> => {
    return apiFetch<ClinicUser>('/users', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  // Update user
  update: async (id: string, dto: UpdateClinicUserDTO): Promise<ApiResponse<ClinicUser>> => {
    return apiFetch<ClinicUser>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  // Delete user
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiFetch<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== Stats API ====================

export const statsApi = {
  // Get overview statistics
  getOverview: async (params?: StatsParams): Promise<ApiResponse<LeadOverviewStats>> => {
    return apiFetch<LeadOverviewStats>('/stats/overview', { params });
  },

  // Get financial statistics
  getFinance: async (params?: StatsParams): Promise<ApiResponse<LeadFinanceStats>> => {
    return apiFetch<LeadFinanceStats>('/stats/finance', { params });
  },

  // Get interest/procedure statistics
  getInterests: async (params?: StatsParams): Promise<ApiResponse<LeadInterestStat[]>> => {
    return apiFetch<LeadInterestStat[]>('/stats/interests', { params });
  },

  // Get monthly trends
  getTrends: async (params?: StatsParams): Promise<ApiResponse<LeadTrendStat[]>> => {
    return apiFetch<LeadTrendStat[]>('/stats/trends', { params });
  },

  // Get statistics by clinic
  getByClinics: async (params?: StatsParams): Promise<ApiResponse<LeadClinicStat[]>> => {
    return apiFetch<LeadClinicStat[]>('/stats/clinics', { params });
  },
};

// ==================== Activity API ====================

export const activityApi = {
  // List activities with filters
  list: async (params?: ActivityListParams): Promise<ApiResponse<Activity[]> & { pagination?: Pagination }> => {
    return apiFetch<Activity[]>('/activity', { params });
  },

  // Get single activity by ID
  getById: async (id: string): Promise<ApiResponse<Activity>> => {
    return apiFetch<Activity>(`/activity/${id}`);
  },

  // Get activities by resource
  getByResource: async (resource: string, resourceId: string, limit?: number): Promise<ApiResponse<Activity[]> & { count?: number }> => {
    return apiFetch<Activity[]>(`/activity/resource/${resource}/${resourceId}`, { params: { limit } });
  },

  // Get activities by user
  getByUser: async (userId: string, limit?: number): Promise<ApiResponse<Activity[]> & { count?: number }> => {
    return apiFetch<Activity[]>(`/activity/user/${userId}`, { params: { limit } });
  },

  // Get activity statistics
  getStats: async (params?: StatsParams): Promise<ApiResponse<ActivityStats>> => {
    return apiFetch<ActivityStats>('/activity/stats', { params });
  },

  // Create new activity
  create: async (dto: CreateActivityDTO): Promise<ApiResponse<Activity>> => {
    return apiFetch<Activity>('/activity', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};

// ==================== Options API ====================

export const optionsApi = {
  // Get all clinics for dropdown
  getClinics: async (activeOnly?: boolean): Promise<ApiResponse<ClinicOption[]> & { count?: number }> => {
    return apiFetch<ClinicOption[]>('/options/clinics', {
      params: activeOnly ? { active_only: 'true' } : undefined
    });
  },

  // Get clinic options (settings) by clinic ID
  getClinicOptions: async (clinicId: number): Promise<ApiResponse<ClinicOptionsData>> => {
    return apiFetch<ClinicOptionsData>(`/options/clinics/${clinicId}`);
  },

  // Get all options (for caching)
  getAllOptions: async (activeOnly?: boolean): Promise<ApiResponse<AllOptionsData> & { count?: number }> => {
    return apiFetch<AllOptionsData>('/options/all', {
      params: activeOnly ? { active_only: 'true' } : undefined
    });
  },

  // Get form schema
  getFormSchema: async (): Promise<ApiResponse<FormSchema>> => {
    return apiFetch<FormSchema>('/options/form-schema');
  },
};

// ==================== Activity Logger Helper ====================

// Helper function to log activities from Synergy
export const logExternalActivity = async (
  action: CreateActivityDTO['action'],
  resource: CreateActivityDTO['resource'],
  description: string,
  options?: {
    resourceId?: string;
    resourceName?: string;
    changes?: Record<string, { from: any; to: any }>;
    metadata?: Record<string, any>;
    clinicId?: number;
    clinicName?: string;
  }
): Promise<boolean> => {
  try {
    // Get current user from auth store
    const { user } = useAuthStore.getState();

    if (!user) {
      console.warn('Cannot log activity: No user logged in');
      return false;
    }

    const dto: CreateActivityDTO = {
      userId: user.id || 'synergy-system',
      userName: user.firstname ? `${user.firstname} ${user.lastname}` : 'Synergy System',
      action,
      resource,
      description,
      ...options,
    };

    const result = await activityApi.create(dto);
    return result.success;
  } catch (error) {
    console.error('Failed to log activity:', error);
    return false;
  }
};

// ==================== Patients API ====================

export const patientsApi = {
  // List patients with filters
  list: async (params: PatientListParams): Promise<ApiResponse<Patient[]> & { pagination?: Pagination }> => {
    return apiFetch<Patient[]>('/patients', { params });
  },

  // Search patients (autocomplete)
  search: async (clinicId: number, query: string, limit?: number): Promise<ApiResponse<Patient[]>> => {
    return apiFetch<Patient[]>('/patients/search', {
      params: { clinic_id: clinicId, q: query, limit },
    });
  },

  // Check duplicate phone
  checkTel: async (clinicId: number, tel: string, excludeId?: string): Promise<ApiResponse<{ exists: boolean; patient: Patient | null }>> => {
    return apiFetch<{ exists: boolean; patient: Patient | null }>('/patients/check-tel', {
      params: { clinic_id: clinicId, tel, exclude_id: excludeId },
    });
  },

  // Get patient by ID
  getById: async (id: string, clinicId: number): Promise<ApiResponse<Patient>> => {
    return apiFetch<Patient>(`/patients/${id}`, { params: { clinic_id: clinicId } });
  },

  // Create patient
  create: async (dto: CreatePatientDTO): Promise<ApiResponse<Patient>> => {
    return apiFetch<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  // Update patient
  update: async (id: string, dto: UpdatePatientDTO): Promise<ApiResponse<Patient>> => {
    return apiFetch<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  // Get patient appointments
  getAppointments: async (id: string, clinicId: number): Promise<ApiResponse<Lead[]>> => {
    return apiFetch<Lead[]>(`/patients/${id}/appointments`, { params: { clinic_id: clinicId } });
  },

  // Get transaction history
  getTransactions: async (id: string, clinicId: number): Promise<ApiResponse<PatientTransaction[]>> => {
    return apiFetch<PatientTransaction[]>(`/patients/${id}/transactions`, { params: { clinic_id: clinicId } });
  },

  // Add deposit
  addDeposit: async (id: string, dto: DepositDTO): Promise<ApiResponse<{ patientId: string; fullname: string; balance: number }>> => {
    return apiFetch<{ patientId: string; fullname: string; balance: number }>(`/patients/${id}/deposit`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  // Use deposit
  useDeposit: async (id: string, dto: UseDepositDTO): Promise<ApiResponse<{ patientId: string; fullname: string; balance: number }>> => {
    return apiFetch<{ patientId: string; fullname: string; balance: number }>(`/patients/${id}/use-deposit`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  // Refund deposit
  refund: async (id: string, dto: RefundDTO): Promise<ApiResponse<{ patientId: string; fullname: string; balance: number }>> => {
    return apiFetch<{ patientId: string; fullname: string; balance: number }>(`/patients/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  // Adjust balance (admin)
  adjustBalance: async (id: string, dto: AdjustBalanceDTO): Promise<ApiResponse<{ patientId: string; fullname: string; balance: number }>> => {
    return apiFetch<{ patientId: string; fullname: string; balance: number }>(`/patients/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};

// ==================== Uploads API ====================
// Upload flow: upload files first → get URLs → use in lead create/update body
// POST /uploads/slips  → receiptUrls[]
// POST /uploads/receipts → receiptUrls[]

const uploadMultipart = async <T>(
  endpoint: string,
  fieldName: string,
  files: File[]
): Promise<ApiResponse<T>> => {
  const apiKey = getApiKey();
  const accessToken = getAccessToken();
  if (!apiKey && !accessToken) {
    return { success: false, error: { code: 'AUTH_ERROR', message: 'No API key or access token available' } };
  }
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append(fieldName, file));

    const headers: Record<string, string> = {};
    if (apiKey) headers['x-api-key'] = apiKey;
    else if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    // Do NOT set Content-Type — browser sets multipart boundary automatically

    const url = `${EXTERNAL_API_BASE}${endpoint}`;
    const response = await fetch(url, { method: 'POST', headers, body: formData });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || { code: 'UPLOAD_FAILED', message: data.message || response.statusText } };
    }
    return data;
  } catch (error: any) {
    return { success: false, error: { code: 'NETWORK_ERROR', message: error.message || 'Network error' } };
  }
};

export interface UploadedFile {
  url: string;
  filename: string;
  size: number;
}

export interface UploadMultipleResult {
  urls: string[];
  files: UploadedFile[];
  count: number;
}

export const uploadsApi = {
  // Upload multiple slip images (field: 'slips', max 5)
  // → use returned urls as receiptUrls in lead create/update
  uploadSlips: (files: File[]): Promise<ApiResponse<UploadMultipleResult>> =>
    uploadMultipart<UploadMultipleResult>('/uploads/slips', 'slips', files),

  // Upload multiple receipt images (field: 'receipts', max 5)
  uploadReceipts: (files: File[]): Promise<ApiResponse<UploadMultipleResult>> =>
    uploadMultipart<UploadMultipleResult>('/uploads/receipts', 'receipts', files),

  // Upload single slip (field: 'slip')
  uploadSlip: (file: File): Promise<ApiResponse<UploadedFile & { url: string }>> =>
    uploadMultipart<UploadedFile & { url: string }>('/uploads/slip', 'slip', [file]),

  // Upload single receipt (field: 'receipt')
  uploadReceipt: (file: File): Promise<ApiResponse<UploadedFile & { url: string }>> =>
    uploadMultipart<UploadedFile & { url: string }>('/uploads/receipt', 'receipt', [file]),
};

// ==================== Export ====================

export const externalLeadsService = {
  leads: leadsApi,
  clinicUsers: clinicUsersApi,
  stats: statsApi,
  activity: activityApi,
  options: optionsApi,
  patients: patientsApi,
  uploads: uploadsApi,
  logActivity: logExternalActivity,
};