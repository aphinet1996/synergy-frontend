// import { useState, useEffect, useCallback } from 'react';
// import { useLeadsStore } from '@/stores/externalLeadsStore';
// import { optionsApi, leadsApi } from '@/services/externalLeadsService';
// import type { Lead, LeadListParams, ClinicOption, UpdateLeadDTO } from '@/types/externalLeads';
// import {
//     formatCurrency,
//     formatShortDate,
//     resolveFileUrl,
//     THAI_MONTHS,
//     THAI_MONTHS_SHORT,
//     getMonthRange,
//     getCurrentYearMonth,
//     getYearOptions,
// } from '../../utils/leadHelpers';

// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from '@/components/ui/table';
// import {
//     Percent,
//     Loader2,
//     Save,
//     X,
//     Building2,
//     Image as ImageIcon,
//     CalendarDays,
//     CreditCard,
// } from 'lucide-react';

// // ==================== Constants ====================

// const PAYMENT_METHOD_LABELS: Record<string, string> = {
//     cash: 'เงินสด',
//     transfer: 'โอนเงิน',
//     card: 'บัตรเครดิต',
//     free: 'ฟรี',
// };

// // ==================== Types ====================

// interface ProcRow {
//     type: 'procedure' | 'deposit';
//     leadId: string;
//     name: string;
//     amount: number;
//     serviceCharge: number;
//     netAmount: number;
//     commissionRate: number;
//     commissionAmount: number;
//     depositUsed: number;
//     depositBalance: number;
//     procedureIndex: number;
// }

// interface VisitGroup {
//     leadId: string;
//     clinicId: number;
//     date: string;
//     paymentMethod?: string;
//     serviceChargeAmount: number;
//     netAmount: number;
//     totalAmount: number;
//     receiptUrl?: string;
//     receiptUrls?: string[];
//     leadRef: Lead;
//     rows: ProcRow[];
// }

// interface PatientGroup {
//     key: string;
//     name: string;
//     nickname?: string;
//     visits: VisitGroup[];
//     totalVisits: number;
//     totalAmount: number;
//     totalCommission: number;
// }

// // ==================== Build Data ====================

// function buildGroups(leads: Lead[]): PatientGroup[] {
//     const patientMap = new Map<string, Lead[]>();
//     for (const lead of leads) {
//         const key = lead.patient.tel || lead.patient.fullname;
//         if (!patientMap.has(key)) patientMap.set(key, []);
//         patientMap.get(key)!.push(lead);
//     }

//     const groups: PatientGroup[] = [];

//     for (const [key, patientLeads] of patientMap) {
//         patientLeads.sort((a, b) => {
//             const da = a.appointments.date || a.createdAt;
//             const db = b.appointments.date || b.createdAt;
//             return new Date(da).getTime() - new Date(db).getTime();
//         });

//         const first = patientLeads[0];
//         let depositBalance = 0;
//         const visits: VisitGroup[] = [];

//         for (const lead of patientLeads) {
//             const dateKey = lead.appointments.date?.split('T')[0] || lead.createdAt.split('T')[0];
//             const procedures = lead.procedures || [];
//             const depositAmount = Number(
//                 typeof lead.deposit === 'number' ? lead.deposit
//                     : typeof lead.deposit === 'object' ? (lead.deposit as any)?.amount || 0 : lead.deposit
//             ) || 0;

//             const sc = lead.payments?.serviceCharge;
//             const serviceChargeAmount = typeof sc === 'number' ? sc : Number(sc?.amount) || 0;
//             const totalPayment = Number(lead.payments?.amount) || 0;
//             const netAmount = (typeof sc === 'object' && sc?.netAmount)
//                 ? Number(sc.netAmount) : totalPayment - serviceChargeAmount;

//             const procRows: ProcRow[] = [];

//             if (depositAmount > 0) {
//                 depositBalance += depositAmount;
//                 procRows.push({
//                     type: 'deposit', leadId: lead._id,
//                     name: 'วางมัดจำ', amount: depositAmount,
//                     serviceCharge: 0, netAmount: 0,
//                     commissionRate: 0, commissionAmount: 0,
//                     depositUsed: depositAmount, depositBalance,
//                     procedureIndex: -1,
//                 });
//             }

//             // Calculate proportional service charge per procedure
//             const totalProcPrice = procedures.reduce((s, p) => s + (Number(p.price) || 0), 0);

//             procedures.forEach((proc, idx) => {
//                 const price = Number(proc.price) || 0;
//                 const rate = Number(proc.commissionRate) || 0;
//                 const procDepositUsed = Number((proc as any).depositUsed) || 0;
//                 if (procDepositUsed > 0) depositBalance -= procDepositUsed;

//                 // Proportional: (price / totalProcPrice) * serviceCharge
//                 const procServiceCharge = totalProcPrice > 0
//                     ? Math.round(serviceChargeAmount * price / totalProcPrice)
//                     : 0;
//                 const procNet = price - procServiceCharge;

//                 procRows.push({
//                     type: 'procedure', leadId: lead._id,
//                     name: proc.name, amount: price,
//                     serviceCharge: procServiceCharge, netAmount: procNet,
//                     commissionRate: rate, commissionAmount: Math.round(procNet * rate / 100),
//                     depositUsed: procDepositUsed, depositBalance,
//                     procedureIndex: idx,
//                 });
//             });

//             if (procRows.length === 0) {
//                 procRows.push({
//                     type: 'procedure', leadId: lead._id,
//                     name: '-', amount: totalPayment,
//                     serviceCharge: serviceChargeAmount, netAmount: netAmount,
//                     commissionRate: 0, commissionAmount: 0,
//                     depositUsed: 0, depositBalance, procedureIndex: 0,
//                 });
//             }

