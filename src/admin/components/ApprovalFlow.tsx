import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    AlertCircle,
    X,
    GitBranch,
    ArrowRight,
    Star,
    Users,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApprovalFlow } from '@/admin/hooks/useApprovalFlow';
import type {
    ApprovalFlow,
    CreateApprovalFlowDTO,
} from '@/admin/services/approvalFlowService';

interface StepFormData {
    stepOrder: number;
    approverPosition: string;
    canSkip: boolean;
    autoApproveAfterDays: string;
}

interface FormState {
    name: string;
    description: string;
    requesterPosition: string;
    leaveTypes: string[];
    steps: StepFormData[];
    isDefault: boolean;
}

const initialFormState: FormState = {
    name: '',
    description: '',
    requesterPosition: '',
    leaveTypes: [],
    steps: [{ stepOrder: 1, approverPosition: '', canSkip: false, autoApproveAfterDays: '' }],
    isDefault: false,
};

export default function ApprovalFlowManagement() {
    const {
        flows: rawFlows,
        positions: rawPositions,
        leaveTypes: rawLeaveTypes,
        summary,
        isLoading,
        isSubmitting,
        error,
        getPositionName,
        getLeaveTypesNames,
        extractId,
        createFlow,
        updateFlow,
        deleteFlow,
        clearError,
    } = useApprovalFlow();

    const flows = Array.isArray(rawFlows) ? rawFlows : [];
    const positions = Array.isArray(rawPositions) ? rawPositions : [];
    const leaveTypes = Array.isArray(rawLeaveTypes) ? rawLeaveTypes : [];

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingFlow, setEditingFlow] = useState<ApprovalFlow | null>(null);
    const [deletingFlow, setDeletingFlow] = useState<ApprovalFlow | null>(null);
    const [form, setForm] = useState<FormState>(initialFormState);
    const [expandedFlowId, setExpandedFlowId] = useState<string | null>(null);

    const openCreateDialog = () => {
        setEditingFlow(null);
        setForm(initialFormState);
        setIsDialogOpen(true);
    };

    const openEditDialog = (flow: ApprovalFlow) => {
        setEditingFlow(flow);
        setForm({
            name: flow.name,
            description: flow.description || '',
            requesterPosition: extractId(flow.requesterPosition),
            leaveTypes: (flow.leaveTypes || []).map((lt) => extractId(lt)),
            steps: flow.steps.map((s) => ({
                stepOrder: s.stepOrder,
                approverPosition: extractId(s.approverPosition),
                canSkip: s.canSkip,
                autoApproveAfterDays: s.autoApproveAfterDays?.toString() || '',
            })),
            isDefault: flow.isDefault,
        });
        setIsDialogOpen(true);
    };

    const openDeleteDialog = (flow: ApprovalFlow) => {
        setDeletingFlow(flow);
        setIsDeleteDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.name || !form.requesterPosition || form.steps.length === 0) {
            return;
        }

        // Validate steps
        const invalidSteps = form.steps.filter((s) => !s.approverPosition);
        if (invalidSteps.length > 0) {
            return;
        }

        const dto: CreateApprovalFlowDTO = {
            name: form.name,
            description: form.description || undefined,
            requesterPosition: form.requesterPosition,
            leaveTypes: form.leaveTypes.length > 0 ? form.leaveTypes : undefined,
            steps: form.steps.map((s, index) => ({
                stepOrder: index + 1,
                approverPosition: s.approverPosition,
                canSkip: s.canSkip,
                autoApproveAfterDays: s.autoApproveAfterDays ? parseInt(s.autoApproveAfterDays) : null,
            })),
            isDefault: form.isDefault,
        };

        let success: boolean;
        if (editingFlow) {
            success = await updateFlow(editingFlow.id || editingFlow._id || '', dto);
        } else {
            success = await createFlow(dto);
        }

        if (success) {
            setIsDialogOpen(false);
            setForm(initialFormState);
            setEditingFlow(null);
        }
    };

    const handleDelete = async () => {
        if (!deletingFlow) return;

        const success = await deleteFlow(deletingFlow.id || deletingFlow._id || '');
        if (success) {
            setIsDeleteDialogOpen(false);
            setDeletingFlow(null);
        }
    };

    // Step management
    const addStep = () => {
        setForm((prev) => ({
            ...prev,
            steps: [
                ...prev.steps,
                {
                    stepOrder: prev.steps.length + 1,
                    approverPosition: '',
                    canSkip: false,
                    autoApproveAfterDays: '',
                },
            ],
        }));
    };

    const removeStep = (index: number) => {
        if (form.steps.length <= 1) return;
        setForm((prev) => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepOrder: i + 1 })),
        }));
    };

    const updateStep = (index: number, field: keyof StepFormData, value: any) => {
        setForm((prev) => ({
            ...prev,
            steps: prev.steps.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
        }));
    };

    const moveStep = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= form.steps.length) return;

        setForm((prev) => {
            const newSteps = [...prev.steps];
            [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
            return {
                ...prev,
                steps: newSteps.map((s, i) => ({ ...s, stepOrder: i + 1 })),
            };
        });
    };

    // Leave type toggle
    const toggleLeaveType = (leaveTypeId: string) => {
        setForm((prev) => ({
            ...prev,
            leaveTypes: prev.leaveTypes.includes(leaveTypeId)
                ? prev.leaveTypes.filter((id) => id !== leaveTypeId)
                : [...prev.leaveTypes, leaveTypeId],
        }));
    };

    // Toggle expand flow details
    const toggleExpand = (flowId: string) => {
        setExpandedFlowId((prev) => (prev === flowId ? null : flowId));
    };

    if (isLoading && flows.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
                    <h1 className="text-2xl font-bold text-gray-900">Flow การอนุมัติ</h1>
                    <p className="text-gray-500">กำหนดลำดับขั้นตอนการอนุมัติตามตำแหน่ง</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่ม Flow
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <GitBranch className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Flow ทั้งหมด</p>
                                <p className="text-2xl font-bold">{summary.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <GitBranch className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">ใช้งานอยู่</p>
                                <p className="text-2xl font-bold">{summary.active}</p>
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
                                <p className="text-sm text-gray-500">Flow เริ่มต้น</p>
                                <p className="text-2xl font-bold">{summary.defaults}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">ตำแหน่ง</p>
                                <p className="text-2xl font-bold">{summary.positions}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Flows Table */}
            <Card>
                <CardHeader>
                    <CardTitle>รายการ Flow อนุมัติ</CardTitle>
                </CardHeader>
                <CardContent>
                    {flows.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>ยังไม่มี Flow การอนุมัติ</p>
                            <Button onClick={openCreateDialog} variant="outline" className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                สร้าง Flow แรก
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {flows.map((flow) => {
                                const flowId = flow.id || flow._id || '';
                                const isExpanded = expandedFlowId === flowId;

                                return (
                                    <div key={flowId} className="border rounded-lg overflow-hidden">
                                        {/* Flow Header */}
                                        <div
                                            className="p-4 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                                            onClick={() => toggleExpand(flowId)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-5 w-5 text-gray-400" />
                                                    ) : (
                                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                                    )}
                                                    <span className="font-medium">{flow.name}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {flow.isDefault && (
                                                        <Badge className="bg-yellow-100 text-yellow-700">
                                                            <Star className="h-3 w-3 mr-1" />
                                                            เริ่มต้น
                                                        </Badge>
                                                    )}
                                                    <Badge className={flow.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                                        {flow.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditDialog(flow)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openDeleteDialog(flow)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Flow Details */}
                                        {isExpanded && (
                                            <div className="p-4 border-t space-y-4">
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">ตำแหน่งผู้ขอ:</span>
                                                        <span className="ml-2 font-medium">
                                                            {getPositionName(flow.requesterPosition, flow.requesterPositionName)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">ประเภทการลา:</span>
                                                        <span className="ml-2 font-medium">
                                                            {getLeaveTypesNames(flow.leaveTypes)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {flow.description && (
                                                    <div className="text-sm">
                                                        <span className="text-gray-500">คำอธิบาย:</span>
                                                        <span className="ml-2">{flow.description}</span>
                                                    </div>
                                                )}

                                                {/* Steps */}
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-2">ลำดับการอนุมัติ:</p>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {flow.steps
                                                            .sort((a, b) => a.stepOrder - b.stepOrder)
                                                            .map((step, idx) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                                                                        <span className="text-xs text-gray-500">ขั้น {step.stepOrder}</span>
                                                                        <p className="font-medium text-sm">
                                                                            {getPositionName(step.approverPosition, step.approverPositionName)}
                                                                        </p>
                                                                        {step.canSkip && (
                                                                            <span className="text-xs text-orange-600">ข้ามได้</span>
                                                                        )}
                                                                        {step.autoApproveAfterDays && (
                                                                            <span className="text-xs text-green-600">
                                                                                อัตโนมัติ {step.autoApproveAfterDays} วัน
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {idx < flow.steps.length - 1 && (
                                                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                                                    )}
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingFlow ? 'แก้ไข Flow อนุมัติ' : 'สร้าง Flow อนุมัติ'}
                        </DialogTitle>
                        <DialogDescription>
                            กำหนดลำดับขั้นตอนการอนุมัติสำหรับตำแหน่งที่เลือก
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label>ชื่อ Flow *</Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="เช่น Flow อนุมัติสำหรับพนักงานทั่วไป"
                                />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label>คำอธิบาย</Label>
                                <Textarea
                                    value={form.description}
                                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="อธิบายรายละเอียดของ Flow นี้..."
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>ตำแหน่งผู้ขอ *</Label>
                                <Select
                                    value={form.requesterPosition}
                                    onValueChange={(v) => setForm((prev) => ({ ...prev, requesterPosition: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกตำแหน่ง" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {positions.map((p) => (
                                            <SelectItem key={p.id || p._id} value={p.id || p._id || ''}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2 pt-8">
                                <Switch
                                    checked={form.isDefault}
                                    onCheckedChange={(v) => setForm((prev) => ({ ...prev, isDefault: v }))}
                                />
                                <Label>ตั้งเป็น Flow เริ่มต้น</Label>
                            </div>
                        </div>

                        {/* Leave Types */}
                        <div className="space-y-2">
                            <Label>ประเภทการลา (ว่าง = ทุกประเภท)</Label>
                            <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
                                {leaveTypes.map((lt) => (
                                    <div
                                        key={lt.id || lt._id}
                                        className={cn(
                                            'flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer border transition-colors',
                                            form.leaveTypes.includes(lt.id || lt._id || '')
                                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        )}
                                        onClick={() => toggleLeaveType(lt.id || lt._id || '')}
                                    >
                                        <Checkbox
                                            checked={form.leaveTypes.includes(lt.id || lt._id || '')}
                                            className="pointer-events-none"
                                        />
                                        <span className="text-sm">{lt.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Steps */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>ขั้นตอนการอนุมัติ *</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addStep}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    เพิ่มขั้น
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {form.steps.map((step, index) => (
                                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50">
                                        <div className="flex flex-col gap-1 pt-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => moveStep(index, 'up')}
                                                disabled={index === 0}
                                            >
                                                <ChevronUp className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => moveStep(index, 'down')}
                                                disabled={index === form.steps.length - 1}
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">ขั้นที่ {index + 1}</Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">ตำแหน่งผู้อนุมัติ *</Label>
                                                    <Select
                                                        value={step.approverPosition}
                                                        onValueChange={(v) => updateStep(index, 'approverPosition', v)}
                                                    >
                                                        <SelectTrigger className="h-9">
                                                            <SelectValue placeholder="เลือกตำแหน่ง" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {positions.map((p) => (
                                                                <SelectItem key={p.id || p._id} value={p.id || p._id || ''}>
                                                                    {p.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-1">
                                                    <Label className="text-xs">อนุมัติอัตโนมัติหลัง (วัน)</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={step.autoApproveAfterDays}
                                                        onChange={(e) => updateStep(index, 'autoApproveAfterDays', e.target.value)}
                                                        placeholder="ว่าง = ไม่มี"
                                                        className="h-9"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={step.canSkip}
                                                    onCheckedChange={(v) => updateStep(index, 'canSkip', v)}
                                                />
                                                <Label className="text-sm font-normal">ข้ามได้ถ้าไม่มีคนในตำแหน่งนี้</Label>
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => removeStep(index)}
                                            disabled={form.steps.length <= 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                            ยกเลิก
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !form.name || !form.requesterPosition || form.steps.some((s) => !s.approverPosition)}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingFlow ? 'บันทึก' : 'สร้าง'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการลบ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณต้องการลบ Flow "{deletingFlow?.name}" หรือไม่?
                            การกระทำนี้ไม่สามารถย้อนกลับได้
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            ลบ
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}