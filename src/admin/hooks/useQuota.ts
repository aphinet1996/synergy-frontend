import { useEffect, useRef } from 'react';
import { useLeaveQuotaStore } from '@/admin/stores/quotaStore';
import { useAuthStore } from '@/stores/authStore';
import type { LeaveQuota, LeaveTypeBasic } from '@/admin/services/quotaService';

export function useLeaveQuota() {
    const {
        // Data
        quotas,
        positions,
        leaveTypes,
        selectedYear,
        availableYears,
        // Loading
        loading,
        error,
        // Actions
        fetchAll,
        fetchQuotas,
        fetchPositions,
        fetchLeaveTypes,
        createQuota,
        updateQuota,
        deleteQuota,
        copyQuotasToYear,
        setSelectedYear,
        clearError,
    } = useLeaveQuotaStore();

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
    const safeQuotas = Array.isArray(quotas) ? quotas : [];
    const safePositions = Array.isArray(positions) ? positions : [];
    const safeLeaveTypes = Array.isArray(leaveTypes) ? leaveTypes : [];

    // ==================== Helper Functions ====================

    // Get position name by ID
    const getPositionName = (positionId: string | undefined): string => {
        if (!positionId) return 'ทุกตำแหน่ง';
        const position = safePositions.find((p) => p.id === positionId || p._id === positionId);
        return position?.name || '-';
    };

    // Get leave type name by ID
    const getLeaveTypeName = (leaveTypeId: string): string => {
        const leaveType = safeLeaveTypes.find((lt) => lt.id === leaveTypeId || lt._id === leaveTypeId);
        return leaveType?.name || '-';
    };

    // Get leave type by ID
    const getLeaveType = (leaveTypeId: string): LeaveTypeBasic | undefined => {
        return safeLeaveTypes.find((lt) => lt.id === leaveTypeId || lt._id === leaveTypeId);
    };

    // Get employee type label
    const getEmployeeTypeLabel = (employeeType: string | null | undefined): string => {
        if (!employeeType) return 'ทุกประเภท';
        const labels: Record<string, string> = {
            permanent: 'พนักงานประจำ',
            probation: 'ทดลองงาน',
            freelance: 'ฟรีแลนซ์',
        };
        return labels[employeeType] || employeeType;
    };

    // Extract position ID from quota (handles both string and object)
    const extractPositionId = (quota: LeaveQuota): string | undefined => {
        if (!quota.position) return undefined;
        if (typeof quota.position === 'string') return quota.position;
        return quota.position.id || quota.position._id;
    };

    // Extract position name from quota
    const extractPositionName = (quota: LeaveQuota): string => {
        if (quota.positionName) return quota.positionName;
        if (!quota.position) return 'ทุกตำแหน่ง';
        if (typeof quota.position === 'object' && quota.position.name) {
            return quota.position.name;
        }
        return getPositionName(extractPositionId(quota));
    };

    // Extract leave type ID from quota item
    const extractLeaveTypeId = (item: { leaveType: string | LeaveTypeBasic }): string => {
        if (typeof item.leaveType === 'string') return item.leaveType;
        return item.leaveType.id || item.leaveType._id || '';
    };

    // Extract leave type info from quota item
    const extractLeaveTypeInfo = (item: { leaveType: string | LeaveTypeBasic; leaveTypeCode?: string }): LeaveTypeBasic => {
        if (typeof item.leaveType === 'object') {
            return {
                id: item.leaveType.id || item.leaveType._id || '',
                code: item.leaveType.code || item.leaveTypeCode || '',
                name: item.leaveType.name || '',
                color: item.leaveType.color,
                icon: item.leaveType.icon,
            };
        }
        const found = getLeaveType(item.leaveType);
        return found || {
            id: item.leaveType,
            code: item.leaveTypeCode || '',
            name: getLeaveTypeName(item.leaveType),
        };
    };

    // ==================== Derived Data ====================

    // Group quotas by position for easier display
    const quotasByPosition = safeQuotas.reduce((acc, quota) => {
        const posName = extractPositionName(quota);
        if (!acc[posName]) {
            acc[posName] = [];
        }
        acc[posName].push(quota);
        return acc;
    }, {} as Record<string, LeaveQuota[]>);

    // Find default quota
    const defaultQuota = safeQuotas.find((q) => q.isDefault);

    // Check if year has quotas
    const hasQuotas = safeQuotas.length > 0;

    // Loading states
    const isLoading = loading.quotas || loading.positions || loading.leaveTypes;
    const isSubmitting = loading.submitting;

    return {
        // Raw data
        quotas: safeQuotas,
        positions: safePositions,
        leaveTypes: safeLeaveTypes,
        selectedYear,
        availableYears,

        // Derived data
        quotasByPosition,
        defaultQuota,
        hasQuotas,

        // Helper functions
        getPositionName,
        getLeaveTypeName,
        getLeaveType,
        getEmployeeTypeLabel,
        extractPositionId,
        extractPositionName,
        extractLeaveTypeId,
        extractLeaveTypeInfo,

        // Loading states
        loading,
        isLoading,
        isSubmitting,
        error,

        // Actions
        fetchAll,
        fetchQuotas,
        fetchPositions,
        fetchLeaveTypes,
        createQuota,
        updateQuota,
        deleteQuota,
        copyQuotasToYear,
        setSelectedYear,
        clearError,
        refetch: () => fetchQuotas(selectedYear),
    };
}

export default useLeaveQuota;