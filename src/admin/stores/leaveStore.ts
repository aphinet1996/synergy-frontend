import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
    leaveAdminService,
    type Position,
    type Holiday,
    type LeaveTypeAdmin,
    type CreateHolidayDTO,
    type UpdateHolidayDTO,
    type CreateLeaveTypeDTO,
    type UpdateLeaveTypeDTO,
} from '@/admin/services/leaveService';

interface LeaveAdminState {
    // Data
    positions: Position[];
    holidays: Holiday[];
    holidayYears: number[];
    leaveTypes: LeaveTypeAdmin[];
    selectedYear: number;

    // Loading states
    loading: {
        positions: boolean;
        holidays: boolean;
        leaveTypes: boolean;
        submitting: boolean;
    };

    // Error
    error: string | null;

    // Actions - Fetch
    fetchPositions: () => Promise<void>;
    fetchHolidays: (year?: number) => Promise<void>;
    fetchHolidayYears: () => Promise<void>;
    fetchLeaveTypes: () => Promise<void>;
    fetchAll: () => Promise<void>;

    // Actions - Holidays
    createHoliday: (dto: CreateHolidayDTO) => Promise<boolean>;
    updateHoliday: (id: string, dto: UpdateHolidayDTO) => Promise<boolean>;
    deleteHoliday: (id: string) => Promise<boolean>;
    publishHolidays: (year: number, isPublished: boolean) => Promise<boolean>;
    copyHolidaysFromYear: (fromYear: number, toYear: number) => Promise<boolean>;

    // Actions - Leave Types
    createLeaveType: (dto: CreateLeaveTypeDTO) => Promise<boolean>;
    updateLeaveType: (id: string, dto: UpdateLeaveTypeDTO) => Promise<boolean>;
    deleteLeaveType: (id: string) => Promise<boolean>;

    // Actions - Utils
    setSelectedYear: (year: number) => void;
    clearError: () => void;
    reset: () => void;
}

const currentYear = new Date().getFullYear();

const initialState = {
    positions: [],
    holidays: [],
    holidayYears: [currentYear],
    leaveTypes: [],
    selectedYear: currentYear,
    loading: {
        positions: false,
        holidays: false,
        leaveTypes: false,
        submitting: false,
    },
    error: null,
};

