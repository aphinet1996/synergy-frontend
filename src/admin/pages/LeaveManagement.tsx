import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Settings,
    GitBranch,
    CalendarDays,
    Plus,
    Pencil,
    Trash2,
    Calendar as CalendarIcon,
    Check,
    X,
    Loader2,
    Upload,
    Eye,
    EyeOff,
    Umbrella,
    Stethoscope,
    Baby,
    Briefcase,
    FileText,
    Copy,
    AlertCircle,
    Calculator,
    SlidersHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useLeaveAdmin } from '@/admin/hooks/useLeave';
import type {
    // CreateApprovalFlowDTO,
    CreateHolidayDTO,
    CreateLeaveTypeDTO,
    LeaveTypeAdmin,
    Holiday,
    // ApprovalFlow,
} from '@/admin/services/leaveService';
import ApprovalFlowTab from '@/admin/components/ApprovalFlow';
import LeaveQuota from '@/admin/components/LeaveQuota';
import LeaveAdjustment from '@/admin/components/LeaveAdjustment';

// ==================== Helper Functions ====================
const getLeaveTypeIcon = (iconName: string) => {
    const icons: Record<string, React.ElementType> = {
        Umbrella,
        Stethoscope,
        Briefcase,
        Baby,
        FileText,
    };
    return icons[iconName] || FileText;
};

const colorToHex: Record<string, string> = {
    'text-blue-600': '#2563eb',
    'text-red-600': '#dc2626',
    'text-orange-600': '#ea580c',
    'text-pink-600': '#db2777',
    'text-yellow-600': '#ca8a04',
    'text-green-600': '#16a34a',
    'text-purple-600': '#9333ea',
    'text-gray-600': '#4b5563',
};

const hexToTextColor: Record<string, string> = {
    '#2563eb': 'text-blue-600',
    '#3B82F6': 'text-blue-600',
    '#dc2626': 'text-red-600',
    '#EF4444': 'text-red-600',
    '#ea580c': 'text-orange-600',
    '#F97316': 'text-orange-600',
    '#db2777': 'text-pink-600',
    '#EC4899': 'text-pink-600',
    '#ca8a04': 'text-yellow-600',
    '#EAB308': 'text-yellow-600',
    '#16a34a': 'text-green-600',
    '#22C55E': 'text-green-600',
    '#9333ea': 'text-purple-600',
    '#A855F7': 'text-purple-600',
    '#4b5563': 'text-gray-600',
    '#6B7280': 'text-gray-600',
};

const textColorToBgColor: Record<string, string> = {
    'text-blue-600': 'bg-blue-100',
    'text-red-600': 'bg-red-100',
    'text-orange-600': 'bg-orange-100',
    'text-pink-600': 'bg-pink-100',
    'text-yellow-600': 'bg-yellow-100',
    'text-green-600': 'bg-green-100',
    'text-purple-600': 'bg-purple-100',
    'text-gray-600': 'bg-gray-100',
};

