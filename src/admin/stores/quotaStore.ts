import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
    leaveQuotaService,
    type LeaveQuota,
    type Position,
    type LeaveTypeBasic,
    type CreateLeaveQuotaDTO,
    type UpdateLeaveQuotaDTO,
} from '@/admin/services/quotaService';

interface LeaveQuotaState {
    // Data
    quotas: LeaveQuota[];
    positions: Position[];
    leaveTypes: LeaveTypeBasic[];
    selectedYear: number;
    availableYears: number[];

    // Loading states
    loading: {
        quotas: boolean;
        positions: boolean;
        leaveTypes: boolean;
        submitting: boolean;
    };

    // Error
    error: string | null;

    // Actions - Fetch
    fetchQuotas: (year?: number) => Promise<void>;
    fetchPositions: () => Promise<void>;
    fetchLeaveTypes: () => Promise<void>;
    fetchAll: (year?: number) => Promise<void>;

    // Actions - CRUD
    createQuota: (dto: CreateLeaveQuotaDTO) => Promise<boolean>;
    updateQuota: (id: string, dto: UpdateLeaveQuotaDTO) => Promise<boolean>;
    deleteQuota: (id: string) => Promise<boolean>;
    copyQuotasToYear: (fromYear: number, toYear: number) => Promise<boolean>;

    // Actions - Utils
    setSelectedYear: (year: number) => void;
    clearError: () => void;
    reset: () => void;
}

const currentYear = new Date().getFullYear();

const initialState = {
    quotas: [],
    positions: [],
    leaveTypes: [],
    selectedYear: currentYear,
    availableYears: [currentYear - 1, currentYear, currentYear + 1],
    loading: {
        quotas: false,
        positions: false,
        leaveTypes: false,
        submitting: false,
    },
    error: null,
};

export const useLeaveQuotaStore = create<LeaveQuotaState>()(
    devtools(
        (set, get) => ({
            ...initialState,

            fetchQuotas: async (year?: number) => {
                const targetYear = year || get().selectedYear;
                set((state) => ({ loading: { ...state.loading, quotas: true }, error: null }));

                const response = await leaveQuotaService.getLeaveQuotasByYear(targetYear);

                if (response.success && response.data) {
                    set((state) => ({
                        quotas: response.data!,
                        loading: { ...state.loading, quotas: false },
                    }));
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to fetch quotas',
                        loading: { ...state.loading, quotas: false },
                    }));
                }
            },

            fetchPositions: async () => {
                set((state) => ({ loading: { ...state.loading, positions: true } }));

                const response = await leaveQuotaService.getPositions();

                if (response.success && response.data) {
                    set((state) => ({
                        positions: response.data!,
                        loading: { ...state.loading, positions: false },
                    }));
                } else {
                    set((state) => ({
                        loading: { ...state.loading, positions: false },
                    }));
                }
            },

            fetchLeaveTypes: async () => {
                set((state) => ({ loading: { ...state.loading, leaveTypes: true } }));

                const response = await leaveQuotaService.getLeaveTypes();

                if (response.success && response.data) {
                    set((state) => ({
                        leaveTypes: response.data!,
                        loading: { ...state.loading, leaveTypes: false },
                    }));
                } else {
                    set((state) => ({
                        loading: { ...state.loading, leaveTypes: false },
                    }));
                }
            },

            fetchAll: async (year?: number) => {
                const { fetchQuotas, fetchPositions, fetchLeaveTypes } = get();
                await Promise.all([
                    fetchQuotas(year),
                    fetchPositions(),
                    fetchLeaveTypes(),
                ]);
            },

            createQuota: async (dto: CreateLeaveQuotaDTO) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveQuotaService.createLeaveQuota(dto);

                if (response.success && response.data) {
                    set((state) => ({
                        quotas: [...state.quotas, response.data!],
                        loading: { ...state.loading, submitting: false },
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to create quota',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            updateQuota: async (id: string, dto: UpdateLeaveQuotaDTO) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveQuotaService.updateLeaveQuota(id, dto);

                if (response.success && response.data) {
                    set((state) => ({
                        quotas: state.quotas.map((q) => ((q.id === id || q._id === id) ? response.data! : q)),
                        loading: { ...state.loading, submitting: false },
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to update quota',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            deleteQuota: async (id: string) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveQuotaService.deleteLeaveQuota(id);

                if (response.success) {
                    set((state) => ({
                        quotas: state.quotas.filter((q) => q.id !== id && q._id !== id),
                        loading: { ...state.loading, submitting: false },
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to delete quota',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            copyQuotasToYear: async (fromYear: number, toYear: number) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveQuotaService.copyLeaveQuotasToYear(fromYear, toYear);

                if (response.success) {
                    // Refresh quotas for the target year if it's the selected year
                    const { selectedYear, fetchQuotas } = get();
                    if (selectedYear === toYear) {
                        await fetchQuotas(toYear);
                    }
                    set((state) => ({ loading: { ...state.loading, submitting: false } }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to copy quotas',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            setSelectedYear: (year: number) => {
                set({ selectedYear: year });
                get().fetchQuotas(year);
            },

            clearError: () => set({ error: null }),

            reset: () => set(initialState),
        }),
        { name: 'LeaveQuotaStore' }
    )
);

export const selectQuotas = (state: LeaveQuotaState) => state.quotas;
export const selectPositions = (state: LeaveQuotaState) => state.positions;
export const selectLeaveTypes = (state: LeaveQuotaState) => state.leaveTypes;
export const selectSelectedYear = (state: LeaveQuotaState) => state.selectedYear;
export const selectLoading = (state: LeaveQuotaState) => state.loading;
export const selectError = (state: LeaveQuotaState) => state.error;
export const selectIsSubmitting = (state: LeaveQuotaState) => state.loading.submitting;