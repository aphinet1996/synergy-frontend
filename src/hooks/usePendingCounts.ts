import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Hook สำหรับ fetch pending counts จาก API เมื่อ load app
 * และ sync กับ real-time updates
 */
export function usePendingCounts() {
    const tokens = useAuthStore((state) => state.tokens);
    const { setPendingCount, pendingCounts } = useNotificationStore();
    const hasFetchedRef = useRef(false);

    // Fetch function ที่สามารถเรียกใช้ได้ทุกเมื่อ
    const fetchLeavePendingCount = useCallback(async () => {
        if (!tokens?.accessToken) return;

        try {
            const response = await fetch(`${API_BASE_URL}/leave/requests/pending/count`, {
                headers: {
                    'Authorization': `Bearer ${tokens.accessToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                const count = data.data?.count ?? data.count ?? 0;
                setPendingCount('leave', count);
            }
        } catch (error) {
            console.error('Failed to fetch leave pending count:', error);
        }
    }, [tokens?.accessToken, setPendingCount]);

    // Initial fetch
    useEffect(() => {
        if (!tokens?.accessToken || hasFetchedRef.current) return;

        fetchLeavePendingCount();
        hasFetchedRef.current = true;
    }, [tokens?.accessToken, fetchLeavePendingCount]);

    // Reset when logged out
    useEffect(() => {
        if (!tokens?.accessToken) {
            hasFetchedRef.current = false;
        }
    }, [tokens?.accessToken]);

    return {
        pendingCounts,
        refetchLeavePendingCount: fetchLeavePendingCount,
    };
}

export default usePendingCounts;