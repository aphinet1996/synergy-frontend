import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    X,
    Volume2,
    VolumeX,
    Settings,
    CalendarDays,
    ListChecks,
    Hospital,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    useNotificationStore,
    type AppNotification,
    type NotificationType,
    type NotificationModule,
} from '@/stores/notificationStore';

// ==================== Hook for responsive ====================

function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [matches, query]);

    return matches;
}

// ==================== Module Config ====================

const moduleConfig: Record<NotificationModule, { icon: React.ElementType; label: string; color: string }> = {
    leave: { icon: CalendarDays, label: 'ลางาน', color: 'text-blue-600' },
    task: { icon: ListChecks, label: 'งาน', color: 'text-purple-600' },
    clinic: { icon: Hospital, label: 'คลินิก', color: 'text-green-600' },
    system: { icon: AlertCircle, label: 'ระบบ', color: 'text-gray-600' },
    other: { icon: Bell, label: 'อื่นๆ', color: 'text-gray-600' },
};

const typeStyles: Record<NotificationType, string> = {
    success: 'border-l-green-500 bg-green-50/50',
    info: 'border-l-blue-500 bg-blue-50/50',
    warning: 'border-l-yellow-500 bg-yellow-50/50',
    error: 'border-l-red-500 bg-red-50/50',
};

// ==================== Notification Item ====================

interface NotificationItemProps {
    notification: AppNotification;
    onMarkAsRead: (id: string) => void;
    onRemove: (id: string) => void;
    onClick?: (notification: AppNotification) => void;
    compact?: boolean;
}

