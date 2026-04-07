import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Plus,
    Minus,
    ArrowRightLeft,
    Gift,
    Loader2,
    AlertCircle,
    X,
    Calendar,
    Users,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaveAdjustment } from '@/admin/hooks/useAdjustment';
import type { 
    CreateAdjustmentDTO, 
    TransferDTO, 
    BulkBonusDTO,
    AdjustmentType,
    UserBasic,
    LeaveTypeBasic,
    LeaveAdjustment,
    UserBalance,
} from '@/admin/services/adjustmentService';

// ==================== Types ====================
interface AdjustmentFormState {
    user: string;
    leaveType: string;
    adjustmentType: AdjustmentType;
    days: string;
    reason: string;
}

interface TransferFormState {
    fromUser: string;
    toUser: string;
    leaveType: string;
    days: string;
    reason: string;
}

interface BulkBonusFormState {
    selectedUsers: string[];
    leaveType: string;
    days: string;
    reason: string;
}

const initialAdjustmentForm: AdjustmentFormState = {
    user: '',
    leaveType: '',
    adjustmentType: 'add',
    days: '0',
    reason: '',
};

const initialTransferForm: TransferFormState = {
    fromUser: '',
    toUser: '',
    leaveType: '',
    days: '0',
    reason: '',
};

const initialBulkBonusForm: BulkBonusFormState = {
    selectedUsers: [],
    leaveType: '',
    days: '0',
    reason: '',
};

