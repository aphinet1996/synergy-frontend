import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
    LeaveType,
    LeaveBalanceResponse,
    LeaveRequest,
    TeamLeaveRequest,
    Holiday,
    CreateLeaveRequestDTO,
    LeaveStatus,
} from '@/services/leaveService';
import { leaveService } from '@/services/leaveService'

interface LeaveState {
    // Data
    leaveTypes: LeaveType[];
    balance: LeaveBalanceResponse | null;
    requests: LeaveRequest[];
    pendingApprovals: TeamLeaveRequest[];
    holidays: Holiday[];
    selectedYear: number;

    // Loading states
    loading: {
        types: boolean;
        balance: boolean;
        requests: boolean;
        approvals: boolean;
        holidays: boolean;
        submitting: boolean;
        approving: boolean;
    };

    // Error
    error: string | null;

    // Actions - Fetch
    fetchLeaveTypes: () => Promise<void>;
    fetchBalance: (year?: number) => Promise<void>;
    fetchRequests: (params?: { status?: LeaveStatus; year?: number }) => Promise<void>;
    fetchPendingApprovals: () => Promise<void>;
    fetchHolidays: (year?: number) => Promise<void>;
    fetchAll: () => Promise<void>;

    // Actions - Mutations
    createRequest: (dto: CreateLeaveRequestDTO) => Promise<boolean>;
    cancelRequest: (id: string, reason?: string) => Promise<boolean>;
    approveRequest: (id: string, comment?: string) => Promise<boolean>;
    rejectRequest: (id: string, reason: string) => Promise<boolean>;

    // Actions - Utils
    setSelectedYear: (year: number) => void;
    clearError: () => void;
    reset: () => void;
}

const initialState = {
    leaveTypes: [],
    balance: null,
    requests: [],
    pendingApprovals: [],
    holidays: [],
    selectedYear: new Date().getFullYear(),
    loading: {
        types: false,
        balance: false,
        requests: false,
        approvals: false,
        holidays: false,
        submitting: false,
        approving: false,
    },
    error: null,
};

