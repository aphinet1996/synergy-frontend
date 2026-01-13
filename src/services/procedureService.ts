import type { 
    Procedure, 
    ProcedureListParams, 
    ProcedureListResponse,
    CreateProcedureRequest,
    UpdateProcedureRequest 
  } from '@/types/procedure';
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/synergy/api';
  
  // Helper: Get access token from localStorage
  const getAccessToken = (): string | null => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.tokens?.accessToken || null;
      }
      return null;
    } catch {
      return null;
    }
  };
  
  interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
  }
  
  // GET /synergy/api/procedure - List procedures
  export const getProcedures = async (params?: ProcedureListParams): Promise<ApiResponse<{ 
    procedures: Procedure[]; 
    pagination: ProcedureListResponse['pagination'] 
  }>> => {
    const token = getAccessToken();
    if (!token) {
      return { success: false, error: 'No access token available' };
    }
  
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isActive) queryParams.append('isActive', params.isActive);
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
  
    const queryString = queryParams.toString();
    const url = `${API_BASE}/procedure${queryString ? `?${queryString}` : ''}`;
  
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        return { success: false, error: `Failed to fetch procedures: ${response.statusText}` };
      }
  
      const data: ProcedureListResponse = await response.json();
      if (data.status !== 'success') {
        return { success: false, error: 'Failed to fetch procedures' };
      }
  
      return { success: true, data: { procedures: data.data.procedures, pagination: data.pagination } };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };
  
  // GET /synergy/api/procedure/active - Get active procedures for dropdown
  export const getActiveProcedures = async (): Promise<ApiResponse<{ procedures: Procedure[] }>> => {
    const token = getAccessToken();
    if (!token) {
      return { success: false, error: 'No access token available' };
    }
  
    try {
      const response = await fetch(`${API_BASE}/procedure/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        return { success: false, error: `Failed to fetch active procedures: ${response.statusText}` };
      }
  
      const data = await response.json();
      if (data.status !== 'success') {
        return { success: false, error: 'Failed to fetch active procedures' };
      }
  
      return { success: true, data: { procedures: data.data.procedures } };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };
  
  // GET /synergy/api/procedure/:id
  export const getProcedureById = async (id: string): Promise<ApiResponse<{ procedure: Procedure }>> => {
    const token = getAccessToken();
    if (!token) {
      return { success: false, error: 'No access token available' };
    }
  
    try {
      const response = await fetch(`${API_BASE}/procedure/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        return { success: false, error: `Failed to fetch procedure: ${response.statusText}` };
      }
  
      const data = await response.json();
      if (data.status !== 'success') {
        return { success: false, error: 'Failed to fetch procedure' };
      }
  
      return { success: true, data: { procedure: data.data.procedure } };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };
  
  // POST /synergy/api/procedure
  export const createProcedure = async (payload: CreateProcedureRequest): Promise<ApiResponse<{ procedure: Procedure }>> => {
    const token = getAccessToken();
    if (!token) {
      return { success: false, error: 'No access token available' };
    }
  
    try {
      const response = await fetch(`${API_BASE}/procedure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        return { success: false, error: `Failed to create procedure: ${response.statusText}` };
      }
  
      const data = await response.json();
      if (data.status !== 'success') {
        return { success: false, error: data.message || 'Failed to create procedure' };
      }
  
      return { success: true, data: { procedure: data.data.procedure } };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };
  
  // PUT /synergy/api/procedure/:id
  export const updateProcedure = async (id: string, payload: UpdateProcedureRequest): Promise<ApiResponse<{ procedure: Procedure }>> => {
    const token = getAccessToken();
    if (!token) {
      return { success: false, error: 'No access token available' };
    }
  
    try {
      const response = await fetch(`${API_BASE}/procedure/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        return { success: false, error: `Failed to update procedure: ${response.statusText}` };
      }
  
      const data = await response.json();
      if (data.status !== 'success') {
        return { success: false, error: data.message || 'Failed to update procedure' };
      }
  
      return { success: true, data: { procedure: data.data.procedure } };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };
  
  // DELETE /synergy/api/procedure/:id
  export const deleteProcedure = async (id: string): Promise<ApiResponse<void>> => {
    const token = getAccessToken();
    if (!token) {
      return { success: false, error: 'No access token available' };
    }
  
    try {
      const response = await fetch(`${API_BASE}/procedure/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        return { success: false, error: `Failed to delete procedure: ${response.statusText}` };
      }
  
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };
  
  export const procedureService = {
    getProcedures,
    getActiveProcedures,
    getProcedureById,
    createProcedure,
    updateProcedure,
    deleteProcedure,
  };