//             visits.push({
//                 leadId: lead._id, clinicId: lead.clinic.clinicId,
//                 date: dateKey, paymentMethod: lead.payments?.method,
//                 serviceChargeAmount, netAmount, totalAmount: totalPayment,
//                 receiptUrl: lead.receiptUrl, receiptUrls: lead.receiptUrls,
//                 leadRef: lead, rows: procRows,
//             });
//         }

//         const allProcs = visits.flatMap((v) => v.rows).filter((r) => r.type === 'procedure');
//         groups.push({
//             key, name: first.patient.fullname, nickname: first.patient.nickname,
//             visits, totalVisits: patientLeads.length,
//             totalAmount: allProcs.reduce((s, r) => s + Number(r.amount || 0), 0),
//             totalCommission: allProcs.reduce((s, r) => s + Number(r.commissionAmount || 0), 0),
//         });
//     }
//     return groups;
// }

// // ==================== Component ====================

// export default function CommissionManagement() {
//     const error = useLeadsStore((s) => s.error);
//     const clearError = useLeadsStore((s) => s.clearError);
//     const updateLead = useLeadsStore((s) => s.updateLead);

//     const [clinicOptions, setClinicOptions] = useState<ClinicOption[]>([]);
//     const [groups, setGroups] = useState<PatientGroup[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [saving, setSaving] = useState<string | null>(null);

//     const { year: currentYear, month: currentMonth } = getCurrentYearMonth();
//     const [filterYear, setFilterYear] = useState(String(currentYear));
//     const [filterMonth, setFilterMonth] = useState(String(currentMonth));
//     const [filterClinicId, setFilterClinicId] = useState('');
//     const [dirtyLeads, setDirtyLeads] = useState<Set<string>>(new Set());

//     const yearOptions = getYearOptions();
//     const monthLabel = `${THAI_MONTHS[parseInt(filterMonth) - 1]} ${parseInt(filterYear) + 543}`;

//     // ==================== Load ====================

//     useEffect(() => {
//         optionsApi.getClinics(true).then((res) => {
//             if (res.success && res.data) setClinicOptions(res.data);
//         });
//     }, []);

//     const fetchData = useCallback(async () => {
//         setLoading(true);
//         const { start_date, end_date } = getMonthRange(parseInt(filterYear), parseInt(filterMonth));
//         const params: LeadListParams = {
//             start_date, end_date, status: 'arrived', limit: 500,
//             sort_by: 'createdAt', sort_order: 'asc',
//         };
//         if (filterClinicId) params.clinic_id = parseInt(filterClinicId);
//         const res = await leadsApi.list(params);
//         if (res.success && res.data) {
//             setGroups(buildGroups(Array.isArray(res.data) ? res.data : []));
//         }
//         setDirtyLeads(new Set());
//         setLoading(false);
//     }, [filterYear, filterMonth, filterClinicId]);

//     useEffect(() => { fetchData(); }, [fetchData]);

//     // ==================== Handlers ====================

//     const handleRateChange = useCallback((leadId: string, procedureIndex: number, rateStr: string) => {
//         const rate = Math.min(100, Math.max(0, parseFloat(rateStr) || 0));
//         setGroups((prev) =>
//             prev.map((g) => {
//                 const newVisits = g.visits.map((v) => ({
//                     ...v,
//                     rows: v.rows.map((r) => {
//                         if (r.leadId !== leadId || r.procedureIndex !== procedureIndex || r.type !== 'procedure') return r;
//                         return { ...r, commissionRate: rate, commissionAmount: Math.round(Number(r.netAmount) * rate / 100) };
//                     }),
//                 }));
//                 const allProcs = newVisits.flatMap((v) => v.rows).filter((r) => r.type === 'procedure');
//                 return { ...g, visits: newVisits, totalCommission: allProcs.reduce((s, r) => s + Number(r.commissionAmount || 0), 0) };
//             })
//         );
//         setDirtyLeads((prev) => new Set(prev).add(leadId));
//     }, []);

//     const handleSaveLead = useCallback(async (visit: VisitGroup) => {
//         const leadRows = visit.rows.filter((r) => r.type === 'procedure');
//         const lead = visit.leadRef;
//         if (!lead) return;

//         setSaving(visit.leadId);
//         const totalCommission = leadRows.reduce((sum, r) => sum + Number(r.commissionAmount || 0), 0);
//         const dto: UpdateLeadDTO = {
//             procedures: leadRows.map((r) => ({
//                 name: r.name, price: r.amount,
//                 commissionRate: r.commissionRate, commissionAmount: r.commissionAmount,
//                 depositUsed: r.depositUsed || 0,
//             })),
//             payments: {
//                 ...lead.payments,
//                 commission: {
//                     totalAmount: totalCommission,
//                     details: leadRows.filter((r) => r.commissionRate > 0).map((r) => ({
//                         procedureName: r.name, baseAmount: Number(r.amount),
//                         rate: r.commissionRate, amount: r.commissionAmount,
//                     })),
//                 },
//             },
//         };
//         const success = await updateLead(visit.leadId, visit.clinicId, dto);
//         if (success) {
//             setDirtyLeads((prev) => { const n = new Set(prev); n.delete(visit.leadId); return n; });
//         }
//         setSaving(null);
//     }, [updateLead]);

//     // ==================== Totals ====================

