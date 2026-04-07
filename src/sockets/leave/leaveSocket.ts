import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

// Types

export interface LeaveRequestInfo {
    id: string;
    requestNumber: string;
    leaveType: string;
    leaveTypeName: string;
    startDate: string;
    endDate: string;
    days: number;
    status: string;
    userName: string;
}

export interface LeaveRequestCreatedPayload {
    request: LeaveRequestInfo;
    message: string;
    timestamp: string;
}

export interface LeaveStatusUpdatedPayload {
    request: LeaveRequestInfo;
    action: 'step_approved' | 'fully_approved' | 'rejected';
    message: string;
    notificationType: 'success' | 'info' | 'error';
    approverName?: string;
    rejectedReason?: string;
    timestamp: string;
}

export interface LeaveRequestCancelledPayload {
    request: LeaveRequestInfo;
    message: string;
    timestamp: string;
}

export interface LeaveBalanceUpdatedPayload {
    leaveType: string;
    leaveTypeName: string;
    previousBalance: number;
    newBalance: number;
    reason: string;
    timestamp: string;
}

export interface LeavePendingPayload {
    request: LeaveRequestInfo;
    message?: string;
    timestamp: string;
}

export interface LeaveRequestUpdatedPayload {
    request: LeaveRequestInfo;
    action: string;
    timestamp: string;
}

// Event types for subscription
export type LeaveSocketEvents = {
    // For requester (พนักงาน)
    'leave:status-updated': LeaveStatusUpdatedPayload;
    'leave:balance-updated': LeaveBalanceUpdatedPayload;

    // For approvers (ผู้อนุมัติ)
    'leave:request-created': LeaveRequestCreatedPayload;
    'leave:new-pending': LeavePendingPayload;
    'leave:pending-updated': LeaveRequestUpdatedPayload;
    'leave:pending-approval': LeavePendingPayload;
    'leave:request-cancelled': LeaveRequestCancelledPayload;

    // For subscribers
    'leave:request-updated': LeaveRequestUpdatedPayload;
    'leave:team-request': LeavePendingPayload;
    'leave:department-request': LeavePendingPayload;
};

type EventCallback<T> = (data: T) => void;

// Socket Manager Class

class LeaveSocketService {
    private socket: Socket | null = null;
    private isConnecting = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;
    private eventHandlers: Map<string, Set<Function>> = new Map();
    private connectionListeners: Set<(connected: boolean) => void> = new Set();

    // Socket URL from env or default
    private getSocketUrl(): string {
        const apiUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
        // Remove /api if present
        return apiUrl.replace('/leave', '');
    }

    /**
     * Connect to leave socket namespace
     */
    connect(): Socket | null {
        if (this.socket?.connected) {
            console.log('[LeaveSocket] Already connected');
            return this.socket;
        }

        if (this.isConnecting) {
            console.log('[LeaveSocket] Connection in progress...');
            return null;
        }

        const token = useAuthStore.getState().tokens?.accessToken;
        if (!token) {
            console.warn('[LeaveSocket] No token available');
            return null;
        }

        this.isConnecting = true;

        try {
            const socketUrl = this.getSocketUrl();
            console.log('[LeaveSocket] Connecting to:', socketUrl + '/leave');

            this.socket = io(`${socketUrl}/leave`, {
                auth: {
                    token: token,
                },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay,
                timeout: 10000,
            });

            this.setupInternalListeners();
            return this.socket;
        } catch (error) {
            console.error('[LeaveSocket] Connection error:', error);
            this.isConnecting = false;
            return null;
        }
    }

