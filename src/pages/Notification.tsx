import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    CalendarDays,
    ListChecks,
    Hospital,
    AlertCircle,
    Search,
    Filter,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
    useNotificationStore,
    type AppNotification,
    type NotificationType,
    type NotificationModule,
} from '@/stores/notificationStore';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const moduleConfig: Record<NotificationModule, { icon: React.ElementType; label: string; color: string; bgColor: string }> = {
    leave: { icon: CalendarDays, label: 'ลางาน', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    task: { icon: ListChecks, label: 'งาน', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    clinic: { icon: Hospital, label: 'คลินิก', color: 'text-green-600', bgColor: 'bg-green-100' },
    system: { icon: AlertCircle, label: 'ระบบ', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    other: { icon: Bell, label: 'อื่นๆ', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

const typeStyles: Record<NotificationType, { border: string; bg: string; label: string }> = {
    success: { border: 'border-l-green-500', bg: 'bg-green-50/50', label: 'สำเร็จ' },
    info: { border: 'border-l-blue-500', bg: 'bg-blue-50/50', label: 'ข้อมูล' },
    warning: { border: 'border-l-yellow-500', bg: 'bg-yellow-50/50', label: 'เตือน' },
    error: { border: 'border-l-red-500', bg: 'bg-red-50/50', label: 'ผิดพลาด' },
};

export default function Notifications() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'all' | NotificationModule>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');

    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
    } = useNotificationStore();

    // Count unread by module
    const unreadByModule = (module: NotificationModule) =>
        notifications.filter((n) => n.module === module && !n.read).length;

    // Filter notifications
    const filteredNotifications = notifications
        .filter((n) => {
            // Filter by tab/module
            if (activeTab !== 'all' && n.module !== activeTab) return false;

            // Filter by read status
            if (filterRead === 'unread' && n.read) return false;
            if (filterRead === 'read' && !n.read) return false;

            // Filter by search query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    n.title.toLowerCase().includes(query) ||
                    n.message.toLowerCase().includes(query) ||
                    n.data?.requestNumber?.toLowerCase().includes(query)
                );
            }

            return true;
        });

    // Group notifications by date
    const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
        const date = format(new Date(notification.timestamp), 'yyyy-MM-dd');
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(notification);
        return groups;
    }, {} as Record<string, AppNotification[]>);

    const formatDateHeader = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
            return 'วันนี้';
        }
        if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
            return 'เมื่อวาน';
        }
        return format(date, 'd MMMM yyyy', { locale: th });
    };

    const formatTime = (timestamp: string) => {
        return format(new Date(timestamp), 'HH:mm น.', { locale: th });
    };

    // Handle notification click
    const handleNotificationClick = (notification: AppNotification) => {
        markAsRead(notification.id);

        if (notification.data?.link) {
            navigate(notification.data.link);
        } else if (notification.data?.requestId) {
            switch (notification.module) {
                case 'leave':
                    navigate(`/leave?tab=approval`);
                    break;
                case 'task':
                    navigate(`/task/${notification.data.requestId}`);
                    break;
                case 'clinic':
                    navigate(`/clinic/appointments/${notification.data.requestId}`);
                    break;
            }
        }
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">การแจ้งเตือน</h1>
                    <p className="text-gray-500 mt-1">
                        {unreadCount > 0 ? `มี ${unreadCount} รายการที่ยังไม่ได้อ่าน` : 'ไม่มีการแจ้งเตือนใหม่'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={markAllAsRead}
                        >
                            <CheckCheck className="h-4 w-4 mr-2" />
                            อ่านทั้งหมด
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    ลบทั้งหมด
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        คุณต้องการลบการแจ้งเตือนทั้งหมด ({notifications.length} รายการ) ใช่หรือไม่?
                                        การดำเนินการนี้ไม่สามารถย้อนกลับได้
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={clearAll}
                                    >
                                        ลบทั้งหมด
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card className="mt-6 flex-shrink-0">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="ค้นหาการแจ้งเตือน..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                    onClick={() => setSearchQuery('')}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Filter by read status */}
                        <Select value={filterRead} onValueChange={(v: any) => setFilterRead(v)}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทั้งหมด</SelectItem>
                                <SelectItem value="unread">ยังไม่อ่าน</SelectItem>
                                <SelectItem value="read">อ่านแล้ว</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Module Tabs */}
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as any)}
                        className="mt-4"
                    >
                        <TabsList className="w-full justify-start bg-transparent p-0 h-auto flex-wrap gap-2">
                            <TabsTrigger
                                value="all"
                                className="rounded-full data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
                            >
                                ทั้งหมด
                                {unreadCount > 0 && (
                                    <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            {Object.entries(moduleConfig).map(([key, config]) => {
                                const ModuleIcon = config.icon;
                                const count = unreadByModule(key as NotificationModule);
                                return (
                                    <TabsTrigger
                                        key={key}
                                        value={key}
                                        className={cn(
                                            'rounded-full',
                                            `data-[state=active]:${config.bgColor} data-[state=active]:${config.color}`
                                        )}
                                    >
                                        <ModuleIcon className="h-4 w-4 mr-1" />
                                        {config.label}
                                        {count > 0 && (
                                            <Badge className={cn('ml-1.5 h-5 px-1.5', config.bgColor, config.color)}>
                                                {count}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Notification List */}
            <div className="flex-1 mt-6 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                    <Card className="h-full">
                        <CardContent className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
                            <Bell className="h-16 w-16 mb-4 opacity-30" />
                            <p className="text-lg font-medium text-gray-600">ไม่มีการแจ้งเตือน</p>
                            <p className="text-sm mt-1">
                                {searchQuery ? 'ไม่พบการแจ้งเตือนที่ตรงกับการค้นหา' : 'การแจ้งเตือนใหม่จะปรากฏที่นี่'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedNotifications)
                            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                            .map(([date, items]) => (
                                <div key={date}>
                                    {/* Date Header */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-sm font-semibold text-gray-600">
                                            {formatDateHeader(date)}
                                        </h3>
                                        <div className="flex-1 h-px bg-gray-200" />
                                        <Badge variant="outline" className="text-xs">
                                            {items.length} รายการ
                                        </Badge>
                                    </div>

                                    {/* Notifications */}
                                    <div className="space-y-2">
                                        {items.map((notification) => {
                                            const ModuleIcon = moduleConfig[notification.module]?.icon || Bell;
                                            const moduleColor = moduleConfig[notification.module]?.color || 'text-gray-600';
                                            const moduleBgColor = moduleConfig[notification.module]?.bgColor || 'bg-gray-100';
                                            const typeStyle = typeStyles[notification.type];

                                            return (
                                                <Card
                                                    key={notification.id}
                                                    className={cn(
                                                        'border-l-4 cursor-pointer transition-all hover:shadow-md',
                                                        typeStyle.border,
                                                        !notification.read && 'bg-blue-50/30'
                                                    )}
                                                    onClick={() => handleNotificationClick(notification)}
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start gap-4">
                                                            {/* Module Icon */}
                                                            <div className={cn('p-2 rounded-lg flex-shrink-0', moduleBgColor)}>
                                                                <ModuleIcon className={cn('h-5 w-5', moduleColor)} />
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className={cn(
                                                                            'font-medium text-gray-900',
                                                                            !notification.read && 'font-semibold'
                                                                        )}>
                                                                            {notification.title}
                                                                        </p>
                                                                        {!notification.read && (
                                                                            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                                                                        )}
                                                                    </div>
                                                                    <span className="text-xs text-gray-400 flex-shrink-0">
                                                                        {formatTime(notification.timestamp)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    {notification.message}
                                                                </p>
                                                                {notification.data?.requestNumber && (
                                                                    <p className="text-xs text-gray-400 font-mono mt-2">
                                                                        #{notification.data.requestNumber}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                {!notification.read && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 hover:bg-gray-200"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            markAsRead(notification.id);
                                                                        }}
                                                                        title="ทำเครื่องหมายว่าอ่านแล้ว"
                                                                    >
                                                                        <Check className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        removeNotification(notification.id);
                                                                    }}
                                                                    title="ลบ"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}