// ==================== Component ====================
export default function LeaveAdjustmentManagement() {
    const {
        adjustments: rawAdjustments,
        pendingApprovals: rawPendingApprovals,
        users: rawUsers,
        leaveTypes: rawLeaveTypes,
        userBalances: rawUserBalances,
        selectedYear,
        availableYears: rawAvailableYears,
        adjustmentsSummary,
        isLoading,
        isSubmitting,
        error,
        getUserName,
        getLeaveTypeName,
        getAdjustmentTypeLabel,
        getAdjustmentTypeColor,
        getStatusLabel,
        getStatusColor,
        createAdjustment,
        transferDays,
        bulkBonus,
        approveAdjustment,
        rejectAdjustment,
        setSelectedYear,
        clearError,
    } = useLeaveAdjustment();

    // ==================== Safe Arrays ====================
    const adjustments = Array.isArray(rawAdjustments) ? rawAdjustments : [];
    const pendingApprovals = Array.isArray(rawPendingApprovals) ? rawPendingApprovals : [];
    const users = Array.isArray(rawUsers) ? rawUsers : [];
    const leaveTypes = Array.isArray(rawLeaveTypes) ? rawLeaveTypes : [];
    const userBalances = Array.isArray(rawUserBalances) ? rawUserBalances : [];
    const availableYears: number[] = Array.isArray(rawAvailableYears) ? rawAvailableYears : [new Date().getFullYear()];

    // ==================== State ====================
    const [activeTab, setActiveTab] = useState('adjustments');
    const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
    const [isBulkBonusDialogOpen, setIsBulkBonusDialogOpen] = useState(false);
    const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentFormState>(initialAdjustmentForm);
    const [transferForm, setTransferForm] = useState<TransferFormState>(initialTransferForm);
    const [bulkBonusForm, setBulkBonusForm] = useState<BulkBonusFormState>(initialBulkBonusForm);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectAll, setSelectAll] = useState(false);

    // ==================== Handlers ====================
    const openAdjustmentDialog = (type: 'add' | 'deduct') => {
        setAdjustmentForm({
            ...initialAdjustmentForm,
            adjustmentType: type,
        });
        setIsAdjustmentDialogOpen(true);
    };

    const handleCreateAdjustment = async () => {
        const days = parseInt(adjustmentForm.days);
        if (!adjustmentForm.user || !adjustmentForm.leaveType || days <= 0 || !adjustmentForm.reason) {
            return;
        }

        const dto: CreateAdjustmentDTO = {
            user: adjustmentForm.user,
            year: selectedYear,
            leaveType: adjustmentForm.leaveType,
            adjustmentType: adjustmentForm.adjustmentType,
            days: adjustmentForm.adjustmentType === 'deduct' ? -days : days,
            reason: adjustmentForm.reason,
        };

        const success = await createAdjustment(dto);
        if (success) {
            setIsAdjustmentDialogOpen(false);
            setAdjustmentForm(initialAdjustmentForm);
        }
    };

    const handleTransfer = async () => {
        const days = parseInt(transferForm.days);
        if (!transferForm.fromUser || !transferForm.toUser || !transferForm.leaveType || days <= 0 || !transferForm.reason) {
            return;
        }

        if (transferForm.fromUser === transferForm.toUser) {
            return;
        }

        const dto: TransferDTO = {
            fromUser: transferForm.fromUser,
            toUser: transferForm.toUser,
            leaveType: transferForm.leaveType,
            days,
            year: selectedYear,
            reason: transferForm.reason,
        };

        const success = await transferDays(dto);
        if (success) {
            setIsTransferDialogOpen(false);
            setTransferForm(initialTransferForm);
        }
    };

    const handleBulkBonus = async () => {
        const days = parseInt(bulkBonusForm.days);
        if (bulkBonusForm.selectedUsers.length === 0 || !bulkBonusForm.leaveType || days <= 0 || !bulkBonusForm.reason) {
            return;
        }

        const dto: BulkBonusDTO = {
            userIds: bulkBonusForm.selectedUsers,
            leaveType: bulkBonusForm.leaveType,
            days,
            year: selectedYear,
            reason: bulkBonusForm.reason,
        };

        const result = await bulkBonus(dto);
        if (result.success) {
            setIsBulkBonusDialogOpen(false);
            setBulkBonusForm(initialBulkBonusForm);
            setSelectAll(false);
            alert(`เพิ่มโบนัสสำเร็จ ${result.count} คน`);
        }
    };

    const toggleUserSelection = (userId: string) => {
        setBulkBonusForm((prev) => ({
            ...prev,
            selectedUsers: prev.selectedUsers.includes(userId)
                ? prev.selectedUsers.filter((id) => id !== userId)
                : [...prev.selectedUsers, userId],
        }));
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setBulkBonusForm((prev) => ({ ...prev, selectedUsers: [] }));
        } else {
            setBulkBonusForm((prev) => ({
                ...prev,
                selectedUsers: filteredUsers.map((u: UserBasic) => u.id || u._id || ''),
            }));
        }
        setSelectAll(!selectAll);
    };

    // Filter users by search
    const filteredUsers = users.filter((u: UserBasic) => {
        const name = `${u.firstname} ${u.lastname}`.toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    // Filter adjustments by search
    const filteredAdjustments = adjustments.filter((adj: LeaveAdjustment) => {
        const userName = getUserName(adj.user).toLowerCase();
        return userName.includes(searchQuery.toLowerCase());
    });

    // ==================== Render ====================
    if (isLoading && adjustments.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">ปรับยอดวันลา</h1>
                    <p className="text-gray-500">เพิ่ม/ลด วันลา โอนวันลา และให้โบนัส</p>
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
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">การปรับทั้งหมด</p>
                                <p className="text-2xl font-bold">{adjustmentsSummary.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Plus className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">เพิ่ม/โบนัส</p>
                                <p className="text-2xl font-bold">{adjustmentsSummary.adds}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <Minus className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">หัก/หมดอายุ</p>
                                <p className="text-2xl font-bold">{adjustmentsSummary.deducts}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-cyan-100 rounded-lg">
                                <ArrowRightLeft className="h-6 w-6 text-cyan-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">โอนวันลา</p>
                                <p className="text-2xl font-bold">{adjustmentsSummary.transfers}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">รออนุมัติ</p>
                                <p className="text-2xl font-bold">{adjustmentsSummary.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => openAdjustmentDialog('add')}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มวันลา
                </Button>
                <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => openAdjustmentDialog('deduct')}
                >
                    <Minus className="h-4 w-4 mr-2" />
                    หักวันลา
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setIsTransferDialogOpen(true)}
                >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    โอนวันลา
                </Button>
                <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => setIsBulkBonusDialogOpen(true)}
                >
                    <Gift className="h-4 w-4 mr-2" />
                    โบนัสหลายคน
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="adjustments">ประวัติการปรับ</TabsTrigger>
                    <TabsTrigger value="balances">ยอดคงเหลือ</TabsTrigger>
                    {pendingApprovals.length > 0 && (
                        <TabsTrigger value="pending">
                            รออนุมัติ
                            <Badge className="ml-2 bg-yellow-500">{pendingApprovals.length}</Badge>
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* Adjustments History */}
                <TabsContent value="adjustments">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>ประวัติการปรับยอด</CardTitle>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="ค้นหาพนักงาน..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 w-64"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredAdjustments.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>ยังไม่มีประวัติการปรับยอด</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>วันที่</TableHead>
                                                <TableHead>พนักงาน</TableHead>
                                                <TableHead>ประเภทการลา</TableHead>
                                                <TableHead>ประเภทการปรับ</TableHead>
                                                <TableHead className="text-center">จำนวนวัน</TableHead>
                                                <TableHead>ยอดก่อน → หลัง</TableHead>
                                                <TableHead>เหตุผล</TableHead>
                                                <TableHead>ผู้ปรับ</TableHead>
                                                <TableHead>สถานะ</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAdjustments.map((adj: LeaveAdjustment) => (
                                                <TableRow key={adj.id || adj._id}>
                                                    <TableCell className="whitespace-nowrap">
                                                        {new Date(adj.adjustedAt).toLocaleDateString('th-TH')}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {getUserName(adj.user)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getLeaveTypeName(adj.leaveType)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={getAdjustmentTypeColor(adj.adjustmentType)}>
                                                            {getAdjustmentTypeLabel(adj.adjustmentType)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={cn(
                                                            'font-bold',
                                                            adj.days > 0 ? 'text-green-600' : 'text-red-600'
                                                        )}>
                                                            {adj.days > 0 ? '+' : ''}{adj.days}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-gray-500">
                                                            {adj.balanceBefore} → {adj.balanceAfter}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="max-w-48 truncate">
                                                        {adj.reason}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getUserName(adj.adjustedBy)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={getStatusColor(adj.status)}>
                                                            {getStatusLabel(adj.status)}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* User Balances */}
                <TabsContent value="balances">
                    <Card>
                        <CardHeader>
                            <CardTitle>ยอดวันลาคงเหลือ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {userBalances.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>ไม่มีข้อมูลยอดวันลา</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>พนักงาน</TableHead>
                                                {leaveTypes.map((lt: LeaveTypeBasic) => (
                                                    <TableHead key={lt.id || lt._id} className="text-center">
                                                        {lt.name}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userBalances.map((ub: UserBalance) => (
                                                <TableRow key={ub.id || ub._id}>
                                                    <TableCell className="font-medium">
                                                        {ub.firstname} {ub.lastname}
                                                    </TableCell>
                                                    {leaveTypes.map((lt: LeaveTypeBasic) => {
                                                        const balance = ub.balances?.find(
                                                            (b) => {
                                                                const bltId = typeof b.leaveType === 'object' 
                                                                    ? (b.leaveType.id || b.leaveType._id)
                                                                    : b.leaveType;
                                                                return bltId === lt.id || bltId === lt._id;
                                                            }
                                                        );
                                                        return (
                                                            <TableCell key={lt.id || lt._id} className="text-center">
                                                                {balance ? (
                                                                    <span className={cn(
                                                                        'font-medium',
                                                                        balance.remaining > 0 ? 'text-green-600' : 'text-gray-400'
                                                                    )}>
                                                                        {balance.remaining}/{balance.total}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-300">-</span>
                                                                )}
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pending Approvals */}
                <TabsContent value="pending">
                    <Card>
                        <CardHeader>
                            <CardTitle>รออนุมัติ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pendingApprovals.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>ไม่มีรายการรออนุมัติ</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingApprovals.map((adj: LeaveAdjustment) => (
                                        <div
                                            key={adj.id || adj._id}
                                            className="p-4 border rounded-lg flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="font-medium">{getUserName(adj.user)}</p>
                                                <p className="text-sm text-gray-500">
                                                    {getLeaveTypeName(adj.leaveType)} • {getAdjustmentTypeLabel(adj.adjustmentType)} • {adj.days > 0 ? '+' : ''}{adj.days} วัน
                                                </p>
                                                <p className="text-sm text-gray-400">{adj.reason}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => approveAdjustment(adj.id || adj._id || '')}
                                                    disabled={isSubmitting}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    อนุมัติ
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        const reason = prompt('เหตุผลที่ปฏิเสธ:');
                                                        if (reason) {
                                                            rejectAdjustment(adj.id || adj._id || '', reason);
                                                        }
                                                    }}
                                                    disabled={isSubmitting}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    ปฏิเสธ
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Adjustment Dialog */}
            <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {adjustmentForm.adjustmentType === 'add' ? 'เพิ่มวันลา' : 'หักวันลา'}
                        </DialogTitle>
                        <DialogDescription>
                            ปรับยอดวันลาให้พนักงาน
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>พนักงาน *</Label>
                            <Select
                                value={adjustmentForm.user}
                                onValueChange={(v) => setAdjustmentForm((prev) => ({ ...prev, user: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกพนักงาน" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((u: UserBasic) => (
                                        <SelectItem key={u.id || u._id} value={u.id || u._id || ''}>
                                            {u.firstname} {u.lastname}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>ประเภทการลา *</Label>
                            <Select
                                value={adjustmentForm.leaveType}
                                onValueChange={(v) => setAdjustmentForm((prev) => ({ ...prev, leaveType: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกประเภทการลา" />
                                </SelectTrigger>
                                <SelectContent>
                                    {leaveTypes.map((lt: LeaveTypeBasic) => (
                                        <SelectItem key={lt.id || lt._id} value={lt.id || lt._id || ''}>
                                            {lt.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>จำนวนวัน *</Label>
                            <Input
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={adjustmentForm.days}
                                onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, days: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>เหตุผล *</Label>
                            <Textarea
                                value={adjustmentForm.reason}
                                onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, reason: e.target.value }))}
                                placeholder="ระบุเหตุผลในการปรับยอด..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)} disabled={isSubmitting}>
                            ยกเลิก
                        </Button>
                        <Button
                            className={adjustmentForm.adjustmentType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                            onClick={handleCreateAdjustment}
                            disabled={isSubmitting || !adjustmentForm.user || !adjustmentForm.leaveType || parseInt(adjustmentForm.days) <= 0 || !adjustmentForm.reason}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {adjustmentForm.adjustmentType === 'add' ? 'เพิ่มวันลา' : 'หักวันลา'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transfer Dialog */}
            <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>โอนวันลา</DialogTitle>
                        <DialogDescription>
                            โอนวันลาระหว่างพนักงาน
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>จากพนักงาน *</Label>
                            <Select
                                value={transferForm.fromUser}
                                onValueChange={(v) => setTransferForm((prev) => ({ ...prev, fromUser: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกพนักงานต้นทาง" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((u: UserBasic) => (
                                        <SelectItem key={u.id || u._id} value={u.id || u._id || ''}>
                                            {u.firstname} {u.lastname}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>ไปยังพนักงาน *</Label>
                            <Select
                                value={transferForm.toUser}
                                onValueChange={(v) => setTransferForm((prev) => ({ ...prev, toUser: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกพนักงานปลายทาง" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users
                                        .filter((u: UserBasic) => (u.id || u._id) !== transferForm.fromUser)
                                        .map((u: UserBasic) => (
                                            <SelectItem key={u.id || u._id} value={u.id || u._id || ''}>
                                                {u.firstname} {u.lastname}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>ประเภทการลา *</Label>
                            <Select
                                value={transferForm.leaveType}
                                onValueChange={(v) => setTransferForm((prev) => ({ ...prev, leaveType: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกประเภทการลา" />
                                </SelectTrigger>
                                <SelectContent>
                                    {leaveTypes.map((lt: LeaveTypeBasic) => (
                                        <SelectItem key={lt.id || lt._id} value={lt.id || lt._id || ''}>
                                            {lt.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>จำนวนวัน *</Label>
                            <Input
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={transferForm.days}
                                onChange={(e) => setTransferForm((prev) => ({ ...prev, days: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>เหตุผล *</Label>
                            <Textarea
                                value={transferForm.reason}
                                onChange={(e) => setTransferForm((prev) => ({ ...prev, reason: e.target.value }))}
                                placeholder="ระบุเหตุผลในการโอน..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)} disabled={isSubmitting}>
                            ยกเลิก
                        </Button>
                        <Button
                            onClick={handleTransfer}
                            disabled={isSubmitting || !transferForm.fromUser || !transferForm.toUser || !transferForm.leaveType || parseInt(transferForm.days) <= 0 || !transferForm.reason || transferForm.fromUser === transferForm.toUser}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            โอนวันลา
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Bonus Dialog */}
            <Dialog open={isBulkBonusDialogOpen} onOpenChange={setIsBulkBonusDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>โบนัสวันลาหลายคน</DialogTitle>
                        <DialogDescription>
                            เพิ่มวันลาให้พนักงานหลายคนพร้อมกัน
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>ประเภทการลา *</Label>
                                <Select
                                    value={bulkBonusForm.leaveType}
                                    onValueChange={(v) => setBulkBonusForm((prev) => ({ ...prev, leaveType: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกประเภทการลา" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leaveTypes.map((lt: LeaveTypeBasic) => (
                                            <SelectItem key={lt.id || lt._id} value={lt.id || lt._id || ''}>
                                                {lt.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>จำนวนวัน *</Label>
                                <Input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={bulkBonusForm.days}
                                    onChange={(e) => setBulkBonusForm((prev) => ({ ...prev, days: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>เหตุผล *</Label>
                            <Textarea
                                value={bulkBonusForm.reason}
                                onChange={(e) => setBulkBonusForm((prev) => ({ ...prev, reason: e.target.value }))}
                                placeholder="ระบุเหตุผลในการให้โบนัส..."
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>เลือกพนักงาน ({bulkBonusForm.selectedUsers.length} คน)</Label>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selectAll}
                                        onCheckedChange={handleSelectAll}
                                    />
                                    <span className="text-sm">เลือกทั้งหมด</span>
                                </div>
                            </div>
                            <Input
                                placeholder="ค้นหาพนักงาน..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="mb-2"
                            />
                            <div className="border rounded-lg max-h-60 overflow-y-auto">
                                {filteredUsers.map((u: UserBasic) => (
                                    <div
                                        key={u.id || u._id}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                                        onClick={() => toggleUserSelection(u.id || u._id || '')}
                                    >
                                        <Checkbox
                                            checked={bulkBonusForm.selectedUsers.includes(u.id || u._id || '')}
                                        />
                                        <span>{u.firstname} {u.lastname}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkBonusDialogOpen(false)} disabled={isSubmitting}>
                            ยกเลิก
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={handleBulkBonus}
                            disabled={isSubmitting || bulkBonusForm.selectedUsers.length === 0 || !bulkBonusForm.leaveType || parseInt(bulkBonusForm.days) <= 0 || !bulkBonusForm.reason}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <Gift className="h-4 w-4 mr-2" />
                            เพิ่มโบนัส ({bulkBonusForm.selectedUsers.length} คน)
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}