function NotificationItem({ notification, onMarkAsRead, onRemove, onClick, compact }: NotificationItemProps) {
    const ModuleIcon = moduleConfig[notification.module]?.icon || Bell;
    const moduleColor = moduleConfig[notification.module]?.color || 'text-gray-600';

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return 'เมื่อสักครู่';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} นาที`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชม.`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} วัน`;

        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    };

    return (
        <div
            className={cn(
                'border-l-4 rounded-r-lg cursor-pointer transition-all active:scale-[0.98]',
                typeStyles[notification.type],
                !notification.read && 'bg-opacity-100 font-medium',
                compact ? 'p-2.5' : 'p-3'
            )}
            onClick={() => onClick?.(notification)}
        >
            <div className="flex items-start gap-2.5">
                {/* Module Icon */}
                <div className={cn('mt-0.5 flex-shrink-0', moduleColor)}>
                    <ModuleIcon className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                            'font-medium truncate',
                            compact ? 'text-xs' : 'text-sm'
                        )}>
                            {notification.title}
                        </p>
                        {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                        )}
                    </div>
                    <p className={cn(
                        'text-gray-600 mt-0.5 line-clamp-2',
                        compact ? 'text-[11px]' : 'text-xs'
                    )}>
                        {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        {notification.data?.requestNumber && (
                            <span className={cn(
                                'text-gray-400 font-mono',
                                compact ? 'text-[10px]' : 'text-xs'
                            )}>
                                #{notification.data.requestNumber}
                            </span>
                        )}
                        <span className={cn(
                            'text-gray-400',
                            compact ? 'text-[10px]' : 'text-xs'
                        )}>
                            {formatTime(notification.timestamp)}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    {!notification.read && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                'p-0 hover:bg-gray-200',
                                compact ? 'h-6 w-6' : 'h-7 w-7'
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notification.id);
                            }}
                        >
                            <Check className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            'p-0 text-gray-400 hover:text-red-500 hover:bg-red-50',
                            compact ? 'h-6 w-6' : 'h-7 w-7'
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(notification.id);
                        }}
                    >
                        <X className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ==================== Settings Menu ====================

interface SettingsMenuProps {
    soundEnabled: boolean;
    desktopNotificationEnabled: boolean;
    onSoundChange: (enabled: boolean) => void;
    onDesktopChange: (enabled: boolean) => void;
    onClearAll: () => void;
}

function SettingsMenu({
    soundEnabled,
    desktopNotificationEnabled,
    onSoundChange,
    onDesktopChange,
    onClearAll,
}: SettingsMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <div className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="sound" className="text-sm flex items-center gap-2 cursor-pointer">
                            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                            เสียงแจ้งเตือน
                        </Label>
                        <Switch
                            id="sound"
                            checked={soundEnabled}
                            onCheckedChange={onSoundChange}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="desktop" className="text-sm flex items-center gap-2 cursor-pointer">
                            <Bell className="h-4 w-4" />
                            Desktop
                        </Label>
                        <Switch
                            id="desktop"
                            checked={desktopNotificationEnabled}
                            onCheckedChange={onDesktopChange}
                        />
                    </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={onClearAll}
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    ล้างทั้งหมด
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ==================== Notification Content (Shared) ====================

interface NotificationContentProps {
    notifications: AppNotification[];
    activeTab: 'all' | NotificationModule;
    onTabChange: (tab: 'all' | NotificationModule) => void;
    unreadCount: number;
    unreadByModule: (module: NotificationModule) => number;
    onMarkAsRead: (id: string) => void;
    onRemove: (id: string) => void;
    onNotificationClick: (notification: AppNotification) => void;
    onMarkAllAsRead: () => void;
    soundEnabled: boolean;
    desktopNotificationEnabled: boolean;
    onSoundChange: (enabled: boolean) => void;
    onDesktopChange: (enabled: boolean) => void;
    onClearAll: () => void;
    onViewAll?: () => void;
    compact?: boolean;
}

function NotificationContent({
    notifications,
    activeTab,
    onTabChange,
    unreadCount,
    unreadByModule,
    onMarkAsRead,
    onRemove,
    onNotificationClick,
    onMarkAllAsRead,
    soundEnabled,
    desktopNotificationEnabled,
    onSoundChange,
    onDesktopChange,
    onClearAll,
    onViewAll,
    compact,
}: NotificationContentProps) {
    const filteredNotifications = activeTab === 'all'
        ? notifications
        : notifications.filter((n) => n.module === activeTab);

    return (
        <div className={cn(
            "flex flex-col overflow-hidden",
            compact ? "h-full" : "h-full max-h-[500px]"
        )}>
            {/* Header */}
            <div className={cn(
                'flex items-center justify-between border-b bg-gray-50/50 flex-shrink-0',
                compact ? 'px-3 py-2' : 'p-3'
            )}>
                <h3 className={cn('font-semibold', compact ? 'text-sm' : 'text-base')}>
                    การแจ้งเตือน
                </h3>
                <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn('text-xs', compact ? 'h-7 px-2' : 'h-8')}
                            onClick={onMarkAllAsRead}
                        >
                            <CheckCheck className="h-3.5 w-3.5 mr-1" />
                            <span className={compact ? 'hidden' : 'hidden sm:inline'}>อ่านทั้งหมด</span>
                        </Button>
                    )}
                    <SettingsMenu
                        soundEnabled={soundEnabled}
                        desktopNotificationEnabled={desktopNotificationEnabled}
                        onSoundChange={onSoundChange}
                        onDesktopChange={onDesktopChange}
                        onClearAll={onClearAll}
                    />
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={(v) => onTabChange(v as any)}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
                <TabsList className={cn(
                    'w-full justify-start rounded-none border-b bg-transparent p-0 h-auto flex-shrink-0',
                    'overflow-x-auto'
                )}>
                    <TabsTrigger
                        value="all"
                        className={cn(
                            'rounded-none border-b-2 border-transparent',
                            'data-[state=active]:border-purple-600 data-[state=active]:bg-transparent',
                            compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
                            'flex-shrink-0'
                        )}
                    >
                        ทั้งหมด
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className={cn(
                                'ml-1.5 px-1.5',
                                compact ? 'h-4 text-[10px]' : 'h-5 text-xs'
                            )}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="leave"
                        className={cn(
                            'rounded-none border-b-2 border-transparent',
                            'data-[state=active]:border-blue-600 data-[state=active]:bg-transparent',
                            compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
                            'flex-shrink-0'
                        )}
                    >
                        <CalendarDays className={cn(compact ? 'h-3 w-3' : 'h-4 w-4', 'mr-1')} />
                        ลางาน
                        {unreadByModule('leave') > 0 && (
                            <Badge className={cn(
                                'ml-1.5 px-1.5 bg-blue-100 text-blue-700',
                                compact ? 'h-4 text-[10px]' : 'h-5 text-xs'
                            )}>
                                {unreadByModule('leave')}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="task"
                        className={cn(
                            'rounded-none border-b-2 border-transparent',
                            'data-[state=active]:border-purple-600 data-[state=active]:bg-transparent',
                            compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
                            'flex-shrink-0'
                        )}
                    >
                        <ListChecks className={cn(compact ? 'h-3 w-3' : 'h-4 w-4', 'mr-1')} />
                        งาน
                        {unreadByModule('task') > 0 && (
                            <Badge className={cn(
                                'ml-1.5 px-1.5 bg-purple-100 text-purple-700',
                                compact ? 'h-4 text-[10px]' : 'h-5 text-xs'
                            )}>
                                {unreadByModule('task')}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Notification List */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                        <div className={cn(
                            'flex flex-col items-center justify-center text-gray-400',
                            compact ? 'py-10' : 'py-12'
                        )}>
                            <Bell className={cn(
                                'mb-3 opacity-30',
                                compact ? 'h-10 w-10' : 'h-12 w-12'
                            )} />
                            <p className={cn(compact ? 'text-xs' : 'text-sm')}>ไม่มีการแจ้งเตือน</p>
                        </div>
                    ) : (
                        <div className={cn('space-y-1.5', compact ? 'p-2' : 'p-2')}>
                            {filteredNotifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={onMarkAsRead}
                                    onRemove={onRemove}
                                    onClick={onNotificationClick}
                                    compact={compact}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </Tabs>

            {/* Footer */}
            {notifications.length > 0 && onViewAll && (
                <div className={cn(
                    'border-t bg-gray-50/50 text-center flex-shrink-0',
                    compact ? 'p-2' : 'p-2'
                )}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            'text-gray-500 hover:text-gray-700 w-full',
                            compact ? 'text-xs h-8' : 'text-xs h-8'
                        )}
                        onClick={onViewAll}
                    >
                        ดูทั้งหมด ({notifications.length})
                    </Button>
                </div>
            )}
        </div>
    );
}

// ==================== Main Component ====================

interface NotificationBellProps {
    className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | NotificationModule>('all');
    const navigate = useNavigate();

    // Check if mobile (max-width: 640px = sm breakpoint)
    const isMobile = useMediaQuery('(max-width: 640px)');

    // Store
    const {
        notifications,
        unreadCount,
        soundEnabled,
        desktopNotificationEnabled,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        setSoundEnabled,
        setDesktopNotificationEnabled,
    } = useNotificationStore();

    // Count unread by module
    const unreadByModule = (module: NotificationModule) =>
        notifications.filter((n) => n.module === module && !n.read).length;

    // Handle notification click
    const handleNotificationClick = (notification: AppNotification) => {
        markAsRead(notification.id);

        if (notification.data?.link) {
            navigate(notification.data.link);
            setOpen(false);
        } else if (notification.data?.requestId) {
            switch (notification.module) {
                case 'leave':
                    navigate(`/leave/requests/${notification.data.requestId}`);
                    break;
                case 'task':
                    navigate(`/task/${notification.data.requestId}`);
                    break;
                case 'clinic':
                    navigate(`/clinic/appointments/${notification.data.requestId}`);
                    break;
            }
            setOpen(false);
        }
    };

    const handleViewAll = () => {
        navigate('/notifications');
        setOpen(false);
    };

    // Bell Button
    const BellButton = (
        <Button
            variant="ghost"
            size="icon"
            className={cn('relative', className)}
        >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                <Badge
                    className={cn(
                        'absolute -top-1 -right-1 px-1 bg-red-500 hover:bg-red-500 border-2 border-white',
                        isMobile ? 'h-4 min-w-[16px] text-[10px]' : 'h-5 min-w-[20px] text-xs'
                    )}
                >
                    {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
            )}
        </Button>
    );

    // Shared props for NotificationContent
    const contentProps = {
        notifications,
        activeTab,
        onTabChange: setActiveTab,
        unreadCount,
        unreadByModule,
        onMarkAsRead: markAsRead,
        onRemove: removeNotification,
        onNotificationClick: handleNotificationClick,
        onMarkAllAsRead: markAllAsRead,
        soundEnabled,
        desktopNotificationEnabled,
        onSoundChange: setSoundEnabled,
        onDesktopChange: setDesktopNotificationEnabled,
        onClearAll: clearAll,
        onViewAll: handleViewAll,
    };

    // 📱 Mobile: Use Sheet (Bottom drawer)
    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    {BellButton}
                </SheetTrigger>
                <SheetContent
                    side="bottom"
                    className="h-[80vh] p-0 rounded-t-2xl overflow-hidden"
                >
                    {/* Drag indicator */}
                    <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                        <div className="w-10 h-1 bg-gray-300 rounded-full" />
                    </div>
                    <NotificationContent {...contentProps} compact />
                </SheetContent>
            </Sheet>
        );
    }

    // 🖥️ Desktop: Use Popover
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {BellButton}
            </PopoverTrigger>
            <PopoverContent
                className="w-[400px] p-0 max-h-[500px] overflow-hidden"
                align="end"
            >
                <NotificationContent {...contentProps} />
            </PopoverContent>
        </Popover>
    );
}

export default NotificationBell;