//     const allRows = groups.flatMap((g) => g.visits.flatMap((v) => v.rows));
//     const totalAmount = allRows.filter((r) => r.type === 'procedure').reduce((s, r) => s + Number(r.amount || 0), 0);
//     const totalCommission = allRows.filter((r) => r.type === 'procedure').reduce((s, r) => s + Number(r.commissionAmount || 0), 0);
//     const totalServiceCharge = groups.flatMap((g) => g.visits).reduce((s, v) => s + Number(v.serviceChargeAmount || 0), 0);
//     const totalNet = totalAmount - totalServiceCharge;

//     // ==================== Render ====================

//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div>
//                 <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
//                     <Percent className="h-6 w-6 text-emerald-600" />
//                     จัดการคอมมิชชัน
//                 </h1>
//                 <p className="text-gray-500 mt-1">คอมมิชชันประจำ{monthLabel}</p>
//             </div>

//             {error && (
//                 <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
//                     <p className="text-red-700 text-sm">{error}</p>
//                     <Button variant="ghost" size="sm" onClick={clearError}><X className="h-4 w-4" /></Button>
//                 </div>
//             )}

//             {/* Filters */}
//             <div className="bg-white rounded-xl border p-4">
//                 <div className="grid grid-cols-12 gap-4">
//                     <div className="col-span-2">
//                         <Label className="text-sm text-gray-600 mb-1.5 block">เดือน</Label>
//                         <Select value={filterMonth} onValueChange={setFilterMonth}>
//                             <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
//                             <SelectContent position="popper" sideOffset={4} className="max-h-52 overflow-y-auto">
//                                 {THAI_MONTHS_SHORT.map((m, i) => (
//                                     <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
//                                 ))}
//                             </SelectContent>
//                         </Select>
//                     </div>
//                     <div className="col-span-1">
//                         <Label className="text-sm text-gray-600 mb-1.5 block">ปี</Label>
//                         <Select value={filterYear} onValueChange={setFilterYear}>
//                             <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
//                             <SelectContent position="popper" sideOffset={4}>
//                                 {yearOptions.map((y) => (
//                                     <SelectItem key={y} value={String(y)}>{y + 543}</SelectItem>
//                                 ))}
//                             </SelectContent>
//                         </Select>
//                     </div>
//                     <div className="col-span-3">
//                         <Label className="text-sm text-gray-600 mb-1.5 block">คลินิก</Label>
//                         <Select value={filterClinicId || 'all'} onValueChange={(v) => setFilterClinicId(v === 'all' ? '' : v)}>
//                             <SelectTrigger className="h-10 w-full"><SelectValue placeholder="ทุกคลินิก" /></SelectTrigger>
//                             <SelectContent position="popper" sideOffset={4} align="start" avoidCollisions collisionPadding={8} className="w-[var(--radix-select-trigger-width)] max-h-60">
//                                 <SelectItem value="all">ทุกคลินิก</SelectItem>
//                                 {clinicOptions.map((c) => (
//                                     <SelectItem key={c.clinicId} value={String(c.clinicId)}>
//                                         <div className="flex items-center gap-2">
//                                             <Building2 className="h-4 w-4 text-gray-400" /> {c.label}
//                                         </div>
//                                     </SelectItem>
//                                 ))}
//                             </SelectContent>
//                         </Select>
//                     </div>
//                     <div className="col-span-6 flex items-end justify-end gap-2">
//                         <Badge variant="outline" className="h-10 px-3 text-sm bg-blue-50 text-blue-700 border-blue-200">
//                             ยอดรวม {formatCurrency(totalAmount)}
//                         </Badge>
//                         <Badge variant="outline" className="h-10 px-3 text-sm bg-emerald-50 text-emerald-700 border-emerald-200">
//                             คอมมิชชัน {formatCurrency(totalCommission)}
//                         </Badge>
//                     </div>
//                 </div>
//             </div>

//             {/* Content */}
//             <Card>
//                 <CardHeader className="pb-3">
//                     <CardTitle className="flex items-center gap-2 text-base">
//                         <Percent className="h-5 w-5 text-emerald-600" />
//                         รายการคอมมิชชัน — {monthLabel}
//                     </CardTitle>
//                 </CardHeader>
//                 <CardContent className="p-0">
//                     {loading ? (
//                         <div className="flex items-center justify-center py-20">
//                             <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
//                             <span className="ml-2 text-gray-500">กำลังโหลด...</span>
//                         </div>
//                     ) : groups.length === 0 ? (
//                         <div className="text-center py-20">
//                             <Percent className="h-16 w-16 mx-auto mb-4 text-gray-300" />
//                             <p className="text-lg font-medium text-gray-900">ไม่มีข้อมูลคอมมิชชัน</p>
//                             <p className="text-sm text-gray-500 mt-1">
//                                 ไม่พบ Lead สถานะ "มาแล้ว" ในเดือน{THAI_MONTHS_SHORT[parseInt(filterMonth) - 1]} {parseInt(filterYear) + 543}
//                             </p>
//                         </div>
//                     ) : (
//                         <div className="p-4 space-y-4">
//                             {groups.map((patient) => (
//                                 <div key={patient.key} className="border border-gray-200 rounded-xl overflow-hidden">
//                                     {/* ====== Patient Header ====== */}
//                                     <div className="px-5 py-3 bg-purple-50/70 flex items-center justify-between">
//                                         <div className="flex items-center gap-2">
//                                             <span className="text-sm font-semibold text-purple-900">{patient.name}</span>
//                                             {patient.nickname && <span className="text-xs text-purple-600">({patient.nickname})</span>}
//                                             <Badge variant="outline" className="text-[11px] bg-white text-purple-600 border-purple-200 px-2 py-0">
//                                                 {patient.totalVisits} ครั้ง
//                                             </Badge>
//                                         </div>
//                                     </div>

