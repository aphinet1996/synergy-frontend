// import type { ClinicListResponse, ClinicDetailResponse, CreateClinicRequest, UpdateClinicRequest, Clinic, ClinicListParams } from '@/types/clinic';

// const API_BASE = import.meta.env.VITE_API_BASE_URL || '/synergy/api';

// // Helper: Get access token from localStorage (จาก authStore persist)
// const getAccessToken = (): string | null => {
//   try {
//     const authStorage = localStorage.getItem('auth-storage');
//     if (authStorage) {
//       const parsed = JSON.parse(authStorage);
//       return parsed.state?.tokens?.accessToken || null;
//     }
//     return null;
//   } catch {
//     return null;
//   }
// };

// // Helper: Format Date to "MM/DD/YYYY" สำหรับ request body
// const formatDateToAPI = (date: Date | string): string => {
//   const d = typeof date === 'string' ? new Date(date) : date;
//   return d.toLocaleDateString('en-US', {
//     month: '2-digit',
//     day: '2-digit',
//     year: 'numeric',
//   });
// };

// interface ApiResponse<T> {
//   success: boolean;
//   data?: T;
//   error?: string;
// }

// // GET /synergy/api/clinic/ - List with optional params
// export const getClinics = async (params?: ClinicListParams): Promise<ApiResponse<{ clinics: Clinic[]; pagination: ClinicListResponse['pagination'] }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   // Build query string
//   const queryParams = new URLSearchParams();
//   if (params?.search) queryParams.append('search', params.search);
//   if (params?.sort) queryParams.append('sort', params.sort);
//   if (params?.page) queryParams.append('page', params.page.toString());
//   if (params?.limit) queryParams.append('limit', params.limit.toString());

//   const queryString = queryParams.toString();
//   const url = `${API_BASE}/clinic/${queryString ? `?${queryString}` : ''}`;

