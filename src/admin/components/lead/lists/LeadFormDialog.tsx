import { useState, useEffect, useRef } from 'react';
import { useLeadsStore } from '@/stores/externalLeadsStore';
import { optionsApi, uploadsApi } from '@/services/externalLeadsService';
import { useUser } from '@/hooks/useUser';

const LEADS_BASE_URL = (() => {
    const raw = import.meta.env.VITE_LEADS_API_URL || 'http://localhost:3008';
    try { return new URL(raw).origin; } catch { return raw; }
})();

const resolveLeadFileUrl = (path: string): string => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${LEADS_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
import type {
    Lead,
    LeadAppointment,
    CreateLeadDTO,
    UpdateLeadDTO,
    ClinicOption,
    ClinicOptionsData,
} from '@/types/externalLeads';
import { DEFAULT_LEAD_FORM } from '../../../utils/leadHelpers';
import type { LeadFormData } from '../../../utils/leadHelpers';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Loader2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Building2,
    UserPlus,
    CalendarClock,
    Phone,
    User,
    MessageCircle,
    Heart,
    Megaphone,
    Wallet,
    StickyNote,
    Clock,
    Upload,
    X,
} from 'lucide-react';

interface LeadFormDialogProps {
    open: boolean;
    lead: Lead | null;
    clinics: ClinicOption[];
    onClose: () => void;
    onSuccess: () => void;
}

const MAX_SLIPS = 5;

