import { useEffect, useState } from 'react';
import { usePatientsStore } from '@/stores/externalLeadsStore';
import type { Patient, PatientTransaction, Lead } from '@/types/externalLeads';
import {
    formatCurrency,
    formatDate,
    formatDateTime,
    TRANSACTION_STYLES,
    TRANSACTION_LABELS,
} from '../../../utils/patientHelpers';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Users,
    Pencil,
    Loader2,
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    RefreshCw,
    Calendar,
    Settings,
} from 'lucide-react'

interface PatientDetailDialogProps {
    open: boolean;
    patient: Patient | null;
    selectedClinicId: string;
    canManage: boolean;
    onClose: () => void;
    onEdit: (patient: Patient) => void;
}

function TransactionItem({ tx }: { tx: PatientTransaction }) {
    const icons = {
        deposit: <ArrowUpCircle className="h-8 w-8 text-green-500" />,
        use: <ArrowDownCircle className="h-8 w-8 text-red-500" />,
        refund: <RefreshCw className="h-8 w-8 text-yellow-500" />,
        adjust: <Settings className="h-8 w-8 text-blue-500" />,
    };

    const isNegative = tx.type === 'use' || (tx.type === 'adjust' && tx.amount < 0);

    return (
        <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {icons[tx.type]}
                <div>
                    <Badge className={TRANSACTION_STYLES[tx.type]}>
                        {TRANSACTION_LABELS[tx.type]}
                    </Badge>
                    {tx.description && (
                        <p className="text-sm text-gray-600 mt-0.5">{tx.description}</p>
                    )}
                    <p className="text-xs text-gray-400">{formatDateTime(tx.createdAt)}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-semibold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                    {isNegative ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                </p>
                <p className="text-xs text-gray-500">คงเหลือ: {formatCurrency(tx.balance)}</p>
            </div>
        </div>
    );
}

function AppointmentItem({ appt }: { appt: Lead }) {
    const statusStyles: Record<string, string> = {
        arrived: 'bg-green-100 text-green-700',
        scheduled: 'bg-blue-100 text-blue-700',
        cancelled: 'bg-gray-100 text-gray-700',
    };

    return (
        <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
                <Badge className={statusStyles[appt.appointments.status] || 'bg-yellow-100 text-yellow-700'}>
                    {appt.appointments.status}
                </Badge>
                <span className="text-sm text-gray-500">
                    {formatDate(appt.appointments.date)}
                </span>
            </div>
            {appt.interests && appt.interests.length > 0 && (
                <p className="text-sm text-gray-600">
                    {appt.interests.map((i) => i.name).join(', ')}
                </p>
            )}
            {appt.deposit && (
                <p className="text-sm text-green-600 mt-1">
                    มัดจำ: {formatCurrency(
                        typeof appt.deposit === 'number'
                            ? appt.deposit
                            : (appt.deposit as any).amount || 0
                    )}
                </p>
            )}
        </div>
    );
}

export default function PatientDetailDialog({
    open,
    patient,
    selectedClinicId,
    canManage,
    onClose,
    onEdit,
}: PatientDetailDialogProps) {
    // Store
    const transactions = usePatientsStore((s) => s.transactions);
    const appointments = usePatientsStore((s) => s.appointments);
    const fetchTransactions = usePatientsStore((s) => s.fetchTransactions);
    const fetchAppointments = usePatientsStore((s) => s.fetchAppointments);

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!open || !patient) return;

        const clinicId = patient.clinicId || parseInt(selectedClinicId);
        if (!clinicId) return;

        let cancelled = false;
        setIsLoading(true);

        Promise.all([
            fetchTransactions(patient._id, clinicId),
            fetchAppointments(patient._id, clinicId),
        ]).finally(() => {
            if (!cancelled) setIsLoading(false);
        });

        return () => { cancelled = true; };
    }, [open, patient?._id]);

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => { if (!v) onClose(); }}
        >
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        รายละเอียดคนไข้
                    </DialogTitle>
                    <DialogDescription>
                        ดูข้อมูลทั่วไป, ประวัติมัดจำ และนัดหมาย
                    </DialogDescription>
                </DialogHeader>

                {patient && (
                    <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
                        <TabsList className="w-full justify-start">
                            <TabsTrigger value="info">ข้อมูลทั่วไป</TabsTrigger>
                            <TabsTrigger value="transactions">ประวัติมัดจำ</TabsTrigger>
                            <TabsTrigger value="appointments">นัดหมาย</TabsTrigger>
                        </TabsList>

                        {/* Info Tab */}
                        <TabsContent value="info" className="flex-1 overflow-y-auto mt-4">
                            <div className="space-y-4">
                                <div className="bg-purple-50 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {patient.fullname}
                                        </h3>
                                        {patient.nickname && (
                                            <p className="text-gray-500">({patient.nickname})</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">ยอดเงินคงเหลือ</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency(patient.balance)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'เบอร์โทร', value: patient.tel },
                                        { label: 'Social Media', value: patient.socialMedia },
                                        { label: 'ความสนใจ', value: patient.interest },
                                        { label: 'ช่องทาง', value: patient.referralChannel },
                                        { label: 'สาขา', value: patient.branch },
                                        { label: 'สร้างเมื่อ', value: formatDate(patient.createdAt) },
                                    ].map((item) => (
                                        <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">{item.label}</p>
                                            <p className="font-medium">{item.value || '-'}</p>
                                        </div>
                                    ))}
                                </div>

                                {patient.note && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">หมายเหตุ</p>
                                        <p className="text-sm">{patient.note}</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Transactions Tab */}
                        <TabsContent value="transactions" className="flex-1 overflow-y-auto mt-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                                </div>
                            ) : !Array.isArray(transactions) || transactions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>ยังไม่มีประวัติมัดจำ</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {transactions.map((tx) => (
                                        <TransactionItem key={tx._id} tx={tx} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Appointments Tab */}
                        <TabsContent value="appointments" className="flex-1 overflow-y-auto mt-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                                </div>
                            ) : !Array.isArray(appointments) || appointments.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>ยังไม่มีประวัตินัดหมาย</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {appointments.map((appt) => (
                                        <AppointmentItem key={appt._id} appt={appt} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose}>
                        ปิด
                    </Button>
                    {canManage && patient && (
                        <Button
                            onClick={() => {
                                onClose();
                                onEdit(patient);
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            <Pencil className="h-4 w-4 mr-2" />
                            แก้ไข
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}