// ==================== Component ====================
export default function LeaveManagement() {
    const {
        // Data
        holidays,
        holidayYears,
        leaveTypes,
        selectedYear,
        // Loading
        isLoading,
        isSubmitting,
        error,
        // Helper functions
        // getPositionName,
        // Actions
        setSelectedYear,
        createHoliday,
        updateHoliday,
        deleteHoliday,
        publishHolidays,
        copyHolidaysFromYear,
        createLeaveType,
        updateLeaveType,
        deleteLeaveType,
        clearError,
    } = useLeaveAdmin();

    const [activeTab, setActiveTab] = useState('leave-types');

    // ==================== Holiday State ====================
    const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
    const [holidayForm, setHolidayForm] = useState({
        date: undefined as Date | undefined,
        name: '',
        nameTh: '',
        type: 'national' as 'national' | 'religious' | 'special' | 'company',
    });
    const [isYearDialogOpen, setIsYearDialogOpen] = useState(false);
    const [newYear, setNewYear] = useState('');

    // ==================== Leave Type State ====================
    const [isLeaveTypeDialogOpen, setIsLeaveTypeDialogOpen] = useState(false);
    const [editingLeaveType, setEditingLeaveType] = useState<LeaveTypeAdmin | null>(null);
    const [leaveTypeForm, setLeaveTypeForm] = useState({
        code: '',
        name: '',
        description: '',
        icon: 'FileText',
        color: 'text-gray-600',
        defaultDays: '0',
        maxDaysPerRequest: '',
        requireApproval: true,
        allowHalfDay: false,
        allowHours: false,
        allowPastDate: false,
        pastDateLimit: '7',
        requireAttachment: false,
        attachmentAfterDays: '',
        // Conditions
        minServiceMonths: '',
        requireProbationPassed: false,
        employeeTypes: 'all' as 'permanent' | 'freelance' | 'all',
        advanceNoticeDays: '',
        maxUsagePerYear: '',
        allowCarryOver: false,
        carryOverMaxDays: '',
        carryOverExpiryMonths: '',
    });
    const [expandedLeaveType, setExpandedLeaveType] = useState<string | null>(null);

    // ==================== Check if year is published ====================
    const isYearPublished = holidays.length > 0 && holidays.every((h) => h.isPublished);

    // ==================== Holiday Handlers ====================
    const openHolidayDialog = (holiday?: Holiday) => {
        if (holiday) {
            setEditingHoliday(holiday);
            setHolidayForm({
                date: new Date(holiday.date),
                name: holiday.name,
                nameTh: holiday.nameTh,
                type: holiday.type,
            });
        } else {
            setEditingHoliday(null);
            setHolidayForm({ date: undefined, name: '', nameTh: '', type: 'national' });
        }
        setIsHolidayDialogOpen(true);
    };

    const handleSaveHoliday = async () => {
        if (!holidayForm.date || !holidayForm.nameTh) return;

        const dto: CreateHolidayDTO = {
            date: holidayForm.date.toISOString(),
            name: holidayForm.name || holidayForm.nameTh,
            nameTh: holidayForm.nameTh,
            type: holidayForm.type,
        };

        let success = false;
        if (editingHoliday) {
            success = await updateHoliday(editingHoliday.id, dto);
        } else {
            success = await createHoliday(dto);
        }

        if (success) {
            setIsHolidayDialogOpen(false);
        }
    };

    const handleDeleteHoliday = async (holidayId: string) => {
        if (confirm('ต้องการลบวันหยุดนี้หรือไม่?')) {
            await deleteHoliday(holidayId);
        }
    };

    const handlePublishYear = async () => {
        await publishHolidays(selectedYear, !isYearPublished);
    };

    const handleCopyFromPreviousYear = async () => {
        if (confirm(`คัดลอกวันหยุดจากปี ${selectedYear - 1} มาปี ${selectedYear}?`)) {
            await copyHolidaysFromYear(selectedYear - 1, selectedYear);
        }
    };

    const handleAddYear = () => {
        const yearNum = parseInt(newYear);
        if (isNaN(yearNum)) return;

        setSelectedYear(yearNum);
        setIsYearDialogOpen(false);
        setNewYear('');
    };

    // ==================== Leave Type Handlers ====================
    const openLeaveTypeDialog = (leaveType?: LeaveTypeAdmin) => {
        if (leaveType) {
            setEditingLeaveType(leaveType);
            const textColor = hexToTextColor[leaveType.color] || 'text-gray-600';
            setLeaveTypeForm({
                code: leaveType.code,
                name: leaveType.name,
                description: leaveType.description || '',
                icon: leaveType.icon || 'FileText',
                color: textColor,
                defaultDays: leaveType.defaultDays?.toString() || '0',
                maxDaysPerRequest: leaveType.maxDaysPerRequest?.toString() || '',
                requireApproval: leaveType.requireApproval ?? true,
                allowHalfDay: leaveType.allowHalfDay ?? false,
                allowHours: leaveType.allowHours ?? false,
                allowPastDate: leaveType.allowPastDate ?? false,
                pastDateLimit: leaveType.pastDateLimit?.toString() || '7',
                requireAttachment: leaveType.requireAttachment ?? false,
                attachmentAfterDays: leaveType.attachmentAfterDays?.toString() || '',
                // Conditions
                minServiceMonths: leaveType.minServiceMonths?.toString() || '',
                requireProbationPassed: leaveType.requireProbationPassed ?? false,
                employeeTypes: leaveType.employeeTypes?.includes('freelance')
                    ? 'freelance'
                    : leaveType.employeeTypes?.includes('permanent')
                        ? 'permanent'
                        : 'all',
                advanceNoticeDays: leaveType.advanceNoticeDays?.toString() || '',
                maxUsagePerYear: leaveType.maxUsagePerYear?.toString() || '',
                allowCarryOver: leaveType.allowCarryOver ?? false,
                carryOverMaxDays: leaveType.carryOverMaxDays?.toString() || '',
                carryOverExpiryMonths: leaveType.carryOverExpiryMonths?.toString() || '',
            });
        } else {
            setEditingLeaveType(null);
            setLeaveTypeForm({
                code: '',
                name: '',
                description: '',
                icon: 'FileText',
                color: 'text-gray-600',
                defaultDays: '0',
                maxDaysPerRequest: '',
                requireApproval: true,
                allowHalfDay: false,
                allowHours: false,
                allowPastDate: false,
                pastDateLimit: '7',
                requireAttachment: false,
                attachmentAfterDays: '',
                minServiceMonths: '',
                requireProbationPassed: false,
                employeeTypes: 'all',
                advanceNoticeDays: '',
                maxUsagePerYear: '',
                allowCarryOver: false,
                carryOverMaxDays: '',
                carryOverExpiryMonths: '',
            });
        }
        setIsLeaveTypeDialogOpen(true);
    };

    const handleSaveLeaveType = async () => {
        if (!leaveTypeForm.code || !leaveTypeForm.name) return;

        const dto: CreateLeaveTypeDTO = {
            code: leaveTypeForm.code,
            name: leaveTypeForm.name,
            description: leaveTypeForm.description || undefined,
            color: colorToHex[leaveTypeForm.color] || '#4b5563',
            icon: leaveTypeForm.icon,
            defaultDays: parseInt(leaveTypeForm.defaultDays) || 0,
            maxDaysPerRequest: leaveTypeForm.maxDaysPerRequest
                ? parseInt(leaveTypeForm.maxDaysPerRequest)
                : undefined,
            requireApproval: leaveTypeForm.requireApproval,
            allowHalfDay: leaveTypeForm.allowHalfDay,
            allowHours: leaveTypeForm.allowHours,
            allowPastDate: leaveTypeForm.allowPastDate,
            pastDateLimit: leaveTypeForm.allowPastDate
                ? parseInt(leaveTypeForm.pastDateLimit) || 7
                : undefined,
            requireAttachment: leaveTypeForm.requireAttachment,
            attachmentAfterDays: leaveTypeForm.attachmentAfterDays
                ? parseInt(leaveTypeForm.attachmentAfterDays)
                : undefined,
            // Conditions
            minServiceMonths: leaveTypeForm.minServiceMonths
                ? parseInt(leaveTypeForm.minServiceMonths)
                : undefined,
            requireProbationPassed: leaveTypeForm.requireProbationPassed,
            employeeTypes:
                leaveTypeForm.employeeTypes === 'all'
                    ? undefined
                    : [leaveTypeForm.employeeTypes],
            advanceNoticeDays: leaveTypeForm.advanceNoticeDays
                ? parseInt(leaveTypeForm.advanceNoticeDays)
                : undefined,
            maxUsagePerYear: leaveTypeForm.maxUsagePerYear
                ? parseInt(leaveTypeForm.maxUsagePerYear)
                : undefined,
            allowCarryOver: leaveTypeForm.allowCarryOver,
            carryOverMaxDays: leaveTypeForm.allowCarryOver && leaveTypeForm.carryOverMaxDays
                ? parseInt(leaveTypeForm.carryOverMaxDays)
                : undefined,
            carryOverExpiryMonths:
                leaveTypeForm.allowCarryOver && leaveTypeForm.carryOverExpiryMonths
                    ? parseInt(leaveTypeForm.carryOverExpiryMonths)
                    : undefined,
        };

        let success = false;
        if (editingLeaveType) {
            success = await updateLeaveType(editingLeaveType.id, dto);
        } else {
            success = await createLeaveType(dto);
        }

        if (success) {
            setIsLeaveTypeDialogOpen(false);
        }
    };

    const handleToggleLeaveType = async (leaveType: LeaveTypeAdmin) => {
        await updateLeaveType(leaveType.id, { isActive: !leaveType.isActive });
    };

    const handleDeleteLeaveType = async (id: string) => {
        if (confirm('ต้องการลบประเภทการลานี้หรือไม่?')) {
            await deleteLeaveType(id);
        }
    };

    // ==================== Render ====================
    if (isLoading && leaveTypes.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            {/* Error Alert */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700">{error}</span>
                    <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">ตั้งค่าการลา</h1>
                    <p className="text-gray-500 mt-1">
                        จัดการ Flow การอนุมัติ, วันหยุดประจำปี และสิทธิ์การลา
                    </p>
                </div>
                {activeTab === 'holidays' && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCopyFromPreviousYear}
                            disabled={isSubmitting}
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            คัดลอกจากปีก่อน
                        </Button>
                        <Button
                            onClick={() => openHolidayDialog()}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            เพิ่มวันหยุด
                        </Button>
                    </div>
                )}
                {activeTab === 'leave-types' && (
                    <Button
                        onClick={() => openLeaveTypeDialog()}
                        className="bg-purple-600 hover:bg-purple-700 w-fit"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        เพิ่มประเภทการลา
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col mt-6">
                <TabsList className="flex w-full justify-start gap-1 overflow-x-auto bg-muted p-1 rounded-lg">
                    <TabsTrigger value="leave-types" className="flex items-center gap-2 px-3">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden md:inline">ประเภทการลา</span>
                    </TabsTrigger>
                    <TabsTrigger value="holidays" className="flex items-center gap-2 px-3">
                        <CalendarDays className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden md:inline">วันหยุด</span>
                    </TabsTrigger>
                    <TabsTrigger value="approval-flow" className="flex items-center gap-2 px-3">
                        <GitBranch className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden md:inline">Flow อนุมัติ</span>
                    </TabsTrigger>
                    <TabsTrigger value="quotas" className="flex items-center gap-2 px-3">
                        <Calculator className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden md:inline">โควต้า</span>
                    </TabsTrigger>
                    <TabsTrigger value="adjustments" className="flex items-center gap-2 px-3">
                        <SlidersHorizontal className="h-4 w-4 flex-shrink-0" />
                        <span className="hidden md:inline">ปรับยอด</span>
                    </TabsTrigger>
                </TabsList>

                {/* ==================== Leave Types Tab ==================== */}
                <TabsContent value="leave-types" className="flex-1 overflow-auto mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-purple-600" />
                                ประเภทการลา ({leaveTypes.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead>รหัส</TableHead>
                                        <TableHead>ชื่อ</TableHead>
                                        <TableHead className="text-center">วันเริ่มต้น</TableHead>
                                        <TableHead className="text-center">ต้องอนุมัติ</TableHead>
                                        <TableHead className="text-center">แนบเอกสาร</TableHead>
                                        <TableHead className="text-center">สถานะ</TableHead>
                                        <TableHead className="text-right">จัดการ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaveTypes.map((lt) => {
                                        const IconComponent = getLeaveTypeIcon(lt.icon || 'FileText');
                                        const textColor = hexToTextColor[lt.color] || 'text-gray-600';
                                        const bgColor = textColorToBgColor[textColor] || 'bg-gray-100';
                                        const isExpanded = expandedLeaveType === lt.id;

                                        return (
                                            <>
                                                <TableRow
                                                    key={lt.id}
                                                    className="cursor-pointer hover:bg-gray-50"
                                                    onClick={() =>
                                                        setExpandedLeaveType(isExpanded ? null : lt.id)
                                                    }
                                                >
                                                    <TableCell>
                                                        <div className={cn('p-2 rounded-lg w-fit', bgColor)}>
                                                            <IconComponent className={cn('h-4 w-4', textColor)} />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono">{lt.code}</TableCell>
                                                    <TableCell className="font-medium">{lt.name}</TableCell>
                                                    <TableCell className="text-center">{lt.defaultDays} วัน</TableCell>
                                                    <TableCell className="text-center">
                                                        {lt.requireApproval ? (
                                                            <Check className="h-4 w-4 text-green-600 mx-auto" />
                                                        ) : (
                                                            <X className="h-4 w-4 text-gray-400 mx-auto" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {lt.requireAttachment ? (
                                                            <Check className="h-4 w-4 text-green-600 mx-auto" />
                                                        ) : (
                                                            <X className="h-4 w-4 text-gray-400 mx-auto" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge
                                                            variant={lt.isActive ? 'default' : 'secondary'}
                                                            className={
                                                                lt.isActive
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : ''
                                                            }
                                                        >
                                                            {lt.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div
                                                            className="flex justify-end gap-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleToggleLeaveType(lt)}
                                                                disabled={isSubmitting}
                                                            >
                                                                {lt.isActive ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openLeaveTypeDialog(lt)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700"
                                                                onClick={() => handleDeleteLeaveType(lt.id)}
                                                                disabled={isSubmitting}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {isExpanded && (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="bg-gray-50 p-4">
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                                <div>
                                                                    <p className="text-gray-500">ลาครึ่งวัน</p>
                                                                    <p className="font-medium">
                                                                        {lt.allowHalfDay ? 'อนุญาต' : 'ไม่อนุญาต'}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-500">ลาเป็นชั่วโมง</p>
                                                                    <p className="font-medium">
                                                                        {lt.allowHours ? 'อนุญาต' : 'ไม่อนุญาต'}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-500">ลาย้อนหลัง</p>
                                                                    <p className="font-medium">
                                                                        {lt.allowPastDate
                                                                            ? `อนุญาต (${lt.pastDateLimit || 7} วัน)`
                                                                            : 'ไม่อนุญาต'}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-500">ยกยอด</p>
                                                                    <p className="font-medium">
                                                                        {lt.allowCarryOver
                                                                            ? `อนุญาต${lt.carryOverMaxDays
                                                                                ? ` (สูงสุด ${lt.carryOverMaxDays} วัน)`
                                                                                : ''
                                                                            }`
                                                                            : 'ไม่อนุญาต'}
                                                                    </p>
                                                                </div>
                                                                {lt.minServiceMonths && (
                                                                    <div>
                                                                        <p className="text-gray-500">อายุงานขั้นต่ำ</p>
                                                                        <p className="font-medium">
                                                                            {lt.minServiceMonths} เดือน
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {lt.advanceNoticeDays && (
                                                                    <div>
                                                                        <p className="text-gray-500">แจ้งล่วงหน้า</p>
                                                                        <p className="font-medium">
                                                                            {lt.advanceNoticeDays} วัน
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ==================== Holidays Tab ==================== */}
                <TabsContent value="holidays" className="flex-1 overflow-auto mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-purple-600" />
                                    วันหยุดประจำปี พ.ศ. {selectedYear + 543}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={selectedYear.toString()}
                                        onValueChange={(v) => setSelectedYear(parseInt(v))}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {holidayYears.map((year) => (
                                                <SelectItem key={year} value={year.toString()}>
                                                    {year + 543}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsYearDialogOpen(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={isYearPublished ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={handlePublishYear}
                                        disabled={isSubmitting}
                                        className={
                                            isYearPublished ? 'bg-green-600 hover:bg-green-700' : ''
                                        }
                                    >
                                        {isYearPublished ? (
                                            <>
                                                <Check className="h-4 w-4 mr-1" /> เผยแพร่แล้ว
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4 mr-1" /> เผยแพร่
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {holidays.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    ยังไม่มีวันหยุดในปีนี้
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>วันที่</TableHead>
                                            <TableHead>ชื่อวันหยุด</TableHead>
                                            <TableHead>ประเภท</TableHead>
                                            <TableHead className="text-right">จัดการ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {holidays.map((holiday) => (
                                            <TableRow key={holiday.id}>
                                                <TableCell>
                                                    {format(new Date(holiday.date), 'EEEE d MMMM', {
                                                        locale: th,
                                                    })}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {holiday.nameTh || holiday.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {holiday.type === 'national'
                                                            ? 'วันหยุดราชการ'
                                                            : holiday.type === 'religious'
                                                                ? 'วันหยุดทางศาสนา'
                                                                : holiday.type === 'company'
                                                                    ? 'วันหยุดบริษัท'
                                                                    : 'วันหยุดพิเศษ'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openHolidayDialog(holiday)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() => handleDeleteHoliday(holiday.id)}
                                                            disabled={isSubmitting}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="approval-flow">
                    <ApprovalFlowTab />
                </TabsContent>

                <TabsContent value="quotas">
                    <LeaveQuota />
                </TabsContent>

                <TabsContent value="adjustments">
                    <LeaveAdjustment />
                </TabsContent>

            </Tabs>

            {/* ==================== Dialogs ==================== */}

            {/* Holiday Dialog */}
            <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingHoliday ? 'แก้ไขวันหยุด' : 'เพิ่มวันหยุด'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>วันที่ *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !holidayForm.date && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {holidayForm.date
                                            ? format(holidayForm.date, 'PPP', { locale: th })
                                            : 'เลือกวันที่'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={holidayForm.date}
                                        onSelect={(date) =>
                                            setHolidayForm((p) => ({ ...p, date }))
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>ชื่อวันหยุด (ไทย) *</Label>
                            <Input
                                value={holidayForm.nameTh}
                                onChange={(e) =>
                                    setHolidayForm((p) => ({ ...p, nameTh: e.target.value }))
                                }
                                placeholder="เช่น วันขึ้นปีใหม่"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ชื่อวันหยุด (อังกฤษ)</Label>
                            <Input
                                value={holidayForm.name}
                                onChange={(e) =>
                                    setHolidayForm((p) => ({ ...p, name: e.target.value }))
                                }
                                placeholder="e.g. New Year's Day"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ประเภท</Label>
                            <Select
                                value={holidayForm.type}
                                onValueChange={(v: any) =>
                                    setHolidayForm((p) => ({ ...p, type: v }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="national">วันหยุดราชการ</SelectItem>
                                    <SelectItem value="religious">วันหยุดทางศาสนา</SelectItem>
                                    <SelectItem value="special">วันหยุดพิเศษ</SelectItem>
                                    <SelectItem value="company">วันหยุดบริษัท</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsHolidayDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={handleSaveHoliday}
                            disabled={isSubmitting || !holidayForm.date || !holidayForm.nameTh}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            บันทึก
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Year Dialog */}
            <Dialog open={isYearDialogOpen} onOpenChange={setIsYearDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>เพิ่มปี</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>ปี ค.ศ.</Label>
                            <Input
                                type="number"
                                value={newYear}
                                onChange={(e) => setNewYear(e.target.value)}
                                placeholder="เช่น 2026"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsYearDialogOpen(false)}>
                            ยกเลิก
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={handleAddYear}
                        >
                            เพิ่ม
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Leave Type Dialog */}
            <Dialog open={isLeaveTypeDialogOpen} onOpenChange={setIsLeaveTypeDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingLeaveType ? 'แก้ไขประเภทการลา' : 'เพิ่มประเภทการลา'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <p className="text-sm font-medium text-gray-700 border-b pb-2">
                                ข้อมูลพื้นฐาน
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>รหัส *</Label>
                                    <Input
                                        value={leaveTypeForm.code}
                                        onChange={(e) =>
                                            setLeaveTypeForm((p) => ({
                                                ...p,
                                                code: e.target.value.toLowerCase(),
                                            }))
                                        }
                                        placeholder="เช่น annual"
                                        disabled={!!editingLeaveType}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ชื่อ *</Label>
                                    <Input
                                        value={leaveTypeForm.name}
                                        onChange={(e) =>
                                            setLeaveTypeForm((p) => ({ ...p, name: e.target.value }))
                                        }
                                        placeholder="เช่น ลาพักร้อน"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>คำอธิบาย</Label>
                                <Textarea
                                    value={leaveTypeForm.description}
                                    onChange={(e) =>
                                        setLeaveTypeForm((p) => ({ ...p, description: e.target.value }))
                                    }
                                    placeholder="รายละเอียดเพิ่มเติม"
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>ไอคอน</Label>
                                    <Select
                                        value={leaveTypeForm.icon}
                                        onValueChange={(v) =>
                                            setLeaveTypeForm((p) => ({ ...p, icon: v }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Umbrella">🏖️ Umbrella</SelectItem>
                                            <SelectItem value="Stethoscope">🩺 Stethoscope</SelectItem>
                                            <SelectItem value="Briefcase">💼 Briefcase</SelectItem>
                                            <SelectItem value="Baby">👶 Baby</SelectItem>
                                            <SelectItem value="FileText">📄 FileText</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>สี</Label>
                                    <Select
                                        value={leaveTypeForm.color}
                                        onValueChange={(v) =>
                                            setLeaveTypeForm((p) => ({ ...p, color: v }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text-blue-600">🔵 น้ำเงิน</SelectItem>
                                            <SelectItem value="text-red-600">🔴 แดง</SelectItem>
                                            <SelectItem value="text-orange-600">🟠 ส้ม</SelectItem>
                                            <SelectItem value="text-pink-600">🩷 ชมพู</SelectItem>
                                            <SelectItem value="text-yellow-600">🟡 เหลือง</SelectItem>
                                            <SelectItem value="text-green-600">🟢 เขียว</SelectItem>
                                            <SelectItem value="text-purple-600">🟣 ม่วง</SelectItem>
                                            <SelectItem value="text-gray-600">⚪ เทา</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>จำนวนวันเริ่มต้น</Label>
                                    <Input
                                        type="number"
                                        value={leaveTypeForm.defaultDays}
                                        onChange={(e) =>
                                            setLeaveTypeForm((p) => ({ ...p, defaultDays: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>สูงสุดต่อครั้ง (วัน)</Label>
                                    <Input
                                        type="number"
                                        value={leaveTypeForm.maxDaysPerRequest}
                                        onChange={(e) =>
                                            setLeaveTypeForm((p) => ({
                                                ...p,
                                                maxDaysPerRequest: e.target.value,
                                            }))
                                        }
                                        placeholder="ไม่จำกัด"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={leaveTypeForm.requireApproval}
                                        onCheckedChange={(v) =>
                                            setLeaveTypeForm((p) => ({ ...p, requireApproval: v }))
                                        }
                                    />
                                    <Label>ต้องขออนุมัติ</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={leaveTypeForm.allowHalfDay}
                                        onCheckedChange={(v) =>
                                            setLeaveTypeForm((p) => ({ ...p, allowHalfDay: v }))
                                        }
                                    />
                                    <Label>ลาครึ่งวันได้</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={leaveTypeForm.allowHours}
                                        onCheckedChange={(v) =>
                                            setLeaveTypeForm((p) => ({ ...p, allowHours: v }))
                                        }
                                    />
                                    <Label>ลาเป็นชั่วโมงได้</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={leaveTypeForm.allowPastDate}
                                        onCheckedChange={(v) =>
                                            setLeaveTypeForm((p) => ({ ...p, allowPastDate: v }))
                                        }
                                    />
                                    <Label>ลาย้อนหลังได้</Label>
                                </div>
                                {leaveTypeForm.allowPastDate && (
                                    <div className="ml-6 space-y-2">
                                        <Label>จำกัด (วัน)</Label>
                                        <Input
                                            type="number"
                                            value={leaveTypeForm.pastDateLimit}
                                            onChange={(e) =>
                                                setLeaveTypeForm((p) => ({
                                                    ...p,
                                                    pastDateLimit: e.target.value,
                                                }))
                                            }
                                            className="w-24"
                                        />
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={leaveTypeForm.requireAttachment}
                                        onCheckedChange={(v) =>
                                            setLeaveTypeForm((p) => ({ ...p, requireAttachment: v }))
                                        }
                                    />
                                    <Label>ต้องแนบเอกสาร</Label>
                                </div>
                            </div>
                        </div>

                        {/* Conditions */}
                        <div className="space-y-4">
                            <p className="text-sm font-medium text-gray-700 border-b pb-2">
                                เงื่อนไขการใช้สิทธิ์
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>อายุงานขั้นต่ำ (เดือน)</Label>
                                    <Input
                                        type="number"
                                        value={leaveTypeForm.minServiceMonths}
                                        onChange={(e) =>
                                            setLeaveTypeForm((p) => ({
                                                ...p,
                                                minServiceMonths: e.target.value,
                                            }))
                                        }
                                        placeholder="ไม่กำหนด"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ประเภทพนักงาน</Label>
                                    <Select
                                        value={leaveTypeForm.employeeTypes}
                                        onValueChange={(v: any) =>
                                            setLeaveTypeForm((p) => ({ ...p, employeeTypes: v }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">ทุกประเภท</SelectItem>
                                            <SelectItem value="permanent">เฉพาะพนักงานประจำ</SelectItem>
                                            <SelectItem value="freelance">เฉพาะฟรีแลนซ์</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>แจ้งล่วงหน้า (วัน)</Label>
                                    <Input
                                        type="number"
                                        value={leaveTypeForm.advanceNoticeDays}
                                        onChange={(e) =>
                                            setLeaveTypeForm((p) => ({
                                                ...p,
                                                advanceNoticeDays: e.target.value,
                                            }))
                                        }
                                        placeholder="ไม่กำหนด"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ใช้ได้สูงสุด (ครั้ง/ปี)</Label>
                                    <Input
                                        type="number"
                                        value={leaveTypeForm.maxUsagePerYear}
                                        onChange={(e) =>
                                            setLeaveTypeForm((p) => ({
                                                ...p,
                                                maxUsagePerYear: e.target.value,
                                            }))
                                        }
                                        placeholder="ไม่จำกัด"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={leaveTypeForm.requireProbationPassed}
                                    onCheckedChange={(v) =>
                                        setLeaveTypeForm((p) => ({ ...p, requireProbationPassed: v }))
                                    }
                                />
                                <Label>ต้องผ่านทดลองงาน</Label>
                            </div>
                            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={leaveTypeForm.allowCarryOver}
                                        onCheckedChange={(v) =>
                                            setLeaveTypeForm((p) => ({
                                                ...p,
                                                allowCarryOver: v,
                                                carryOverMaxDays: v ? p.carryOverMaxDays : '',
                                                carryOverExpiryMonths: v ? p.carryOverExpiryMonths : '',
                                            }))
                                        }
                                    />
                                    <Label>ยกยอดไปปีหน้าได้</Label>
                                </div>
                                {leaveTypeForm.allowCarryOver && (
                                    <div className="ml-6 grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>สูงสุด (วัน)</Label>
                                            <Input
                                                type="number"
                                                value={leaveTypeForm.carryOverMaxDays}
                                                onChange={(e) =>
                                                    setLeaveTypeForm((p) => ({
                                                        ...p,
                                                        carryOverMaxDays: e.target.value,
                                                    }))
                                                }
                                                placeholder="ไม่จำกัด"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>หมดอายุ (เดือน)</Label>
                                            <Input
                                                type="number"
                                                value={leaveTypeForm.carryOverExpiryMonths}
                                                onChange={(e) =>
                                                    setLeaveTypeForm((p) => ({
                                                        ...p,
                                                        carryOverExpiryMonths: e.target.value,
                                                    }))
                                                }
                                                placeholder="ไม่หมดอายุ"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsLeaveTypeDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={handleSaveLeaveType}
                            disabled={isSubmitting || !leaveTypeForm.code || !leaveTypeForm.name}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            บันทึก
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}