export const useLeaveAdminStore = create<LeaveAdminState>()(
    devtools(
        (set, get) => ({
            ...initialState,

            fetchPositions: async () => {
                set((state) => ({ loading: { ...state.loading, positions: true }, error: null }));

                const response = await leaveAdminService.getPositions();

                if (response.success && response.data) {
                    set((state) => ({
                        positions: response.data!,
                        loading: { ...state.loading, positions: false },
                    }));
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to fetch positions',
                        loading: { ...state.loading, positions: false },
                    }));
                }
            },

            fetchHolidays: async (year?: number) => {
                const targetYear = year || get().selectedYear;
                set((state) => ({ loading: { ...state.loading, holidays: true }, error: null }));

                const response = await leaveAdminService.getHolidaysByYear(targetYear);

                if (response.success && response.data) {
                    set((state) => ({
                        holidays: response.data!,
                        loading: { ...state.loading, holidays: false },
                    }));
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to fetch holidays',
                        loading: { ...state.loading, holidays: false },
                    }));
                }
            },

            fetchHolidayYears: async () => {
                const response = await leaveAdminService.getHolidayYears();

                if (response.success && response.data) {
                    set({ holidayYears: response.data });
                }
            },

            fetchLeaveTypes: async () => {
                set((state) => ({ loading: { ...state.loading, leaveTypes: true }, error: null }));

                const response = await leaveAdminService.getLeaveTypesAdmin();

                if (response.success && response.data) {
                    set((state) => ({
                        leaveTypes: response.data!,
                        loading: { ...state.loading, leaveTypes: false },
                    }));
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to fetch leave types',
                        loading: { ...state.loading, leaveTypes: false },
                    }));
                }
            },

            fetchAll: async () => {
                const {
                    fetchPositions,
                    fetchHolidays,
                    fetchHolidayYears,
                    fetchLeaveTypes,
                } = get();

                await Promise.all([
                    fetchPositions(),
                    fetchHolidays(),
                    fetchHolidayYears(),
                    fetchLeaveTypes(),
                ]);
            },

            createHoliday: async (dto: CreateHolidayDTO) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveAdminService.createHoliday(dto);

                if (response.success && response.data) {
                    set((state) => ({
                        holidays: [...state.holidays, response.data!].sort(
                            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                        ),
                        loading: { ...state.loading, submitting: false },
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to create holiday',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            updateHoliday: async (id: string, dto: UpdateHolidayDTO) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveAdminService.updateHoliday(id, dto);

                if (response.success && response.data) {
                    set((state) => ({
                        holidays: state.holidays
                            .map((h) => (h.id === id ? response.data! : h))
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
                        loading: { ...state.loading, submitting: false },
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to update holiday',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            deleteHoliday: async (id: string) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveAdminService.deleteHoliday(id);

                if (response.success) {
                    set((state) => ({
                        holidays: state.holidays.filter((h) => h.id !== id),
                        loading: { ...state.loading, submitting: false },
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to delete holiday',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            publishHolidays: async (year: number, isPublished: boolean) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveAdminService.publishHolidays(year, isPublished);

                if (response.success) {
                    // Update all holidays for this year
                    set((state) => ({
                        holidays: state.holidays.map((h) =>
                            h.year === year ? { ...h, isPublished } : h
                        ),
                        loading: { ...state.loading, submitting: false },
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to publish holidays',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            copyHolidaysFromYear: async (fromYear: number, toYear: number) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveAdminService.copyHolidaysFromYear(fromYear, toYear);

                if (response.success && response.data) {
                    // If currently viewing the target year, update holidays
                    const { selectedYear, fetchHolidays } = get();
                    if (selectedYear === toYear) {
                        await fetchHolidays(toYear);
                    }
                    set((state) => ({ loading: { ...state.loading, submitting: false } }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to copy holidays',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            createLeaveType: async (dto: CreateLeaveTypeDTO) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveAdminService.createLeaveType(dto);

                if (response.success && response.data) {
                    set((state) => ({
                        leaveTypes: [...state.leaveTypes, response.data!],
                        loading: { ...state.loading, submitting: false },
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to create leave type',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            updateLeaveType: async (id: string, dto: UpdateLeaveTypeDTO) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveAdminService.updateLeaveType(id, dto);

                if (response.success && response.data) {
                    set((state) => ({
                        leaveTypes: state.leaveTypes.map((lt) =>
                            lt.id === id ? response.data! : lt
                        ),
                        loading: { ...state.loading, submitting: false },
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to update leave type',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            deleteLeaveType: async (id: string) => {
                set((state) => ({ loading: { ...state.loading, submitting: true }, error: null }));

                const response = await leaveAdminService.deleteLeaveType(id);

                if (response.success) {
                    set((state) => ({
                        leaveTypes: state.leaveTypes.filter((lt) => lt.id !== id),
                        loading: { ...state.loading, submitting: false },
                    }));
                    return true;
                } else {
                    set((state) => ({
                        error: response.error || 'Failed to delete leave type',
                        loading: { ...state.loading, submitting: false },
                    }));
                    return false;
                }
            },

            setSelectedYear: (year: number) => {
                set({ selectedYear: year });
                const { fetchHolidays } = get();
                fetchHolidays(year);
            },

            clearError: () => set({ error: null }),

            reset: () => set(initialState),
        }),
        { name: 'LeaveAdminStore' }
    )
);

export const selectPositions = (state: LeaveAdminState) => state.positions;
export const selectHolidays = (state: LeaveAdminState) => state.holidays;
export const selectHolidayYears = (state: LeaveAdminState) => state.holidayYears;
export const selectLeaveTypes = (state: LeaveAdminState) => state.leaveTypes;
export const selectSelectedYear = (state: LeaveAdminState) => state.selectedYear;
export const selectLoading = (state: LeaveAdminState) => state.loading;
export const selectError = (state: LeaveAdminState) => state.error;
export const selectIsSubmitting = (state: LeaveAdminState) => state.loading.submitting;