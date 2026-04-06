import { useState, useEffect, useCallback } from 'react';
import { useLeadsStore } from '@/stores/externalLeadsStore';
import { optionsApi, leadsApi } from '@/services/externalLeadsService';
import type { Lead, LeadListParams, ClinicOption, UpdateLeadDTO } from '@/types/externalLeads';
import {
    formatCurrency,
    formatShortDate,
    resolveFileUrl,
    THAI_MONTHS,
    THAI_MONTHS_SHORT,
    getMonthRange,
    getCurrentYearMonth,
    getYearOptions,
} from '../../utils/leadHelpers';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
    Percent,
    Loader2,
    Save,
    X,
    Building2,
    Image as ImageIcon,
} from 'lucide-react';

// ==================== Constants ====================

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: 'เงินสด',
    transfer: 'โอนเงิน',
    card: 'บัตรเครดิต',
    free: 'ฟรี',
};

interface FlatRow {
    type: 'procedure' | 'deposit';
    leadId: string;
    clinicId: number;
    patientName: string;
    patientNickname?: string;
    patientVisits: number;
    date: string;
    name: string;
    amount: number;
    procServiceCharge: number;
    procNetAmount: number;
    paymentMethod?: string;
    serviceChargeAmount: number;
    netAmount: number;
    depositUsed: number;
    depositBalance: number;
    receiptUrl?: string;
    receiptUrls?: string[];
    commissionRate: number;
    commissionAmount: number;
    procedureIndex: number;
    patientRowSpan: number;
    dateRowSpan: number;
    isFirstOfPatient: boolean;
    isFirstOfDate: boolean;
    leadRef: Lead;
}

// ==================== Build flat rows ====================

function buildRows(leads: Lead[]): FlatRow[] {
    const patientGroups = new Map<string, Lead[]>();
    for (const lead of leads) {
        const key = lead.patient.tel || lead.patient.fullname;
        if (!patientGroups.has(key)) patientGroups.set(key, []);
        patientGroups.get(key)!.push(lead);
    }

    const rows: FlatRow[] = [];

    for (const [, patientLeads] of patientGroups) {
        // Sort oldest first for deposit balance calculation + display
        patientLeads.sort((a, b) => {
            const da = a.appointments.date || a.createdAt;
            const db = b.appointments.date || b.createdAt;
            return new Date(da).getTime() - new Date(db).getTime();
        });

        const first = patientLeads[0];
        const patientName = first.patient.fullname;
        const patientNickname = first.patient.nickname;

        const patientRows: any[] = [];
        let depositBalance = 0;

        const dateGroups: { dateKey: string; subRows: any[] }[] = [];

        for (const lead of patientLeads) {
            const dateKey = lead.appointments.date?.split('T')[0] || lead.createdAt.split('T')[0];
            const subRows: any[] = [];
            const procedures = lead.procedures || [];
            const depositAmount = Number(
                typeof lead.deposit === 'number' ? lead.deposit
                    : typeof lead.deposit === 'object' ? (lead.deposit as any)?.amount || 0 : lead.deposit
            ) || 0;

            // Per-visit payment info
            const paymentMethod = lead.payments?.method;
            const sc = lead.payments?.serviceCharge;
            const serviceChargeAmount = typeof sc === 'number' ? sc : Number(sc?.amount) || 0;
            const totalPayment = Number(lead.payments?.amount) || 0;
            const netAmount = (typeof sc === 'object' && sc?.netAmount)
                ? Number(sc.netAmount)
                : totalPayment - serviceChargeAmount;

            if (depositAmount > 0) {
                depositBalance += depositAmount;
                subRows.push({
                    type: 'deposit', leadId: lead._id, clinicId: lead.clinic.clinicId,
                    date: dateKey, name: 'วางมัดจำ', amount: depositAmount,
                    procServiceCharge: 0, procNetAmount: 0,
                    paymentMethod, serviceChargeAmount, netAmount,
                    depositUsed: depositAmount, depositBalance,
                    receiptUrl: lead.receiptUrl, receiptUrls: lead.receiptUrls,
                    commissionRate: 0, commissionAmount: 0, procedureIndex: -1,
                    leadRef: lead,
                });
            }

            // Calculate proportional service charge per procedure
            const totalProcPrice = procedures.reduce((s, p) => s + (Number(p.price) || 0), 0);

            procedures.forEach((proc, idx) => {
                const price = Number(proc.price) || 0;
                const rate = Number(proc.commissionRate) || 0;
                const procDepositUsed = Number((proc as any).depositUsed) || 0;
                if (procDepositUsed > 0) depositBalance -= procDepositUsed;

                const procSC = totalProcPrice > 0
                    ? Math.round(serviceChargeAmount * price / totalProcPrice) : 0;
                const procNet = price - procSC;

                subRows.push({
                    type: 'procedure', leadId: lead._id, clinicId: lead.clinic.clinicId,
                    date: dateKey, name: proc.name, amount: price,
                    procServiceCharge: procSC, procNetAmount: procNet,
                    paymentMethod, serviceChargeAmount, netAmount,
                    depositUsed: procDepositUsed, depositBalance,
                    receiptUrl: lead.receiptUrl, receiptUrls: lead.receiptUrls,
                    commissionRate: rate, commissionAmount: Math.round(procNet * rate / 100),
                    procedureIndex: idx, leadRef: lead,
                });
            });

            if (subRows.length === 0) {
                subRows.push({
                    type: 'procedure', leadId: lead._id, clinicId: lead.clinic.clinicId,
                    date: dateKey, name: '-', amount: totalPayment,
                    procServiceCharge: serviceChargeAmount, procNetAmount: netAmount,
                    paymentMethod, serviceChargeAmount, netAmount,
                    depositUsed: 0, depositBalance,
                    receiptUrl: lead.receiptUrl, receiptUrls: lead.receiptUrls,
                    commissionRate: 0, commissionAmount: 0, procedureIndex: 0,
                    leadRef: lead,
                });
            }

            dateGroups.push({ dateKey, subRows });
        }

        for (const { subRows } of dateGroups) {
            subRows.forEach((row: any, idx: number) => {
                patientRows.push({
                    ...row, patientName, patientNickname,
                    patientVisits: patientLeads.length,
                    dateRowSpan: idx === 0 ? subRows.length : 0,
                    isFirstOfDate: idx === 0,
                });
            });
        }

        patientRows.forEach((row, idx) => {
            rows.push({
                ...row,
                patientRowSpan: idx === 0 ? patientRows.length : 0,
                isFirstOfPatient: idx === 0,
            } as FlatRow);
        });
    }

    return rows;
}