//   const response = await fetch(url, {
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   if (!response.ok) {
//     return { success: false, error: `Failed to fetch clinics: ${response.statusText}` };
//   }

//   const data: ClinicListResponse = await response.json();
//   if (data.status !== 'success') {
//     return { success: false, error: 'Failed to fetch clinics' };
//   }

//   // Parse dates
//   const clinics = data.data.clinics.map((clinic) => ({
//     ...clinic,
//     contractDateStart: new Date(clinic.contractDateStart),
//     contractDateEnd: new Date(clinic.contractDateEnd),
//     clinicName: clinic.name.th,
//   }));

//   return { success: true, data: { clinics, pagination: data.pagination } };
// };

// // GET /synergy/api/clinic/:id
// export const getClinicById = async (id: string): Promise<ApiResponse<{ clinic: Clinic }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   const response = await fetch(`${API_BASE}/clinic/${id}`, {
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   if (!response.ok) {
//     return { success: false, error: `Failed to fetch clinic: ${response.statusText}` };
//   }

//   const data: ClinicDetailResponse = await response.json();
//   if (data.status !== 'success') {
//     return { success: false, error: 'Failed to fetch clinic' };
//   }

//   // Parse dates
//   const clinic = {
//     ...data.data.clinic,
//     contractDateStart: new Date(data.data.clinic.contractDateStart),
//     contractDateEnd: new Date(data.data.clinic.contractDateEnd),
//     clinicName: data.data.clinic.name.th,
//   };

//   return { success: true, data: { clinic } };
// };

// // POST /synergy/api/clinic/
// export const createClinic = async (payload: CreateClinicRequest): Promise<ApiResponse<void>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   const body: CreateClinicRequest = {
//     ...payload,
//     contractDateStart: formatDateToAPI(payload.contractDateStart),
//     contractDateEnd: formatDateToAPI(payload.contractDateEnd),
//   };

//   const response = await fetch(`${API_BASE}/clinic/`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(body),
//   });

//   if (!response.ok) {
//     return { success: false, error: `Failed to create clinic: ${response.statusText}` };
//   }

//   const data = await response.json();
//   if (data.status !== 'success') {
//     return { success: false, error: data.message || 'Failed to create clinic' };
//   }

//   return { success: true };
// };

// // PUT /synergy/api/clinic/:id
// export const updateClinic = async (id: string, payload: UpdateClinicRequest): Promise<ApiResponse<void>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   const body: UpdateClinicRequest = {
//     ...payload,
//     ...(payload.contractDateStart && { contractDateStart: formatDateToAPI(payload.contractDateStart) }),
//     ...(payload.contractDateEnd && { contractDateEnd: formatDateToAPI(payload.contractDateEnd) }),
//   };

//   const response = await fetch(`${API_BASE}/clinic/${id}`, {
//     method: 'PUT',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(body),
//   });

//   if (!response.ok) {
//     return { success: false, error: `Failed to update clinic: ${response.statusText}` };
//   }

//   const data = await response.json();
//   if (data.status !== 'success') {
//     return { success: false, error: data.message || 'Failed to update clinic' };
//   }

//   return { success: true };
// };

// export const clinicService = {
//   getClinics,
//   getClinicById,
//   createClinic,
//   updateClinic,
// };

// 2

// import type { 
//   ClinicListResponse, 
//   ClinicDetailResponse, 
//   CreateClinicRequest, 
//   UpdateClinicRequest, 
//   Clinic, 
//   ClinicListParams,
//   TimelineItem 
// } from '@/types/clinic';
// import { useAuthStore } from '@/stores/authStore';

// const API_BASE = import.meta.env.VITE_API_BASE_URL || '/synergy/api';

// // Helper: Get access token
// const getAccessToken = (): string | null => {
//   return useAuthStore.getState().tokens?.accessToken || null;
// };

// // Helper: Format Date to "MM/DD/YYYY" for request body
// const formatDateToAPI = (date: Date | string): string => {
//   const d = typeof date === 'string' ? new Date(date) : date;
//   return d.toLocaleDateString('en-US', {
//     month: '2-digit',
//     day: '2-digit',
//     year: 'numeric',
//   });
// };

// interface ApiResponse<T> {
//   success: boolean;
//   data?: T;
//   error?: string;
// }

// // GET /synergy/api/clinic - List with optional params
// export const getClinics = async (params?: ClinicListParams): Promise<ApiResponse<{ 
//   clinics: Clinic[]; 
//   pagination: ClinicListResponse['pagination'] 
// }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   // Build query string
//   const queryParams = new URLSearchParams();
//   if (params?.search) queryParams.append('search', params.search);
//   if (params?.sort) queryParams.append('sort', params.sort);
//   if (params?.page) queryParams.append('page', params.page.toString());
//   if (params?.limit) queryParams.append('limit', params.limit.toString());

//   const queryString = queryParams.toString();
//   const url = `${API_BASE}/clinic${queryString ? `?${queryString}` : ''}`;

//   try {
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to fetch clinics: ${response.statusText}` };
//     }

//     const data: ClinicListResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to fetch clinics' };
//     }

//     // Parse dates
//     const clinics = data.data.clinics.map((clinic) => ({
//       ...clinic,
//       contractDateStart: new Date(clinic.contractDateStart),
//       contractDateEnd: new Date(clinic.contractDateEnd),
//       clinicName: clinic.name.th,
//     }));

//     return { success: true, data: { clinics, pagination: data.pagination } };
//   } catch (error) {
//     return { success: false, error: 'Network error' };
//   }
// };

// // GET /synergy/api/clinic/:id
// export const getClinicById = async (id: string): Promise<ApiResponse<{ clinic: Clinic }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${id}`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to fetch clinic: ${response.statusText}` };
//     }

//     const data: ClinicDetailResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to fetch clinic' };
//     }

//     // Parse dates
//     const clinic = {
//       ...data.data.clinic,
//       contractDateStart: new Date(data.data.clinic.contractDateStart),
//       contractDateEnd: new Date(data.data.clinic.contractDateEnd),
//       clinicName: data.data.clinic.name.th,
//     };

//     return { success: true, data: { clinic } };
//   } catch (error) {
//     return { success: false, error: 'Network error' };
//   }
// };

// // POST /synergy/api/clinic
// export const createClinic = async (payload: CreateClinicRequest): Promise<ApiResponse<{ clinic: Clinic }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   // Format dates for API
//   const body = {
//     ...payload,
//     contractDateStart: typeof payload.contractDateStart === 'string' 
//       ? payload.contractDateStart 
//       : formatDateToAPI(payload.contractDateStart),
//     contractDateEnd: typeof payload.contractDateEnd === 'string' 
//       ? payload.contractDateEnd 
//       : formatDateToAPI(payload.contractDateEnd),
//   };

//   try {
//     const response = await fetch(`${API_BASE}/clinic`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(body),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       console.error('Create clinic error:', errorData);
//       return { success: false, error: errorData.message || `Failed to create clinic: ${response.statusText}` };
//     }

//     const data = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: data.message || 'Failed to create clinic' };
//     }

//     return { success: true, data: { clinic: data.data.clinic } };
//   } catch (error) {
//     console.error('Create clinic network error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // PUT /synergy/api/clinic/:id
// export const updateClinic = async (id: string, payload: UpdateClinicRequest): Promise<ApiResponse<{ clinic: Clinic }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   // Format dates for API
//   const body = {
//     ...payload,
//     ...(payload.contractDateStart && { 
//       contractDateStart: typeof payload.contractDateStart === 'string' 
//         ? payload.contractDateStart 
//         : formatDateToAPI(payload.contractDateStart) 
//     }),
//     ...(payload.contractDateEnd && { 
//       contractDateEnd: typeof payload.contractDateEnd === 'string' 
//         ? payload.contractDateEnd 
//         : formatDateToAPI(payload.contractDateEnd) 
//     }),
//   };

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${id}`, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(body),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       console.error('Update clinic error:', errorData);
//       return { success: false, error: errorData.message || `Failed to update clinic: ${response.statusText}` };
//     }

//     const data = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: data.message || 'Failed to update clinic' };
//     }

//     return { success: true, data: { clinic: data.data.clinic } };
//   } catch (error) {
//     console.error('Update clinic network error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // DELETE /synergy/api/clinic/:id
// export const deleteClinic = async (id: string): Promise<ApiResponse<void>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${id}`, {
//       method: 'DELETE',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to delete clinic: ${response.statusText}` };
//     }

//     return { success: true };
//   } catch (error) {
//     return { success: false, error: 'Network error' };
//   }
// };

// // ==================== TIMELINE API ====================

// // Timeline response types
// interface TimelineResponse {
//   status: 'success';
//   data: {
//     timeline: TimelineItem[];
//     totalWeeks: number;
//     contractDateStart: string;
//     contractDateEnd: string;
//   };
// }

// interface TimelineUpdateResponse {
//   status: 'success';
//   message: string;
//   data: {
//     timeline: TimelineItem[];
//     totalWeeks?: number;
//   };
// }

// // Timeline item input for create/update
// export interface TimelineItemInput {
//   serviceType: 'setup' | 'coperateIdentity' | 'website' | 'socialMedia' | 'training';
//   serviceName: string;
//   serviceAmount: string;
//   weekStart: number;
//   weekEnd: number;
// }

// export interface UpdateTimelineItemInput {
//   weekStart?: number;
//   weekEnd?: number;
//   serviceName?: string;
//   serviceAmount?: string;
// }

// // GET /synergy/api/clinic/:id/timeline
// export const getTimeline = async (clinicId: string): Promise<ApiResponse<{
//   timeline: TimelineItem[];
//   totalWeeks: number;
//   contractDateStart: Date;
//   contractDateEnd: Date;
// }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${clinicId}/timeline`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to fetch timeline: ${response.statusText}` };
//     }

//     const data: TimelineResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to fetch timeline' };
//     }

//     return {
//       success: true,
//       data: {
//         timeline: data.data.timeline,
//         totalWeeks: data.data.totalWeeks,
//         contractDateStart: new Date(data.data.contractDateStart),
//         contractDateEnd: new Date(data.data.contractDateEnd),
//       },
//     };
//   } catch (error) {
//     console.error('Get timeline error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // PUT /synergy/api/clinic/:id/timeline - Update entire timeline
// export const updateTimeline = async (
//   clinicId: string,
//   timeline: TimelineItemInput[]
// ): Promise<ApiResponse<{ timeline: TimelineItem[] }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${clinicId}/timeline`, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ timeline }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to update timeline: ${response.statusText}` };
//     }

//     const data: TimelineUpdateResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to update timeline' };
//     }

//     return { success: true, data: { timeline: data.data.timeline } };
//   } catch (error) {
//     console.error('Update timeline error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // POST /synergy/api/clinic/:id/timeline/item - Add single item
// export const addTimelineItem = async (
//   clinicId: string,
//   item: TimelineItemInput
// ): Promise<ApiResponse<{ timeline: TimelineItem[] }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${clinicId}/timeline/item`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(item),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to add timeline item: ${response.statusText}` };
//     }

//     const data: TimelineUpdateResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to add timeline item' };
//     }

//     return { success: true, data: { timeline: data.data.timeline } };
//   } catch (error) {
//     console.error('Add timeline item error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // PATCH /synergy/api/clinic/:id/timeline/item/:itemId - Update single item
// export const updateTimelineItem = async (
//   clinicId: string,
//   itemId: string,
//   updates: UpdateTimelineItemInput
// ): Promise<ApiResponse<{ timeline: TimelineItem[] }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${clinicId}/timeline/item/${itemId}`, {
//       method: 'PATCH',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(updates),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to update timeline item: ${response.statusText}` };
//     }

//     const data: TimelineUpdateResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to update timeline item' };
//     }

//     return { success: true, data: { timeline: data.data.timeline } };
//   } catch (error) {
//     console.error('Update timeline item error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // DELETE /synergy/api/clinic/:id/timeline/item/:itemId - Delete single item
// export const deleteTimelineItem = async (
//   clinicId: string,
//   itemId: string
// ): Promise<ApiResponse<{ timeline: TimelineItem[] }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${clinicId}/timeline/item/${itemId}`, {
//       method: 'DELETE',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to delete timeline item: ${response.statusText}` };
//     }

//     const data: TimelineUpdateResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to delete timeline item' };
//     }

//     return { success: true, data: { timeline: data.data.timeline } };
//   } catch (error) {
//     console.error('Delete timeline item error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// export const clinicService = {
//   getClinics,
//   getClinicById,
//   createClinic,
//   updateClinic,
//   deleteClinic,
//   // Timeline
//   getTimeline,
//   updateTimeline,
//   addTimelineItem,
//   updateTimelineItem,
//   deleteTimelineItem,
// };

// import type { 
//   ClinicListResponse, 
//   ClinicDetailResponse, 
//   CreateClinicRequest, 
//   UpdateClinicRequest, 
//   Clinic, 
//   ClinicListParams,
//   TimelineItem 
// } from '@/types/clinic';
// import { useAuthStore } from '@/stores/authStore';

// const API_BASE = import.meta.env.VITE_API_BASE_URL || '/synergy/api';

// // Helper: Get access token
// const getAccessToken = (): string | null => {
//   return useAuthStore.getState().tokens?.accessToken || null;
// };

// // Helper: Format Date to "MM/DD/YYYY" for request body
// const formatDateToAPI = (date: Date | string): string => {
//   const d = typeof date === 'string' ? new Date(date) : date;
//   return d.toLocaleDateString('en-US', {
//     month: '2-digit',
//     day: '2-digit',
//     year: 'numeric',
//   });
// };

// interface ApiResponse<T> {
//   success: boolean;
//   data?: T;
//   error?: string;
// }

// // GET /synergy/api/clinic - List with optional params
// export const getClinics = async (params?: ClinicListParams): Promise<ApiResponse<{ 
//   clinics: Clinic[]; 
//   pagination: ClinicListResponse['pagination'] 
// }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   // Build query string
//   const queryParams = new URLSearchParams();
//   if (params?.search) queryParams.append('search', params.search);
//   if (params?.sort) queryParams.append('sort', params.sort);
//   if (params?.page) queryParams.append('page', params.page.toString());
//   if (params?.limit) queryParams.append('limit', params.limit.toString());

//   const queryString = queryParams.toString();
//   const url = `${API_BASE}/clinic${queryString ? `?${queryString}` : ''}`;

//   try {
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to fetch clinics: ${response.statusText}` };
//     }

//     const data: ClinicListResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to fetch clinics' };
//     }

//     // Parse dates and add computed clinicName
//     const clinics = data.data.clinics.map((clinic) => ({
//       ...clinic,
//       contractDateStart: new Date(clinic.contractDateStart),
//       contractDateEnd: new Date(clinic.contractDateEnd),
//       clinicName: clinic.name.th,
//     }));

//     return { success: true, data: { clinics, pagination: data.pagination } };
//   } catch (error) {
//     console.error('Get clinics error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // GET /synergy/api/clinic/:id
// export const getClinicById = async (id: string): Promise<ApiResponse<{ clinic: Clinic }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${id}`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to fetch clinic: ${response.statusText}` };
//     }

//     const data: ClinicDetailResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to fetch clinic' };
//     }

//     // Parse dates and add computed clinicName
//     const clinic = {
//       ...data.data.clinic,
//       contractDateStart: new Date(data.data.clinic.contractDateStart),
//       contractDateEnd: new Date(data.data.clinic.contractDateEnd),
//       clinicName: data.data.clinic.name.th,
//     };

//     return { success: true, data: { clinic } };
//   } catch (error) {
//     console.error('Get clinic error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // POST /synergy/api/clinic
// export const createClinic = async (payload: CreateClinicRequest): Promise<ApiResponse<{ clinic: Clinic }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   const body: CreateClinicRequest = {
//     ...payload,
//     contractDateStart: formatDateToAPI(payload.contractDateStart),
//     contractDateEnd: formatDateToAPI(payload.contractDateEnd),
//   };

//   try {
//     const response = await fetch(`${API_BASE}/clinic`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(body),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to create clinic: ${response.statusText}` };
//     }

//     const data = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: data.message || 'Failed to create clinic' };
//     }

//     return { success: true, data: { clinic: data.data.clinic } };
//   } catch (error) {
//     console.error('Create clinic error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // PUT /synergy/api/clinic/:id
// export const updateClinic = async (id: string, payload: UpdateClinicRequest): Promise<ApiResponse<{ clinic: Clinic }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   const body: UpdateClinicRequest = {
//     ...payload,
//     ...(payload.contractDateStart && { contractDateStart: formatDateToAPI(payload.contractDateStart) }),
//     ...(payload.contractDateEnd && { contractDateEnd: formatDateToAPI(payload.contractDateEnd) }),
//   };

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${id}`, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(body),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to update clinic: ${response.statusText}` };
//     }