//                                     {/* ====== Visits ====== */}
//                                     {patient.visits.map((visit, vi) => {
//                                         const isDirty = dirtyLeads.has(visit.leadId);
//                                         const isSaving = saving === visit.leadId;
//                                         const slipRaw = visit.receiptUrls?.length ? visit.receiptUrls : (visit.receiptUrl ? [visit.receiptUrl] : []);
//                                         const slipUrls = slipRaw.map(resolveFileUrl).filter(Boolean) as string[];
//                                         const visitProcs = visit.rows.filter((r) => r.type === 'procedure');
//                                         const visitCommission = visitProcs.reduce((s, r) => s + Number(r.commissionAmount || 0), 0);

//                                         return (
//                                             <div key={visit.leadId} className={vi > 0 ? 'border-t-2 border-dashed border-gray-200' : ''}>
//                                                 {/* Visit Header — date bar */}
//                                                 <div className="px-5 py-2.5 bg-gray-50 border-y border-gray-100 flex items-center justify-between">
//                                                     <div className="flex items-center gap-2">
//                                                         <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
//                                                         <span className="text-sm font-semibold text-gray-800">{formatShortDate(visit.date)}</span>
//                                                     </div>

//                                                     <div className="flex items-center gap-3">
//                                                         <div className="px-5 py-2flex items-center gap-5 text-xs text-gray-500 border-b border-gray-50">
//                                                             <span className="flex items-center gap-1">
//                                                                 <CreditCard className="h-3 w-3" />
//                                                                 {visit.paymentMethod ? PAYMENT_METHOD_LABELS[visit.paymentMethod] || visit.paymentMethod : '-'}
//                                                             </span>
//                                                         </div>
//                                                         {/* Slip */}
//                                                         {slipUrls.length === 1 && (
//                                                             <a href={slipUrls[0]} target="_blank" rel="noopener noreferrer"
//                                                                 className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 hover:underline">
//                                                                 <ImageIcon className="h-3.5 w-3.5" /> ดูสลิป
//                                                             </a>
//                                                         )}
//                                                         {slipUrls.length > 1 && (
//                                                             <div className="flex items-center gap-1">
//                                                                 {slipUrls.map((url, idx) => (
//                                                                     <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
//                                                                         className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-50 text-blue-500 hover:bg-blue-100 text-[10px] font-medium"
//                                                                         title={`สลิป #${idx + 1}`}>{idx + 1}</a>
//                                                                 ))}
//                                                             </div>
//                                                         )}
//                                                         {/* Save */}
//                                                         {isDirty && (
//                                                             <Button variant="ghost" size="sm"
//                                                                 className="h-6 px-2 text-xs text-emerald-600 hover:bg-emerald-50 gap-1"
//                                                                 onClick={() => handleSaveLead(visit)} disabled={isSaving}>
//                                                                 {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
//                                                                 บันทึก
//                                                             </Button>
//                                                         )}
//                                                     </div>
//                                                 </div>

//                                                 {/* Procedure Table */}
//                                                 <Table>
//                                                     <TableHeader>
//                                                         <TableRow>
//                                                             <TableHead className="pl-5">รายการ</TableHead>
//                                                             <TableHead className="text-right w-[110px]">ยอด</TableHead>
//                                                             <TableHead className="text-right w-[100px]">ค่าธรรมเนียม</TableHead>
//                                                             <TableHead className="text-right w-[110px]">สุทธิ</TableHead>
//                                                             <TableHead className="text-center w-[80px]">คอม %</TableHead>
//                                                             <TableHead className="text-right w-[110px]">ค่าคอม</TableHead>
//                                                             <TableHead className="text-right w-[100px]">ใช้มัดจำ</TableHead>
//                                                             <TableHead className="text-right w-[110px] pr-5">คงเหลือ</TableHead>
//                                                         </TableRow>
//                                                     </TableHeader>
//                                                     <TableBody>
//                                                         {visit.rows.map((row, ri) => {
//                                                             const isDeposit = row.type === 'deposit';
//                                                             return (
//                                                                 <TableRow key={ri} className={isDeposit ? 'bg-emerald-50/40' : 'hover:bg-gray-50/80'}>
//                                                                     <TableCell className={`pl-5 text-sm font-medium ${isDeposit ? 'text-emerald-600' : 'text-gray-800'}`}>{row.name}</TableCell>
//                                                                     <TableCell className={`text-right text-sm tabular-nums ${isDeposit ? 'text-emerald-600' : 'text-gray-700'}`}>
//                                                                         {row.amount > 0 ? formatCurrency(row.amount) : '-'}
//                                                                     </TableCell>
//                                                                     <TableCell className="text-right text-sm tabular-nums">
//                                                                         {!isDeposit && row.serviceCharge > 0
//                                                                             ? <span className="text-orange-600">{formatCurrency(row.serviceCharge)}</span>
//                                                                             : <span className="text-gray-300">-</span>}
//                                                                     </TableCell>
//                                                                     <TableCell className="text-right text-sm tabular-nums">
//                                                                         {!isDeposit && row.amount > 0
//                                                                             ? <span className="font-medium text-gray-700">{formatCurrency(row.netAmount)}</span>
//                                                                             : <span className="text-gray-300">-</span>}
//                                                                     </TableCell>
//                                                                     <TableCell className="text-center">
//                                                                         {!isDeposit && row.amount > 0 ? (
//                                                                             <div className="flex justify-center">
//                                                                                 <div className="relative w-16">
//                                                                                     <Input type="number" min={0} max={100} value={row.commissionRate || ''}
//                                                                                         onChange={(e) => handleRateChange(row.leadId, row.procedureIndex, e.target.value)}
//                                                                                         placeholder="0"
//                                                                                         className="h-7 text-center pr-5 text-xs font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
//                                                                                     <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
//                                                                                 </div>
//                                                                             </div>
//                                                                         ) : <span className="text-gray-300">-</span>}
//                                                                     </TableCell>
//                                                                     <TableCell className="text-right text-sm tabular-nums">
//                                                                         {!isDeposit && row.commissionAmount > 0
//                                                                             ? <span className="font-semibold text-emerald-600">{formatCurrency(row.commissionAmount)}</span>
//                                                                             : <span className="text-gray-300">-</span>}
//                                                                     </TableCell>
//                                                                     <TableCell className="text-right text-sm tabular-nums">
//                                                                         {isDeposit ? <span className="font-medium text-emerald-600">+{formatCurrency(row.depositUsed)}</span>
//                                                                             : row.depositUsed > 0 ? <span className="font-medium text-red-500">-{formatCurrency(row.depositUsed)}</span>
//                                                                                 : <span className="text-gray-300">-</span>}
//                                                                     </TableCell>
//                                                                     <TableCell className="text-right text-sm tabular-nums font-medium text-gray-700 pr-5">{formatCurrency(row.depositBalance)}</TableCell>
//                                                                 </TableRow>
//                                                             );
//                                                         })}

