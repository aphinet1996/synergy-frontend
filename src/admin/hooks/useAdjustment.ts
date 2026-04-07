import { useEffect, useRef } from 'react';
import { useLeaveAdjustmentStore } from '@/admin/stores/adjustmentStore';
import { useAuthStore } from '@/stores/authStore';
import type { LeaveAdjustment, UserBasic, LeaveTypeBasic, AdjustmentType } from '@/admin/services/adjustmentService';

export function useLeaveAdjustment() {
    const {
        // Data
        adjustments,
        pendingApprovals,
        users,
        leaveTypes,
        userBalances,
        selectedYear,
        availableYears,
        // Loading
        loading,
        error,
        // Actions
        fetchAll,
        fetchAdjustments,
        fetchAdjustmentsByUser,
        fetchPendingApprovals,
        fetchUsers,
        fetchLeaveTypes,
        fetchUserBalances,
        createAdjustment,
        transferDays,
        bulkBonus,
        approveAdjustment,
        rejectAdjustment,
        setSelectedYear,
        clearError,
    } = useLeaveAdjustmentStore();

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

    // ==================== Safe Arrays ====================
    const safeAdjustments = Array.isArray(adjustments) ? adjustments : [];
    const safePendingApprovals = Array.isArray(pendingApprovals) ? pendingApprovals : [];
    const safeUsers = Array.isArray(users) ? users : [];
    const safeLeaveTypes = Array.isArray(leaveTypes) ? leaveTypes : [];
    const safeUserBalances = Array.isArray(userBalances) ? userBalances : [];

    // ==================== Helper Functions ====================

    // Get user by ID
    const getUserById = (userId: string | undefined): UserBasic | undefined => {
        if (!userId) return undefined;
        return safeUsers.find((u) => u.id === userId || u._id === userId);
    };

    // Get user full name
    const getUserName = (user: string | UserBasic | undefined): string => {
        if (!user) return 'ไม่ระบุ';
        if (typeof user === 'object') {
            return `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'ไม่ระบุ';
        }
        const found = getUserById(user);
        return found ? `${found.firstname || ''} ${found.lastname || ''}`.trim() : 'ไม่ระบุ';
    };

    // Get leave type by ID
    const getLeaveTypeById = (leaveTypeId: string | undefined): LeaveTypeBasic | undefined => {
        if (!leaveTypeId) return undefined;
        return safeLeaveTypes.find((lt) => lt.id === leaveTypeId || lt._id === leaveTypeId);
    };

    // Get leave type name
    const getLeaveTypeName = (leaveType: string | LeaveTypeBasic | undefined): string => {
        if (!leaveType) return 'ไม่ระบุ';
        if (typeof leaveType === 'object') {
            return leaveType.name || 'ไม่ระบุ';
        }
        const found = getLeaveTypeById(leaveType);
        return found?.name || 'ไม่ระบุ';
    };

    // Get adjustment type label
    const getAdjustmentTypeLabel = (type: AdjustmentType): string => {
        const labels: Record<AdjustmentType, string> = {
            add: 'เพิ่มวันลา',
            deduct: 'หักวันลา',
            carry_over: 'ยกยอดข้ามปี',
            expired: 'หมดอายุ',
            correction: 'แก้ไขข้อผิดพลาด',
            bonus: 'โบนัสวันลา',
            transfer_in: 'รับโอน',
            transfer_out: 'โอนออก',
        };
        return labels[type] || type;
    };

    // Get adjustment type color
    const getAdjustmentTypeColor = (type: AdjustmentType): string => {
        const colors: Record<AdjustmentType, string> = {
            add: 'bg-green-100 text-green-700',
            deduct: 'bg-red-100 text-red-700',
            carry_over: 'bg-blue-100 text-blue-700',
            expired: 'bg-gray-100 text-gray-700',
            correction: 'bg-yellow-100 text-yellow-700',
            bonus: 'bg-purple-100 text-purple-700',
            transfer_in: 'bg-cyan-100 text-cyan-700',
            transfer_out: 'bg-orange-100 text-orange-700',
        };
        return colors[type] || 'bg-gray-100 text-gray-700';
    };

    // Get status label
    const getStatusLabel = (status: string): string => {
        const labels: Record<string, string> = {
            pending: 'รออนุมัติ',
            approved: 'อนุมัติแล้ว',
            rejected: 'ปฏิเสธ',
        };
        return labels[status] || status;
    };

    // Get status color
    const getStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    // Extract user ID from adjustment
    const extractUserId = (adj: LeaveAdjustment): string => {
        if (typeof adj.user === 'object' && adj.user) {
            return adj.user.id || adj.user._id || '';
        }
        return adj.user || '';
    };

    // Extract leave type ID from adjustment
    const extractLeaveTypeId = (adj: LeaveAdjustment): string => {
        if (typeof adj.leaveType === 'object' && adj.leaveType) {
            return adj.leaveType.id || adj.leaveType._id || '';
        }
        return adj.leaveType || '';
    };

    // ==================== Derived Data ====================

    // Group adjustments by user
    const adjustmentsByUser = safeAdjustments.reduce((acc, adj) => {
        const userId = extractUserId(adj);
        if (!acc[userId]) {
            acc[userId] = [];
        }
        acc[userId].push(adj);
        return acc;
    }, {} as Record<string, LeaveAdjustment[]>);

    // Adjustments summary
    const adjustmentsSummary = {
        total: safeAdjustments.length,
        adds: safeAdjustments.filter((a) => a.adjustmentType === 'add' || a.adjustmentType === 'bonus').length,
        deducts: safeAdjustments.filter((a) => a.adjustmentType === 'deduct' || a.adjustmentType === 'expired').length,
        transfers: safeAdjustments.filter((a) => a.adjustmentType === 'transfer_in' || a.adjustmentType === 'transfer_out').length,
        pending: safePendingApprovals.length,
    };

    // Loading states
    const isLoading = loading.adjustments || loading.users || loading.leaveTypes || loading.balances;
    const isSubmitting = loading.submitting;

    return {
        // Raw data
        adjustments: safeAdjustments,
        pendingApprovals: safePendingApprovals,
        users: safeUsers,
        leaveTypes: safeLeaveTypes,
        userBalances: safeUserBalances,
        selectedYear,
        availableYears,

        // Derived data
        adjustmentsByUser,
        adjustmentsSummary,

        // Helper functions
        getUserById,
        getUserName,
        getLeaveTypeById,
        getLeaveTypeName,
        getAdjustmentTypeLabel,
        getAdjustmentTypeColor,
        getStatusLabel,
        getStatusColor,
        extractUserId,
        extractLeaveTypeId,

        // Loading states
        loading,
        isLoading,
        isSubmitting,
        error,

        // Actions
        fetchAll,
        fetchAdjustments,
        fetchAdjustmentsByUser,
        fetchPendingApprovals,
        fetchUsers,
        fetchLeaveTypes,
        fetchUserBalances,
        createAdjustment,
        transferDays,
        bulkBonus,
        approveAdjustment,
        rejectAdjustment,
        setSelectedYear,
        clearError,
        refetch: () => fetchAll(selectedYear),
    };
}

// Named export
export { useLeaveAdjustment as default };