//     const data = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: data.message || 'Failed to update clinic' };
//     }

//     return { success: true, data: { clinic: data.data.clinic } };
//   } catch (error) {
//     console.error('Update clinic error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // DELETE /synergy/api/clinic/:id
// export const deleteClinic = async (id: string): Promise<ApiResponse<void>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${id}`, {
//       method: 'DELETE',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to delete clinic: ${response.statusText}` };
//     }

//     return { success: true };
//   } catch (error) {
//     return { success: false, error: 'Network error' };
//   }
// };

// // ==================== TIMELINE API ====================

// // Timeline response types
// interface TimelineResponse {
//   status: 'success';
//   data: {
//     timeline: TimelineItem[];
//     totalWeeks: number;
//     contractDateStart: string;
//     contractDateEnd: string;
//   };
// }

// interface TimelineUpdateResponse {
//   status: 'success';
//   message: string;
//   data: {
//     timeline: TimelineItem[];
//     totalWeeks?: number;
//   };
// }

// // Timeline item input for create/update
// export interface TimelineItemInput {
//   serviceType: 'setup' | 'coperateIdentity' | 'website' | 'socialMedia' | 'training';
//   serviceName: string;
//   serviceAmount: string;
//   weekStart: number;
//   weekEnd: number;
// }

// export interface UpdateTimelineItemInput {
//   weekStart?: number;
//   weekEnd?: number;
//   serviceName?: string;
//   serviceAmount?: string;
// }