//                                                         {/* Visit Subtotal */}
//                                                         <TableRow className="bg-gray-50/60 border-t">
//                                                             <TableCell className="pl-5 text-xs font-medium text-gray-500">รวมครั้งนี้</TableCell>
//                                                             <TableCell className="text-right text-xs font-semibold text-gray-700 tabular-nums">
//                                                                 {formatCurrency(visitProcs.reduce((s, r) => s + Number(r.amount || 0), 0))}
//                                                             </TableCell>
//                                                             <TableCell className="text-right text-xs tabular-nums">
//                                                                 {visit.serviceChargeAmount > 0
//                                                                     ? <span className="font-medium text-orange-600">{formatCurrency(visit.serviceChargeAmount)}</span>
//                                                                     : <span className="text-gray-300">-</span>}
//                                                             </TableCell>
//                                                             <TableCell className="text-right text-xs font-semibold text-gray-800 tabular-nums">
//                                                                 {formatCurrency(visit.netAmount)}
//                                                             </TableCell>
//                                                             <TableCell />
//                                                             <TableCell className="text-right text-xs font-semibold text-emerald-600 tabular-nums">
//                                                                 {visitCommission > 0 ? formatCurrency(visitCommission) : '-'}
//                                                             </TableCell>
//                                                             <TableCell colSpan={2} />
//                                                         </TableRow>
//                                                     </TableBody>
//                                                 </Table>
//                                             </div>
//                                         );
//                                     })}
//                                 </div>
//                             ))}

//                             {/* ====== Grand Total ====== */}
//                             <div className="border border-gray-200 rounded-xl overflow-hidden px-5 py-4 bg-gray-50">
//                                 <div className="flex items-center justify-between">
//                                     <span className="text-sm font-bold text-gray-800">รวมทั้งหมด ({groups.length} คน, {groups.reduce((s, g) => s + g.totalVisits, 0)} ครั้ง)</span>
//                                     <div className="flex items-center gap-6 text-sm tabular-nums">
//                                         <div className="text-right">
//                                             <p className="text-[10px] text-gray-400">ยอดหัตถการ</p>
//                                             <p className="font-bold text-blue-700">{formatCurrency(totalAmount)}</p>
//                                         </div>
//                                         {totalServiceCharge > 0 && (
//                                             <div className="text-right">
//                                                 <p className="text-[10px] text-gray-400">ค่าธรรมเนียม</p>
//                                                 <p className="font-bold text-orange-600">{formatCurrency(totalServiceCharge)}</p>
//                                             </div>
//                                         )}
//                                         <div className="text-right">
//                                             <p className="text-[10px] text-gray-400">สุทธิ</p>
//                                             <p className="font-bold text-gray-800">{formatCurrency(totalNet)}</p>
//                                         </div>
//                                         <div className="text-right">
//                                             <p className="text-[10px] text-gray-400">คอมมิชชันรวม</p>
//                                             <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalCommission)}</p>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>

//             {/* Floating dirty indicator */}
//             {dirtyLeads.size > 0 && (
//                 <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm z-50">
//                     <Save className="h-4 w-4" />
//                     {dirtyLeads.size} รายการที่ยังไม่บันทึก
//                 </div>
//             )}
//         </div>
//     );
// }

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
    CalendarDays,
    CreditCard,
} from 'lucide-react';

// ==================== Constants ====================

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: 'เงินสด',
    transfer: 'โอนเงิน',
    card: 'บัตรเครดิต',
    free: 'ฟรี',
};

// ==================== Types ====================

interface ProcRow {
    type: 'procedure' | 'deposit';
    leadId: string;
    name: string;
    amount: number;
    serviceCharge: number;
    netAmount: number;
    commissionRate: number;
    commissionAmount: number;
    depositUsed: number;
    depositBalance: number;
    procedureIndex: number;
}

interface VisitGroup {
    leadId: string;
    clinicId: number;
    date: string;
    paymentMethod?: string;
    serviceChargeAmount: number;
    netAmount: number;
    totalAmount: number;
    receiptUrl?: string;
    receiptUrls?: string[];
    leadRef: Lead;
    rows: ProcRow[];
}

