import { useState, useEffect, useRef } from 'react';
import { usePatientsStore } from '@/stores/externalLeadsStore';
import { externalLeadsService } from '@/services/externalLeadsService';
import type {
    Patient,
    ClinicOption,
    ClinicOptionsData,
    CreatePatientDTO,
    UpdatePatientDTO,
} from '@/types/externalLeads';
import { DEFAULT_FORM, patientToForm } from '../../../utils/patientHelpers';
import type { PatientFormData } from '../../../utils/patientHelpers';

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
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Loader2,
    Building2,
    UserPlus,
    UserPen,
    User,
    Phone,
    MessageCircle,
    Heart,
    Megaphone,
    GitBranch,
    StickyNote,
    CheckCircle2,
} from 'lucide-react';

interface PatientFormDialogProps {
    open: boolean;
    patient: Patient | null;
    selectedClinicId: string;
    clinics: ClinicOption[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function PatientFormDialog({
    open,
    patient,
    selectedClinicId,
    clinics,
    onClose,
    onSuccess,
}: PatientFormDialogProps) {
    const isEdit = !!patient;

    const isSubmitting = usePatientsStore((s) => s.isSubmitting);
    const createPatient = usePatientsStore((s) => s.createPatient);
    const updatePatient = usePatientsStore((s) => s.updatePatient);

    const [form, setForm] = useState<PatientFormData>(DEFAULT_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [clinicSettings, setClinicSettings] = useState<ClinicOptionsData | null>(null);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const prevClinicRef = useRef<string>('');

    useEffect(() => {
        if (!open) {
            setClinicSettings(null);
            prevClinicRef.current = '';
            return;
        }
        if (patient) {
            setForm(patientToForm(patient, selectedClinicId));
        } else {
            setForm({ ...DEFAULT_FORM, clinicId: selectedClinicId });
        }
        setFormErrors({});
    }, [open, patient, selectedClinicId]);

    useEffect(() => {
        if (!open || !form.clinicId) { setClinicSettings(null); return; }
        if (prevClinicRef.current === form.clinicId) return;
        prevClinicRef.current = form.clinicId;

        let cancelled = false;
        setIsLoadingOptions(true);

        externalLeadsService.options.getClinicOptions(parseInt(form.clinicId))
            .then((res) => {
                if (!cancelled && res.success && res.data) {
                    setClinicSettings(res.data);

                    // remap stored name/label → option value (edit mode)
                    if (patient) {
                        const opts = res.data.options;

                        const matchedInterest = patient.interest
                            ? (opts.interests.find((o) => o.name === patient.interest || o.label === patient.interest)?.value || '')
                            : '';

                        const matchedChannel = patient.referralChannel
                            ? (opts.channels.find((o) => o.name === patient.referralChannel || o.label === patient.referralChannel)?.value || '')
                            : '';

                        // branch เก็บเป็น label ตรงๆ
                        const matchedBranch = patient.branch
                            ? (opts.branches.find((o) => o.label === patient.branch || o.name === patient.branch)?.label || patient.branch)
                            : '';

                        setForm((prev) => ({
                            ...prev,
                            interest: matchedInterest,
                            referralChannel: matchedChannel,
                            branch: matchedBranch,
                        }));
                    }
                }
            })
            .catch(console.error)
            .finally(() => { if (!cancelled) setIsLoadingOptions(false); });

        return () => { cancelled = true; };
    }, [open, form.clinicId]);

    const updateForm = (updates: Partial<PatientFormData>) => {
        setForm((prev) => ({ ...prev, ...updates }));
    };

    const handleClinicChange = (clinicId: string) => {
        updateForm({ clinicId, interest: '', referralChannel: '', branch: '' });
        setClinicSettings(null);
        if (formErrors.clinicId) setFormErrors((p) => ({ ...p, clinicId: '' }));
    };

    const validate = () => {
        const errors: Record<string, string> = {};
        if (!form.clinicId) errors.clinicId = 'กรุณาเลือกคลินิก';
        if (!form.fullname.trim()) errors.fullname = 'กรุณากรอกชื่อ-นามสกุล';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        const clinicId = parseInt(form.clinicId) || patient?.clinicId || parseInt(selectedClinicId);
        const baseFields = {
            fullname: form.fullname,
            nickname: form.nickname || undefined,
            tel: form.tel || undefined,
            socialMedia: form.socialMedia || undefined,
            interest: form.interest || undefined,
            referralChannel: form.referralChannel || undefined,
            branch: form.branch || undefined,
            note: form.note || undefined,
        };

        let success = false;
        if (isEdit && patient) {
            if (!clinicId) { setFormErrors({ clinicId: 'ไม่พบข้อมูล clinicId' }); return; }
            success = await updatePatient(patient._id, { clinic_id: clinicId, ...baseFields } as UpdatePatientDTO);
        } else {
            success = await createPatient({ clinic_id: parseInt(form.clinicId), ...baseFields } as CreatePatientDTO);
        }

        if (success) { onClose(); onSuccess(); }
    };

    const selectedClinic = clinics.find((c) => String(c.clinicId) === form.clinicId);
    const hasInterests = (clinicSettings?.options.interests?.length ?? 0) > 0;
    const hasChannels = (clinicSettings?.options.channels?.length ?? 0) > 0;
    const hasBranches = (clinicSettings?.options.branches?.length ?? 0) > 0;
    const hasClinicOptions = hasInterests || hasChannels || hasBranches;

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">

                {/* ── Header title — colored ── */}
                <div className="relative px-6 pt-6 pb-5 shrink-0 overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600">
                    {/* blobs */}
                    <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-black/10 blur-2xl pointer-events-none" />

                    <div className="relative flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-lg">
                            {isEdit ? <UserPen className="h-5 w-5 text-white" /> : <UserPlus className="h-5 w-5 text-white" />}
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-white leading-tight tracking-tight">
                                {isEdit ? 'แก้ไขข้อมูลคนไข้' : 'เพิ่มคนไข้ใหม่'}
                            </DialogTitle>
                            <DialogDescription className="text-[11px] text-white/70 mt-0.5">
                                {isEdit
                                    ? `${selectedClinic?.label || ''}`
                                    : 'เลือกคลินิกและกรอกข้อมูลคนไข้'}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                    {/* คลินิก */}
                    {isEdit ? (
                        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                            <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-600 font-medium">{selectedClinic?.label || `Clinic #${form.clinicId}`}</span>
                        </div>
                    ) : (
                        <FieldGroup icon={Building2} label="คลินิก" required error={formErrors.clinicId}>
                            <Select value={form.clinicId} onValueChange={handleClinicChange}>
                                <SelectTrigger className={`h-10 w-full ${formErrors.clinicId ? 'border-red-300' : ''}`}>
                                    <SelectValue placeholder="เลือกคลินิก..." />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4} align="start" avoidCollisions collisionPadding={8} className="w-[var(--radix-select-trigger-width)] max-h-44 overflow-y-auto">
                                    {clinics.map((clinic) => (
                                        <SelectItem key={clinic.clinicId} value={String(clinic.clinicId)} disabled={clinic.isExpired}>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                                <span>{clinic.label}</span>
                                                {clinic.isExpired && (
                                                    <Badge variant="outline" className="text-[10px] text-red-400 border-red-200 px-1.5 py-0 ml-1">หมดอายุ</Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldGroup>
                    )}

                    {/* ชื่อ + ชื่อเล่น */}
                    <div className="grid grid-cols-[1fr_120px] gap-3">
                        <FieldGroup icon={User} label="ชื่อ-นามสกุล" required error={formErrors.fullname}>
                            <Input
                                value={form.fullname}
                                onChange={(e) => {
                                    updateForm({ fullname: e.target.value });
                                    if (formErrors.fullname) setFormErrors((p) => ({ ...p, fullname: '' }));
                                }}
                                placeholder="กรอกชื่อ-นามสกุล"
                                className={`h-10 ${formErrors.fullname ? 'border-red-300' : ''}`}
                            />
                        </FieldGroup>
                        <FieldGroup label="ชื่อเล่น">
                            <Input value={form.nickname} onChange={(e) => updateForm({ nickname: e.target.value })} placeholder="ชื่อเล่น" className="h-10" />
                        </FieldGroup>
                    </div>

                    {/* เบอร์โทร + Social */}
                    <div className="grid grid-cols-2 gap-3">
                        <FieldGroup icon={Phone} label="เบอร์โทรศัพท์">
                            <Input value={form.tel} onChange={(e) => updateForm({ tel: e.target.value })} placeholder="08X-XXX-XXXX" className="h-10" />
                        </FieldGroup>
                        <FieldGroup icon={MessageCircle} label="Social / Line ID">
                            <Input value={form.socialMedia} onChange={(e) => updateForm({ socialMedia: e.target.value })} placeholder="Line ID / Facebook" className="h-10" />
                        </FieldGroup>
                    </div>

                    {/* ตัวเลือกคลินิก */}
                    {isLoadingOptions && (
                        <div className="flex items-center gap-2 py-3 text-xs text-purple-500">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            กำลังโหลดตัวเลือก...
                        </div>
                    )}

                    {clinicSettings && hasClinicOptions && (
                        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3.5">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">ตัวเลือกคลินิก</p>

                            {hasInterests && (
                                <FieldGroup icon={Heart} label="ความสนใจ">
                                    <Select value={form.interest || '__none__'} onValueChange={(v) => updateForm({ interest: v === '__none__' ? '' : v })}>
                                        <SelectTrigger className="h-10 w-full bg-white">
                                            <SelectValue placeholder="เลือก..." />
                                        </SelectTrigger>
                                        <SelectContent position="popper" sideOffset={4} align="start" avoidCollisions collisionPadding={8} className="w-[var(--radix-select-trigger-width)] max-h-44 overflow-y-auto">
                                            <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                                            {clinicSettings.options.interests.map((i) => (
                                                <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FieldGroup>
                            )}

                            {(hasChannels || hasBranches) && (
                                <div className="grid grid-cols-2 gap-3">
                                    {hasChannels && (
                                        <FieldGroup icon={Megaphone} label="ช่องทาง">
                                            <Select value={form.referralChannel || '__none__'} onValueChange={(v) => updateForm({ referralChannel: v === '__none__' ? '' : v })}>
                                                <SelectTrigger className="h-10 w-full bg-white">
                                                    <SelectValue placeholder="เลือก..." />
                                                </SelectTrigger>
                                                <SelectContent position="popper" sideOffset={4} align="start" avoidCollisions collisionPadding={8} className="w-[var(--radix-select-trigger-width)] max-h-44 overflow-y-auto">
                                                    <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                                                    {clinicSettings.options.channels.map((c) => (
                                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FieldGroup>
                                    )}
                                    {hasBranches && (
                                        <FieldGroup icon={GitBranch} label="สาขา">
                                            <Select value={form.branch || '__none__'} onValueChange={(v) => updateForm({ branch: v === '__none__' ? '' : v })}>
                                                <SelectTrigger className="h-10 w-full bg-white">
                                                    <SelectValue placeholder="เลือก..." />
                                                </SelectTrigger>
                                                <SelectContent position="popper" sideOffset={4} align="start" avoidCollisions collisionPadding={8} className="w-[var(--radix-select-trigger-width)] max-h-44 overflow-y-auto">
                                                    <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                                                    {clinicSettings.options.branches.map((b) => (
                                                        <SelectItem key={b.value} value={b.label}>{b.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FieldGroup>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

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

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t bg-gray-50/60 flex items-center justify-between shrink-0">
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting} className="text-gray-500 hover:text-gray-700">
                        ยกเลิก
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !form.clinicId}
                        className={`h-9 px-5 shadow-sm bg-purple-600 hover:bg-purple-700 shadow-purple-200`}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />กำลังบันทึก...</>
                        ) : (
                            <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />{isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มคนไข้'}</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

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