// // GET /synergy/api/clinic/:id/timeline
// export const getTimeline = async (clinicId: string): Promise<ApiResponse<{
//   timeline: TimelineItem[];
//   totalWeeks: number;
//   contractDateStart: Date;
//   contractDateEnd: Date;
// }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${clinicId}/timeline`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to fetch timeline: ${response.statusText}` };
//     }

//     const data: TimelineResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to fetch timeline' };
//     }

//     return {
//       success: true,
//       data: {
//         timeline: data.data.timeline,
//         totalWeeks: data.data.totalWeeks,
//         contractDateStart: new Date(data.data.contractDateStart),
//         contractDateEnd: new Date(data.data.contractDateEnd),
//       },
//     };
//   } catch (error) {
//     console.error('Get timeline error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // PUT /synergy/api/clinic/:id/timeline - Update entire timeline
// export const updateTimeline = async (
//   clinicId: string,
//   timeline: TimelineItemInput[]
// ): Promise<ApiResponse<{ timeline: TimelineItem[] }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${clinicId}/timeline`, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ timeline }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to update timeline: ${response.statusText}` };
//     }

//     const data: TimelineUpdateResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to update timeline' };
//     }

//     return { success: true, data: { timeline: data.data.timeline } };
//   } catch (error) {
//     console.error('Update timeline error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // POST /synergy/api/clinic/:id/timeline/item - Add single item
// export const addTimelineItem = async (
//   clinicId: string,
//   item: TimelineItemInput
// ): Promise<ApiResponse<{ timeline: TimelineItem[] }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${clinicId}/timeline/item`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(item),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to add timeline item: ${response.statusText}` };
//     }