interface PatientGroup {
    key: string;
    name: string;
    nickname?: string;
    visits: VisitGroup[];
    totalVisits: number;
    totalAmount: number;
    totalCommission: number;
}

// ==================== Build Data ====================

function buildGroups(leads: Lead[]): PatientGroup[] {
    const patientMap = new Map<string, Lead[]>();
    for (const lead of leads) {
        const key = lead.patient.tel || lead.patient.fullname;
        if (!patientMap.has(key)) patientMap.set(key, []);
        patientMap.get(key)!.push(lead);
    }

    const groups: PatientGroup[] = [];

    for (const [key, patientLeads] of patientMap) {
        patientLeads.sort((a, b) => {
            const da = a.appointments.date || a.createdAt;
            const db = b.appointments.date || b.createdAt;
            return new Date(da).getTime() - new Date(db).getTime();
        });

        const first = patientLeads[0];
        let depositBalance = 0;
        const visits: VisitGroup[] = [];

        for (const lead of patientLeads) {
            const dateKey = lead.appointments.date?.split('T')[0] || lead.createdAt.split('T')[0];
            const procedures = lead.procedures || [];
            const depositAmount = Number(
                typeof lead.deposit === 'number' ? lead.deposit
                    : typeof lead.deposit === 'object' ? (lead.deposit as any)?.amount || 0 : lead.deposit
            ) || 0;

            const sc = lead.payments?.serviceCharge;
            const serviceChargeAmount = typeof sc === 'number' ? sc : Number(sc?.amount) || 0;
            const totalPayment = Number(lead.payments?.amount) || 0;
            const netAmount = (typeof sc === 'object' && sc?.netAmount)
                ? Number(sc.netAmount) : totalPayment - serviceChargeAmount;

            const procRows: ProcRow[] = [];

            if (depositAmount > 0) {
                depositBalance += depositAmount;
                procRows.push({
                    type: 'deposit', leadId: lead._id,
                    name: 'วางมัดจำ', amount: depositAmount,
                    serviceCharge: 0, netAmount: 0,
                    commissionRate: 0, commissionAmount: 0,
                    depositUsed: depositAmount, depositBalance,
                    procedureIndex: -1,
                });
            }

            // Calculate proportional service charge per procedure
            const totalProcPrice = procedures.reduce((s, p) => s + (Number(p.price) || 0), 0);

            procedures.forEach((proc, idx) => {
                const price = Number(proc.price) || 0;
                const rate = Number(proc.commissionRate) || 0;
                const procDepositUsed = Number((proc as any).depositUsed) || 0;
                if (procDepositUsed > 0) depositBalance -= procDepositUsed;

                // Proportional: (price / totalProcPrice) * serviceCharge
                const procServiceCharge = totalProcPrice > 0
                    ? Math.round(serviceChargeAmount * price / totalProcPrice)
                    : 0;
                const procNet = price - procServiceCharge;

                procRows.push({
                    type: 'procedure', leadId: lead._id,
                    name: proc.name, amount: price,
                    serviceCharge: procServiceCharge, netAmount: procNet,
                    commissionRate: rate, commissionAmount: Math.round(procNet * rate / 100),
                    depositUsed: procDepositUsed, depositBalance,
                    procedureIndex: idx,
                });
            });

            if (procRows.length === 0) {
                procRows.push({
                    type: 'procedure', leadId: lead._id,
                    name: '-', amount: totalPayment,
                    serviceCharge: serviceChargeAmount, netAmount: netAmount,
                    commissionRate: 0, commissionAmount: 0,
                    depositUsed: 0, depositBalance, procedureIndex: 0,
                });
            }

            visits.push({
                leadId: lead._id, clinicId: lead.clinic.clinicId,
                date: dateKey, paymentMethod: lead.payments?.method,
                serviceChargeAmount, netAmount, totalAmount: totalPayment,
                receiptUrl: lead.receiptUrl, receiptUrls: lead.receiptUrls,
                leadRef: lead, rows: procRows,
            });
        }

        const allProcs = visits.flatMap((v) => v.rows).filter((r) => r.type === 'procedure');
        groups.push({
            key, name: first.patient.fullname, nickname: first.patient.nickname,
            visits, totalVisits: patientLeads.length,
            totalAmount: allProcs.reduce((s, r) => s + Number(r.amount || 0), 0),
            totalCommission: allProcs.reduce((s, r) => s + Number(r.commissionAmount || 0), 0),
        });
    }
    return groups;
}

// ==================== Component ====================

