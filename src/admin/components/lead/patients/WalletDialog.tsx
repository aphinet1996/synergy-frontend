import { useState } from 'react';
import { usePatientsStore } from '@/stores/externalLeadsStore';
import type { Patient } from '@/types/externalLeads';
import { formatCurrency } from '../../../utils/patientHelpers';
import type { WalletAction } from '../../../utils/patientHelpers';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    X,
    Loader2,
    CheckCircle2,
    ArrowUpCircle,
    ArrowDownCircle,
    RefreshCw,
    Settings,
    Banknote,
} from 'lucide-react';

const ACTION_CONFIG: Record<WalletAction, {
    icon: React.ReactNode;
    title: string;
    buttonClass: string;
}> = {
    deposit: {
        icon: <ArrowUpCircle className="h-5 w-5 text-green-600" />,
        title: 'เพิ่มมัดจำ',
        buttonClass: 'bg-green-600 hover:bg-green-700',
    },
    use: {
        icon: <ArrowDownCircle className="h-5 w-5 text-red-600" />,
        title: 'ใช้มัดจำ',
        buttonClass: 'bg-red-600 hover:bg-red-700',
    },
    refund: {
        icon: <RefreshCw className="h-5 w-5 text-yellow-600" />,
        title: 'คืนเงิน',
        buttonClass: 'bg-yellow-600 hover:bg-yellow-700',
    },
    adjust: {
        icon: <Settings className="h-5 w-5 text-blue-600" />,
        title: 'ปรับยอดเงิน',
        buttonClass: 'bg-blue-600 hover:bg-blue-700',
    },
};

interface WalletDialogProps {
    open: boolean;
    patient: Patient | null;
    action: WalletAction;
    selectedClinicId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function WalletDialog({
    open,
    patient,
    action,
    selectedClinicId,
    onClose,
    onSuccess,
}: WalletDialogProps) {
    const isSubmitting = usePatientsStore((s) => s.isSubmitting);
    const error = usePatientsStore((s) => s.error);
    const addDeposit = usePatientsStore((s) => s.addDeposit);
    const useDeposit = usePatientsStore((s) => s.useDeposit);
    const refundDeposit = usePatientsStore((s) => s.refundDeposit);
    const adjustBalance = usePatientsStore((s) => s.adjustBalance);

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [localError, setLocalError] = useState('');

    const config = ACTION_CONFIG[action];

    // Reset form when dialog opens/closes
    const handleOpenChange = (v: boolean) => {
        if (!v) {
            onClose();
            setAmount('');
            setDescription('');
            setLocalError('');
        }
    };

    const handleSubmit = async () => {
        if (!patient) return;

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setLocalError('กรุณากรอกจำนวนเงินที่ถูกต้อง');
            return;
        }

        if (action === 'adjust' && !description.trim()) {
            setLocalError('กรุณากรอกเหตุผลในการปรับยอด');
            return;
        }

        const clinicId = patient.clinicId || parseInt(selectedClinicId);
        if (!clinicId) {
            setLocalError('ไม่พบข้อมูล clinicId');
            return;
        }

        const baseDto = { clinic_id: clinicId, amount: parsedAmount, description: description || undefined };
        let success = false;

        switch (action) {
            case 'deposit':
                success = await addDeposit(patient._id, baseDto);
                break;
            case 'use':
                success = await useDeposit(patient._id, baseDto);
                break;
            case 'refund':
                success = await refundDeposit(patient._id, baseDto);
                break;
            case 'adjust':
                success = await adjustBalance(patient._id, {
                    clinic_id: clinicId,
                    amount: parsedAmount,
                    description: description,
                });
                break;
        }

        if (success) {
            handleOpenChange(false);
            onSuccess();
        } else {
            setLocalError(error || 'เกิดข้อผิดพลาด');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {config.icon}
                        {config.title}
                    </DialogTitle>
                    <DialogDescription>
                        {patient?.fullname} - ยอดปัจจุบัน: {formatCurrency(patient?.balance)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Amount */}
                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">
                            จำนวนเงิน (บาท) <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => { setAmount(e.target.value); setLocalError(''); }}
                                placeholder="0"
                                className="pl-10 pr-12"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                บาท
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">
                            รายละเอียด {action === 'adjust' && <span className="text-red-500">*</span>}
                        </Label>
                        <Textarea
                            value={description}
                            onChange={(e) => { setDescription(e.target.value); setLocalError(''); }}
                            placeholder={action === 'adjust' ? 'เหตุผลในการปรับยอด...' : 'รายละเอียด (ถ้ามี)...'}
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    {/* Error */}
                    {localError && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <X className="h-4 w-4" />
                            {localError}
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                        ยกเลิก
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className={config.buttonClass}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                กำลังดำเนินการ...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                ยืนยัน
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}