//     const data: TimelineUpdateResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to add timeline item' };
//     }

//     return { success: true, data: { timeline: data.data.timeline } };
//   } catch (error) {
//     console.error('Add timeline item error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // PATCH /synergy/api/clinic/:id/timeline/item/:itemId - Update single item
// export const updateTimelineItem = async (
//   clinicId: string,
//   itemId: string,
//   updates: UpdateTimelineItemInput
// ): Promise<ApiResponse<{ timeline: TimelineItem[] }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${clinicId}/timeline/item/${itemId}`, {
//       method: 'PATCH',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(updates),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to update timeline item: ${response.statusText}` };
//     }

//     const data: TimelineUpdateResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to update timeline item' };
//     }

//     return { success: true, data: { timeline: data.data.timeline } };
//   } catch (error) {
//     console.error('Update timeline item error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // DELETE /synergy/api/clinic/:id/timeline/item/:itemId - Delete single item
// export const deleteTimelineItem = async (
//   clinicId: string,
//   itemId: string
// ): Promise<ApiResponse<{ timeline: TimelineItem[] }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${clinicId}/timeline/item/${itemId}`, {
//       method: 'DELETE',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to delete timeline item: ${response.statusText}` };
//     }

//     const data: TimelineUpdateResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to delete timeline item' };
//     }

//     return { success: true, data: { timeline: data.data.timeline } };
//   } catch (error) {
//     console.error('Delete timeline item error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // ==================== DOCUMENT API ====================

// // Document types
// export interface ClinicDocument {
//   _id?: string;
//   id?: string;
//   title: string;
//   content: string;
//   createdBy: {
//     id: string;
//     name: string;
//   };
//   updatedBy?: {
//     id: string;
//     name: string;
//   };
//   createdAt: Date;
//   updatedAt: Date;
// }

// interface DocumentListResponse {
//   status: 'success';
//   data: {
//     documents: ClinicDocument[];
//   };
// }

// interface DocumentDetailResponse {
//   status: 'success';
//   data: {
//     document: ClinicDocument;
//   };
// }

// // GET /synergy/api/clinic/:id/documents - List all documents
// export const getDocuments = async (clinicId: string): Promise<ApiResponse<{ documents: ClinicDocument[] }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${clinicId}/documents`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to fetch documents: ${response.statusText}` };
//     }

//     const data: DocumentListResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to fetch documents' };
//     }

//     // Parse dates
//     const documents = data.data.documents.map((doc) => ({
//       ...doc,
//       id: doc.id || doc._id,
//       createdAt: new Date(doc.createdAt),
//       updatedAt: new Date(doc.updatedAt),
//     }));

//     return { success: true, data: { documents } };
//   } catch (error) {
//     console.error('Get documents error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // GET /synergy/api/clinic/:id/documents/:docId - Get single document
// export const getDocument = async (clinicId: string, docId: string): Promise<ApiResponse<{ document: ClinicDocument }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${clinicId}/documents/${docId}`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to fetch document: ${response.statusText}` };
//     }

//     const data: DocumentDetailResponse = await response.json();
//     if (data.status !== 'success') {
//       return { success: false, error: 'Failed to fetch document' };
//     }

//     const document = {
//       ...data.data.document,
//       id: data.data.document.id || data.data.document._id,
//       createdAt: new Date(data.data.document.createdAt),
//       updatedAt: new Date(data.data.document.updatedAt),
//     };

//     return { success: true, data: { document } };
//   } catch (error) {
//     console.error('Get document error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // POST /synergy/api/clinic/:id/documents - Create new document
// export const createDocument = async (
//   clinicId: string, 
//   data: { title: string; content?: string }
// ): Promise<ApiResponse<{ document: ClinicDocument }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${clinicId}/documents`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(data),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to create document: ${response.statusText}` };
//     }

