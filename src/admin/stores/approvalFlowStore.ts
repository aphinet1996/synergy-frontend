import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
    approvalFlowService,
    type ApprovalFlow,
    type Position,
    type LeaveTypeBasic,
    type CreateApprovalFlowDTO,
    type UpdateApprovalFlowDTO,
} from '@/admin/services/approvalFlowService';

interface ApprovalFlowState {
    // Data
    flows: ApprovalFlow[];
    positions: Position[];
    leaveTypes: LeaveTypeBasic[];

    // Loading states
    loading: {
        flows: boolean;
        positions: boolean;
        leaveTypes: boolean;
        submitting: boolean;
    };

    // Error
    error: string | null;

    // Actions - Fetch
    fetchFlows: () => Promise<void>;
    fetchPositions: () => Promise<void>;
    fetchLeaveTypes: () => Promise<void>;
    fetchAll: () => Promise<void>;

    // Actions - CRUD
    createFlow: (dto: CreateApprovalFlowDTO) => Promise<boolean>;
    updateFlow: (id: string, dto: UpdateApprovalFlowDTO) => Promise<boolean>;
    deleteFlow: (id: string) => Promise<boolean>;

    // Actions - Utils
    clearError: () => void;
    reset: () => void;
}

const initialState = {
    flows: [],
    positions: [],
    leaveTypes: [],
    loading: {
        flows: false,
        positions: false,
        leaveTypes: false,
        submitting: false,
    },
    error: null,
};

export const useApprovalFlowStore = create<ApprovalFlowState>()(
    devtools(
        (set, get) => ({
            ...initialState,

            fetchFlows: async () => {
                set((state) => ({ loading: { ...state.loading, flows: true } }));

                const response = await approvalFlowService.getApprovalFlows();

                if (response.success && response.data) {
                    set((state) => ({
                        flows: response.data!,
                        loading: { ...state.loading, flows: false },
                    }));
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to fetch approval flows',
                        loading: { ...state.loading, flows: false },
                    }));
                }
            },

            fetchPositions: async () => {
                set((state) => ({ loading: { ...state.loading, positions: true } }));

                const response = await approvalFlowService.getPositions();

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

                const response = await approvalFlowService.getLeaveTypes();

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

            fetchAll: async () => {
                const { fetchFlows, fetchPositions, fetchLeaveTypes } = get();
                await Promise.all([
                    fetchFlows(),
                    fetchPositions(),
                    fetchLeaveTypes(),
                ]);
            },

            createFlow: async (dto: CreateApprovalFlowDTO) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await approvalFlowService.createApprovalFlow(dto);

                if (response.success && response.data) {
                    set((state) => ({
                        flows: [...state.flows, response.data!],
                        loading: { ...state.loading, submitting: false },
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to create approval flow',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            updateFlow: async (id: string, dto: UpdateApprovalFlowDTO) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await approvalFlowService.updateApprovalFlow(id, dto);

                if (response.success && response.data) {
                    set((state) => ({
                        flows: state.flows.map((f) =>
                            (f.id === id || f._id === id) ? response.data! : f
                        ),
                        loading: { ...state.loading, submitting: false },
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to update approval flow',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            deleteFlow: async (id: string) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await approvalFlowService.deleteApprovalFlow(id);

                if (response.success) {
                    set((state) => ({
                        flows: state.flows.filter((f) => f.id !== id && f._id !== id),
                        loading: { ...state.loading, submitting: false },
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to delete approval flow',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            clearError: () => set({ error: null }),

            reset: () => set(initialState),
        }),
        { name: 'ApprovalFlowStore' }
    )
);