export const useLeaveStore = create<LeaveState>()(
    devtools(
        (set, get) => ({
            ...initialState,

            // Fetch Actions

            fetchLeaveTypes: async () => {
                set((state) => ({ loading: { ...state.loading, types: true }, error: null }));

                const response = await leaveService.getLeaveTypes();

                if (response.success && response.data) {
                    set((state) => ({
                        leaveTypes: response.data!,
                        loading: { ...state.loading, types: false }
                    }));
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to fetch leave types',
                        loading: { ...state.loading, types: false }
                    }));
                }
            },

            fetchBalance: async (year?: number) => {
                const targetYear = year || get().selectedYear;
                set((state) => ({ loading: { ...state.loading, balance: true }, error: null }));

                const response = await leaveService.getMyBalance(targetYear);

                if (response.success && response.data) {
                    set((state) => ({
                        balance: response.data!,
                        loading: { ...state.loading, balance: false }
                    }));
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to fetch balance',
                        loading: { ...state.loading, balance: false }
                    }));
                }
            },

            fetchRequests: async (params) => {
                const year = params?.year || get().selectedYear;
                set((state) => ({ loading: { ...state.loading, requests: true }, error: null }));

                const response = await leaveService.getMyRequests({ ...params, year });

                if (response.success && response.data) {
                    set((state) => ({
                        requests: response.data!.requests,
                        loading: { ...state.loading, requests: false }
                    }));
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to fetch requests',
                        loading: { ...state.loading, requests: false }
                    }));
                }
            },

            fetchPendingApprovals: async () => {
                set((state) => ({ loading: { ...state.loading, approvals: true }, error: null }));

                const response = await leaveService.getPendingApprovals();

                if (response.success && response.data) {
                    set((state) => ({
                        pendingApprovals: response.data!,
                        loading: { ...state.loading, approvals: false }
                    }));
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to fetch pending approvals',
                        loading: { ...state.loading, approvals: false }
                    }));
                }
            },

            fetchHolidays: async (year?: number) => {
                const targetYear = year || get().selectedYear;
                set((state) => ({ loading: { ...state.loading, holidays: true }, error: null }));

                const response = await leaveService.getHolidays(targetYear);

                if (response.success && response.data) {
                    set((state) => ({
                        holidays: response.data!,
                        loading: { ...state.loading, holidays: false }
                    }));
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to fetch holidays',
                        loading: { ...state.loading, holidays: false }
                    }));
                }
            },

            fetchAll: async () => {
                const { fetchLeaveTypes, fetchBalance, fetchRequests, fetchPendingApprovals, fetchHolidays } = get();

                await Promise.all([
                    fetchLeaveTypes(),
                    fetchBalance(),
                    fetchRequests(),
                    fetchPendingApprovals(),
                    fetchHolidays(),
                ]);
            },

            // Mutation Actions

            createRequest: async (dto: CreateLeaveRequestDTO) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveService.createLeaveRequest(dto);

                if (response.success) {
                    // Refetch balance and requests
                    const { fetchBalance, fetchRequests, fetchPendingApprovals } = get();
                    await Promise.all([fetchBalance(), fetchRequests(), fetchPendingApprovals()]);

                    set((state) => ({ loading: { ...state.loading, submitting: false } }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to create request',
                        loading: { ...state.loading, submitting: false }
                    }));
                    return false;
                }
            },

            cancelRequest: async (id: string, reason?: string) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveService.cancelLeaveRequest(id, reason);

                if (response.success) {
                    // Refetch
                    const { fetchBalance, fetchRequests, fetchPendingApprovals } = get();
                    await Promise.all([fetchBalance(), fetchRequests(), fetchPendingApprovals()]);

                    set((state) => ({ loading: { ...state.loading, submitting: false } }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to cancel request',
                        loading: { ...state.loading, submitting: false }
                    }));
                    return false;
                }
            },

            approveRequest: async (id: string, comment?: string) => {
                set((state) => ({ loading: { ...state.loading, approving: true }, error: null }));

                const response = await leaveService.approveLeaveRequest(id, comment);

                if (response.success) {
                    // Remove from pending list
                    set((state) => ({
                        pendingApprovals: state.pendingApprovals.filter((r) => r.id !== id),
                        loading: { ...state.loading, approving: false }
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to approve request',
                        loading: { ...state.loading, approving: false }
                    }));
                    return false;
                }
            },

            rejectRequest: async (id: string, reason: string) => {
                set((state) => ({ loading: { ...state.loading, approving: true }, error: null }));

                const response = await leaveService.rejectLeaveRequest(id, reason);

                if (response.success) {
                    // Remove from pending list
                    set((state) => ({
                        pendingApprovals: state.pendingApprovals.filter((r) => r.id !== id),
                        loading: { ...state.loading, approving: false }
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to reject request',
                        loading: { ...state.loading, approving: false }
                    }));
                    return false;
                }
            },

            // Util Actions

            setSelectedYear: (year: number) => {
                set({ selectedYear: year });
                // Refetch data for new year
                const { fetchBalance, fetchRequests, fetchHolidays } = get();
                fetchBalance(year);
                fetchRequests({ year });
                fetchHolidays(year);
            },

            clearError: () => set({ error: null }),

            reset: () => set(initialState),
        }),
        { name: 'LeaveStore' }
    )
);

// Selectors
export const selectLeaveTypes = (state: LeaveState) => state.leaveTypes;
export const selectBalance = (state: LeaveState) => state.balance;
export const selectRequests = (state: LeaveState) => state.requests;
export const selectPendingApprovals = (state: LeaveState) => state.pendingApprovals;
export const selectHolidays = (state: LeaveState) => state.holidays;
export const selectSelectedYear = (state: LeaveState) => state.selectedYear;
export const selectLoading = (state: LeaveState) => state.loading;
export const selectError = (state: LeaveState) => state.error;

// Combined loading state
export const selectIsLoading = (state: LeaveState) =>
    state.loading.types ||
    state.loading.balance ||
    state.loading.requests ||
    state.loading.holidays;

export const selectIsSubmitting = (state: LeaveState) => state.loading.submitting;
export const selectIsApproving = (state: LeaveState) => state.loading.approving;