//     const resData: DocumentDetailResponse = await response.json();
//     if (resData.status !== 'success') {
//       return { success: false, error: 'Failed to create document' };
//     }

//     const document = {
//       ...resData.data.document,
//       id: resData.data.document.id || resData.data.document._id,
//       createdAt: new Date(resData.data.document.createdAt),
//       updatedAt: new Date(resData.data.document.updatedAt),
//     };

//     return { success: true, data: { document } };
//   } catch (error) {
//     console.error('Create document error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // PUT /synergy/api/clinic/:id/documents/:docId - Update document
// export const updateDocument = async (
//   clinicId: string, 
//   docId: string,
//   data: { title?: string; content?: string }
// ): Promise<ApiResponse<{ document: ClinicDocument }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${clinicId}/documents/${docId}`, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(data),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to update document: ${response.statusText}` };
//     }

//     const resData: DocumentDetailResponse = await response.json();
//     if (resData.status !== 'success') {
//       return { success: false, error: 'Failed to update document' };
//     }

//     const document = {
//       ...resData.data.document,
//       id: resData.data.document.id || resData.data.document._id,
//       createdAt: new Date(resData.data.document.createdAt),
//       updatedAt: new Date(resData.data.document.updatedAt),
//     };

//     return { success: true, data: { document } };
//   } catch (error) {
//     console.error('Update document error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// // DELETE /synergy/api/clinic/:id/documents/:docId - Delete document
// export const deleteDocument = async (clinicId: string, docId: string): Promise<ApiResponse<void>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   try {
//     const response = await fetch(`${API_BASE}/clinic/${clinicId}/documents/${docId}`, {
//       method: 'DELETE',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       return { success: false, error: errorData.message || `Failed to delete document: ${response.statusText}` };
//     }

//     return { success: true };
//   } catch (error) {
//     console.error('Delete document error:', error);
//     return { success: false, error: 'Network error' };
//   }
// };

// export const clinicService = {
//   getClinics,
//   getClinicById,
//   createClinic,
//   updateClinic,
//   deleteClinic,
//   // Timeline
//   getTimeline,
//   updateTimeline,
//   addTimelineItem,
//   updateTimelineItem,
//   deleteTimelineItem,
//   // Documents
//   getDocuments,
//   getDocument,
//   createDocument,
//   updateDocument,
//   deleteDocument,
// };

// src/services/clinicService.ts

import type { 
  ClinicListResponse, 
  ClinicDetailResponse, 
  CreateClinicRequest, 
  UpdateClinicRequest, 
  Clinic, 
  ClinicListParams,
  TimelineItem 
} from '@/types/clinic';
import { useAuthStore } from '@/stores/authStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/synergy/api';

// Helper: Get access token
const getAccessToken = (): string | null => {
  return useAuthStore.getState().tokens?.accessToken || null;
};

// Helper: Format Date to "MM/DD/YYYY" for request body
const formatDateToAPI = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

// Helper: Safe date parsing
const safeParseDate = (date: any): Date => {
  if (!date) return new Date();
  
  try {
    const parsed = new Date(date);
    // Check if valid date
    if (isNaN(parsed.getTime())) {
      return new Date();
    }
    return parsed;
  } catch {
    return new Date();
  }
};

// Helper: Get user display name from various user object formats
const getUserName = (user: any): string => {
  if (!user) return 'Unknown';
  
  if (typeof user === 'string') return user;
  
  if (user.name && typeof user.name === 'string') return user.name;
  
  if (user.firstname || user.lastname) {
    return `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.nickname || 'Unknown';
  }
  
  if (user.nickname) return user.nickname;
  
  return 'Unknown';
};

// Helper: Transform user object to standard format
const transformUser = (user: any): { id: string; name: string } | undefined => {
  if (!user) return undefined;
  
  const id = user.id || user._id || '';
  const name = getUserName(user);
  
  return { id, name };
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET /synergy/api/clinic - List with optional params
export const getClinics = async (params?: ClinicListParams): Promise<ApiResponse<{ 
  clinics: Clinic[]; 
  pagination: ClinicListResponse['pagination'] 
}>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  // Build query string
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const url = `${API_BASE}/clinic${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to fetch clinics: ${response.statusText}` };
    }

    const data: ClinicListResponse = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to fetch clinics' };
    }

    // Parse dates and add computed clinicName
    const clinics = data.data.clinics.map((clinic) => ({
      ...clinic,
      contractDateStart: safeParseDate(clinic.contractDateStart),
      contractDateEnd: safeParseDate(clinic.contractDateEnd),
      clinicName: clinic.name.th,
    }));

    return { success: true, data: { clinics, pagination: data.pagination } };
  } catch (error) {
    console.error('Get clinics error:', error);
    return { success: false, error: 'Network error' };
  }
};

// GET /synergy/api/clinic/:id
export const getClinicById = async (id: string): Promise<ApiResponse<{ clinic: Clinic }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/clinic/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to fetch clinic: ${response.statusText}` };
    }

    const data: ClinicDetailResponse = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to fetch clinic' };
    }

    // Parse dates and add computed clinicName
    const clinic = {
      ...data.data.clinic,
      contractDateStart: safeParseDate(data.data.clinic.contractDateStart),
      contractDateEnd: safeParseDate(data.data.clinic.contractDateEnd),
      clinicName: data.data.clinic.name.th,
    };

    return { success: true, data: { clinic } };
  } catch (error) {
    console.error('Get clinic error:', error);
    return { success: false, error: 'Network error' };
  }
};

