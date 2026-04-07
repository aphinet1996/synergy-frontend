import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Clinic, CreateClinicRequest, UpdateClinicRequest, ClinicListParams } from '@/types/clinic';
import { clinicService } from '@/services/clinicService';

interface ClinicState {
  clinics: Clinic[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  loading: boolean;
  error: string | null;

  fetchClinics: (params?: ClinicListParams) => Promise<void>;
  getClinicById: (id: string) => Promise<Clinic | null>;
  createClinic: (data: CreateClinicRequest) => Promise<{ success: boolean; error?: string }>;
  updateClinic: (id: string, data: UpdateClinicRequest) => Promise<{ success: boolean; error?: string }>;

  reset: () => void;
  clearError: () => void;
  setPage: (page: number, limit?: number) => void;
}

export const useClinicStore = create<ClinicState>()(
  devtools(
    (set, get) => ({
      clinics: [],
      pagination: null,
      loading: false,
      error: null,

      fetchClinics: async (params = { page: 1, limit: 10 }) => {
        set({ loading: true, error: null });
        const response = await clinicService.getClinics(params);
        
        if (response.success && response.data) {
          set({ 
            clinics: response.data.clinics, 
            pagination: response.data.pagination, 
            loading: false 
          });
        } else {
          set({ error: response.error || 'Failed to fetch clinics', loading: false });
        }
      },

      getClinicById: async (id: string) => {
        const response = await clinicService.getClinicById(id);
        if (response.success && response.data) {
          // Update local clinics if exists
          set((state) => ({
            clinics: state.clinics.map((c) => c.id === id ? response.data!.clinic : c),
          }));
          return response.data.clinic;
        } else {
          set({ error: response.error || 'Failed to fetch clinic' });
          return null;
        }
      },

      createClinic: async (data: CreateClinicRequest) => {
        set({ loading: true, error: null });
        const response = await clinicService.createClinic(data);
        
        if (response.success) {
          await get().fetchClinics({ page: 1, limit: get().pagination?.limit || 10 }); // Refetch page 1
          set({ loading: false });
          return { success: true };
        } else {
          set({ error: response.error || 'Failed to create clinic', loading: false });
          return { success: false, error: response.error };
        }
      },

      updateClinic: async (id: string, data: UpdateClinicRequest) => {
        set({ loading: true, error: null });
        const response = await clinicService.updateClinic(id, data);
        
        if (response.success) {
          await get().fetchClinics({ page: get().pagination?.page || 1, limit: get().pagination?.limit || 10 }); // Refetch current page
          set({ loading: false });
          return { success: true };
        } else {
          set({ error: response.error || 'Failed to update clinic', loading: false });
          return { success: false, error: response.error };
        }
      },

      setPage: (page, limit = get().pagination?.limit || 10) => {
        set({ pagination: { ...get().pagination!, page } });
        get().fetchClinics({ page, limit });
      },

      reset: () => set({ clinics: [], pagination: null, loading: false, error: null }),
      clearError: () => set({ error: null }),
    }),
    { name: 'ClinicStore' }
  )
);

// Selectors
export const selectClinics = (state: ClinicState) => state.clinics;
export const selectPagination = (state: ClinicState) => state.pagination;
export const selectLoading = (state: ClinicState) => state.loading;
export const selectError = (state: ClinicState) => state.error;