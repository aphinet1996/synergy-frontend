import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
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
import { Switch } from '@/components/ui/switch';
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    AlertCircle,
    X,
    Copy,
    Settings2,
    Users,
    Calendar,
    Star,
    Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaveQuota } from '@/admin/hooks/useQuota';
import type { LeaveQuota, CreateLeaveQuotaDTO, UpdateLeaveQuotaDTO, QuotaItem, LeaveTypeBasic, Position } from '@/admin/services/quotaService';

// ==================== Types ====================
interface QuotaFormItem {
    leaveTypeId: string;
    days: string;
}

interface QuotaFormState {
    position: string;
    employeeType: string;
    isDefault: boolean;
    quotaItems: QuotaFormItem[];
}

const initialFormState: QuotaFormState = {
    position: '',
    employeeType: '',
    isDefault: false,
    quotaItems: [],
};

// ==================== Helper Functions ====================
const getLeaveTypeColor = (color?: string): string => {
    if (!color) return 'bg-gray-100 text-gray-600';

    // Handle hex colors
    const colorMap: Record<string, string> = {
        '#3B82F6': 'bg-blue-100 text-blue-600',
        '#EF4444': 'bg-red-100 text-red-600',
        '#F97316': 'bg-orange-100 text-orange-600',
        '#EC4899': 'bg-pink-100 text-pink-600',
        '#EAB308': 'bg-yellow-100 text-yellow-600',
        '#22C55E': 'bg-green-100 text-green-600',
        '#A855F7': 'bg-purple-100 text-purple-600',
        '#6B7280': 'bg-gray-100 text-gray-600',
    };

    return colorMap[color] || 'bg-gray-100 text-gray-600';
};

