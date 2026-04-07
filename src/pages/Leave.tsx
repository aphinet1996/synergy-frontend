import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useLeave } from '@/hooks/useLeave';
import { useNotificationStore } from '@/stores/notificationStore';
import leaveSocket from '@/sockets/leave/leaveSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    CalendarDays,
    Plus,
    Calendar as CalendarIcon,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Umbrella,
    Stethoscope,
    Baby,
    Briefcase,
    FileText,
    History,
    AlertCircle,
    ChevronRight,
    Upload,
    X,
    File,
    Image as ImageIcon,
    Sun,
    Moon,
    UserCheck,
    User,
    Eye,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { LeaveTypeCode, LeaveDurationType, HalfDayPeriod } from '@/services/leaveService';

type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface UploadedFile {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
}

const HOURS_PER_DAY = 8;

const START_TIME_OPTIONS = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

const getEndTimeOptions = (startTime: string): string[] => {
    const startHour = parseInt(startTime.split(':')[0]);
    const options: string[] = [];
    for (let h = startHour + 1; h <= 18; h++) {
        options.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return options;
};

const getLeaveTypeConfig = (type: LeaveTypeCode) => {
    const config: Record<LeaveTypeCode, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
        annual: { label: 'ลาพักร้อน', icon: Umbrella, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        sick: { label: 'ลาป่วย', icon: Stethoscope, color: 'text-red-600', bgColor: 'bg-red-100' },
        personal: { label: 'ลากิจ', icon: Briefcase, color: 'text-orange-600', bgColor: 'bg-orange-100' },
        maternity: { label: 'ลาคลอด', icon: Baby, color: 'text-pink-600', bgColor: 'bg-pink-100' },
        ordination: { label: 'ลาบวช', icon: FileText, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
        military: { label: 'ลาเกณฑ์ทหาร', icon: FileText, color: 'text-green-600', bgColor: 'bg-green-100' },
        other: { label: 'ลาอื่นๆ', icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-100' },
    };
    return config[type] || config.other;
};

const getStatusConfig = (status: LeaveStatus) => {
    const config: Record<LeaveStatus, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
        pending: { label: 'รอพิจารณา', icon: Clock, color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
        approved: { label: 'อนุมัติ', icon: CheckCircle2, color: 'text-green-700', bgColor: 'bg-green-100' },
        rejected: { label: 'ไม่อนุมัติ', icon: XCircle, color: 'text-red-700', bgColor: 'bg-red-100' },
        cancelled: { label: 'ยกเลิก', icon: AlertCircle, color: 'text-gray-700', bgColor: 'bg-gray-100' },
    };
    return config[status] || config.pending;
};

const getDurationTypeConfig = (type: LeaveDurationType, halfDayPeriod?: HalfDayPeriod) => {
    const config: Record<LeaveDurationType, { label: string; shortLabel: string; icon: React.ElementType }> = {
        full_day: { label: 'เต็มวัน', shortLabel: 'เต็มวัน', icon: CalendarDays },
        half_day: { label: 'ครึ่งวัน', shortLabel: halfDayPeriod === 'morning' ? 'ครึ่งวันเช้า' : 'ครึ่งวันบ่าย', icon: halfDayPeriod === 'morning' ? Sun : Moon },
        hours: { label: 'ระบุเวลา', shortLabel: 'ช่วงเวลา', icon: Clock },
    };
    return config[type];
};

const getHalfDayPeriodConfig = (period: HalfDayPeriod) => {
    const config: Record<HalfDayPeriod, { label: string; icon: React.ElementType }> = {
        morning: { label: 'เช้า', icon: Sun },
        afternoon: { label: 'บ่าย', icon: Moon },
    };
    return config[period];
};

const calculateHoursBetween = (startTime: string, endTime: string): number => {
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    let totalHours = endHour - startHour;
    if (startHour < 13 && endHour > 12) {
        totalHours -= 1;
    }
    return Math.max(0, totalHours);
};

const formatDaysDisplay = (days: number, hours?: number): string => {
    if (hours && hours < 8) {
        return `${hours} ชม.`;
    }
    if (days === 1) return '1 วัน';
    if (days === 0.5) return 'ครึ่งวัน';
    if (days === 0.25) return '2 ชม.';
    if (days === 0.75) return '6 ชม.';
    if (Number.isInteger(days)) return `${days} วัน`;
    return `${days} วัน`;
};

/**
 * แสดงยอดคงเหลือเป็น "X วัน Y ชม."
 * เช่น 2.875 วัน → "2 วัน 7 ชม."
 */
const formatQuotaDisplay = (days: number): string => {
    if (days <= 0) return '0 วัน';

    const wholeDays = Math.floor(days);
    const remainingHours = Math.round((days - wholeDays) * HOURS_PER_DAY);

    // ถ้าเป็นจำนวนเต็มวัน
    if (remainingHours === 0 || remainingHours === HOURS_PER_DAY) {
        const finalDays = remainingHours === HOURS_PER_DAY ? wholeDays + 1 : wholeDays;
        return `${finalDays} วัน`;
    }

    // ถ้าน้อยกว่า 1 วัน แสดงเป็นชั่วโมงอย่างเดียว
    if (wholeDays === 0) {
        return `${remainingHours} ชม.`;
    }

    // แสดงเป็น "X วัน Y ชม."
    return `${wholeDays} วัน ${remainingHours} ชม.`;
};

export default function Leave() {
    const { user } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        leaveTypes,
        leaveQuotas,
        publicHolidays,
        leaveRequests,
        teamPendingRequests,
        upcomingHolidays,
        summary,
        isLoading,
        isSubmitting,
        isApproving,
        error,
        createRequest,
        cancelRequest,
        approveRequest,
        rejectRequest,
    } = useLeave();

    // 🔥 Real-time pending count from notification store
    const pendingCounts = useNotificationStore((state) => state.pendingCounts);
    const realTimePendingCount = pendingCounts.leave;

    const [activeTab, setActiveTab] = useState('overview');
    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Form state
    const [leaveType, setLeaveType] = useState<LeaveTypeCode>('annual');
    const [durationType, setDurationType] = useState<LeaveDurationType>('full_day');
    const [halfDayPeriod, setHalfDayPeriod] = useState<HalfDayPeriod>('morning');
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [startTime, setStartTime] = useState<string>('09:00');
    const [endTime, setEndTime] = useState<string>('10:00');
    const [reason, setReason] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

    const isManager = user?.role === 'manager' || user?.role === 'admin';
    const pendingRequests = leaveRequests.filter((r) => r.status === 'pending');

    // ใช้ realTimePendingCount ถ้ามี ไม่งั้นใช้ teamPendingRequests.length
    const displayPendingCount = realTimePendingCount > 0
        ? realTimePendingCount
        : teamPendingRequests.length;

    // Force re-render เมื่อ socket event มา
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        if (!isManager) return;

        const handleDataChange = () => {
            console.log('[Leave] Socket event received, updating UI...');
            forceUpdate(n => n + 1);
        };

        const unsub1 = leaveSocket.on('leave:request-created', handleDataChange);
        const unsub2 = leaveSocket.on('leave:request-cancelled', handleDataChange);
        const unsub3 = leaveSocket.on('leave:new-pending', handleDataChange);
        const unsub4 = leaveSocket.on('leave:pending-updated', handleDataChange);

        return () => {
            unsub1();
            unsub2();
            unsub3();
            unsub4();
        };
    }, [isManager]);

    const handleStartTimeChange = (newStartTime: string) => {
        setStartTime(newStartTime);
        const newEndOptions = getEndTimeOptions(newStartTime);
        if (!newEndOptions.includes(endTime)) {
            setEndTime(newEndOptions[0] || '10:00');
        }
    };

    const calculateDays = (): number => {
        if (!startDate) return 0;
        switch (durationType) {
            case 'full_day':
                if (!endDate) return 1;
                return differenceInDays(endDate, startDate) + 1;
            case 'half_day':
                return 0.5;
            case 'hours':
                const hours = calculateHoursBetween(startTime, endTime);
                return Number((hours / HOURS_PER_DAY).toFixed(2));
            default:
                return 0;
        }
    };

    const calculateHours = (): number => {
        if (durationType === 'hours') {
            return calculateHoursBetween(startTime, endTime);
        }
        return calculateDays() * HOURS_PER_DAY;
    };

    const resetForm = () => {
        setLeaveType('annual');
        setDurationType('full_day');
        setHalfDayPeriod('morning');
        setStartDate(undefined);
        setEndDate(undefined);
        setStartTime('09:00');
        setEndTime('10:00');
        setReason('');
        setUploadedFiles([]);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        const maxSize = 5 * 1024 * 1024;

        Array.from(files).forEach((file) => {
            if (!allowedTypes.includes(file.type)) {
                toast.error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, GIF) และ PDF');
                return;
            }
            if (file.size > maxSize) {
                toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
                return;
            }

            const newFile: UploadedFile = {
                id: crypto.randomUUID(),
                name: file.name,
                type: file.type,
                size: file.size,
                url: URL.createObjectURL(file),
            };
            setUploadedFiles((prev) => [...prev, newFile]);
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (fileId: string) => {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    };

    const selectedLeaveType = leaveTypes.find((t) => t.code === leaveType);
    const canSelectPastDate = selectedLeaveType?.allowPastDate ?? (leaveType === 'sick');
    const pastDateLimit = selectedLeaveType?.pastDateLimit ?? 7;

    const getMinDate = (): Date => {
        if (canSelectPastDate) {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - pastDateLimit);
            pastDate.setHours(0, 0, 0, 0);
            return pastDate;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    };

    const handleSubmit = async () => {
        if (!startDate || !reason) return;
        if (durationType === 'full_day' && !endDate) return;

        const selectedType = leaveTypes.find((t) => t.code === leaveType);
        if (!selectedType) return;

        const success = await createRequest({
            leaveType: selectedType.id,
            durationType,
            halfDayPeriod: durationType === 'half_day' ? halfDayPeriod : undefined,
            startDate: startDate.toISOString(),
            endDate: (durationType === 'full_day' ? endDate : startDate)?.toISOString() || startDate.toISOString(),
            startTime: durationType === 'hours' ? startTime : undefined,
            endTime: durationType === 'hours' ? endTime : undefined,
            reason,
            attachments: uploadedFiles.map((f) => f.url),
        });

        if (success) {
            toast.success('ส่งคำขอลาเรียบร้อยแล้ว');
            setIsRequestDialogOpen(false);
            resetForm();
        } else {
            toast.error(error || 'เกิดข้อผิดพลาดในการส่งคำขอลา');
        }
    };

    const handleApprove = async (request: any) => {
        const success = await approveRequest(request.id);
        if (success) {
            toast.success('อนุมัติคำขอลาเรียบร้อยแล้ว');
            setIsDetailDialogOpen(false);
            setSelectedRequest(null);
        } else {
            toast.error(error || 'เกิดข้อผิดพลาดในการอนุมัติ');
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !rejectReason.trim()) return;

        const success = await rejectRequest(selectedRequest.id, rejectReason);
        if (success) {
            toast.success('ไม่อนุมัติคำขอลาเรียบร้อยแล้ว');
            setIsRejectDialogOpen(false);
            setIsDetailDialogOpen(false);
            setSelectedRequest(null);
            setRejectReason('');
        } else {
            toast.error(error || 'เกิดข้อผิดพลาด');
        }
    };

    const handleCancel = async (requestId: string) => {
        const success = await cancelRequest(requestId);
        if (success) {
            toast.success('ยกเลิกคำขอลาเรียบร้อยแล้ว');
        } else {
            toast.error(error || 'เกิดข้อผิดพลาดในการยกเลิก');
        }
    };

    const openRejectDialog = (request: any) => {
        setSelectedRequest(request);
        setIsRejectDialogOpen(true);
    };

    const openDetailDialog = (request: any) => {
        setSelectedRequest(request);
        setIsDetailDialogOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">กำลังโหลด...</span>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">การลางาน</h1>
                    <p className="text-gray-500 mt-1">จัดการการลาและดูโควต้าวันลา</p>
                </div>
                <Button
                    className="bg-purple-600 hover:bg-purple-700 w-fit"
                    onClick={() => setIsRequestDialogOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    ยื่นใบลา
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 mt-6">
                <TabsList className="bg-gray-100 w-full h-auto flex-wrap sm:flex-nowrap justify-start overflow-x-auto scrollbar-hide flex-shrink-0">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-white flex-shrink-0">
                        <CalendarDays className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">ภาพรวม</span>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-white flex-shrink-0">
                        <History className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">ประวัติการลา</span>
                    </TabsTrigger>
                    <TabsTrigger value="holidays" className="data-[state=active]:bg-white flex-shrink-0">
                        <CalendarIcon className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">วันหยุดประจำปี</span>
                    </TabsTrigger>
                    {isManager && (
                        <TabsTrigger value="approval" className="data-[state=active]:bg-white flex-shrink-0">
                            <UserCheck className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">อนุมัติการลา</span>
                            {/* 🔥 ใช้ displayPendingCount แทน teamPendingRequests.length */}
                            {displayPendingCount > 0 && (
                                <Badge className="ml-1 sm:ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                                    {displayPendingCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="overview" className="flex-1 min-h-0 mt-6 data-[state=active]:flex data-[state=active]:flex-col">
                    <Card className="h-full flex flex-col">
                        <CardContent className="p-4 sm:p-6 flex-1 overflow-y-auto scrollbar-thin">
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4">
                                        <p className="text-purple-100 text-xs">วันหยุดคงเหลือทั้งหมด</p>
                                        {/* 🔥 ใช้ formatQuotaDisplay */}
                                        <p className="text-3xl font-bold">{formatQuotaDisplay(summary.totalRemaining)}</p>
                                    </div>
                                    <div className="bg-white border rounded-lg p-4">
                                        <p className="text-gray-500 text-xs">ใช้ไปแล้ว</p>
                                        {/* 🔥 ใช้ formatQuotaDisplay */}
                                        <p className="text-3xl font-bold text-gray-900">{formatQuotaDisplay(summary.totalUsed)}</p>
                                    </div>
                                    <div className="bg-white border rounded-lg p-4">
                                        <p className="text-gray-500 text-xs">รอพิจารณา</p>
                                        <p className="text-3xl font-bold text-yellow-600">{pendingRequests.length} <span className="text-base font-normal text-gray-400">รายการ</span></p>
                                    </div>
                                </div>

                                {/* Leave Quota Cards */}
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">โควต้าวันลาของคุณ</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {leaveQuotas.map((quota) => {
                                            const config = getLeaveTypeConfig(quota.type as LeaveTypeCode);
                                            const Icon = config.icon;
                                            const percentage = quota.total > 0 ? (quota.used / quota.total) * 100 : 0;

                                            return (
                                                <div key={quota.type} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn('p-2 rounded-lg', config.bgColor)}>
                                                                <Icon className={cn('h-4 w-4', config.color)} />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm text-gray-900">{quota.typeName || config.label}</p>
                                                                <p className="text-xs text-gray-500">ทั้งหมด {quota.total} วัน</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {/* 🔥 ใช้ formatQuotaDisplay */}
                                                            <p className="text-xl font-bold text-gray-900">{formatQuotaDisplay(quota.remaining)}</p>
                                                            <p className="text-xs text-gray-500">คงเหลือ</p>
                                                        </div>
                                                    </div>
                                                    <Progress value={percentage} className="h-1.5" />
                                                    <div className="flex justify-between mt-1.5 text-xs text-gray-500">
                                                        {/* 🔥 ใช้ formatQuotaDisplay */}
                                                        <span>ใช้ไป {formatQuotaDisplay(quota.used)}</span>
                                                        <span>{percentage.toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Two Column Layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Pending Requests */}
                                    <div className="border rounded-lg">
                                        <div className="p-4 border-b flex items-center justify-between">
                                            <div className="flex items-center gap-2 font-semibold">
                                                <Clock className="h-5 w-5 text-yellow-600" />
                                                ใบลารอพิจารณา
                                            </div>
                                            {pendingRequests.length > 0 && (
                                                <Badge variant="secondary">{pendingRequests.length} รายการ</Badge>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            {pendingRequests.length > 0 ? (
                                                <div className="space-y-3">
                                                    {pendingRequests.map((request) => {
                                                        const typeConfig = getLeaveTypeConfig(request.type as LeaveTypeCode);
                                                        const durationConfig = getDurationTypeConfig(request.durationType as LeaveDurationType, request.halfDayPeriod as HalfDayPeriod);
                                                        const TypeIcon = typeConfig.icon;

                                                        return (
                                                            <div
                                                                key={request.id}
                                                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                                            >
                                                                <div className={cn('p-2 rounded-lg', typeConfig.bgColor)}>
                                                                    <TypeIcon className={cn('h-4 w-4', typeConfig.color)} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium text-gray-900">{request.typeName || typeConfig.label}</p>
                                                                    <p className="text-sm text-gray-500 truncate">
                                                                        {format(request.startDate, 'd MMM', { locale: th })}
                                                                        {request.durationType !== 'full_day' && request.days < 1 && (
                                                                            <span className="text-xs ml-1">({durationConfig.shortLabel})</span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <Badge variant="secondary">{formatDaysDisplay(request.days, request.hours)}</Badge>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                                    <p>ไม่มีใบลารอพิจารณา</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Upcoming Holidays */}
                                    <div className="border rounded-lg">
                                        <div className="p-4 border-b flex items-center justify-between">
                                            <div className="flex items-center gap-2 font-semibold">
                                                <CalendarDays className="h-5 w-5 text-purple-600" />
                                                วันหยุดที่จะถึง
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-purple-600"
                                                onClick={() => setActiveTab('holidays')}
                                            >
                                                ดูทั้งหมด
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </div>
                                        <div className="p-4">
                                            <div className="space-y-3">
                                                {upcomingHolidays.length > 0 ? (
                                                    upcomingHolidays.map((holiday, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors"
                                                        >
                                                            <div className="w-12 h-12 rounded-lg bg-purple-100 flex flex-col items-center justify-center flex-shrink-0">
                                                                <span className="text-[10px] text-purple-600 font-medium uppercase">
                                                                    {format(holiday.date, 'MMM', { locale: th })}
                                                                </span>
                                                                <span className="text-lg font-bold text-purple-700 leading-none">
                                                                    {format(holiday.date, 'd')}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-gray-900 truncate">{holiday.name}</p>
                                                                <p className="text-sm text-gray-500">
                                                                    {format(holiday.date, 'EEEE', { locale: th })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 text-gray-500">
                                                        <CalendarDays className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                                        <p>ไม่มีวันหยุดที่จะถึง</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="flex-1 min-h-0 mt-6 data-[state=active]:flex data-[state=active]:flex-col">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="flex-shrink-0">
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5 text-purple-600" />
                                ประวัติการลา
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto scrollbar-thin">
                            <div className="overflow-x-auto scrollbar-thin">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ประเภท</TableHead>
                                            <TableHead>วันที่/เวลา</TableHead>
                                            <TableHead className="text-center">จำนวน</TableHead>
                                            <TableHead>เหตุผล</TableHead>
                                            <TableHead>สถานะ</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leaveRequests.length > 0 ? (
                                            leaveRequests.map((request) => {
                                                const typeConfig = getLeaveTypeConfig(request.type as LeaveTypeCode);
                                                const statusConfig = getStatusConfig(request.status as LeaveStatus);
                                                const TypeIcon = typeConfig.icon;
                                                const StatusIcon = statusConfig.icon;

                                                return (
                                                    <TableRow key={request.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn('p-1.5 rounded', typeConfig.bgColor)}>
                                                                    <TypeIcon className={cn('h-3.5 w-3.5', typeConfig.color)} />
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-sm">{request.typeName || typeConfig.label}</span>
                                                                    {request.attachments && request.attachments.length > 0 && (
                                                                        <span className="ml-1 text-xs text-gray-400">📎</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="text-sm">
                                                                <p>{format(request.startDate, 'd MMM yy', { locale: th })}</p>
                                                                {request.durationType === 'full_day' && request.days > 1 && (
                                                                    <p className="text-gray-500 text-xs">
                                                                        ถึง {format(request.endDate, 'd MMM yy', { locale: th })}
                                                                    </p>
                                                                )}
                                                                {request.durationType === 'hours' && request.startTime && request.endTime && (
                                                                    <p className="text-gray-500 text-xs">
                                                                        {request.startTime} - {request.endTime}
                                                                    </p>
                                                                )}
                                                                {request.durationType === 'half_day' && request.halfDayPeriod && (
                                                                    <p className="text-gray-500 text-xs">
                                                                        {request.halfDayPeriod === 'morning' ? 'ครึ่งวันเช้า' : 'ครึ่งวันบ่าย'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="secondary">
                                                                {formatDaysDisplay(request.days, request.hours)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="max-w-[180px]">
                                                            <p className="truncate text-sm" title={request.reason}>
                                                                {request.reason}
                                                            </p>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={cn('gap-1', statusConfig.bgColor, statusConfig.color)}>
                                                                <StatusIcon className="h-3 w-3" />
                                                                {statusConfig.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {request.status === 'pending' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-600 hover:text-red-700"
                                                                    onClick={() => handleCancel(request.id)}
                                                                    disabled={isSubmitting}
                                                                >
                                                                    ยกเลิก
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                                    ยังไม่มีประวัติการลา
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="holidays" className="flex-1 min-h-0 mt-6 data-[state=active]:flex data-[state=active]:flex-col">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="flex-shrink-0">
                            <CardTitle className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-purple-600" />
                                วันหยุดประจำปี {new Date().getFullYear() + 543}
                                <Badge variant="secondary" className="ml-2">
                                    {publicHolidays.length} วัน
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto scrollbar-thin">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {publicHolidays.map((holiday, index) => {
                                    const isPast = holiday.date < new Date();
                                    const isToday = format(holiday.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                                    return (
                                        <div
                                            key={index}
                                            className={cn(
                                                'flex items-center gap-4 p-4 border rounded-xl transition-all',
                                                isPast && 'opacity-50 bg-gray-50',
                                                isToday && 'ring-2 ring-purple-500 bg-purple-50',
                                                !isPast && !isToday && 'hover:bg-purple-50 hover:border-purple-200'
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0',
                                                    isPast ? 'bg-gray-200' : 'bg-purple-100'
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'text-[10px] font-medium uppercase',
                                                        isPast ? 'text-gray-500' : 'text-purple-600'
                                                    )}
                                                >
                                                    {format(holiday.date, 'MMM', { locale: th })}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'text-xl font-bold leading-none',
                                                        isPast ? 'text-gray-600' : 'text-purple-700'
                                                    )}
                                                >
                                                    {format(holiday.date, 'd')}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{holiday.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {format(holiday.date, 'EEEE', { locale: th })}
                                                </p>
                                            </div>
                                            {isPast && (
                                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                                    ผ่านไปแล้ว
                                                </Badge>
                                            )}
                                            {isToday && (
                                                <Badge className="bg-purple-600 text-xs flex-shrink-0">
                                                    วันนี้
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {isManager && (
                    <TabsContent value="approval" className="flex-1 min-h-0 mt-6 data-[state=active]:flex data-[state=active]:flex-col">
                        <Card className="h-full flex flex-col">
                            <CardHeader className="pb-3 flex-shrink-0">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <UserCheck className="h-5 w-5 text-purple-600" />
                                    รายการลารอพิจารณา
                                    {teamPendingRequests.length > 0 && (
                                        <Badge className="bg-yellow-100 text-yellow-700 ml-2">
                                            {teamPendingRequests.length} รายการ
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto scrollbar-thin">
                                {teamPendingRequests.length > 0 ? (
                                    <div className="space-y-3">
                                        {teamPendingRequests.map((request) => {
                                            const typeConfig = getLeaveTypeConfig(request.type as LeaveTypeCode);
                                            const durationConfig = getDurationTypeConfig(request.durationType as LeaveDurationType, request.halfDayPeriod as HalfDayPeriod);
                                            const TypeIcon = typeConfig.icon;

                                            return (
                                                <div
                                                    key={request.id}
                                                    className="p-3 lg:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    {/* Mobile/Tablet Layout */}
                                                    <div className="lg:hidden">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                                    <User className="h-5 w-5 text-purple-600" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <p className="font-medium text-gray-900">{request.employee.name}</p>
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            {formatDaysDisplay(request.days, request.hours)}
                                                                        </Badge>
                                                                        {request.attachments && request.attachments.length > 0 && (
                                                                            <Badge variant="outline" className="gap-1 text-xs">
                                                                                <FileText className="h-3 w-3" />
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 mt-0.5">{request.employee.position}</p>
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        {format(request.startDate, 'd MMM', { locale: th })}
                                                                        {request.durationType === 'full_day' && request.days > 1 && (
                                                                            <span> - {format(request.endDate, 'd MMM', { locale: th })}</span>
                                                                        )}
                                                                        {request.durationType === 'half_day' && (
                                                                            <span className="ml-1">({durationConfig.shortLabel})</span>
                                                                        )}
                                                                        {request.durationType === 'hours' && request.startTime && request.endTime && (
                                                                            <span className="ml-1">({request.startTime}-{request.endTime})</span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <div className={cn('p-1.5 rounded', typeConfig.bgColor)}>
                                                                    <TypeIcon className={cn('h-3.5 w-3.5', typeConfig.color)} />
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-700">{request.typeName || typeConfig.label}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex-1"
                                                                onClick={() => openDetailDialog(request)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => openRejectDialog(request)}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                                                onClick={() => handleApprove(request)}
                                                                disabled={isApproving}
                                                            >
                                                                {isApproving ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Desktop Layout */}
                                                    <div className="hidden lg:flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                            <User className="h-5 w-5 text-purple-600" />
                                                        </div>
                                                        <div className="w-[140px]">
                                                            <p className="font-medium text-gray-900">{request.employee.name}</p>
                                                            <p className="text-xs text-gray-500">{request.employee.position}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 w-[120px]">
                                                            <div className={cn('p-1.5 rounded', typeConfig.bgColor)}>
                                                                <TypeIcon className={cn('h-3.5 w-3.5', typeConfig.color)} />
                                                            </div>
                                                            <span className="text-sm">{request.typeName || typeConfig.label}</span>
                                                        </div>
                                                        <div className="w-[120px] text-sm text-gray-600">
                                                            {format(request.startDate, 'd MMM', { locale: th })}
                                                            {request.durationType === 'full_day' && request.days > 1 && (
                                                                <span> - {format(request.endDate, 'd MMM', { locale: th })}</span>
                                                            )}
                                                        </div>
                                                        <Badge variant="secondary" className="w-[70px] justify-center">
                                                            {formatDaysDisplay(request.days, request.hours)}
                                                        </Badge>
                                                        <div className="w-[90px]">
                                                            {request.attachments && request.attachments.length > 0 ? (
                                                                <Badge variant="outline" className="gap-1">
                                                                    <FileText className="h-3 w-3" />
                                                                    แนบไฟล์
                                                                </Badge>
                                                            ) : (
                                                                <span></span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-auto">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openDetailDialog(request)}
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                ดูรายละเอียด
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => openRejectDialog(request)}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-1" />
                                                                ไม่อนุมัติ
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700"
                                                                onClick={() => handleApprove(request)}
                                                                disabled={isApproving}
                                                            >
                                                                {isApproving ? (
                                                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                ) : (
                                                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                                                )}
                                                                อนุมัติ
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-200" />
                                        <p className="text-lg font-medium text-gray-900">ไม่มีรายการรอพิจารณา</p>
                                        <p className="text-sm text-gray-500 mt-1">รายการลาทั้งหมดได้รับการพิจารณาแล้ว</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>

            <Dialog
                open={isRequestDialogOpen}
                onOpenChange={(open) => {
                    setIsRequestDialogOpen(open);
                    if (!open) resetForm();
                }}
            >
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto scrollbar-thin">
                    <DialogHeader>
                        <DialogTitle>ยื่นใบลา</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Leave Type */}
                        <div className="space-y-2">
                            <Label>ประเภทการลา *</Label>
                            <Select value={leaveType} onValueChange={(value: LeaveTypeCode) => setLeaveType(value)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="เลือกประเภทการลา" />
                                </SelectTrigger>
                                <SelectContent>
                                    {leaveQuotas.map((quota) => {
                                        const config = getLeaveTypeConfig(quota.type as LeaveTypeCode);
                                        const Icon = config.icon;
                                        return (
                                            <SelectItem key={quota.type} value={quota.type}>
                                                <div className="flex items-center gap-2">
                                                    <Icon className={cn('h-4 w-4', config.color)} />
                                                    <span>{quota.typeName || config.label}</span>
                                                    <span className="text-gray-400 text-xs ml-auto">
                                                        {/* 🔥 ใช้ formatQuotaDisplay */}
                                                        (เหลือ {formatQuotaDisplay(quota.remaining)})
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sick leave notice */}
                        {leaveType === 'sick' && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                                <p className="font-medium">📌 หมายเหตุ:</p>
                                <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                                    <li>สามารถลาป่วยย้อนหลังได้ไม่เกิน 7 วัน</li>
                                    <li>กรุณาแนบใบรับรองแพทย์ (ถ้ามี)</li>
                                </ul>
                            </div>
                        )}

                        {/* Duration Type */}
                        <div className="space-y-2">
                            <Label>รูปแบบการลา *</Label>
                            <div className="flex gap-2">
                                {(['full_day', 'half_day', 'hours'] as LeaveDurationType[]).map((type) => {
                                    const config = getDurationTypeConfig(type);
                                    const Icon = config.icon;
                                    const isSelected = durationType === type;
                                    return (
                                        <Button
                                            key={type}
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                                'flex-1 gap-2',
                                                isSelected && 'border-purple-500 bg-purple-50 text-purple-700'
                                            )}
                                            onClick={() => setDurationType(type)}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {config.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Date Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{durationType === 'full_day' ? 'วันที่เริ่มต้น *' : 'วันที่ลา *'}</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !startDate && 'text-muted-foreground'
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(startDate, 'd MMM yy', { locale: th }) : 'เลือกวันที่'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={(date) => {
                                                setStartDate(date);
                                                if (durationType === 'full_day' && date && (!endDate || date > endDate)) {
                                                    setEndDate(date);
                                                }
                                            }}
                                            disabled={(date) => {
                                                const minDate = getMinDate();
                                                return date < minDate;
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {durationType === 'full_day' && (
                                <div className="space-y-2">
                                    <Label>วันที่สิ้นสุด *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    'w-full justify-start text-left font-normal',
                                                    !endDate && 'text-muted-foreground'
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {endDate ? format(endDate, 'd MMM yy', { locale: th }) : 'เลือกวันที่'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={endDate}
                                                onSelect={setEndDate}
                                                disabled={(date) => {
                                                    if (!startDate) {
                                                        const minDate = getMinDate();
                                                        return date < minDate;
                                                    }
                                                    return date < startDate;
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}

                            {durationType === 'half_day' && (
                                <div className="space-y-2">
                                    <Label>ช่วงเวลา *</Label>
                                    <div className="flex gap-2">
                                        {(['morning', 'afternoon'] as HalfDayPeriod[]).map((period) => {
                                            const config = getHalfDayPeriodConfig(period);
                                            const Icon = config.icon;
                                            const isSelected = halfDayPeriod === period;
                                            return (
                                                <Button
                                                    key={period}
                                                    type="button"
                                                    variant="outline"
                                                    className={cn(
                                                        'flex-1 gap-2',
                                                        isSelected && 'border-purple-500 bg-purple-50 text-purple-700'
                                                    )}
                                                    onClick={() => setHalfDayPeriod(period)}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    {config.label}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {durationType === 'hours' && (
                                <div className="space-y-2">
                                    <Label>ช่วงเวลา *</Label>
                                    <div className="flex items-center gap-2">
                                        <Select value={startTime} onValueChange={handleStartTimeChange}>
                                            <SelectTrigger className="flex-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {START_TIME_OPTIONS.map((time) => (
                                                    <SelectItem key={time} value={time}>
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <span className="text-gray-500">-</span>
                                        <Select value={endTime} onValueChange={setEndTime}>
                                            <SelectTrigger className="flex-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getEndTimeOptions(startTime).map((time) => (
                                                    <SelectItem key={time} value={time}>
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Days/Hours Summary */}
                        {startDate && (durationType !== 'full_day' || endDate) && (
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-purple-700">สรุปการลา</span>
                                    <div className="flex items-center gap-2">
                                        {durationType === 'hours' && (
                                            <Badge variant="secondary">{calculateHours()} ชั่วโมง</Badge>
                                        )}
                                        <Badge className="bg-purple-600">{calculateDays()} วัน</Badge>
                                    </div>
                                </div>
                                {durationType === 'hours' && (
                                    <p className="text-xs text-purple-600 mt-1">
                                        * คิดจาก 1 วัน = 8 ชั่วโมงทำงาน (หักพักเที่ยง 12:00-13:00)
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Reason */}
                        <div className="space-y-2">
                            <Label>เหตุผลการลา *</Label>
                            <Textarea
                                placeholder="กรุณาระบุเหตุผล..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* File Upload - Only for sick leave */}
                        {leaveType === 'sick' && (
                            <div className="space-y-2">
                                <Label>ใบรับรองแพทย์ (ถ้ามี)</Label>
                                <div
                                    className={cn(
                                        'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                                        'hover:border-purple-400 hover:bg-purple-50'
                                    )}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*,.pdf"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600">คลิกเพื่ออัปโหลดไฟล์</p>
                                    <p className="text-xs text-gray-400 mt-1">รองรับ JPG, PNG, GIF, PDF (ไม่เกิน 5MB)</p>
                                </div>

                                {uploadedFiles.length > 0 && (
                                    <div className="space-y-2 mt-3">
                                        {uploadedFiles.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                                            >
                                                {file.type.startsWith('image/') ? (
                                                    <ImageIcon className="h-5 w-5 text-blue-500" />
                                                ) : (
                                                    <File className="h-5 w-5 text-red-500" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {(file.size / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                                                    onClick={() => removeFile(file.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)} disabled={isSubmitting}>
                            ยกเลิก
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={handleSubmit}
                            disabled={
                                isSubmitting ||
                                !startDate ||
                                !reason ||
                                (durationType === 'full_day' && !endDate) ||
                                (durationType === 'hours' && calculateHours() <= 0)
                            }
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            ยื่นใบลา
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>รายละเอียดใบลา</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                    <User className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{selectedRequest.employee.name}</p>
                                    <p className="text-sm text-gray-500">{selectedRequest.employee.position}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-gray-500">ประเภทการลา</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        {(() => {
                                            const config = getLeaveTypeConfig(selectedRequest.type);
                                            const Icon = config.icon;
                                            return (
                                                <>
                                                    <div className={cn('p-1.5 rounded', config.bgColor)}>
                                                        <Icon className={cn('h-4 w-4', config.color)} />
                                                    </div>
                                                    <span className="font-medium">{selectedRequest.typeName || config.label}</span>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">จำนวนวัน</Label>
                                    <p className="font-medium mt-1">{formatDaysDisplay(selectedRequest.days, selectedRequest.hours)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-gray-500">วันที่เริ่มต้น</Label>
                                    <p className="font-medium mt-1">{format(selectedRequest.startDate, 'd MMMM yyyy', { locale: th })}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">วันที่สิ้นสุด</Label>
                                    <p className="font-medium mt-1">{format(selectedRequest.endDate, 'd MMMM yyyy', { locale: th })}</p>
                                </div>
                            </div>

                            {selectedRequest.durationType === 'half_day' && selectedRequest.halfDayPeriod && (
                                <div>
                                    <Label className="text-xs text-gray-500">ช่วงเวลา</Label>
                                    <p className="font-medium mt-1">
                                        {selectedRequest.halfDayPeriod === 'morning' ? 'ครึ่งวันเช้า' : 'ครึ่งวันบ่าย'}
                                    </p>
                                </div>
                            )}

                            {selectedRequest.durationType === 'hours' && selectedRequest.startTime && selectedRequest.endTime && (
                                <div>
                                    <Label className="text-xs text-gray-500">ช่วงเวลา</Label>
                                    <p className="font-medium mt-1">{selectedRequest.startTime} - {selectedRequest.endTime}</p>
                                </div>
                            )}

                            <div>
                                <Label className="text-xs text-gray-500">เหตุผล</Label>
                                <p className="font-medium mt-1 p-3 bg-gray-50 rounded-lg">{selectedRequest.reason}</p>
                            </div>

                            {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                                <div>
                                    <Label className="text-xs text-gray-500">ไฟล์แนบ</Label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {selectedRequest.attachments.map((file: string, index: number) => (
                                            <Badge key={index} variant="outline" className="gap-1">
                                                <FileText className="h-3 w-3" />
                                                {file}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label className="text-xs text-gray-500">วันที่ยื่น</Label>
                                <p className="font-medium mt-1">{format(selectedRequest.createdAt, 'd MMMM yyyy', { locale: th })}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                            ปิด
                        </Button>
                        <Button
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                                setIsDetailDialogOpen(false);
                                if (selectedRequest) openRejectDialog(selectedRequest);
                            }}
                        >
                            <XCircle className="h-4 w-4 mr-1" />
                            ไม่อนุมัติ
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => selectedRequest && handleApprove(selectedRequest)}
                            disabled={isApproving}
                        >
                            {isApproving ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                            )}
                            อนุมัติ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isRejectDialogOpen} onOpenChange={(open) => {
                setIsRejectDialogOpen(open);
                if (!open) {
                    setRejectReason('');
                    setSelectedRequest(null);
                }
            }}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">ไม่อนุมัติการลา</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <User className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{selectedRequest.employee.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {getLeaveTypeConfig(selectedRequest.type).label} • {formatDaysDisplay(selectedRequest.days, selectedRequest.hours)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>เหตุผลที่ไม่อนุมัติ *</Label>
                                <Textarea
                                    placeholder="กรุณาระบุเหตุผล..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isApproving}>
                            ยกเลิก
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isApproving || !rejectReason.trim()}
                        >
                            {isApproving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            ยืนยันไม่อนุมัติ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}