// ==================== Component ====================

export default function CommissionManagement() {
    const error = useLeadsStore((s) => s.error);
    const clearError = useLeadsStore((s) => s.clearError);
    const updateLead = useLeadsStore((s) => s.updateLead);

    const [clinicOptions, setClinicOptions] = useState<ClinicOption[]>([]);
    const [rows, setRows] = useState<FlatRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const { year: currentYear, month: currentMonth } = getCurrentYearMonth();
    const [filterYear, setFilterYear] = useState(String(currentYear));
    const [filterMonth, setFilterMonth] = useState(String(currentMonth));
    const [filterClinicId, setFilterClinicId] = useState('');
    const [dirtyLeads, setDirtyLeads] = useState<Set<string>>(new Set());

    const yearOptions = getYearOptions();
    const monthLabel = `${THAI_MONTHS[parseInt(filterMonth) - 1]} ${parseInt(filterYear) + 543}`;

    // ==================== Load ====================

    useEffect(() => {
        optionsApi.getClinics(true).then((res) => {
            if (res.success && res.data) setClinicOptions(res.data);
        });
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { start_date, end_date } = getMonthRange(parseInt(filterYear), parseInt(filterMonth));
        const params: LeadListParams = {
            start_date, end_date, status: 'arrived', limit: 500,
            sort_by: 'createdAt', sort_order: 'asc',
        };
        if (filterClinicId) params.clinic_id = parseInt(filterClinicId);

        const res = await leadsApi.list(params);
        if (res.success && res.data) {
            setRows(buildRows(Array.isArray(res.data) ? res.data : []));
        }
        setDirtyLeads(new Set());
        setLoading(false);
    }, [filterYear, filterMonth, filterClinicId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ==================== Commission ====================

    const handleRateChange = (leadId: string, procedureIndex: number, rateStr: string) => {
        const rate = Math.min(100, Math.max(0, parseFloat(rateStr) || 0));
        setRows((prev) =>
            prev.map((row) => {
                if (row.leadId !== leadId || row.procedureIndex !== procedureIndex || row.type !== 'procedure') return row;
                return { ...row, commissionRate: rate, commissionAmount: Math.round(Number(row.procNetAmount) * rate / 100) };
            })
        );
        setDirtyLeads((prev) => new Set(prev).add(leadId));
    };

    const handleSaveLead = async (leadId: string) => {
        const leadRows = rows.filter((r) => r.leadId === leadId && r.type === 'procedure');
        const lead = leadRows[0]?.leadRef;
        if (!lead) return;

        setSaving(leadId);
        const totalCommission = leadRows.reduce((sum, r) => sum + Number(r.commissionAmount || 0), 0);
        const dto: UpdateLeadDTO = {
            procedures: leadRows.map((r) => ({
                name: r.name, price: r.amount,
                commissionRate: r.commissionRate, commissionAmount: r.commissionAmount,
                depositUsed: r.depositUsed || 0,
            })),
            payments: {
                ...lead.payments,
                commission: {
                    totalAmount: totalCommission,
                    details: leadRows.filter((r) => r.commissionRate > 0).map((r) => ({
                        procedureName: r.name,
                        baseAmount: Number(r.amount),
                        rate: r.commissionRate,
                        amount: r.commissionAmount,
                    })),
                },
            },
        };

        const success = await updateLead(leadId, lead.clinic.clinicId, dto);
        if (success) {
            setDirtyLeads((prev) => { const n = new Set(prev); n.delete(leadId); return n; });
        }
        setSaving(null);
    };

    // ==================== Totals ====================

    const totalAmount = rows.filter((r) => r.type === 'procedure').reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalCommission = rows.filter((r) => r.type === 'procedure').reduce((s, r) => s + Number(r.commissionAmount || 0), 0);
    const totalServiceCharge = rows.filter((r) => r.isFirstOfDate).reduce((s, r) => s + Number(r.serviceChargeAmount || 0), 0);
    const totalNet = totalAmount - totalServiceCharge;

    // ==================== Render ====================

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Percent className="h-6 w-6 text-emerald-600" />
                    จัดการคอมมิชชัน
                </h1>
                <p className="text-gray-500 mt-1">คอมมิชชันประจำ{monthLabel}</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
                    <p className="text-red-700 text-sm">{error}</p>
                    <Button variant="ghost" size="sm" onClick={clearError}><X className="h-4 w-4" /></Button>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border p-4">
                <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-2">
                        <Label className="text-sm text-gray-600 mb-1.5 block">เดือน</Label>
                        <Select value={filterMonth} onValueChange={setFilterMonth}>
                            <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                            <SelectContent position="popper" sideOffset={4} className="max-h-52 overflow-y-auto">
                                {THAI_MONTHS.map((m, i) => (
                                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-1">
                        <Label className="text-sm text-gray-600 mb-1.5 block">ปี</Label>
                        <Select value={filterYear} onValueChange={setFilterYear}>
                            <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                            <SelectContent position="popper" sideOffset={4}>
                                {yearOptions.map((y) => (
                                    <SelectItem key={y} value={String(y)}>{y + 543}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-3">
                        <Label className="text-sm text-gray-600 mb-1.5 block">คลินิก</Label>
                        <Select value={filterClinicId || 'all'} onValueChange={(v) => setFilterClinicId(v === 'all' ? '' : v)}>
                            <SelectTrigger className="h-10 w-full"><SelectValue placeholder="ทุกคลินิก" /></SelectTrigger>
                            <SelectContent position="popper" sideOffset={4} align="start" avoidCollisions collisionPadding={8} className="w-[var(--radix-select-trigger-width)] max-h-60">
                                <SelectItem value="all">ทุกคลินิก</SelectItem>
                                {clinicOptions.map((c) => (
                                    <SelectItem key={c.clinicId} value={String(c.clinicId)}>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-gray-400" />
                                            {c.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-6 flex items-end justify-end gap-2">
                        <Badge variant="outline" className="h-10 px-3 text-sm bg-blue-50 text-blue-700 border-blue-200">
                            ยอดรวม {formatCurrency(totalAmount)}
                        </Badge>
                        <Badge variant="outline" className="h-10 px-3 text-sm bg-emerald-50 text-emerald-700 border-emerald-200">
                            คอมมิชชัน {formatCurrency(totalCommission)}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 mt-4 overflow-hidden">
                <Card className="h-full flex flex-col">
                    <CardHeader className="flex-shrink-0 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Percent className="h-5 w-5 text-emerald-600" />
                            รายการคอมมิชชัน — {monthLabel}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[180px] sticky left-0 bg-white z-10">ชื่อ นามสกุล (ชื่อเล่น)</TableHead>
                                    <TableHead className="min-w-[100px]">วันที่</TableHead>
                                    <TableHead className="min-w-[140px]">รายการ</TableHead>
                                    <TableHead className="text-right min-w-[110px]">ยอด</TableHead>
                                    <TableHead className="text-right min-w-[100px]">ค่าธรรมเนียม</TableHead>
                                    <TableHead className="text-right min-w-[110px]">สุทธิ</TableHead>
                                    <TableHead className="text-center min-w-[80px]">คอม %</TableHead>
                                    <TableHead className="text-right min-w-[110px]">ค่าคอม</TableHead>
                                    <TableHead className="text-right min-w-[100px]">ใช้มัดจำ</TableHead>
                                    <TableHead className="text-right min-w-[120px]">มัดจำคงเหลือ</TableHead>
                                    <TableHead className="text-center min-w-[80px]">ชำระโดย</TableHead>
                                    <TableHead className="text-center min-w-[50px]">สลิป</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={13} className="text-center py-20">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
                                            <p className="text-gray-500 mt-2">กำลังโหลด...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={13} className="text-center py-16">
                                            <Percent className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                            <p className="text-lg font-medium text-gray-900">ไม่มีข้อมูลคอมมิชชัน</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                ไม่พบ Lead สถานะ "มาแล้ว" ในเดือน{THAI_MONTHS_SHORT[parseInt(filterMonth) - 1]} {parseInt(filterYear) + 543}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (<>
                                    {rows.map((row, i) => {
                                        const isDeposit = row.type === 'deposit';
                                        const isDirty = dirtyLeads.has(row.leadId);
                                        const isSaving = saving === row.leadId;

                                        return (
                                            <TableRow
                                                key={`${row.leadId}-${row.procedureIndex}-${i}`}
                                                className={`group ${isDeposit ? 'bg-emerald-50/40' : ''} ${row.isFirstOfPatient && i > 0 ? 'border-t-2 border-gray-300' : ''}`}
                                            >
                                                {/* ชื่อ — patient rowSpan */}
                                                {row.patientRowSpan > 0 && (
                                                    <TableCell rowSpan={row.patientRowSpan} className="align-top border-r border-gray-100 bg-white sticky left-0 z-10">
                                                        <p className="font-bold text-gray-900">{row.patientName}</p>
                                                        {row.patientNickname && <p className="text-xs text-gray-400">({row.patientNickname})</p>}
                                                        <p className="text-xs text-blue-500 mt-1">{row.patientVisits} ครั้ง</p>
                                                    </TableCell>
                                                )}

                                                {/* วันที่ — date rowSpan */}
                                                {row.dateRowSpan > 0 && (
                                                    <TableCell rowSpan={row.dateRowSpan} className="align-middle text-sm text-gray-600 bg-white">
                                                        {formatShortDate(row.date)}
                                                    </TableCell>
                                                )}

                                                {/* รายการ */}
                                                <TableCell className={`text-sm font-medium group-hover:bg-gray-50/80 ${isDeposit ? 'text-emerald-600' : 'text-gray-800'}`}>
                                                    {row.name}
                                                </TableCell>

                                                {/* ยอด */}
                                                <TableCell className={`text-right text-sm tabular-nums group-hover:bg-gray-50/80 ${isDeposit ? 'text-emerald-600' : 'text-gray-700'}`}>
                                                    {row.amount > 0 ? formatCurrency(row.amount) : '-'}
                                                </TableCell>

                                                {/* ค่าธรรมเนียม (per-row, proportional) */}
                                                <TableCell className="text-right text-sm tabular-nums group-hover:bg-gray-50/80">
                                                    {!isDeposit && row.procServiceCharge > 0
                                                        ? <span className="text-orange-600">{formatCurrency(row.procServiceCharge)}</span>
                                                        : <span className="text-gray-300">-</span>}
                                                </TableCell>

                                                {/* สุทธิ (per-row) */}
                                                <TableCell className="text-right text-sm tabular-nums group-hover:bg-gray-50/80">
                                                    {!isDeposit && row.amount > 0
                                                        ? <span className="font-medium text-gray-700">{formatCurrency(row.procNetAmount)}</span>
                                                        : <span className="text-gray-300">-</span>}
                                                </TableCell>

                                                {/* คอม % */}
                                                <TableCell className="text-center group-hover:bg-gray-50/80">
                                                    {!isDeposit && row.amount > 0 ? (
                                                        <div className="flex justify-center">
                                                            <div className="relative w-16">
                                                                <Input
                                                                    type="number" min={0} max={100}
                                                                    value={row.commissionRate || ''}
                                                                    onChange={(e) => handleRateChange(row.leadId, row.procedureIndex, e.target.value)}
                                                                    placeholder="0"
                                                                    className="h-7 text-center pr-5 text-xs font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-gray-300">-</span>}
                                                </TableCell>

                                                {/* ค่าคอม */}
                                                <TableCell className="text-right text-sm tabular-nums group-hover:bg-gray-50/80">
                                                    {!isDeposit && row.commissionAmount > 0
                                                        ? <span className="font-semibold text-emerald-600">{formatCurrency(row.commissionAmount)}</span>
                                                        : <span className="text-gray-300">-</span>
                                                    }
                                                </TableCell>

                                                {/* ใช้มัดจำ */}
                                                <TableCell className="text-right text-sm tabular-nums group-hover:bg-gray-50/80">
                                                    {isDeposit
                                                        ? <span className="font-medium text-emerald-600">+{formatCurrency(row.depositUsed)}</span>
                                                        : row.depositUsed > 0
                                                            ? <span className="font-medium text-red-500">-{formatCurrency(row.depositUsed)}</span>
                                                            : <span className="text-gray-300">-</span>
                                                    }
                                                </TableCell>

                                                {/* มัดจำคงเหลือ */}
                                                <TableCell className="text-right text-sm tabular-nums font-medium text-gray-700 group-hover:bg-gray-50/80">
                                                    {formatCurrency(row.depositBalance)}
                                                </TableCell>

                                                {/* ชำระโดย — date rowSpan */}
                                                {row.dateRowSpan > 0 && (
                                                    <TableCell rowSpan={row.dateRowSpan} className="text-center align-middle bg-white border-l border-gray-100">
                                                        {row.paymentMethod ? (
                                                            <span className="text-xs text-gray-600">
                                                                {PAYMENT_METHOD_LABELS[row.paymentMethod] || row.paymentMethod}
                                                            </span>
                                                        ) : <span className="text-gray-300">-</span>}
                                                    </TableCell>
                                                )}

                                                {/* สลิป — date rowSpan */}
                                                {row.dateRowSpan > 0 && (
                                                    <TableCell rowSpan={row.dateRowSpan} className="text-center align-middle bg-white">
                                                        {(() => {
                                                            const rawUrls = row.receiptUrls?.length ? row.receiptUrls : (row.receiptUrl ? [row.receiptUrl] : []);
                                                            const urls = rawUrls.map(resolveFileUrl).filter(Boolean) as string[];
                                                            if (urls.length === 0) return <span className="text-gray-300">-</span>;
                                                            if (urls.length === 1) {
                                                                return (
                                                                    <a href={urls[0]} target="_blank" rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 hover:underline">
                                                                        <ImageIcon className="h-3.5 w-3.5" /> ดูสลิป
                                                                    </a>
                                                                );
                                                            }
                                                            return (
                                                                <div className="inline-flex items-center gap-1.5">
                                                                    {urls.map((url, idx) => (
                                                                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                                                            className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700 text-[10px] font-medium"
                                                                            title={`สลิป #${idx + 1}`}>
                                                                            {idx + 1}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            );
                                                        })()}
                                                    </TableCell>
                                                )}

                                                {/* Save — date rowSpan */}
                                                {row.dateRowSpan > 0 && (
                                                    <TableCell rowSpan={row.dateRowSpan} className="text-center align-middle bg-white">
                                                        {isDirty && (
                                                            <Button variant="ghost" size="sm"
                                                                className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50"
                                                                onClick={() => handleSaveLead(row.leadId)}
                                                                disabled={isSaving} title="บันทึก">
                                                                {isSaving
                                                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                    : <Save className="h-3.5 w-3.5" />
                                                                }
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })}

                                    {/* Total */}
                                    {rows.length > 0 && (
                                        <TableRow className="bg-gray-50 border-t-2 border-gray-300 font-bold">
                                            <TableCell colSpan={2} className="sticky left-0 bg-gray-50 z-10" />
                                            <TableCell className="text-sm text-gray-700">รวม</TableCell>
                                            <TableCell className="text-right text-sm text-blue-700 tabular-nums">
                                                {formatCurrency(totalAmount)}
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-orange-600 tabular-nums">
                                                {totalServiceCharge > 0 ? formatCurrency(totalServiceCharge) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-gray-800 tabular-nums">
                                                {totalNet > 0 ? formatCurrency(totalNet) : '-'}
                                            </TableCell>
                                            <TableCell />
                                            <TableCell className="text-right text-sm text-emerald-700 tabular-nums">
                                                {formatCurrency(totalCommission)}
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-red-500">-</TableCell>
                                            <TableCell className="text-right text-sm text-gray-700 tabular-nums">
                                                {rows.length > 0 ? formatCurrency(rows[rows.length - 1].depositBalance) : '-'}
                                            </TableCell>
                                            <TableCell colSpan={3} />
                                        </TableRow>
                                    )}
                                </>)}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {dirtyLeads.size > 0 && (
                <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm z-50">
                    <Save className="h-4 w-4" />
                    {dirtyLeads.size} รายการที่ยังไม่บันทึก
                </div>
            )}
        </div>
    );
}