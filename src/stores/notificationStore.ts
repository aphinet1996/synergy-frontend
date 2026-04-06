import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ==================== Types ====================

export type NotificationType = 'success' | 'info' | 'warning' | 'error';
export type NotificationModule = 'leave' | 'task' | 'clinic' | 'system' | 'other';

export interface AppNotification {
    id: string;
    module: NotificationModule;
    type: NotificationType;
    title: string;
    message: string;
    data?: {
        requestId?: string;
        requestNumber?: string;
        userName?: string;
        action?: string;
        link?: string;
        [key: string]: any;
    };
    read: boolean;
    timestamp: string;
}

export interface PendingCounts {
    leave: number;
    task: number;
    clinic: number;
    total: number;
}

interface NotificationState {
    // Data
    notifications: AppNotification[];
    pendingCounts: PendingCounts;
    
    // Settings
    soundEnabled: boolean;
    desktopNotificationEnabled: boolean;
    toastEnabled: boolean;
    
    // Computed
    unreadCount: number;
    
    // Actions - Notifications
    addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => AppNotification;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    markModuleAsRead: (module: NotificationModule) => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    clearByModule: (module: NotificationModule) => void;
    
    // Actions - Pending Counts
    setPendingCount: (module: keyof Omit<PendingCounts, 'total'>, count: number) => void;
    incrementPendingCount: (module: keyof Omit<PendingCounts, 'total'>) => void;
    decrementPendingCount: (module: keyof Omit<PendingCounts, 'total'>) => void;
    
    // Actions - Settings
    setSoundEnabled: (enabled: boolean) => void;
    setDesktopNotificationEnabled: (enabled: boolean) => void;
    setToastEnabled: (enabled: boolean) => void;
}

// ==================== Helpers ====================

const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const playNotificationSound = (): void => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.warn('Could not play notification sound:', error);
    }
};

const showDesktopNotification = (title: string, body: string, icon?: string): void => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body,
            icon: icon || '/favicon.ico',
            tag: 'app-notification',
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                new Notification(title, {
                    body,
                    icon: icon || '/favicon.ico',
                    tag: 'app-notification',
                });
            }
        });
    }
};

// ==================== Initial State ====================

const initialPendingCounts: PendingCounts = {
    leave: 0,
    task: 0,
    clinic: 0,
    total: 0,
};

// ==================== Store ====================

export const useNotificationStore = create<NotificationState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                notifications: [],
                pendingCounts: initialPendingCounts,
                soundEnabled: true,
                desktopNotificationEnabled: true,
                toastEnabled: true,
                unreadCount: 0,

                // ==================== Notification Actions ====================

                addNotification: (notification) => {
                    const newNotification: AppNotification = {
                        ...notification,
                        id: generateId(),
                        read: false,
                        timestamp: new Date().toISOString(),
                    };

                    set((state) => ({
                        notifications: [newNotification, ...state.notifications].slice(0, 100), // Keep max 100
                        unreadCount: state.unreadCount + 1,
                    }));

                    // Play sound if enabled
                    if (get().soundEnabled) {
                        playNotificationSound();
                    }

                    // Show desktop notification if enabled
                    if (get().desktopNotificationEnabled) {
                        showDesktopNotification(notification.title, notification.message);
                    }

                    return newNotification;
                },

                markAsRead: (id) => {
                    set((state) => {
                        const notification = state.notifications.find((n) => n.id === id);
                        if (!notification || notification.read) return state;

                        return {
                            notifications: state.notifications.map((n) =>
                                n.id === id ? { ...n, read: true } : n
                            ),
                            unreadCount: Math.max(0, state.unreadCount - 1),
                        };
                    });
                },

                markAllAsRead: () => {
                    set((state) => ({
                        notifications: state.notifications.map((n) => ({ ...n, read: true })),
                        unreadCount: 0,
                    }));
                },

                markModuleAsRead: (module) => {
                    set((state) => {
                        const unreadInModule = state.notifications.filter(
                            (n) => n.module === module && !n.read
                        ).length;

                        return {
                            notifications: state.notifications.map((n) =>
                                n.module === module ? { ...n, read: true } : n
                            ),
                            unreadCount: Math.max(0, state.unreadCount - unreadInModule),
                        };
                    });
                },

                removeNotification: (id) => {
                    set((state) => {
                        const notification = state.notifications.find((n) => n.id === id);
                        return {
                            notifications: state.notifications.filter((n) => n.id !== id),
                            unreadCount: notification && !notification.read
                                ? Math.max(0, state.unreadCount - 1)
                                : state.unreadCount,
                        };
                    });
                },

                clearAll: () => {
                    set({
                        notifications: [],
                        unreadCount: 0,
                    });
                },

                clearByModule: (module) => {
                    set((state) => {
                        const unreadInModule = state.notifications.filter(
                            (n) => n.module === module && !n.read
                        ).length;

                        return {
                            notifications: state.notifications.filter((n) => n.module !== module),
                            unreadCount: Math.max(0, state.unreadCount - unreadInModule),
                        };
                    });
                },

                // ==================== Pending Count Actions ====================

                setPendingCount: (module, count) => {
                    set((state) => {
                        const newCounts = { ...state.pendingCounts, [module]: count };
                        newCounts.total = newCounts.leave + newCounts.task + newCounts.clinic;
                        return { pendingCounts: newCounts };
                    });
                },

                incrementPendingCount: (module) => {
                    set((state) => {
                        const newCounts = { 
                            ...state.pendingCounts, 
                            [module]: state.pendingCounts[module] + 1 
                        };
                        newCounts.total = newCounts.leave + newCounts.task + newCounts.clinic;
                        return { pendingCounts: newCounts };
                    });
                },

                decrementPendingCount: (module) => {
                    set((state) => {
                        const newCounts = { 
                            ...state.pendingCounts, 
                            [module]: Math.max(0, state.pendingCounts[module] - 1)
                        };
                        newCounts.total = newCounts.leave + newCounts.task + newCounts.clinic;
                        return { pendingCounts: newCounts };
                    });
                },

                // ==================== Settings Actions ====================

                setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

                setDesktopNotificationEnabled: (enabled) => {
                    set({ desktopNotificationEnabled: enabled });
                    if (enabled && 'Notification' in window) {
                        Notification.requestPermission();
                    }
                },

                setToastEnabled: (enabled) => set({ toastEnabled: enabled }),
            }),
            {
                name: 'app-notifications',
                partialize: (state) => ({
                    soundEnabled: state.soundEnabled,
                    desktopNotificationEnabled: state.desktopNotificationEnabled,
                    toastEnabled: state.toastEnabled,
                    notifications: state.notifications.slice(0, 50),
                    unreadCount: state.notifications.filter((n) => !n.read).length,
                }),
            }
        ),
        { name: 'NotificationStore' }
    )
);

// ==================== Selectors ====================

export const selectUnreadNotifications = (state: NotificationState) =>
    state.notifications.filter((n) => !n.read);

export const selectNotificationsByModule = (state: NotificationState, module: NotificationModule) =>
    state.notifications.filter((n) => n.module === module);

export const selectRecentNotifications = (state: NotificationState, count = 10) =>
    state.notifications.slice(0, count);

export const selectUnreadCountByModule = (state: NotificationState, module: NotificationModule) =>
    state.notifications.filter((n) => n.module === module && !n.read).length;