export default function LeadFormDialog({
    open,
    lead,
    clinics,
    onClose,
    onSuccess,
}: LeadFormDialogProps) {
    const isEdit = !!lead;
    const { user: currentUser } = useUser();

    const isSubmitting = useLeadsStore((s) => s.isSubmitting);
    const createLead = useLeadsStore((s) => s.createLead);
    const updateLead = useLeadsStore((s) => s.updateLead);

    const [form, setForm] = useState<LeadFormData>(DEFAULT_LEAD_FORM);
    const [formStep, setFormStep] = useState(1);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [depositEnabled, setDepositEnabled] = useState(false);
    const [clinicSettings, setClinicSettings] = useState<ClinicOptionsData | null>(null);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [slipFiles, setSlipFiles] = useState<File[]>([]);
    const [slipPreviews, setSlipPreviews] = useState<string[]>([]);
    const [isUploadingSlips, setIsUploadingSlips] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // existing slip URLs from lead (server paths, not File objects)
    const [existingSlipUrls, setExistingSlipUrls] = useState<string[]>([]);

    useEffect(() => {
        if (!open) {
            setClinicSettings(null);
            setFormStep(1);
            setFormErrors({});
            setDepositEnabled(false);
            setSlipFiles([]);
            setSlipPreviews([]);
            setExistingSlipUrls([]);
            return;
        }
        if (lead) {
            const depositAmount = lead.deposit?.amount ?? 0;
            setForm({
                clinicId: String(lead.clinic.clinicId),
                fullname: lead.patient.fullname,
                tel: lead.patient.tel || '',
                nickname: lead.patient.nickname || '',
                socialMedia: lead.patient.lineId || '',
                status: lead.appointments.status,
                appointmentDate: lead.appointments.date?.split('T')[0] || '',
                appointmentTime: lead.appointments.time || '',
                // ยังไม่ set interestIds / channelId / adminId — รอ clinicSettings โหลดก่อน
                interestIds: [],
                channelId: '',
                adminId: '',
                note: lead.note || '',
                deposit: depositAmount > 0 ? String(depositAmount) : '',
            });
            setDepositEnabled(depositAmount > 0);
            setExistingSlipUrls((lead.deposit?.slipUrls || []).map(resolveLeadFileUrl).filter(Boolean));
            loadClinicSettings(lead.clinic.clinicId);
        } else {
            setForm({ ...DEFAULT_LEAD_FORM });
            setExistingSlipUrls([]);
        }
    }, [open, lead]);

    useEffect(() => {
        return () => { slipPreviews.forEach((url) => URL.revokeObjectURL(url)); };
    }, [slipPreviews]);

    const loadClinicSettings = async (clinicId: number) => {
        setIsLoadingOptions(true);
        try {
            const res = await optionsApi.getClinicOptions(clinicId);
            if (res.success && res.data) {
                setClinicSettings(res.data);

                // remap lead values → option IDs หลังโหลด options แล้ว (edit mode)
                if (lead) {
                    const opts = res.data.options;

                    // interest: หา value จาก name ที่เก็บใน lead.interests
                    const matchedInterest = lead.interests?.[0]
                        ? opts.interests.find((o) => o.name === lead.interests![0].name)?.value || ''
                        : '';

                    // channel: หา value จาก name ที่เก็บใน lead.referralChannel
                    const matchedChannel = lead.referralChannel
                        ? opts.channels.find((o) => o.name === lead.referralChannel)?.value || ''
                        : '';

                    // admin: หา value จาก name ที่เก็บใน lead.createdBy
                    const matchedAdmin = lead.createdBy
                        ? opts.admins.find((o) => o.name === lead.createdBy)?.name || ''
                        : '';

                    setForm((prev) => ({
                        ...prev,
                        interestIds: matchedInterest ? [matchedInterest] : [],
                        channelId: matchedChannel,
                        adminId: matchedAdmin,
                    }));
                }
            }
        } catch (err) {
            console.error('Failed to load clinic options:', err);
        } finally {
            setIsLoadingOptions(false);
        }
    };

    const handleClinicChange = async (clinicId: string) => {
        updateForm({ clinicId, interestIds: [], channelId: '', adminId: '' });
        if (formErrors.clinicId) setFormErrors((p) => ({ ...p, clinicId: '' }));
        if (clinicId) await loadClinicSettings(parseInt(clinicId));
        else setClinicSettings(null);
    };

    const updateForm = (updates: Partial<LeadFormData>) => {
        setForm((prev) => ({ ...prev, ...updates }));
    };

    const handleSlipFiles = (files: FileList | null) => {
        if (!files) return;
        const incoming = Array.from(files).filter((f) => f.type.startsWith('image/'));
        const toAdd = incoming.slice(0, MAX_SLIPS - existingSlipUrls.length - slipFiles.length);
        if (!toAdd.length) return;
        const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
        setSlipFiles((prev) => [...prev, ...toAdd]);
        setSlipPreviews((prev) => [...prev, ...newPreviews]);
    };

    const removeSlip = (idx: number) => {
        URL.revokeObjectURL(slipPreviews[idx]);
        setSlipFiles((prev) => prev.filter((_, i) => i !== idx));
        setSlipPreviews((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleNextStep = () => {
        const errors: Record<string, string> = {};
        if (!form.clinicId) errors.clinicId = 'กรุณาเลือกคลินิก';
        if (!form.fullname.trim()) errors.fullname = 'กรุณากรอกชื่อ-นามสกุล';
        setFormErrors(errors);
        if (Object.keys(errors).length === 0) setFormStep(2);
    };

    const handleSubmit = async () => {
        if (!form.clinicId || !form.fullname) return;

        // Step 1: upload slip images first → get URLs
        let uploadedSlipUrls: string[] = [];
        if (slipFiles.length > 0 && depositEnabled) {
            setIsUploadingSlips(true);
            try {
                const res = await uploadsApi.uploadSlips(slipFiles);
                if (res.success && res.data) uploadedSlipUrls = res.data.urls;
            } catch (err) {
                console.error('Slip upload failed:', err);
            } finally {
                setIsUploadingSlips(false);
            }
        }

        const depositAmount = depositEnabled && form.deposit ? parseFloat(form.deposit) : undefined;
        const clinicId = parseInt(form.clinicId);

        // รวม slipUrls เดิม + ที่อัปโหลดใหม่
        const allSlipUrls = [...existingSlipUrls, ...uploadedSlipUrls];
        const depositPayload = depositAmount
            ? { amount: depositAmount, slipUrls: allSlipUrls }
            : undefined;

        // Step 2: create / update lead
        // let savedPatientId: string | undefined;

        if (isEdit && lead) {
            const dto: UpdateLeadDTO = {
                patient: {
                    fullname: form.fullname.trim(),
                    tel: form.tel || undefined,
                    nickname: form.nickname || undefined,
                    lineId: form.socialMedia || undefined,
                },
                appointments: {
                    status: form.status,
                    date: form.appointmentDate || undefined,
                    time: form.appointmentTime || undefined,
                },
                interests: form.interestIds.length > 0
                    ? form.interestIds.map((id) => {
                        const interest = clinicSettings?.options.interests.find((i) => i.value === id);
                        return { name: interest?.name || id };
                    })
                    : undefined,
                referralChannel: form.channelId
                    ? clinicSettings?.options.channels.find((c) => c.value === form.channelId)?.name
                    : undefined,
                note: form.note || undefined,
                deposit: depositPayload,
            };
            const success = await updateLead(lead._id, lead.clinic.clinicId, dto);
            if (!success) return;
            // savedPatientId = lead.patientId;
        } else {
            const selectedClinic = clinics.find((c) => c.clinicId === clinicId);
            if (!selectedClinic) return;
            const dto: CreateLeadDTO = {
                clinic: { clinicId: selectedClinic.clinicId, name: selectedClinic.clinicName, branch: selectedClinic.branch },
                patient: {
                    fullname: form.fullname.trim(),
                    tel: form.tel || undefined,
                    nickname: form.nickname || undefined,
                    lineId: form.socialMedia || undefined,
                },
                appointments: {
                    status: form.status,
                    date: form.appointmentDate || undefined,
                    time: form.appointmentTime || undefined,
                },
                interests: form.interestIds.length > 0
                    ? form.interestIds.map((id) => {
                        const interest = clinicSettings?.options.interests.find((i) => i.value === id);
                        return { name: interest?.name || id };
                    })
                    : undefined,
                referralChannel: form.channelId
                    ? clinicSettings?.options.channels.find((c) => c.value === form.channelId)?.name
                    : undefined,
                note: form.note || undefined,
                deposit: depositPayload,
                createdBy: form.adminId || currentUser?.id || 'synergy-admin',
            };
            const createdLead = await createLead(dto);
            if (!createdLead) return;
            // savedPatientId = createdLead.patientId; // ได้จาก response โดยตรง
        }

        onClose();
        onSuccess();
    };

    const steps = [
        { step: 1, label: 'ข้อมูลลูกค้า', icon: User },
        { step: 2, label: 'นัดหมาย', icon: CalendarClock },
    ];

    const statusOptions = [
        { value: 'pending', label: 'รอตัดสินใจ', dot: 'bg-yellow-400', desc: 'ยังไม่ได้กำหนดวันนัด' },
        { value: 'scheduled', label: 'ทำนัด', dot: 'bg-blue-500', desc: 'กำหนดวันและเวลาแล้ว' },
    ];

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">

                {/* ── Header ── */}
                {/* Title bar — purple */}
                <div className="relative px-6 pt-6 pb-5 shrink-0 overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600">
                    <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
                    <div className="relative flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-lg">
                            <UserPlus className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-white leading-tight tracking-tight">
                                {isEdit ? 'แก้ไขข้อมูล Lead' : 'เพิ่ม Lead ใหม่'}
                            </DialogTitle>
                            <DialogDescription className="text-[11px] text-purple-200/80 mt-0.5">
                                {isEdit ? 'แก้ไขข้อมูลผู้ป่วยและการนัดหมาย' : 'กรอกข้อมูลผู้ป่วยเพื่อสร้าง Lead ใหม่'}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* Stepper — white */}
                <div className="px-6 py-4 border-b bg-white shrink-0">
                    <div className="flex items-center justify-center gap-0">
                        {steps.map((item, index) => {
                            const StepIcon = item.icon;
                            const isActive = formStep === item.step;
                            const isDone = formStep > item.step;
                            return (
                                <div key={item.step} className="flex items-center">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border-2
                                            ${isDone
                                                ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-200'
                                                : isActive
                                                    ? 'bg-white border-purple-500 text-purple-600 shadow-sm shadow-purple-100'
                                                    : 'bg-white border-gray-200 text-gray-400'}`}>
                                            {isDone ? <CheckCircle2 className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                                        </div>
                                        <span className={`text-[11px] font-medium whitespace-nowrap
                                            ${isActive ? 'text-purple-600' : isDone ? 'text-purple-400' : 'text-gray-400'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className="relative w-24 mx-3 mb-5">
                                            <div className="h-px bg-gray-200 w-full" />
                                            <div className={`absolute inset-0 h-px bg-purple-400 transition-all duration-500 ${formStep > 1 ? 'w-full' : 'w-0'}`} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto px-6 py-5">

                    {/* ─── Step 1 ─── */}
                    {formStep === 1 && (
                        <div className="space-y-5">
                            <FieldGroup icon={Building2} label="คลินิก" required error={formErrors.clinicId}>
                                <Select value={form.clinicId} onValueChange={handleClinicChange} disabled={isEdit}>
                                    <SelectTrigger className={`h-10 w-full ${formErrors.clinicId ? 'border-red-400' : ''}`}>
                                        <SelectValue placeholder="เลือกคลินิก" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4} align="start" avoidCollisions collisionPadding={8} className="w-[var(--radix-select-trigger-width)] max-h-44 overflow-y-auto">
                                        {clinics.map((clinic) => (
                                            <SelectItem key={clinic.clinicId} value={String(clinic.clinicId)} disabled={clinic.isExpired}>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                                    <span>{clinic.label}</span>
                                                    {clinic.isExpired && <Badge variant="outline" className="text-red-500 text-xs ml-1">หมดอายุ</Badge>}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {isLoadingOptions && (
                                    <p className="text-xs text-purple-500 mt-1.5 flex items-center gap-1.5">
                                        <Loader2 className="h-3 w-3 animate-spin" /> กำลังโหลดตัวเลือก...
                                    </p>
                                )}
                            </FieldGroup>

                            <div className="grid grid-cols-[1fr_120px] gap-3">
                                <FieldGroup icon={User} label="ชื่อ-นามสกุล" required error={formErrors.fullname}>
                                    <Input
                                        value={form.fullname}
                                        onChange={(e) => {
                                            updateForm({ fullname: e.target.value });
                                            if (formErrors.fullname) setFormErrors((p) => ({ ...p, fullname: '' }));
                                        }}
                                        placeholder="กรอกชื่อ-นามสกุล"
                                        className={`h-10 ${formErrors.fullname ? 'border-red-400' : ''}`}
                                    />
                                </FieldGroup>
                                <FieldGroup label="ชื่อเล่น">
                                    <Input value={form.nickname} onChange={(e) => updateForm({ nickname: e.target.value })} placeholder="ชื่อเล่น" className="h-10" />
                                </FieldGroup>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FieldGroup icon={Phone} label="เบอร์โทรศัพท์">
                                    <Input value={form.tel} onChange={(e) => updateForm({ tel: e.target.value })} placeholder="08X-XXX-XXXX" className="h-10" />
                                </FieldGroup>
                                <FieldGroup icon={MessageCircle} label="Social / Line ID">
                                    <Input value={form.socialMedia} onChange={(e) => updateForm({ socialMedia: e.target.value })} placeholder="Line ID / Facebook" className="h-10" />
                                </FieldGroup>
                            </div>

                            {clinicSettings && (
                                <div className="space-y-4 pt-1">
                                    {clinicSettings.options.interests.length > 0 && (
                                        <FieldGroup icon={Heart} label="ความสนใจ">
                                            <Select
                                                value={form.interestIds[0] || '__none__'}
                                                onValueChange={(v) => updateForm({ interestIds: v === '__none__' ? [] : [v] })}
                                            >
                                                <SelectTrigger className="h-10 w-full">
                                                    <SelectValue placeholder="เลือกความสนใจ" />
                                                </SelectTrigger>
                                                <SelectContent position="popper" sideOffset={4} align="start" avoidCollisions collisionPadding={8} className="w-[var(--radix-select-trigger-width)] max-h-52 overflow-y-auto">
                                                    <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                                                    {clinicSettings.options.interests.map((interest) => (
                                                        <SelectItem key={interest.value} value={interest.value}>{interest.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FieldGroup>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        {clinicSettings.options.channels.length > 0 && (
                                            <FieldGroup icon={Megaphone} label="ช่องทางที่รู้จัก">
                                                <Select value={form.channelId || '__none__'} onValueChange={(v) => updateForm({ channelId: v === '__none__' ? '' : v })}>
                                                    <SelectTrigger className="h-10 w-full">
                                                        <SelectValue placeholder="เลือกช่องทาง" />
                                                    </SelectTrigger>
                                                    <SelectContent position="popper" sideOffset={4} align="start" avoidCollisions collisionPadding={8} className="w-[var(--radix-select-trigger-width)] max-h-44 overflow-y-auto">
                                                        <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                                                        {clinicSettings.options.channels.map((ch) => (
                                                            <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FieldGroup>
                                        )}
                                        {clinicSettings.options.admins.length > 0 && (
                                            <FieldGroup icon={User} label="แอดมิน">
                                                <Select value={form.adminId || '__none__'} onValueChange={(v) => updateForm({ adminId: v === '__none__' ? '' : v })}>
                                                    <SelectTrigger className="h-10 w-full">
                                                        <SelectValue placeholder="เลือกแอดมิน" />
                                                    </SelectTrigger>
                                                    <SelectContent position="popper" sideOffset={4} align="start" avoidCollisions collisionPadding={8} className="w-[var(--radix-select-trigger-width)] max-h-44 overflow-y-auto">
                                                        <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                                                        {clinicSettings.options.admins.map((admin) => (
                                                            <SelectItem key={admin.value} value={admin.name}>{admin.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FieldGroup>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── Step 2 ─── */}
                    {formStep === 2 && (
                        <div className="space-y-5">

                            {/* สถานะ — 2 ตัวเลือก */}
                            <FieldGroup icon={Clock} label="สถานะนัดหมาย">
                                <div className="grid grid-cols-2 gap-2 pt-0.5">
                                    {statusOptions.map((s) => {
                                        const isActive = form.status === s.value;
                                        return (
                                            <button
                                                key={s.value}
                                                type="button"
                                                onClick={() => updateForm({ status: s.value as LeadAppointment['status'] })}
                                                className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all
                                                    ${isActive
                                                        ? 'border-purple-400 bg-purple-50 shadow-sm'
                                                        : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                            >
                                                <span className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
                                                <div>
                                                    <p className={`text-sm font-semibold leading-none ${isActive ? 'text-purple-700' : 'text-gray-700'}`}>{s.label}</p>
                                                    <p className="text-xs text-gray-400 mt-1 leading-none">{s.desc}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </FieldGroup>

                            {/* วัน + เวลา — เฉพาะ scheduled */}
                            {form.status === 'scheduled' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <FieldGroup label="วันที่นัด">
                                        <Input type="date" value={form.appointmentDate} onChange={(e) => updateForm({ appointmentDate: e.target.value })} className="h-10" />
                                    </FieldGroup>
                                    <FieldGroup label="เวลานัด">
                                        <Input type="time" value={form.appointmentTime} onChange={(e) => updateForm({ appointmentTime: e.target.value })} className="h-10" />
                                    </FieldGroup>
                                </div>
                            )}

                            {/* มัดจำ */}
                            <div className={`rounded-xl border transition-all ${depositEnabled ? 'border-purple-200 bg-purple-50/40' : 'border-gray-200 bg-gray-50/50'}`}>
                                <div className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-1.5 rounded-lg transition-colors ${depositEnabled ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Wallet className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 leading-none">มัดจำ</p>
                                            <p className="text-xs text-gray-400 mt-0.5">บันทึกข้อมูลการมัดจำและสลิป</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={depositEnabled}
                                        onClick={() => {
                                            setDepositEnabled(!depositEnabled);
                                            if (depositEnabled) {
                                                updateForm({ deposit: '' });
                                                setSlipFiles([]);
                                                slipPreviews.forEach((u) => URL.revokeObjectURL(u));
                                                setSlipPreviews([]);
                                            }
                                        }}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${depositEnabled ? 'bg-purple-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${depositEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>

                                {depositEnabled && (
                                    <div className="px-4 pb-4 pt-1 border-t border-purple-100 space-y-4">
                                        {/* จำนวนเงิน */}
                                        <div>
                                            <Label className="text-xs font-medium text-purple-700 mb-1.5 block">จำนวนเงินมัดจำ</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={form.deposit}
                                                    onChange={(e) => updateForm({ deposit: e.target.value })}
                                                    placeholder="0"
                                                    className="h-10 pr-12 bg-white border-purple-200 focus:border-purple-400"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-400 font-medium">บาท</span>
                                            </div>
                                        </div>

                                        {/* อัปโหลดสลิป */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <Label className="text-xs font-medium text-purple-700">สลิปการโอน</Label>
                                                <span className="text-[11px] text-gray-400 tabular-nums">
                                                    {existingSlipUrls.length + slipFiles.length}/{MAX_SLIPS} รูป
                                                </span>
                                            </div>

                                            {/* สลิปเดิม (server URLs) */}
                                            {existingSlipUrls.length > 0 && (
                                                <div className="grid grid-cols-5 gap-2 mb-2">
                                                    {existingSlipUrls.map((url, idx) => (
                                                        <div key={`existing-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-purple-200 bg-gray-50">
                                                            <img src={url} alt={`existing-slip-${idx + 1}`} className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => setExistingSlipUrls((prev) => prev.filter((_, i) => i !== idx))}
                                                                className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* สลิปใหม่ (object URLs) */}
                                            {slipPreviews.length > 0 && (
                                                <div className="grid grid-cols-5 gap-2 mb-2">
                                                    {slipPreviews.map((url, idx) => (
                                                        <div key={`new-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-purple-200 bg-gray-50">
                                                            <img src={url} alt={`slip-${idx + 1}`} className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSlip(idx)}
                                                                className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {existingSlipUrls.length + slipFiles.length < MAX_SLIPS && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="w-full h-16 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-purple-200 rounded-xl bg-white hover:bg-purple-50/50 hover:border-purple-300 transition-all text-purple-400 hover:text-purple-500"
                                                    >
                                                        <Upload className="h-4 w-4" />
                                                        <span className="text-xs font-medium">คลิกเพื่ออัปโหลดสลิป</span>
                                                    </button>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        className="hidden"
                                                        onChange={(e) => { handleSlipFiles(e.target.files); e.target.value = ''; }}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* หมายเหตุ */}
                            <FieldGroup icon={StickyNote} label="หมายเหตุ">
                                <Textarea
                                    value={form.note}
                                    onChange={(e) => updateForm({ note: e.target.value })}
                                    placeholder="หมายเหตุเพิ่มเติม..."
                                    rows={3}
                                    className="resize-none text-sm"
                                />
                            </FieldGroup>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t bg-gray-50/60 shrink-0">
                    {formStep === 1 ? (
                        <div className="flex justify-between items-center">
                            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-700">ยกเลิก</Button>
                            <Button onClick={handleNextStep} className="bg-purple-600 hover:bg-purple-700 h-9 px-5 shadow-sm shadow-purple-200">
                                ถัดไป <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <Button variant="ghost" size="sm" onClick={() => setFormStep(1)} className="text-gray-500 hover:text-gray-700">
                                <ChevronLeft className="w-4 h-4 mr-1" /> ย้อนกลับ
                            </Button>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting || isUploadingSlips} className="h-9 text-gray-600">ยกเลิก</Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting || isUploadingSlips} className="bg-purple-600 hover:bg-purple-700 h-9 px-5 shadow-sm shadow-purple-200">
                                    {isSubmitting || isUploadingSlips ? (
                                        <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                            {isUploadingSlips ? 'กำลังอัปโหลดสลิป...' : 'กำลังบันทึก...'}</>
                                    ) : (
                                        <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> บันทึก</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ==================== Sub-components ====================

function FieldGroup({
    icon: Icon,
    label,
    required,
    error,
    children,
}: {
    icon?: React.ComponentType<any>;
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
                {Icon && <Icon className="h-3.5 w-3.5 text-gray-400" />}
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                </Label>
            </div>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}