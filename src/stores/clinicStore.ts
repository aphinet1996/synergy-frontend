// import { create } from 'zustand';

// interface Clinic {
//   id: string;
//   name: string;
//   location: string;
//   status: 'active' | 'inactive';
//   logo?: string;
// }

// interface ClinicState {
//   clinics: Clinic[];
//   addClinic: (clinic: Omit<Clinic, 'id'>) => void;
//   searchClinics: (query: string) => Clinic[];
//   filterClinics: (status: 'all' | 'active' | 'inactive') => Clinic[];
// }

// export const useClinicStore = create<ClinicState>((set, get) => ({
//     clinics: [
//         { id: '1', name: 'Bangkok Clinic', location: 'Sukhumvit', status: 'active', logo: 'https://via.placeholder.com/80x60/007BFF/FFFFFF?text=BK' },
//         { id: '2', name: 'Chiang Mai Clinic', location: 'Nimman', status: 'inactive', logo: 'https://via.placeholder.com/80x60/FF6B6B/FFFFFF?text=CM' },
//         { id: '3', name: 'Phuket Clinic', location: 'Patong', status: 'active', logo: 'https://via.placeholder.com/80x60/4ECDC4/FFFFFF?text=PK' },
//         { id: '4', name: 'Pattaya Clinic', location: 'Jomtien', status: 'active', logo: 'https://via.placeholder.com/80x60/45B7D1/FFFFFF?text=PT' },
//         { id: '5', name: 'Hua Hin Clinic', location: 'Cha-Am', status: 'inactive', logo: 'https://via.placeholder.com/80x60/F7DC6F/000000?text=HH' },
//         { id: '6', name: 'Krabi Clinic', location: 'Ao Nang', status: 'active', logo: 'https://via.placeholder.com/80x60/96CEB4/FFFFFF?text=KB' },
//         { id: '7', name: 'Samui Clinic', location: 'Chaweng', status: 'active', logo: 'https://via.placeholder.com/80x60/FF9FF3/000000?text=SM' },
//         { id: '8', name: 'Ayutthaya Clinic', location: 'Historic Park', status: 'inactive', logo: 'https://via.placeholder.com/80x60/54A0FF/FFFFFF?text=AY' },
//       ],
//   addClinic: (clinic) => set((state) => ({
//     clinics: [...state.clinics, { ...clinic, id: crypto.randomUUID() }],
//   })),
//   searchClinics: (query) => {
//     const { clinics } = get();
//     return clinics.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.location.toLowerCase().includes(query.toLowerCase()));
//   },
//   filterClinics: (status) => {
//     const { clinics } = get();
//     if (status === 'all') return clinics;
//     return clinics.filter(c => c.status === status);
//   },
// }));

// src/stores/clinicStore.ts

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