export default function CommissionManagement() {
    const error = useLeadsStore((s) => s.error);
    const clearError = useLeadsStore((s) => s.clearError);
    const updateLead = useLeadsStore((s) => s.updateLead);

    const [clinicOptions, setClinicOptions] = useState<ClinicOption[]>([]);
    const [groups, setGroups] = useState<PatientGroup[]>([]);
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
            setGroups(buildGroups(Array.isArray(res.data) ? res.data : []));
        }
        setDirtyLeads(new Set());
        setLoading(false);
    }, [filterYear, filterMonth, filterClinicId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ==================== Handlers ====================

    const handleRateChange = useCallback((leadId: string, procedureIndex: number, rateStr: string) => {
        const rate = Math.min(100, Math.max(0, parseFloat(rateStr) || 0));
        setGroups((prev) =>
            prev.map((g) => {
                const newVisits = g.visits.map((v) => ({
                    ...v,
                    rows: v.rows.map((r) => {
                        if (r.leadId !== leadId || r.procedureIndex !== procedureIndex || r.type !== 'procedure') return r;
                        return { ...r, commissionRate: rate, commissionAmount: Math.round(Number(r.netAmount) * rate / 100) };
                    }),
                }));
                const allProcs = newVisits.flatMap((v) => v.rows).filter((r) => r.type === 'procedure');
                return { ...g, visits: newVisits, totalCommission: allProcs.reduce((s, r) => s + Number(r.commissionAmount || 0), 0) };
            })
        );
        setDirtyLeads((prev) => new Set(prev).add(leadId));
    }, []);

    const handleSaveLead = useCallback(async (visit: VisitGroup) => {
        const leadRows = visit.rows.filter((r) => r.type === 'procedure');
        const lead = visit.leadRef;
        if (!lead) return;

        setSaving(visit.leadId);
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
                        procedureName: r.name, baseAmount: Number(r.amount),
                        rate: r.commissionRate, amount: r.commissionAmount,
                    })),
                },
            },
        };
        const success = await updateLead(visit.leadId, visit.clinicId, dto);
        if (success) {
            setDirtyLeads((prev) => { const n = new Set(prev); n.delete(visit.leadId); return n; });
        }
        setSaving(null);
    }, [updateLead]);

    // ==================== Totals ====================

    const allRows = groups.flatMap((g) => g.visits.flatMap((v) => v.rows));
    const totalAmount = allRows.filter((r) => r.type === 'procedure').reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalCommission = allRows.filter((r) => r.type === 'procedure').reduce((s, r) => s + Number(r.commissionAmount || 0), 0);
    const totalServiceCharge = groups.flatMap((g) => g.visits).reduce((s, v) => s + Number(v.serviceChargeAmount || 0), 0);
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
                                            <Building2 className="h-4 w-4 text-gray-400" /> {c.label}
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

            {/* Content */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Percent className="h-5 w-5 text-emerald-600" />
                        รายการคอมมิชชัน — {monthLabel}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                            <span className="ml-2 text-gray-500">กำลังโหลด...</span>
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="text-center py-20">
                            <Percent className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium text-gray-900">ไม่มีข้อมูลคอมมิชชัน</p>
                            <p className="text-sm text-gray-500 mt-1">
                                ไม่พบ Lead สถานะ "มาแล้ว" ในเดือน{THAI_MONTHS_SHORT[parseInt(filterMonth) - 1]} {parseInt(filterYear) + 543}
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            {groups.map((patient) => (
                                <div key={patient.key} className="border border-gray-200 rounded-xl overflow-hidden">
                                    {/* ====== Patient Header ====== */}
                                    <div className="px-5 py-3 bg-purple-50/70 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-purple-900">{patient.name}</span>
                                            {patient.nickname && <span className="text-xs text-purple-600">({patient.nickname})</span>}
                                            <Badge variant="outline" className="text-[11px] bg-white text-purple-600 border-purple-200 px-2 py-0">
                                                {patient.totalVisits} ครั้ง
                                            </Badge>
                                        </div>
                                        {/* Save buttons for dirty visits */}
                                        {patient.visits.some((v) => dirtyLeads.has(v.leadId)) && (
                                            <div className="flex items-center gap-1.5">
                                                {patient.visits.filter((v) => dirtyLeads.has(v.leadId)).map((v) => (
                                                    <Button key={v.leadId} variant="default" size="sm"
                                                        className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-lg shadow-sm"
                                                        onClick={() => handleSaveLead(v)} disabled={saving === v.leadId}>
                                                        {saving === v.leadId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                                        {patient.visits.filter((vv) => dirtyLeads.has(vv.leadId)).length > 1
                                                            ? `บันทึก (${formatShortDate(v.date)})`
                                                            : 'บันทึก'}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* ====== Visits ====== */}
                                    {patient.visits.map((visit, vi) => {
                                        const slipRaw = visit.receiptUrls?.length ? visit.receiptUrls : (visit.receiptUrl ? [visit.receiptUrl] : []);
                                        const slipUrls = slipRaw.map(resolveFileUrl).filter(Boolean) as string[];
                                        const visitProcs = visit.rows.filter((r) => r.type === 'procedure');
                                        const visitCommission = visitProcs.reduce((s, r) => s + Number(r.commissionAmount || 0), 0);

                                        return (
                                            <div key={visit.leadId} className={vi > 0 ? 'border-t-2 border-dashed border-gray-200' : ''}>
                                                {/* Visit Header — date bar */}
                                                <div className="px-5 py-2.5 bg-gray-50 border-y border-gray-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                                                        <span className="text-sm font-semibold text-gray-800">{formatShortDate(visit.date)}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {/* Payment Method */}
                                                        {visit.paymentMethod && (
                                                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-md px-2 py-1">
                                                                <CreditCard className="h-3 w-3 text-gray-400" />
                                                                <span className="text-gray-400">ชำระ:</span>
                                                                <span className="font-medium">{PAYMENT_METHOD_LABELS[visit.paymentMethod] || visit.paymentMethod}</span>
                                                            </span>
                                                        )}
                                                        {/* Slip */}
                                                        {slipUrls.length > 0 && (
                                                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-md px-2 py-1">
                                                                <ImageIcon className="h-3 w-3 text-gray-400" />
                                                                <span className="text-gray-400">สลิป:</span>
                                                                {slipUrls.map((url, idx) => (
                                                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                                                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                                                                        {slipUrls.length === 1 ? 'ดูสลิป' : `รูปที่ ${idx + 1}`}
                                                                    </a>
                                                                ))}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Procedure Table */}
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="pl-5">รายการ</TableHead>
                                                            <TableHead className="text-right w-[110px]">ยอด</TableHead>
                                                            <TableHead className="text-right w-[100px]">ค่าธรรมเนียม</TableHead>
                                                            <TableHead className="text-right w-[110px]">สุทธิ</TableHead>
                                                            <TableHead className="text-center w-[80px]">คอม %</TableHead>
                                                            <TableHead className="text-right w-[110px]">ค่าคอม</TableHead>
                                                            <TableHead className="text-right w-[100px]">ใช้มัดจำ</TableHead>
                                                            <TableHead className="text-right w-[110px] pr-5">คงเหลือ</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {visit.rows.map((row, ri) => {
                                                            const isDeposit = row.type === 'deposit';
                                                            return (
                                                                <TableRow key={ri} className={isDeposit ? 'bg-emerald-50/40' : 'hover:bg-gray-50/80'}>
                                                                    <TableCell className={`pl-5 text-sm font-medium ${isDeposit ? 'text-emerald-600' : 'text-gray-800'}`}>{row.name}</TableCell>
                                                                    <TableCell className={`text-right text-sm tabular-nums ${isDeposit ? 'text-emerald-600' : 'text-gray-700'}`}>
                                                                        {row.amount > 0 ? formatCurrency(row.amount) : '-'}
                                                                    </TableCell>
                                                                    <TableCell className="text-right text-sm tabular-nums">
                                                                        {!isDeposit && row.serviceCharge > 0
                                                                            ? <span className="text-orange-600">{formatCurrency(row.serviceCharge)}</span>
                                                                            : <span className="text-gray-300">-</span>}
                                                                    </TableCell>
                                                                    <TableCell className="text-right text-sm tabular-nums">
                                                                        {!isDeposit && row.amount > 0
                                                                            ? <span className="font-medium text-gray-700">{formatCurrency(row.netAmount)}</span>
                                                                            : <span className="text-gray-300">-</span>}
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        {!isDeposit && row.amount > 0 ? (
                                                                            <div className="flex justify-center">
                                                                                <div className="relative w-16">
                                                                                    <Input type="number" min={0} max={100} value={row.commissionRate || ''}
                                                                                        onChange={(e) => handleRateChange(row.leadId, row.procedureIndex, e.target.value)}
                                                                                        placeholder="0"
                                                                                        className="h-7 text-center pr-5 text-xs font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                                                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                                                                                </div>
                                                                            </div>
                                                                        ) : <span className="text-gray-300">-</span>}
                                                                    </TableCell>
                                                                    <TableCell className="text-right text-sm tabular-nums">
                                                                        {!isDeposit && row.commissionAmount > 0
                                                                            ? <span className="font-semibold text-emerald-600">{formatCurrency(row.commissionAmount)}</span>
                                                                            : <span className="text-gray-300">-</span>}
                                                                    </TableCell>
                                                                    <TableCell className="text-right text-sm tabular-nums">
                                                                        {isDeposit ? <span className="font-medium text-emerald-600">+{formatCurrency(row.depositUsed)}</span>
                                                                            : row.depositUsed > 0 ? <span className="font-medium text-red-500">-{formatCurrency(row.depositUsed)}</span>
                                                                                : <span className="text-gray-300">-</span>}
                                                                    </TableCell>
                                                                    <TableCell className="text-right text-sm tabular-nums font-medium text-gray-700 pr-5">{formatCurrency(row.depositBalance)}</TableCell>
                                                                </TableRow>
                                                            );
                                                        })}

                                                        {/* Visit Subtotal */}
                                                        <TableRow className="bg-emerald-50/70 border-t-2 border-emerald-200">
                                                            <TableCell className="pl-5 text-sm font-bold text-emerald-800">รวม</TableCell>
                                                            <TableCell className="text-right text-sm font-bold text-gray-800 tabular-nums">
                                                                {formatCurrency(visitProcs.reduce((s, r) => s + Number(r.amount || 0), 0))}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm tabular-nums">
                                                                {visit.serviceChargeAmount > 0
                                                                    ? <span className="font-semibold text-orange-600">{formatCurrency(visit.serviceChargeAmount)}</span>
                                                                    : <span className="text-gray-300">-</span>}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm font-bold text-gray-800 tabular-nums">
                                                                {formatCurrency(visit.netAmount)}
                                                            </TableCell>
                                                            <TableCell />
                                                            <TableCell className="text-right text-sm font-bold text-emerald-700 tabular-nums">
                                                                {visitCommission > 0 ? formatCurrency(visitCommission) : '-'}
                                                            </TableCell>
                                                            <TableCell colSpan={2} />
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}

                            {/* ====== Grand Total ====== */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden px-5 py-4 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-800">รวมทั้งหมด ({groups.length} คน, {groups.reduce((s, g) => s + g.totalVisits, 0)} ครั้ง)</span>
                                    <div className="flex items-center gap-6 text-sm tabular-nums">
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400">ยอดหัตถการ</p>
                                            <p className="font-bold text-blue-700">{formatCurrency(totalAmount)}</p>
                                        </div>
                                        {totalServiceCharge > 0 && (
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-400">ค่าธรรมเนียม</p>
                                                <p className="font-bold text-orange-600">{formatCurrency(totalServiceCharge)}</p>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400">สุทธิ</p>
                                            <p className="font-bold text-gray-800">{formatCurrency(totalNet)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400">คอมมิชชันรวม</p>
                                            <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalCommission)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Floating dirty indicator */}
            {dirtyLeads.size > 0 && (
                <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm z-50">
                    <Save className="h-4 w-4" />
                    {dirtyLeads.size} รายการที่ยังไม่บันทึก
                </div>
            )}
        </div>
    );
}