// POST /synergy/api/clinic
export const createClinic = async (payload: CreateClinicRequest): Promise<ApiResponse<{ clinic: Clinic }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  const body: CreateClinicRequest = {
    ...payload,
    contractDateStart: formatDateToAPI(payload.contractDateStart),
    contractDateEnd: formatDateToAPI(payload.contractDateEnd),
  };

  try {
    const response = await fetch(`${API_BASE}/clinic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to create clinic: ${response.statusText}` };
    }

    const data = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: data.message || 'Failed to create clinic' };
    }

    return { success: true, data: { clinic: data.data.clinic } };
  } catch (error) {
    console.error('Create clinic error:', error);
    return { success: false, error: 'Network error' };
  }
};

// PUT /synergy/api/clinic/:id
export const updateClinic = async (id: string, payload: UpdateClinicRequest): Promise<ApiResponse<{ clinic: Clinic }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  const body: UpdateClinicRequest = {
    ...payload,
    ...(payload.contractDateStart && { contractDateStart: formatDateToAPI(payload.contractDateStart) }),
    ...(payload.contractDateEnd && { contractDateEnd: formatDateToAPI(payload.contractDateEnd) }),
  };

  try {
    const response = await fetch(`${API_BASE}/clinic/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to update clinic: ${response.statusText}` };
    }

    const data = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: data.message || 'Failed to update clinic' };
    }

    return { success: true, data: { clinic: data.data.clinic } };
  } catch (error) {
    console.error('Update clinic error:', error);
    return { success: false, error: 'Network error' };
  }
};

// DELETE /synergy/api/clinic/:id
export const deleteClinic = async (id: string): Promise<ApiResponse<void>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/clinic/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to delete clinic: ${response.statusText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

// ==================== TIMELINE API ====================

// Timeline response types
interface TimelineResponse {
  status: 'success';
  data: {
    timeline: TimelineItem[];
    totalWeeks: number;
    contractDateStart: string;
    contractDateEnd: string;
  };
}

interface TimelineUpdateResponse {
  status: 'success';
  message: string;
  data: {
    timeline: TimelineItem[];
    totalWeeks?: number;
  };
}

// Timeline item input for create/update
export interface TimelineItemInput {
  serviceType: 'setup' | 'coperateIdentity' | 'website' | 'socialMedia' | 'training';
  serviceName: string;
  serviceAmount: string;
  weekStart: number;
  weekEnd: number;
}

export interface UpdateTimelineItemInput {
  weekStart?: number;
  weekEnd?: number;
  serviceName?: string;
  serviceAmount?: string;
}

// GET /synergy/api/clinic/:id/timeline
export const getTimeline = async (clinicId: string): Promise<ApiResponse<{
  timeline: TimelineItem[];
  totalWeeks: number;
  contractDateStart: Date;
  contractDateEnd: Date;
}>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/clinic/${clinicId}/timeline`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to fetch timeline: ${response.statusText}` };
    }

    const data: TimelineResponse = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to fetch timeline' };
    }

    return {
      success: true,
      data: {
        timeline: data.data.timeline,
        totalWeeks: data.data.totalWeeks,
        contractDateStart: safeParseDate(data.data.contractDateStart),
        contractDateEnd: safeParseDate(data.data.contractDateEnd),
      },
    };
  } catch (error) {
    console.error('Get timeline error:', error);
    return { success: false, error: 'Network error' };
  }
};

// PUT /synergy/api/clinic/:id/timeline - Update entire timeline
export const updateTimeline = async (
  clinicId: string,
  timeline: TimelineItemInput[]
): Promise<ApiResponse<{ timeline: TimelineItem[] }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/clinic/${clinicId}/timeline`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ timeline }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to update timeline: ${response.statusText}` };
    }

    const data: TimelineUpdateResponse = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to update timeline' };
    }

    return { success: true, data: { timeline: data.data.timeline } };
  } catch (error) {
    console.error('Update timeline error:', error);
    return { success: false, error: 'Network error' };
  }
};

// POST /synergy/api/clinic/:id/timeline/item - Add single item
export const addTimelineItem = async (
  clinicId: string,
  item: TimelineItemInput
): Promise<ApiResponse<{ timeline: TimelineItem[] }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/clinic/${clinicId}/timeline/item`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to add timeline item: ${response.statusText}` };
    }

    const data: TimelineUpdateResponse = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to add timeline item' };
    }

    return { success: true, data: { timeline: data.data.timeline } };
  } catch (error) {
    console.error('Add timeline item error:', error);
    return { success: false, error: 'Network error' };
  }
};