    /**
     * Disconnect from socket
     */
    disconnect(): void {
        if (this.socket) {
            console.log('[LeaveSocket] Disconnecting...');
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.eventHandlers.clear();
        this.notifyConnectionListeners(false);
    }

    /**
     * Get current socket instance
     */
    getSocket(): Socket | null {
        return this.socket;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /**
     * Add connection status listener
     */
    onConnectionChange(callback: (connected: boolean) => void): () => void {
        this.connectionListeners.add(callback);
        // Return unsubscribe function
        return () => {
            this.connectionListeners.delete(callback);
        };
    }

    private notifyConnectionListeners(connected: boolean): void {
        this.connectionListeners.forEach((cb) => cb(connected));
    }

    /**
     * Setup internal event listeners
     */
    private setupInternalListeners(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('[LeaveSocket] ✅ Connected successfully');
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.notifyConnectionListeners(true);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[LeaveSocket] ❌ Disconnected:', reason);
            this.isConnecting = false;
            this.notifyConnectionListeners(false);
        });

        this.socket.on('connect_error', (error) => {
            console.error('[LeaveSocket] Connection error:', error.message);
            this.isConnecting = false;
            this.reconnectAttempts++;

            if (error.message?.includes('Token expired')) {
                console.log('[LeaveSocket] Token expired, need to refresh');
                // Could trigger token refresh here
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('[LeaveSocket] 🔄 Reconnected after', attemptNumber, 'attempts');
            this.reconnectAttempts = 0;
            this.notifyConnectionListeners(true);
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('[LeaveSocket] Reconnection error:', error);
        });

        this.socket.on('reconnect_failed', () => {
            console.error('[LeaveSocket] Reconnection failed after max attempts');
        });
    }

    /**
     * Subscribe to an event
     */
    on<K extends keyof LeaveSocketEvents>(
        event: K,
        callback: EventCallback<LeaveSocketEvents[K]>
    ): () => void {
        if (!this.socket) {
            console.warn('[LeaveSocket] Socket not connected, cannot subscribe to:', event);
            return () => { };
        }

        // Track handlers for cleanup
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event)!.add(callback);

        this.socket.on(event, callback as any);
        console.log('[LeaveSocket] 📡 Subscribed to:', event);

        // Return unsubscribe function
        return () => {
            this.off(event, callback);
        };
    }

    /**
     * Unsubscribe from an event
     */
    off<K extends keyof LeaveSocketEvents>(
        event: K,
        callback?: EventCallback<LeaveSocketEvents[K]>
    ): void {
        if (!this.socket) return;

        if (callback) {
            this.socket.off(event, callback as any);
            this.eventHandlers.get(event)?.delete(callback);
        } else {
            this.socket.off(event);
            this.eventHandlers.delete(event);
        }
        console.log('[LeaveSocket] 🔕 Unsubscribed from:', event);
    }

    /**
     * Emit an event
     */
    emit(event: string, data?: any): void {
        if (!this.socket?.connected) {
            console.warn('[LeaveSocket] Cannot emit, socket not connected');
            return;
        }
        this.socket.emit(event, data);
    }

    // Room Subscriptions

    /**
     * Subscribe to a specific leave request
     */
    subscribeToRequest(requestId: string): void {
        this.emit('subscribe:request', requestId);
        console.log('[LeaveSocket] 📌 Subscribed to request:', requestId);
    }

    /**
     * Unsubscribe from a specific leave request
     */
    unsubscribeFromRequest(requestId: string): void {
        this.emit('unsubscribe:request', requestId);
        console.log('[LeaveSocket] 📌 Unsubscribed from request:', requestId);
    }

    /**
     * Subscribe to team updates (for managers)
     */
    subscribeToTeam(teamId: string): void {
        this.emit('subscribe:team', teamId);
        console.log('[LeaveSocket] 👥 Subscribed to team:', teamId);
    }

    /**
     * Unsubscribe from team updates
     */
    unsubscribeFromTeam(teamId: string): void {
        this.emit('unsubscribe:team', teamId);
        console.log('[LeaveSocket] 👥 Unsubscribed from team:', teamId);
    }

    /**
     * Subscribe to department updates
     */
    subscribeToDepartment(departmentId: string): void {
        this.emit('subscribe:department', departmentId);
        console.log('[LeaveSocket] 🏢 Subscribed to department:', departmentId);
    }

    /**
     * Unsubscribe from department updates
     */
    unsubscribeFromDepartment(departmentId: string): void {
        this.emit('unsubscribe:department', departmentId);
        console.log('[LeaveSocket] 🏢 Unsubscribed from department:', departmentId);
    }
}

// Singleton instance
export const leaveSocket = new LeaveSocketService();

export default leaveSocket;