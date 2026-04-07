import { useEffect, useRef } from 'react';
import { useLeaveStore } from '@/stores/leaveStore';
import { useAuthStore } from '@/stores/authStore';
// import type { LeaveTypeCode, LeaveDurationType, HalfDayPeriod } from '@/services/leaveService';
import type { LeaveTypeCode } from '@/services/leaveService';


export function useLeave() {
    const {
        // Data
        leaveTypes,
        balance,
        requests,
        pendingApprovals,
        holidays,
        selectedYear,
        // Loading
        loading,
        error,
        // Actions
        fetchAll,
        fetchLeaveTypes,
        fetchBalance,
        fetchRequests,
        fetchPendingApprovals,
        fetchHolidays,
        createRequest,
        cancelRequest,
        approveRequest,
        rejectRequest,
        setSelectedYear,
        clearError,
    } = useLeaveStore();

    const tokens = useAuthStore((state) => state.tokens);
    const prevTokenRef = useRef<string | undefined>(undefined);
    const isFetchingRef = useRef(false);

    // Auto-fetch when token is available
    useEffect(() => {
        const currentToken = tokens?.accessToken;

        // ถ้าไม่มี token → ไม่ fetch
        if (!currentToken) {
            prevTokenRef.current = undefined;
            isFetchingRef.current = false;
            return;
        }

        // ถ้า token เปลี่ยน (login ใหม่) → fetch ใหม่
        if (currentToken !== prevTokenRef.current && !isFetchingRef.current) {
            isFetchingRef.current = true;
            prevTokenRef.current = currentToken;

            fetchAll().finally(() => {
                isFetchingRef.current = false;
            });
        }
    }, [tokens?.accessToken, fetchAll]);

    const safeLeaveTypes = Array.isArray(leaveTypes) ? leaveTypes : [];
    const safeRequests = Array.isArray(requests) ? requests : [];
    const safePendingApprovals = Array.isArray(pendingApprovals) ? pendingApprovals : [];
    const safeHolidays = Array.isArray(holidays) ? holidays : [];
    const safeBalances = balance?.balances && Array.isArray(balance.balances) ? balance.balances : [];
    
    // Convert balance to quota format
    const leaveQuotas = safeBalances.map((b) => ({
        type: b.leaveType?.code || 'other',
        typeId: b.leaveType?.id || '',
        typeName: b.leaveType?.name || '',
        color: b.leaveType?.color || '#888888',
        total: b.total || 0,
        used: b.used || 0,
        pending: b.pending || 0,
        remaining: b.remaining || 0,
        carryOver: b.carryOver || 0,
    }));

    // Convert holidays to simple format
    const publicHolidays = safeHolidays.map((h) => ({
        date: new Date(h.date),
        name: h.nameTh || h.name || '',
    }));

    // Convert requests to UI format
    const leaveRequests = safeRequests.map((r) => ({
        id: r.id,
        type: r.leaveTypeCode || 'other',
        typeName: r.leaveTypeName || '',
        durationType: r.durationType || 'full_day',
        halfDayPeriod: r.halfDayPeriod,
        startDate: new Date(r.startDate),
        endDate: new Date(r.endDate),
        startTime: r.startTime,
        endTime: r.endTime,
        days: r.days || 0,
        hours: r.hours,
        reason: r.reason || '',
        status: r.status || 'pending',
        attachments: r.attachments || [],
        createdAt: new Date(r.createdAt),
        approvedAt: r.approvedAt ? new Date(r.approvedAt) : undefined,
        rejectReason: r.rejectedReason,
    }));

    // Convert team pending requests
    const teamPendingRequests = safePendingApprovals.map((r) => ({
        id: r.id,
        type: r.type || 'other',
        typeName: r.typeName || '',
        durationType: r.durationType || 'full_day',
        halfDayPeriod: r.halfDayPeriod,
        startDate: new Date(r.startDate),
        endDate: new Date(r.endDate),
        startTime: r.startTime,
        endTime: r.endTime,
        days: r.days || 0,
        hours: r.hours,
        reason: r.reason || '',
        status: r.status || 'pending',
        attachments: r.attachments || [],
        createdAt: new Date(r.createdAt),
        employee: r.employee || { id: '', name: 'Unknown', position: '' },
    }));

    // Summary stats
    const totalUsed = leaveQuotas.reduce((sum, q) => sum + q.used, 0);
    const totalRemaining = leaveQuotas.reduce((sum, q) => sum + q.remaining, 0);
    const totalPending = leaveQuotas.reduce((sum, q) => sum + q.pending, 0);

    // Pending requests count
    const pendingRequestsCount = leaveRequests.filter((r) => r.status === 'pending').length;

    // Upcoming holidays
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingHolidays = publicHolidays
        .filter((h) => h.date >= today)
        .slice(0, 5);

    // Loading states
    const isLoading = loading.types || loading.balance || loading.requests || loading.holidays;
    const isSubmitting = loading.submitting;
    const isApproving = loading.approving;

    return {
        // Raw data
        leaveTypes: safeLeaveTypes,
        balance,
        requests: safeRequests,
        pendingApprovals: safePendingApprovals,
        holidays: safeHolidays,
        selectedYear,

        // Derived data (for UI)
        leaveQuotas,
        publicHolidays,
        leaveRequests,
        teamPendingRequests,
        upcomingHolidays,

        // Summary
        summary: {
            totalUsed,
            totalRemaining,
            totalPending,
            pendingRequestsCount,
            pendingApprovalsCount: safePendingApprovals.length,
        },

        // States
        loading,
        isLoading,
        isSubmitting,
        isApproving,
        error,

        // Actions
        fetchAll,
        fetchLeaveTypes,
        fetchBalance,
        fetchRequests,
        fetchPendingApprovals,
        fetchHolidays,
        createRequest,
        cancelRequest,
        approveRequest,
        rejectRequest,
        setSelectedYear,
        clearError,

        // Refetch shortcut
        refetch: fetchAll,
    };
}

// Get leave type config by code
export function useLeaveTypeConfig(code: LeaveTypeCode) {
    const { leaveTypes } = useLeaveStore();
    const safeLeaveTypes = Array.isArray(leaveTypes) ? leaveTypes : [];
    return safeLeaveTypes.find((t) => t.code === code);
}

// Get leave type by ID
export function useLeaveTypeById(id: string) {
    const { leaveTypes } = useLeaveStore();
    const safeLeaveTypes = Array.isArray(leaveTypes) ? leaveTypes : [];
    return safeLeaveTypes.find((t) => t.id === id);
}

// Check if user can select past dates for a leave type
export function useCanSelectPastDate(code: LeaveTypeCode) {
    const leaveType = useLeaveTypeConfig(code);
    return leaveType?.allowPastDate ?? false;
}

// Get past date limit for a leave type
export function usePastDateLimit(code: LeaveTypeCode) {
    const leaveType = useLeaveTypeConfig(code);
    return leaveType?.pastDateLimit ?? 7;
}

export type {
    LeaveTypeCode,
    LeaveDurationType,
    HalfDayPeriod
} from '@/services/leaveService';