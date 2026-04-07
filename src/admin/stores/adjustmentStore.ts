import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
    leaveAdjustmentService,
    type LeaveAdjustment,
    type UserBasic,
    type LeaveTypeBasic,
    type UserBalance,
    type CreateAdjustmentDTO,
    type TransferDTO,
    type BulkBonusDTO,
} from '@/admin/services/adjustmentService';

interface LeaveAdjustmentState {
    // Data
    adjustments: LeaveAdjustment[];
    pendingApprovals: LeaveAdjustment[];
    users: UserBasic[];
    leaveTypes: LeaveTypeBasic[];
    userBalances: UserBalance[];
    selectedYear: number;
    availableYears: number[];

    // Loading states
    loading: {
        adjustments: boolean;
        users: boolean;
        leaveTypes: boolean;
        balances: boolean;
        submitting: boolean;
    };

    // Error
    error: string | null;

    // Actions - Fetch
    fetchAdjustments: (year?: number) => Promise<void>;
    fetchAdjustmentsByUser: (userId: string, year?: number) => Promise<void>;
    fetchPendingApprovals: () => Promise<void>;
    fetchUsers: () => Promise<void>;
    fetchLeaveTypes: () => Promise<void>;
    fetchUserBalances: (year?: number) => Promise<void>;
    fetchAll: (year?: number) => Promise<void>;

    // Actions - CRUD
    createAdjustment: (dto: CreateAdjustmentDTO) => Promise<boolean>;
    transferDays: (dto: TransferDTO) => Promise<boolean>;
    bulkBonus: (dto: BulkBonusDTO) => Promise<{ success: boolean; count: number }>;
    approveAdjustment: (id: string) => Promise<boolean>;
    rejectAdjustment: (id: string, reason: string) => Promise<boolean>;

    // Actions - Utils
    setSelectedYear: (year: number) => void;
    clearError: () => void;
    reset: () => void;
}

const currentYear = new Date().getFullYear();

const initialState = {
    adjustments: [],
    pendingApprovals: [],
    users: [],
    leaveTypes: [],
    userBalances: [],
    selectedYear: currentYear,
    availableYears: [currentYear - 1, currentYear, currentYear + 1],
    loading: {
        adjustments: false,
        users: false,
        leaveTypes: false,
        balances: false,
        submitting: false,
    },
    error: null,
};

