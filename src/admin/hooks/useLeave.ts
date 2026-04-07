import { useEffect, useRef } from 'react';
import { useLeaveAdminStore } from '@/admin/stores/leaveStore';
import { useAuthStore } from '@/stores/authStore';

export function useLeaveAdmin() {
    const {
        // Data
        positions,
        holidays,
        holidayYears,
        leaveTypes,
        selectedYear,
        // Loading
        loading,
        error,
        // Actions - Fetch
        fetchAll,
        fetchPositions,
        fetchHolidays,
        fetchHolidayYears,
        fetchLeaveTypes,
        // Actions - Holidays
        createHoliday,
        updateHoliday,
        deleteHoliday,
        publishHolidays,
        copyHolidaysFromYear,
        // Actions - Leave Types
        createLeaveType,
        updateLeaveType,
        deleteLeaveType,
        // Utils
        setSelectedYear,
        clearError,
    } = useLeaveAdminStore();

    const tokens = useAuthStore((state) => state.tokens);
    const prevTokenRef = useRef<string | undefined>(undefined);
    const isFetchingRef = useRef(false);

    // Auto-fetch when token is available
    useEffect(() => {
        const currentToken = tokens?.accessToken;

        if (!currentToken) {
            prevTokenRef.current = undefined;
            isFetchingRef.current = false;
            return;
        }

        if (currentToken !== prevTokenRef.current && !isFetchingRef.current) {
            isFetchingRef.current = true;
            prevTokenRef.current = currentToken;

            fetchAll().finally(() => {
                isFetchingRef.current = false;
            });
        }
    }, [tokens?.accessToken, fetchAll]);

    // ==================== Defensive: Ensure arrays ====================
    const safePositions = Array.isArray(positions) ? positions : [];
    const safeHolidays = Array.isArray(holidays) ? holidays : [];
    const safeHolidayYears = Array.isArray(holidayYears) ? holidayYears : [];
    const safeLeaveTypes = Array.isArray(leaveTypes) ? leaveTypes : [];

    // ==================== Derived data ====================

    // Get position name by ID
    const getPositionName = (positionId: string) => {
        return safePositions.find((p) => p.id === positionId)?.name || '-';
    };

    // Get leave type name by ID
    const getLeaveTypeName = (leaveTypeId: string) => {
        return safeLeaveTypes.find((lt) => lt.id === leaveTypeId)?.name || '-';
    };

    // Get active leave types only
    const activeLeaveTypes = safeLeaveTypes.filter((lt) => lt.isActive);

    // Check if holidays are published for selected year
    const isYearPublished = safeHolidays.length > 0 && safeHolidays.every((h) => h.isPublished);

    // Group holidays by month
    const holidaysByMonth = safeHolidays.reduce((acc, holiday) => {
        const date = new Date(holiday.date);
        const month = date.getMonth();
        if (!acc[month]) acc[month] = [];
        acc[month].push(holiday);
        return acc;
    }, {} as Record<number, typeof holidays>);

    // Loading states
    const isLoading =
        loading.positions ||
        loading.holidays ||
        loading.leaveTypes;
    const isSubmitting = loading.submitting;

    return {
        // Raw data
        positions: safePositions,
        holidays: safeHolidays,
        holidayYears: safeHolidayYears,
        leaveTypes: safeLeaveTypes,
        selectedYear,

        // Derived data
        activeLeaveTypes,
        isYearPublished,
        holidaysByMonth,

        // Helper functions
        getPositionName,
        getLeaveTypeName,

        // Loading states
        loading,
        isLoading,
        isSubmitting,
        error,

        // Actions - Fetch
        fetchAll,
        fetchPositions,
        fetchHolidays,
        fetchHolidayYears,
        fetchLeaveTypes,

        // Actions - Holidays
        createHoliday,
        updateHoliday,
        deleteHoliday,
        publishHolidays,
        copyHolidaysFromYear,

        // Actions - Leave Types
        createLeaveType,
        updateLeaveType,
        deleteLeaveType,

        // Utils
        setSelectedYear,
        clearError,
        refetch: fetchAll,
    };
}

// ==================== Helper Hooks ====================

export function usePositions() {
    const { positions, loading, fetchPositions } = useLeaveAdminStore();
    return {
        positions: Array.isArray(positions) ? positions : [],
        isLoading: loading.positions,
        refetch: fetchPositions,
    };
}

export function useHolidaysAdmin() {
    const { holidays, holidayYears, selectedYear, loading, fetchHolidays, setSelectedYear } =
        useLeaveAdminStore();
    return {
        holidays: Array.isArray(holidays) ? holidays : [],
        years: Array.isArray(holidayYears) ? holidayYears : [],
        selectedYear,
        isLoading: loading.holidays,
        refetch: fetchHolidays,
        setSelectedYear,
    };
}

export function useLeaveTypesAdmin() {
    const { leaveTypes, loading, fetchLeaveTypes } = useLeaveAdminStore();
    return {
        leaveTypes: Array.isArray(leaveTypes) ? leaveTypes : [],
        isLoading: loading.leaveTypes,
        refetch: fetchLeaveTypes,
    };
}