// PATCH /synergy/api/clinic/:id/timeline/item/:itemId - Update single item
export const updateTimelineItem = async (
  clinicId: string,
  itemId: string,
  updates: UpdateTimelineItemInput
): Promise<ApiResponse<{ timeline: TimelineItem[] }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/clinic/${clinicId}/timeline/item/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to update timeline item: ${response.statusText}` };
    }

    const data: TimelineUpdateResponse = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to update timeline item' };
    }

    return { success: true, data: { timeline: data.data.timeline } };
  } catch (error) {
    console.error('Update timeline item error:', error);
    return { success: false, error: 'Network error' };
  }
};

// DELETE /synergy/api/clinic/:id/timeline/item/:itemId - Delete single item
export const deleteTimelineItem = async (
  clinicId: string,
  itemId: string
): Promise<ApiResponse<{ timeline: TimelineItem[] }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/clinic/${clinicId}/timeline/item/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to delete timeline item: ${response.statusText}` };
    }

    const data: TimelineUpdateResponse = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to delete timeline item' };
    }

    return { success: true, data: { timeline: data.data.timeline } };
  } catch (error) {
    console.error('Delete timeline item error:', error);
    return { success: false, error: 'Network error' };
  }
};

// ==================== DOCUMENT API ====================

// Document types - flexible to handle various API response formats
export interface ClinicDocument {
  _id?: string;
  id?: string;
  title: string;
  content: string;
  createdBy: {
    id: string;
    name: string;
  } | any; // Allow any format from API
  updatedBy?: {
    id: string;
    name: string;
  } | any;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface DocumentListResponse {
  status: 'success';
  results?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: {
    documents: any[];
  };
}

interface DocumentDetailResponse {
  status: 'success';
  data: {
    document: any;
  };
}

// Transform raw document from API to standard format
const transformDocument = (doc: any): ClinicDocument => {
  return {
    ...doc,
    id: doc.id || doc._id,
    createdBy: transformUser(doc.createdBy) || { id: '', name: 'Unknown' },
    updatedBy: doc.updatedBy ? transformUser(doc.updatedBy) : undefined,
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || doc.createdAt || new Date().toISOString(),
  };
};

// GET /synergy/api/clinic/:id/documents - List all documents
export const getDocuments = async (clinicId: string): Promise<ApiResponse<{ documents: ClinicDocument[] }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/clinic/${clinicId}/documents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to fetch documents: ${response.statusText}` };
    }

    const data: DocumentListResponse = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to fetch documents' };
    }

    // Transform documents
    const documents = (data.data.documents || []).map(transformDocument);

    return { success: true, data: { documents } };
  } catch (error) {
    console.error('Get documents error:', error);
    return { success: false, error: 'Network error' };
  }
};

// GET /synergy/api/clinic/:id/documents/:docId - Get single document
export const getDocument = async (clinicId: string, docId: string): Promise<ApiResponse<{ document: ClinicDocument }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/clinic/${clinicId}/documents/${docId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to fetch document: ${response.statusText}` };
    }

    const data: DocumentDetailResponse = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to fetch document' };
    }

    const document = transformDocument(data.data.document);

    return { success: true, data: { document } };
  } catch (error) {
    console.error('Get document error:', error);
    return { success: false, error: 'Network error' };
  }
};

// POST /synergy/api/clinic/:id/documents - Create new document
export const createDocument = async (
  clinicId: string, 
  data: { title: string; content?: string }
): Promise<ApiResponse<{ document: ClinicDocument }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/clinic/${clinicId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to create document: ${response.statusText}` };
    }

    const resData: DocumentDetailResponse = await response.json();
    if (resData.status !== 'success') {
      return { success: false, error: 'Failed to create document' };
    }

    const document = transformDocument(resData.data.document);

    return { success: true, data: { document } };
  } catch (error) {
    console.error('Create document error:', error);
    return { success: false, error: 'Network error' };
  }
};

// PUT /synergy/api/clinic/:id/documents/:docId - Update document
export const updateDocument = async (
  clinicId: string, 
  docId: string,
  data: { title?: string; content?: string }
): Promise<ApiResponse<{ document: ClinicDocument }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/clinic/${clinicId}/documents/${docId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to update document: ${response.statusText}` };
    }

    const resData: DocumentDetailResponse = await response.json();
    if (resData.status !== 'success') {
      return { success: false, error: 'Failed to update document' };
    }

    const document = transformDocument(resData.data.document);

    return { success: true, data: { document } };
  } catch (error) {
    console.error('Update document error:', error);
    return { success: false, error: 'Network error' };
  }
};

// DELETE /synergy/api/clinic/:id/documents/:docId - Delete document
export const deleteDocument = async (clinicId: string, docId: string): Promise<ApiResponse<void>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/clinic/${clinicId}/documents/${docId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to delete document: ${response.statusText}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete document error:', error);
    return { success: false, error: 'Network error' };
  }
};

export const clinicService = {
  getClinics,
  getClinicById,
  createClinic,
  updateClinic,
  deleteClinic,
  // Timeline
  getTimeline,
  updateTimeline,
  addTimelineItem,
  updateTimelineItem,
  deleteTimelineItem,
  // Documents
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
};