export const useLeaveAdjustmentStore = create<LeaveAdjustmentState>()(
    devtools(
        (set, get) => ({
            ...initialState,

            fetchAdjustments: async (year?: number) => {
                set((state) => ({ loading: { ...state.loading, adjustments: true } }));

                const targetYear = year || get().selectedYear;
                const response = await leaveAdjustmentService.getAllAdjustments(targetYear);

                if (response.success && response.data) {
                    set((state) => ({
                        adjustments: response.data!,
                        loading: { ...state.loading, adjustments: false },
                    }));
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to fetch adjustments',
                        loading: { ...state.loading, adjustments: false },
                    }));
                }
            },

            fetchAdjustmentsByUser: async (userId: string, year?: number) => {
                set((state) => ({ loading: { ...state.loading, adjustments: true } }));

                const targetYear = year || get().selectedYear;
                const response = await leaveAdjustmentService.getAdjustmentsByUser(userId, targetYear);

                if (response.success && response.data) {
                    set((state) => ({
                        adjustments: response.data!,
                        loading: { ...state.loading, adjustments: false },
                    }));
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to fetch adjustments',
                        loading: { ...state.loading, adjustments: false },
                    }));
                }
            },

            fetchPendingApprovals: async () => {
                const response = await leaveAdjustmentService.getPendingApprovals();

                if (response.success && response.data) {
                    set({ pendingApprovals: response.data });
                }
            },

            fetchUsers: async () => {
                set((state) => ({ loading: { ...state.loading, users: true } }));

                const response = await leaveAdjustmentService.getUsers();

                if (response.success && response.data) {
                    set((state) => ({
                        users: response.data!,
                        loading: { ...state.loading, users: false },
                    }));
                } else {
                    set((state) => ({
                        loading: { ...state.loading, users: false },
                    }));
                }
            },

            fetchLeaveTypes: async () => {
                set((state) => ({ loading: { ...state.loading, leaveTypes: true } }));

                const response = await leaveAdjustmentService.getLeaveTypes();

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

            fetchUserBalances: async (year?: number) => {
                set((state) => ({ loading: { ...state.loading, balances: true } }));

                const targetYear = year || get().selectedYear;
                const response = await leaveAdjustmentService.getAllUserBalances(targetYear);

                if (response.success && response.data) {
                    set((state) => ({
                        userBalances: response.data!,
                        loading: { ...state.loading, balances: false },
                    }));
                } else {
                    set((state) => ({
                        loading: { ...state.loading, balances: false },
                    }));
                }
            },

            fetchAll: async (year?: number) => {
                const { fetchAdjustments, fetchUsers, fetchLeaveTypes, fetchUserBalances, fetchPendingApprovals } = get();
                await Promise.all([
                    fetchAdjustments(year),
                    fetchUsers(),
                    fetchLeaveTypes(),
                    fetchUserBalances(year),
                    fetchPendingApprovals(),
                ]);
            },

            createAdjustment: async (dto: CreateAdjustmentDTO) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveAdjustmentService.createAdjustment(dto);

                if (response.success && response.data) {
                    set((state) => ({
                        adjustments: [response.data!, ...state.adjustments],
                        loading: { ...state.loading, submitting: false },
                    }));
                    // Refresh balances
                    get().fetchUserBalances();
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to create adjustment',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            transferDays: async (dto: TransferDTO) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveAdjustmentService.transferDays(dto);

                if (response.success && response.data) {
                    set((state) => ({
                        adjustments: [response.data!.from, response.data!.to, ...state.adjustments],
                        loading: { ...state.loading, submitting: false },
                    }));
                    // Refresh balances
                    get().fetchUserBalances();
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to transfer days',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            bulkBonus: async (dto: BulkBonusDTO) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveAdjustmentService.bulkBonus(dto);

                if (response.success && response.data) {
                    set((state) => ({
                        loading: { ...state.loading, submitting: false },
                    }));
                    // Refresh adjustments and balances
                    get().fetchAdjustments();
                    get().fetchUserBalances();
                    return { success: true, count: response.data.count };
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to add bulk bonus',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return { success: false, count: 0 };
                }
            },

            approveAdjustment: async (id: string) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveAdjustmentService.approveAdjustment(id);

                if (response.success && response.data) {
                    set((state) => ({
                        adjustments: state.adjustments.map((a) =>
                            (a.id === id || a._id === id) ? response.data! : a
                        ),
                        pendingApprovals: state.pendingApprovals.filter((a) =>
                            a.id !== id && a._id !== id
                        ),
                        loading: { ...state.loading, submitting: false },
                    }));
                    get().fetchUserBalances();
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to approve adjustment',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            rejectAdjustment: async (id: string, reason: string) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveAdjustmentService.rejectAdjustment(id, reason);

                if (response.success && response.data) {
                    set((state) => ({
                        adjustments: state.adjustments.map((a) =>
                            (a.id === id || a._id === id) ? response.data! : a
                        ),
                        pendingApprovals: state.pendingApprovals.filter((a) =>
                            a.id !== id && a._id !== id
                        ),
                        loading: { ...state.loading, submitting: false },
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to reject adjustment',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            setSelectedYear: (year: number) => {
                set({ selectedYear: year });
                get().fetchAdjustments(year);
                get().fetchUserBalances(year);
            },

            clearError: () => set({ error: null }),

            reset: () => set(initialState),
        }),
        { name: 'LeaveAdjustmentStore' }
    )
);

export const selectAdjustments = (state: LeaveAdjustmentState) => state.adjustments;
export const selectUsers = (state: LeaveAdjustmentState) => state.users;
export const selectLeaveTypes = (state: LeaveAdjustmentState) => state.leaveTypes;
export const selectUserBalances = (state: LeaveAdjustmentState) => state.userBalances;
export const selectPendingApprovals = (state: LeaveAdjustmentState) => state.pendingApprovals;