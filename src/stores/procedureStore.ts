// src/stores/procedureStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Procedure, ProcedureListParams, CreateProcedureRequest, UpdateProcedureRequest } from '@/types/procedure';
import { procedureService } from '@/services/procedureService';

interface ProcedureState {
    procedures: Procedure[];
    activeProcedures: Procedure[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    } | null;
    loading: boolean;
    error: string | null;

    fetchProcedures: (params?: ProcedureListParams) => Promise<void>;
    fetchActiveProcedures: () => Promise<void>;
    createProcedure: (data: CreateProcedureRequest) => Promise<{ success: boolean; error?: string }>;
    updateProcedure: (id: string, data: UpdateProcedureRequest) => Promise<{ success: boolean; error?: string }>;
    deleteProcedure: (id: string) => Promise<{ success: boolean; error?: string }>;

    reset: () => void;
    clearError: () => void;
}

export const useProcedureStore = create<ProcedureState>()(
    devtools(
        (set, get) => ({
            procedures: [],
            activeProcedures: [],
            pagination: null,
            loading: false,
            error: null,

            fetchProcedures: async (params = { page: 1, limit: 50 }) => {
                set({ loading: true, error: null });
                const response = await procedureService.getProcedures(params);

                if (response.success && response.data) {
                    set({
                        procedures: response.data.procedures,
                        pagination: response.data.pagination,
                        loading: false
                    });
                } else {
                    set({ error: response.error || 'Failed to fetch procedures', loading: false });
                }
            },

            fetchActiveProcedures: async () => {
                set({ loading: true, error: null });
                const response = await procedureService.getActiveProcedures();

                if (response.success && response.data) {
                    set({
                        activeProcedures: response.data.procedures,
                        loading: false
                    });
                } else {
                    set({ error: response.error || 'Failed to fetch active procedures', loading: false });
                }
            },

            createProcedure: async (data: CreateProcedureRequest) => {
                set({ loading: true, error: null });
                const response = await procedureService.createProcedure(data);

                if (response.success) {
                    await get().fetchProcedures();
                    await get().fetchActiveProcedures();
                    set({ loading: false });
                    return { success: true };
                } else {
                    set({ error: response.error || 'Failed to create procedure', loading: false });
                    return { success: false, error: response.error };
                }
            },

            updateProcedure: async (id: string, data: UpdateProcedureRequest) => {
                set({ loading: true, error: null });
                const response = await procedureService.updateProcedure(id, data);

                if (response.success) {
                    await get().fetchProcedures();
                    await get().fetchActiveProcedures();
                    set({ loading: false });
                    return { success: true };
                } else {
                    set({ error: response.error || 'Failed to update procedure', loading: false });
                    return { success: false, error: response.error };
                }
            },

            deleteProcedure: async (id: string) => {
                set({ loading: true, error: null });
                const response = await procedureService.deleteProcedure(id);

                if (response.success) {
                    await get().fetchProcedures();
                    await get().fetchActiveProcedures();
                    set({ loading: false });
                    return { success: true };
                } else {
                    set({ error: response.error || 'Failed to delete procedure', loading: false });
                    return { success: false, error: response.error };
                }
            },

            reset: () => set({ procedures: [], activeProcedures: [], pagination: null, loading: false, error: null }),
            clearError: () => set({ error: null }),
        }),
        { name: 'ProcedureStore' }
    )
);

// Selectors
export const selectProcedures = (state: ProcedureState) => state.procedures;
export const selectActiveProcedures = (state: ProcedureState) => state.activeProcedures;
export const selectProcedureLoading = (state: ProcedureState) => state.loading;
export const selectProcedureError = (state: ProcedureState) => state.error;