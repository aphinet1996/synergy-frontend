import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { usePendingCounts } from '@/hooks/usePendingCounts';
import leaveSocket, {
    type LeaveRequestCreatedPayload,
    type LeaveStatusUpdatedPayload,
    type LeaveRequestCancelledPayload,
    type LeaveBalanceUpdatedPayload,
    type LeavePendingPayload,
} from '@/sockets/leave/leaveSocket';

// ==================== Toast Helpers ====================

const showLeaveToast = (
    type: 'success' | 'info' | 'warning' | 'error',
    title: string,
    message: string,
    action?: { label: string; onClick: () => void }
) => {
    const options: any = {
        description: message,
        duration: 5000,
        action: action ? {
            label: action.label,
            onClick: action.onClick,
        } : undefined,
    };

    switch (type) {
        case 'success':
            toast.success(title, options);
            break;
        case 'error':
            toast.error(title, options);
            break;
        case 'warning':
            toast.warning(title, options);
            break;
        default:
            toast.info(title, options);
    }
};

// ==================== Provider Component ====================

interface AppSocketProviderProps {
    children: React.ReactNode;
}

export function AppSocketProvider({ children }: AppSocketProviderProps) {
    const tokens = useAuthStore((state) => state.tokens);
    const { addNotification, toastEnabled } = useNotificationStore();
    
    // 🔄 Fetch initial pending counts + refetch function
    const { refetchLeavePendingCount } = usePendingCounts();
    
    const isConnectedRef = useRef(false);
    const unsubscribersRef = useRef<Array<() => void>>([]);

    // ==================== Leave Socket Handlers ====================

    // เมื่อมีใบลาใหม่ (สำหรับผู้อนุมัติ)
    const handleLeaveRequestCreated = useCallback((data: LeaveRequestCreatedPayload) => {
        console.log('[Socket] leave:request-created', data);
        
        // Add to notification store
        addNotification({
            module: 'leave',
            type: 'info',
            title: '📋 ใบลาใหม่',
            message: data.message || `${data.request.userName} ขอลา${data.request.leaveTypeName}`,
            data: {
                requestId: data.request.id,
                requestNumber: data.request.requestNumber,
                userName: data.request.userName,
                action: 'created',
                link: `/leave?tab=approvals`,
            },
        });

        // 🔄 Refetch pending count (แทน increment)
        refetchLeavePendingCount();

        // Show toast
        if (toastEnabled) {
            showLeaveToast('info', '📋 ใบลาใหม่', data.message || `${data.request.userName} ขอลา${data.request.leaveTypeName}`, {
                label: 'ดู',
                onClick: () => window.location.href = '/leave?tab=approvals',
            });
        }
    }, [addNotification, refetchLeavePendingCount, toastEnabled]);

    // เมื่อสถานะใบลาเปลี่ยน (สำหรับผู้ขอลา)
    const handleLeaveStatusUpdated = useCallback((data: LeaveStatusUpdatedPayload) => {
        console.log('[Socket] leave:status-updated', data);
        
        let title = '';
        let type: 'success' | 'info' | 'error' = 'info';

        switch (data.action) {
            case 'fully_approved':
                title = '✅ อนุมัติแล้ว';
                type = 'success';
                break;
            case 'step_approved':
                title = '📝 อนุมัติขั้นตอน';
                type = 'info';
                break;
            case 'rejected':
                title = '❌ ไม่อนุมัติ';
                type = 'error';
                break;
        }

        // Add to notification store
        addNotification({
            module: 'leave',
            type,
            title,
            message: data.message,
            data: {
                requestId: data.request.id,
                requestNumber: data.request.requestNumber,
                action: data.action,
                link: `/leave?tab=history`,
            },
        });

        // Show toast
        if (toastEnabled) {
            showLeaveToast(type, title, data.message);
        }
    }, [addNotification, toastEnabled]);

    // เมื่อใบลาถูกยกเลิก (สำหรับผู้อนุมัติ)
    const handleLeaveRequestCancelled = useCallback((data: LeaveRequestCancelledPayload) => {
        console.log('[Socket] leave:request-cancelled', data);
        
        // Add to notification store
        addNotification({
            module: 'leave',
            type: 'warning',
            title: '🚫 ยกเลิกใบลา',
            message: data.message || `${data.request.userName} ยกเลิกใบลา`,
            data: {
                requestId: data.request.id,
                requestNumber: data.request.requestNumber,
                userName: data.request.userName,
                action: 'cancelled',
            },
        });

        // 🔄 Refetch pending count (แทน decrement)
        refetchLeavePendingCount();

        // Show toast
        if (toastEnabled) {
            showLeaveToast('warning', '🚫 ยกเลิกใบลา', data.message || `${data.request.userName} ยกเลิกใบลา`);
        }
    }, [addNotification, refetchLeavePendingCount, toastEnabled]);

    // เมื่อยอดวันลาเปลี่ยน
    const handleLeaveBalanceUpdated = useCallback((data: LeaveBalanceUpdatedPayload) => {
        console.log('[Socket] leave:balance-updated', data);
        
        const diff = data.newBalance - data.previousBalance;
        const type = diff > 0 ? 'success' : diff < 0 ? 'warning' : 'info';
        const sign = diff > 0 ? '+' : '';

        addNotification({
            module: 'leave',
            type,
            title: '💰 อัปเดตยอดวันลา',
            message: `${data.leaveTypeName}: ${sign}${diff} วัน (${data.reason})`,
            data: {
                leaveType: data.leaveType,
            },
        });

        if (toastEnabled) {
            showLeaveToast(type, '💰 อัปเดตยอดวันลา', `${data.leaveTypeName}: ${sign}${diff} วัน`);
        }
    }, [addNotification, toastEnabled]);

    // เมื่อมี pending ใหม่ (broadcast)
    const handleNewPending = useCallback((data: LeavePendingPayload) => {
        console.log('[Socket] leave:new-pending', data);
        // 🔄 Refetch pending count
        refetchLeavePendingCount();
    }, [refetchLeavePendingCount]);

    // เมื่อ pending มีการอัปเดต (อนุมัติ/ไม่อนุมัติ/ยกเลิก)
    const handlePendingUpdated = useCallback((data: any) => {
        console.log('[Socket] leave:pending-updated', data);
        // 🔄 Refetch pending count
        refetchLeavePendingCount();
    }, [refetchLeavePendingCount]);

    // ==================== Socket Connection ====================

    const connectSockets = useCallback(() => {
        if (isConnectedRef.current) return;

        const socket = leaveSocket.connect();
        if (!socket) return;

        isConnectedRef.current = true;

        // Subscribe to leave events
        unsubscribersRef.current.push(
            leaveSocket.on('leave:request-created', handleLeaveRequestCreated)
        );
        unsubscribersRef.current.push(
            leaveSocket.on('leave:status-updated', handleLeaveStatusUpdated)
        );
        unsubscribersRef.current.push(
            leaveSocket.on('leave:request-cancelled', handleLeaveRequestCancelled)
        );
        unsubscribersRef.current.push(
            leaveSocket.on('leave:balance-updated', handleLeaveBalanceUpdated)
        );
        unsubscribersRef.current.push(
            leaveSocket.on('leave:new-pending', handleNewPending)
        );
        unsubscribersRef.current.push(
            leaveSocket.on('leave:pending-updated', handlePendingUpdated)
        );

        console.log('[AppSocketProvider] Connected to sockets');
    }, [
        handleLeaveRequestCreated,
        handleLeaveStatusUpdated,
        handleLeaveRequestCancelled,
        handleLeaveBalanceUpdated,
        handleNewPending,
        handlePendingUpdated,
    ]);

    const disconnectSockets = useCallback(() => {
        // Cleanup subscriptions
        unsubscribersRef.current.forEach((unsub) => unsub());
        unsubscribersRef.current = [];

        leaveSocket.disconnect();
        isConnectedRef.current = false;

        console.log('[AppSocketProvider] Disconnected from sockets');
    }, []);

    // Connect when authenticated
    useEffect(() => {
        if (tokens?.accessToken && !isConnectedRef.current) {
            connectSockets();
        }

        return () => {
            // Don't disconnect on unmount if still authenticated
            // Only disconnect when token is removed
        };
    }, [tokens?.accessToken, connectSockets]);

    // Disconnect when logged out
    useEffect(() => {
        if (!tokens?.accessToken && isConnectedRef.current) {
            disconnectSockets();
        }
    }, [tokens?.accessToken, disconnectSockets]);

    return <>{children}</>;
}

export default AppSocketProvider;