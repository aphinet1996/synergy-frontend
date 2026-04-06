import type { Lead } from '@/types/externalLeads';
import { formatDate, formatCurrency, formatShortDate, STATUS_CONFIG, resolveFileUrl } from '../../../utils/leadHelpers';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Eye,
    Pencil,
    Clock,
    Calendar,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Phone,
    User,
    Building2,
    CalendarDays,
    Heart,
    Megaphone,
    CreditCard,
    Image as ImageIcon,
    StickyNote,
    UserPlus,
    MessageCircle,
} from 'lucide-react';

const STATUS_ICONS: Record<string, React.ComponentType<any>> = {
    pending: Clock,
    scheduled: Calendar,
    rescheduled: RefreshCw,
    arrived: CheckCircle2,
    cancelled: XCircle,
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: 'เงินสด',
    transfer: 'โอนเงิน',
    card: 'บัตรเครดิต',
    free: 'ฟรี',
};

interface LeadDetailDialogProps {
    open: boolean;
    lead: Lead | null;
    canManage: boolean;
    onClose: () => void;
    onEdit: (lead: Lead) => void;
}

export default function LeadDetailDialog({
    open,
    lead,
    canManage,
    onClose,
    onEdit,
}: LeadDetailDialogProps) {
    if (!lead) return null;

    const statusCfg = STATUS_CONFIG[lead.appointments.status] || STATUS_CONFIG.pending;
    const StatusIcon = STATUS_ICONS[lead.appointments.status] || Clock;

    // Payment
    const paymentAmount = Number(lead.payments?.amount) || 0;
    const sc = lead.payments?.serviceCharge;
    const serviceChargeAmount = typeof sc === 'number' ? sc : Number(sc?.amount) || 0;
    const netAmount = (typeof sc === 'object' && sc?.netAmount) ? Number(sc.netAmount) : paymentAmount - serviceChargeAmount;
    const commissionTotal = lead.payments?.commission?.totalAmount || 0;
    const depositAmount = typeof lead.deposit === 'number'
        ? lead.deposit
        : Number(lead.deposit?.amount) || 0;

    // Procedures
    const procedures = lead.procedures || [];

    // Slips — แยก: สลิปมัดจำ (deposit.slipUrls) vs สลิปชำระเงิน (receiptUrls)
    const depositSlipUrls = (lead.deposit?.slipUrls || []).map(resolveFileUrl).filter(Boolean) as string[];
    const slipRaw = lead.receiptUrls?.length ? lead.receiptUrls : (lead.receiptUrl ? [lead.receiptUrl] : []);
    const slipUrls = slipRaw.map(resolveFileUrl).filter(Boolean) as string[];

    // Notes
    const hasNote = !!(lead.note || lead.arrivedNote);

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="!max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-5 pt-10 pb-4 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                <Eye className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-gray-900">
                                    {lead.patient.fullname}
                                    {lead.patient.nickname && (
                                        <span className="ml-2 text-sm font-normal text-gray-400">({lead.patient.nickname})</span>
                                    )}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                                    <Building2 className="h-3 w-3" />
                                    {lead.clinic.name}
                                    {lead.clinic.branch && ` (${lead.clinic.branch})`}
                                </DialogDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className={`${statusCfg.color} text-sm px-3 py-1`}>
                            <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                            {statusCfg.label}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* ---- Row 1: ข้อมูลผู้ป่วย + นัดหมาย ---- */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* ข้อมูลผู้ป่วย */}
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">ข้อมูลผู้ป่วย</p>
                            <div className="space-y-2.5">
                                <InfoRow icon={User} label="ชื่อ-นามสกุล" value={lead.patient.fullname} />
                                {lead.patient.nickname && <InfoRow icon={User} label="ชื่อเล่น" value={lead.patient.nickname} />}
                                <InfoRow icon={Phone} label="เบอร์โทร" value={lead.patient.tel} />
                                {lead.patient.lineId && <InfoRow icon={MessageCircle} label="Line ID" value={lead.patient.lineId} />}

                                {/* ความสนใจ */}
                                {lead.interests && lead.interests.length > 0 && (
                                    <div className="flex items-start gap-2">
                                        <Heart className="h-3.5 w-3.5 text-pink-400 shrink-0 mt-0.5" />
                                        <span className="text-gray-400 text-xs w-20 shrink-0">ความสนใจ</span>
                                        <span className="font-medium text-gray-700 text-sm">
                                            {lead.interests.map((i) => i.name).join(', ')}
                                        </span>
                                    </div>
                                )}

                                {/* ช่องทาง */}
                                {lead.referralChannel && (
                                    <InfoRow icon={Megaphone} label="ช่องทาง" value={lead.referralChannel} />
                                )}
                            </div>
                        </div>

                        {/* นัดหมาย */}
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">นัดหมาย</p>
                            <div className="space-y-2.5">
                                <InfoRow icon={CalendarDays} label="วันนัด" value={lead.appointments.date ? formatShortDate(lead.appointments.date) : '-'} />
                                <InfoRow icon={Clock} label="เวลานัด" value={lead.appointments.time || '-'} />
                                <InfoRow icon={UserPlus} label="ผู้สร้าง" value={lead.createdBy || '-'} />
                                <InfoRow icon={Calendar} label="สร้างเมื่อ" value={formatDate(lead.createdAt)} />
                            </div>
                        </div>
                    </div>

                    {/* ---- หัตถการ ---- */}
                    {procedures.length > 0 && (
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                                หัตถการ ({procedures.length} รายการ)
                            </p>
                            <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-xs text-gray-500">
                                            <th className="text-left font-medium px-3 py-2">รายการ</th>
                                            <th className="text-right font-medium px-3 py-2 w-[90px]">ราคา</th>
                                            <th className="text-right font-medium px-3 py-2 w-[90px]">ค่าธรรมเนียม</th>
                                            <th className="text-right font-medium px-3 py-2 w-[90px]">ยอดสุทธิ</th>
                                            <th className="text-right font-medium px-3 py-2 w-[90px]">ใช้มัดจำ</th>
                                            <th className="text-center font-medium px-3 py-2 w-[60px]">คอม %</th>
                                            <th className="text-right font-medium px-3 py-2 w-[90px]">ค่าคอม</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const totalProcPrice = procedures.reduce((s, p) => s + (Number(p.price) || 0), 0);
                                            return procedures.map((proc, idx) => {
                                                const price = Number(proc.price) || 0;
                                                const rate = Number(proc.commissionRate) || 0;
                                                const procCharge = serviceChargeAmount > 0 && totalProcPrice > 0
                                                    ? Math.round(serviceChargeAmount * price / totalProcPrice)
                                                    : 0;
                                                const procNet = price - procCharge;
                                                const commAmt = Number(proc.commissionAmount) || Math.round(procNet * rate / 100);
                                                const depositUsed = Number(proc.depositUsed) || 0;
                                                return (
                                                    <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50/50">
                                                        <td className="px-3 py-2 font-medium text-gray-800">{proc.name}</td>
                                                        <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                                                            {price > 0 ? formatCurrency(price) : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right tabular-nums text-orange-500">
                                                            {procCharge > 0 ? formatCurrency(procCharge) : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right tabular-nums text-gray-700 font-medium">
                                                            {price > 0 ? formatCurrency(procNet) : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right tabular-nums text-violet-600 font-medium">
                                                            {depositUsed > 0 ? formatCurrency(depositUsed) : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-center tabular-nums text-gray-500">
                                                            {rate > 0 ? `${rate}%` : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right tabular-nums font-medium text-emerald-600">
                                                            {commAmt > 0 ? formatCurrency(commAmt) : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                    {/* Procedures total */}
                                    {procedures.length > 1 && (
                                        <tfoot>
                                            <tr className="border-t-2 border-emerald-200 bg-emerald-50/70">
                                                <td className="px-3 py-2 font-bold text-emerald-800">รวม</td>
                                                <td className="px-3 py-2 text-right tabular-nums font-bold text-gray-800">
                                                    {formatCurrency(procedures.reduce((s, p) => s + (Number(p.price) || 0), 0))}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums font-bold text-orange-600">
                                                    {serviceChargeAmount > 0 ? formatCurrency(serviceChargeAmount) : '-'}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums font-bold text-gray-800">
                                                    {formatCurrency(netAmount)}
                                                </td>
                                                <td />
                                                <td />
                                                <td className="px-3 py-2 text-right tabular-nums font-bold text-emerald-700">
                                                    {(() => {
                                                        const totalProcPrice = procedures.reduce((s, p) => s + (Number(p.price) || 0), 0);
                                                        return formatCurrency(procedures.reduce((s, p) => {
                                                            const price = Number(p.price) || 0;
                                                            const rate = Number(p.commissionRate) || 0;
                                                            const procCharge = serviceChargeAmount > 0 && totalProcPrice > 0
                                                                ? Math.round(serviceChargeAmount * price / totalProcPrice)
                                                                : 0;
                                                            const procNet = price - procCharge;
                                                            return s + (Number(p.commissionAmount) || Math.round(procNet * rate / 100));
                                                        }, 0));
                                                    })()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ---- วิธีชำระและใบเสร็จ ---- */}
                    {(lead.payments?.method || slipUrls.length > 0) && (
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">วิธีชำระและใบเสร็จ</p>
                            <div className="flex flex-wrap items-center gap-2">
                                {lead.payments?.method && (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-md px-2 py-1">
                                        <CreditCard className="h-3 w-3 text-gray-400" />
                                        <span className="text-gray-400">ชำระ:</span>
                                        <span className="font-medium">{PAYMENT_METHOD_LABELS[lead.payments.method] || lead.payments.method}</span>
                                    </span>
                                )}
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
                    )}

                    {/* ---- สรุปการชำระ ---- */}
                    {(paymentAmount > 0 || depositAmount > 0) && (() => {
                        const totalDepositUsed = procedures.reduce((s, p) => s + (Number(p.depositUsed) || 0), 0);
                        const depositRemaining = Math.max(depositAmount - totalDepositUsed, 0);
                        return (
                            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">สรุปการชำระ</p>
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    {/* ยอดรวม */}
                                    {paymentAmount > 0 && (
                                        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                                            <span className="text-gray-500">ยอดรวม</span>
                                            <span className="tabular-nums font-medium text-gray-800">{formatCurrency(paymentAmount)}</span>
                                        </div>
                                    )}
                                    {/* ค่าธรรมเนียม */}
                                    {serviceChargeAmount > 0 && (
                                        <div className="flex items-center justify-between px-4 py-2.5 text-sm border-t border-dashed border-gray-100">
                                            <span className="text-gray-500">ค่าธรรมเนียม</span>
                                            <span className="tabular-nums text-orange-500">− {formatCurrency(serviceChargeAmount)}</span>
                                        </div>
                                    )}
                                    {/* ยอดสุทธิ */}
                                    {paymentAmount > 0 && (
                                        <div className="flex items-center justify-between px-4 py-2.5 text-sm border-t border-gray-200 bg-gray-50">
                                            <span className="font-semibold text-gray-700">ยอดสุทธิ</span>
                                            <span className="tabular-nums font-bold text-gray-900">{formatCurrency(netAmount)}</span>
                                        </div>
                                    )}
                                    {/* divider ก่อนมัดจำ */}
                                    {depositAmount > 0 && (
                                        <>
                                            <div className="flex items-center justify-between px-4 py-2.5 text-sm border-t border-gray-200">
                                                <span className="text-gray-500">มัดจำ</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="tabular-nums text-violet-600 font-medium">{formatCurrency(depositAmount)}</span>
                                                    {depositSlipUrls.length > 0 && depositSlipUrls.map((url, idx) => (
                                                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                                            className="text-xs text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1">
                                                            <ImageIcon className="h-3 w-3" />
                                                            {depositSlipUrls.length === 1 ? 'สลิป' : `สลิป ${idx + 1}`}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between px-4 py-2.5 text-sm border-t border-dashed border-gray-100">
                                                <span className="text-gray-500">มัดจำที่ใช้</span>
                                                <span className="tabular-nums text-violet-600">− {formatCurrency(totalDepositUsed)}</span>
                                            </div>
                                            <div className="flex items-center justify-between px-4 py-2.5 text-sm border-t border-dashed border-gray-100">
                                                <span className="text-gray-500">มัดจำคงเหลือ</span>
                                                <span className={`tabular-nums font-semibold ${depositRemaining > 0 ? 'text-violet-700' : 'text-gray-400'}`}>
                                                    {formatCurrency(depositRemaining)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    {/* ค่าคอมมิชชัน */}
                                    {commissionTotal > 0 && (
                                        <div className="flex items-center justify-between px-4 py-2.5 text-sm border-t-2 border-emerald-200 bg-emerald-50/60">
                                            <span className="font-semibold text-emerald-800">ค่าคอมมิชชัน</span>
                                            <span className="tabular-nums font-bold text-emerald-700">{formatCurrency(commissionTotal)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* ---- หมายเหตุ ---- */}
                    {hasNote && (
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">หมายเหตุ</p>
                            <div className="space-y-2">
                                {lead.note && (
                                    <div className="flex items-start gap-2">
                                        <StickyNote className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] text-gray-400 mb-0.5">หมายเหตุ</p>
                                            <p className="text-sm text-gray-700 bg-white rounded-lg border border-gray-100 p-2.5">{lead.note}</p>
                                        </div>
                                    </div>
                                )}
                                {lead.arrivedNote && (
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] text-gray-400 mb-0.5">บันทึกตอนมาถึง</p>
                                            <p className="text-sm text-gray-700 bg-white rounded-lg border border-gray-100 p-2.5">{lead.arrivedNote}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-3.5 border-t bg-gray-50/50 flex items-center justify-end gap-3 shrink-0">
                    {/* <Button variant="outline" onClick={onClose} className="h-9">ปิด</Button> */}
                    {canManage && (
                        <Button
                            className="h-9 bg-blue-600 hover:bg-blue-700"
                            onClick={() => { onClose(); onEdit(lead); }}
                        >
                            <Pencil className="h-4 w-4 mr-1.5" />
                            แก้ไข
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<any>; label: string; value?: string | null }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="text-gray-400 text-xs w-20 shrink-0">{label}</span>
            <span className="font-medium text-gray-700 truncate">{value || '-'}</span>
        </div>
    );
}