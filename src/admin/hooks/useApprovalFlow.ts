import { useEffect, useRef } from 'react';
import { useApprovalFlowStore } from '@/admin/stores/approvalFlowStore';
import { useAuthStore } from '@/stores/authStore';
import type { ApprovalStep, Position, LeaveTypeBasic } from '@/admin/services/approvalFlowService';

export function useApprovalFlow() {
    const {
        // Data
        flows,
        positions,
        leaveTypes,
        // Loading
        loading,
        error,
        // Actions
        fetchAll,
        fetchFlows,
        fetchPositions,
        fetchLeaveTypes,
        createFlow,
        updateFlow,
        deleteFlow,
        clearError,
    } = useApprovalFlowStore();

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
    const safeFlows = Array.isArray(flows) ? flows : [];
    const safePositions = Array.isArray(positions) ? positions : [];
    const safeLeaveTypes = Array.isArray(leaveTypes) ? leaveTypes : [];

    // ==================== Helper Functions ====================

    // Extract ID from object or string
    const extractId = (val: any): string => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'object') {
            return val.id || val._id || '';
        }
        return '';
    };

    // Get position by ID
    const getPositionById = (positionId: string | undefined): Position | undefined => {
        if (!positionId) return undefined;
        return safePositions.find((p) => p.id === positionId || p._id === positionId);
    };

    // Get position name (from populated or cache or lookup)
    const getPositionName = (position: string | Position | undefined, cacheName?: string): string => {
        if (!position) return cacheName || 'ไม่ระบุ';

        if (typeof position === 'object' && position.name) {
            return position.name;
        }

        if (cacheName) return cacheName;

        const found = getPositionById(extractId(position));
        return found?.name || 'ไม่ระบุ';
    };

    // Get leave type by ID
    const getLeaveTypeById = (leaveTypeId: string | undefined): LeaveTypeBasic | undefined => {
        if (!leaveTypeId) return undefined;
        return safeLeaveTypes.find((lt) => lt.id === leaveTypeId || lt._id === leaveTypeId);
    };

    // Get leave type name
    const getLeaveTypeName = (leaveType: string | LeaveTypeBasic | undefined): string => {
        if (!leaveType) return 'ไม่ระบุ';

        if (typeof leaveType === 'object' && leaveType.name) {
            return leaveType.name;
        }

        const found = getLeaveTypeById(extractId(leaveType));
        return found?.name || 'ไม่ระบุ';
    };

    // Get leave types names from array
    const getLeaveTypesNames = (leaveTypes: (string | LeaveTypeBasic)[] | undefined): string => {
        if (!leaveTypes || leaveTypes.length === 0) return 'ทุกประเภท';
        return leaveTypes.map(getLeaveTypeName).join(', ');
    };

    // Format steps for display
    const formatSteps = (steps: ApprovalStep[]): string => {
        if (!steps || steps.length === 0) return '-';
        return steps
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map((s) => {
                const name = getPositionName(s.approverPosition, s.approverPositionName);
                return `${s.stepOrder}. ${name}`;
            })
            .join(' → ');
    };

    // Get step approver name
    const getStepApproverName = (step: ApprovalStep): string => {
        return getPositionName(step.approverPosition, step.approverPositionName);
    };

    // ==================== Derived Data ====================

    // Active flows only
    const activeFlows = safeFlows.filter((f) => f.isActive);

    // Default flows
    const defaultFlows = safeFlows.filter((f) => f.isDefault && f.isActive);

    // Summary
    const summary = {
        total: safeFlows.length,
        active: activeFlows.length,
        defaults: defaultFlows.length,
        positions: safePositions.length,
    };

    // Loading states
    const isLoading = loading.flows || loading.positions || loading.leaveTypes;
    const isSubmitting = loading.submitting;

    return {
        // Raw data
        flows: safeFlows,
        activeFlows,
        defaultFlows,
        positions: safePositions,
        leaveTypes: safeLeaveTypes,

        // Derived data
        summary,

        // Helper functions
        extractId,
        getPositionById,
        getPositionName,
        getLeaveTypeById,
        getLeaveTypeName,
        getLeaveTypesNames,
        formatSteps,
        getStepApproverName,

        // Loading states
        loading,
        isLoading,
        isSubmitting,
        error,

        // Actions
        fetchAll,
        fetchFlows,
        fetchPositions,
        fetchLeaveTypes,
        createFlow,
        updateFlow,
        deleteFlow,
        clearError,
        refetch: fetchAll,
    };
}

export { useApprovalFlow as default };