// ==================== Component ====================
export default function LeaveQuotaManagement() {
    const {
        quotas: rawQuotas,
        positions: rawPositions,
        leaveTypes: rawLeaveTypes,
        selectedYear,
        availableYears: rawAvailableYears,
        isLoading,
        isSubmitting,
        error,
        // getPositionName,
        getEmployeeTypeLabel,
        extractPositionId,
        extractPositionName,
        extractLeaveTypeId,
        // extractLeaveTypeInfo,
        createQuota,
        updateQuota,
        deleteQuota,
        copyQuotasToYear,
        setSelectedYear,
        clearError,
        // refetch,
    } = useLeaveQuota();

    // ==================== Safe Arrays ====================
    const quotas = Array.isArray(rawQuotas) ? rawQuotas : [];
    const positions = Array.isArray(rawPositions) ? rawPositions : [];
    const leaveTypes = Array.isArray(rawLeaveTypes) ? rawLeaveTypes : [];
    const availableYears: number[] = Array.isArray(rawAvailableYears) ? rawAvailableYears : [new Date().getFullYear()];

    // ==================== State ====================
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
    const [editingQuota, setEditingQuota] = useState<LeaveQuota | null>(null);
    const [form, setForm] = useState<QuotaFormState>(initialFormState);
    const [copyFromYear, setCopyFromYear] = useState<string>('');
    const [copyToYear, setCopyToYear] = useState<string>('');

    // ==================== Initialize form with leave types ====================
    useEffect(() => {
        if (leaveTypes.length > 0 && form.quotaItems.length === 0 && !editingQuota) {
            setForm((prev) => ({
                ...prev,
                quotaItems: leaveTypes.map((lt: LeaveTypeBasic) => ({
                    leaveTypeId: lt.id,
                    days: '0',
                })),
            }));
        }
    }, [leaveTypes, editingQuota]);

    // ==================== Handlers ====================
    const openCreateDialog = () => {
        setEditingQuota(null);
        setForm({
            position: '',
            employeeType: '',
            isDefault: false,
            quotaItems: leaveTypes.map((lt: LeaveTypeBasic) => ({
                leaveTypeId: lt.id,
                days: lt.code === 'annual' ? '6' : lt.code === 'sick' ? '30' : lt.code === 'personal' ? '3' : '0',
            })),
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (quota: LeaveQuota) => {
        setEditingQuota(quota);

        // Map existing quotas to form items
        const existingQuotas = Array.isArray(quota.quotas) ? quota.quotas : [];
        const quotaItems = leaveTypes.map((lt: LeaveTypeBasic) => {
            const existing = existingQuotas.find((q: QuotaItem) => extractLeaveTypeId(q) === lt.id);
            return {
                leaveTypeId: lt.id,
                days: existing ? existing.days.toString() : '0',
            };
        });

        setForm({
            position: extractPositionId(quota) || '',
            employeeType: quota.employeeType || '',
            isDefault: quota.isDefault,
            quotaItems,
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        // Build quotas array (only include items with days > 0)
        const safeQuotaItems = Array.isArray(form.quotaItems) ? form.quotaItems : [];
        const quotasData = safeQuotaItems
            .filter((item: QuotaFormItem) => parseInt(item.days || '0') > 0)
            .map((item: QuotaFormItem) => ({
                leaveType: item.leaveTypeId,
                days: parseInt(item.days || '0'),
            }));

        if (quotasData.length === 0) {
            return; // Must have at least one quota
        }

        const dto: CreateLeaveQuotaDTO = {
            year: selectedYear,
            position: form.position || undefined,
            employeeType: form.employeeType as any || undefined,
            quotas: quotasData,
            isDefault: form.isDefault,
        };

        let success = false;
        if (editingQuota) {
            const quotaId = editingQuota.id || editingQuota._id;
            if (!quotaId) {
                console.error('No quota ID found for update');
                return;
            }
            success = await updateQuota(quotaId, dto as UpdateLeaveQuotaDTO);
        } else {
            success = await createQuota(dto);
        }

        if (success) {
            setIsDialogOpen(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('ต้องการลบโควต้านี้หรือไม่?')) {
            await deleteQuota(id);
        }
    };

    const handleCopyYear = async () => {
        if (!copyFromYear || !copyToYear) return;

        const success = await copyQuotasToYear(parseInt(copyFromYear), parseInt(copyToYear));
        if (success) {
            setIsCopyDialogOpen(false);
            setCopyFromYear('');
            setCopyToYear('');
            // Switch to target year to see results
            setSelectedYear(parseInt(copyToYear));
        }
    };

    const updateQuotaItem = (leaveTypeId: string, days: string) => {
        setForm((prev) => ({
            ...prev,
            quotaItems: (prev.quotaItems || []).map((item: QuotaFormItem) =>
                item.leaveTypeId === leaveTypeId ? { ...item, days } : item
            ),
        }));
    };

    // ==================== Render ====================
    if (isLoading && quotas.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
            </div>
        );
    }

    // Guard: Wait for leaveTypes to load
    if (leaveTypes.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">กำลังโหลดประเภทการลา...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Error Alert */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700">{error}</span>
                    <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings2 className="h-6 w-6 text-purple-600" />
                        จัดการโควต้าวันลา
                    </h1>
                    <p className="text-gray-500 mt-1">
                        กำหนดจำนวนวันลาตามตำแหน่งและประเภทพนักงาน
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select
                        value={selectedYear.toString()}
                        onValueChange={(v) => setSelectedYear(parseInt(v))}
                    >
                        <SelectTrigger className="w-32">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {availableYears.map((year: number) => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year} ({year + 543})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        onClick={() => setIsCopyDialogOpen(true)}
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        คัดลอกจากปีอื่น
                    </Button>
                    <Button
                        onClick={openCreateDialog}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        เพิ่มโควต้า
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Settings2 className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">โควต้าทั้งหมด</p>
                                <p className="text-2xl font-bold">{quotas.length} รายการ</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">ตำแหน่งที่กำหนด</p>
                                <p className="text-2xl font-bold">
                                    {new Set(quotas.map((q: LeaveQuota) => extractPositionId(q) || 'all')).size} ตำแหน่ง
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Star className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">โควต้าเริ่มต้น</p>
                                <p className="text-2xl font-bold">
                                    {quotas.filter((q: LeaveQuota) => q.isDefault).length > 0 ? 'มี' : 'ไม่มี'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quotas Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-purple-600" />
                        รายการโควต้าปี {selectedYear} ({selectedYear + 543})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {quotas.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Settings2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">ยังไม่มีโควต้าในปีนี้</p>
                            <p className="text-sm mt-1">เพิ่มโควต้าใหม่หรือคัดลอกจากปีก่อน</p>
                            <div className="flex justify-center gap-2 mt-4">
                                <Button variant="outline" onClick={() => setIsCopyDialogOpen(true)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    คัดลอกจากปีอื่น
                                </Button>
                                <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    เพิ่มโควต้า
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-48">ตำแหน่ง</TableHead>
                                        <TableHead className="w-32">ประเภทพนักงาน</TableHead>
                                        {leaveTypes.map((lt: LeaveTypeBasic) => (
                                            <TableHead key={lt.id} className="text-center min-w-20">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span
                                                        className={cn(
                                                            'px-2 py-0.5 rounded text-xs font-medium',
                                                            getLeaveTypeColor(lt.color)
                                                        )}
                                                    >
                                                        {lt.name}
                                                    </span>
                                                </div>
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-center w-24">เริ่มต้น</TableHead>
                                        <TableHead className="text-right w-24">จัดการ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quotas.map((quota: LeaveQuota) => {
                                        const quotaId = quota.id || quota._id;
                                        return (
                                            <TableRow key={quotaId}>
                                                <TableCell className="font-medium">
                                                    {extractPositionName(quota)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {getEmployeeTypeLabel(quota.employeeType)}
                                                    </Badge>
                                                </TableCell>
                                                {leaveTypes.map((lt: LeaveTypeBasic) => {
                                                    const quotaItems = Array.isArray(quota.quotas) ? quota.quotas : [];
                                                    const quotaItem = quotaItems.find(
                                                        (q: QuotaItem) => extractLeaveTypeId(q) === lt.id
                                                    );
                                                    const days = quotaItem?.days || 0;
                                                    return (
                                                        <TableCell key={lt.id} className="text-center">
                                                            <span
                                                                className={cn(
                                                                    'font-medium',
                                                                    days > 0 ? 'text-gray-900' : 'text-gray-400'
                                                                )}
                                                            >
                                                                {days} วัน
                                                            </span>
                                                        </TableCell>
                                                    );
                                                })}
                                                <TableCell className="text-center">
                                                    {quota.isDefault ? (
                                                        <Badge className="bg-yellow-100 text-yellow-700">
                                                            <Star className="h-3 w-3 mr-1" />
                                                            เริ่มต้น
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(quota)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() => quotaId && handleDelete(quotaId)}
                                                            disabled={isSubmitting || !quotaId}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingQuota ? 'แก้ไขโควต้าวันลา' : 'เพิ่มโควต้าวันลา'}
                        </DialogTitle>
                        <DialogDescription>
                            กำหนดจำนวนวันลาสำหรับแต่ละประเภทการลา
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Position & Employee Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>ตำแหน่ง</Label>
                                <Select
                                    value={form.position || '_all'}
                                    onValueChange={(v) => setForm((prev) => ({ ...prev, position: v === '_all' ? '' : v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="ทุกตำแหน่ง" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_all">ทุกตำแหน่ง</SelectItem>
                                        {positions.map((pos: Position) => (
                                            <SelectItem key={pos.id} value={pos.id}>
                                                {pos.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500">
                                    เว้นว่างเพื่อใช้กับทุกตำแหน่ง
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>ประเภทพนักงาน</Label>
                                <Select
                                    value={form.employeeType || '_all'}
                                    onValueChange={(v) => setForm((prev) => ({ ...prev, employeeType: v === '_all' ? '' : v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="ทุกประเภท" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_all">ทุกประเภท</SelectItem>
                                        <SelectItem value="permanent">พนักงานประจำ</SelectItem>
                                        <SelectItem value="probation">ทดลองงาน</SelectItem>
                                        <SelectItem value="freelance">ฟรีแลนซ์</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Is Default */}
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                            <Switch
                                checked={form.isDefault}
                                onCheckedChange={(v) => setForm((prev) => ({ ...prev, isDefault: v }))}
                            />
                            <div>
                                <Label className="cursor-pointer">ตั้งเป็นโควต้าเริ่มต้น</Label>
                                <p className="text-xs text-gray-500">
                                    ใช้กับพนักงานที่ไม่มีโควต้าเฉพาะตำแหน่ง
                                </p>
                            </div>
                        </div>

                        {/* Leave Type Quotas */}
                        <div className="space-y-3">
                            <Label className="text-base font-medium">จำนวนวันลาแต่ละประเภท</Label>
                            {!form.quotaItems?.length ? (
                                <div className="text-center py-4 text-gray-500">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                    กำลังโหลดประเภทการลา...
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {(form.quotaItems || []).map((item: QuotaFormItem) => {
                                        const lt = leaveTypes.find((t: LeaveTypeBasic) => t.id === item.leaveTypeId);
                                        if (!lt) return null;

                                        return (
                                            <div
                                                key={item.leaveTypeId}
                                                className="flex items-center gap-3 p-3 border rounded-lg"
                                            >
                                                <div
                                                    className={cn(
                                                        'w-3 h-3 rounded-full',
                                                        lt.color ? '' : 'bg-gray-400'
                                                    )}
                                                    style={{ backgroundColor: lt.color }}
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{lt.name}</p>
                                                    <p className="text-xs text-gray-500">{lt.code}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={item.days}
                                                        onChange={(e) => updateQuotaItem(item.leaveTypeId, e.target.value)}
                                                        className="w-20 text-center"
                                                    />
                                                    <span className="text-sm text-gray-500">วัน</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={handleSave}
                            disabled={isSubmitting || !form.quotaItems?.length || (form.quotaItems || []).every((i: QuotaFormItem) => parseInt(i.days || '0') === 0)}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            บันทึก
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Copy Year Dialog */}
            <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>คัดลอกโควต้าจากปีอื่น</DialogTitle>
                        <DialogDescription>
                            คัดลอกการตั้งค่าโควต้าทั้งหมดจากปีหนึ่งไปอีกปี
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>จากปี</Label>
                            <Select value={copyFromYear} onValueChange={setCopyFromYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกปีต้นทาง" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map((year: number) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year} ({year + 543})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>ไปปี</Label>
                            <Select value={copyToYear} onValueChange={setCopyToYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกปีปลายทาง" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears
                                        .filter((y: number) => y.toString() !== copyFromYear)
                                        .map((year: number) => (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year} ({year + 543})
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800">
                                <AlertCircle className="h-4 w-4 inline mr-1" />
                                โควต้าที่มีอยู่แล้วในปีปลายทางจะไม่ถูกเขียนทับ
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsCopyDialogOpen(false);
                                setCopyFromYear('');
                                setCopyToYear('');
                            }}
                            disabled={isSubmitting}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={handleCopyYear}
                            disabled={isSubmitting || !copyFromYear || !copyToYear}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            คัดลอก
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}