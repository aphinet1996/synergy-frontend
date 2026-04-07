import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { StepIndicator } from '../StepIndicator';
import {
    Loader2,
    Upload,
    CalendarIcon,
    X,
    Building2,
    Settings,
    Globe,
    ImageIcon,
    GraduationCap,
    UserPlus,
    ChevronRight,
    Stethoscope,
    Check,
    Search,
    Camera,
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Clinic, CreateClinicRequest, UpdateClinicRequest } from '@/types/clinic';
import type { UserSummary } from '@/types/user';
import { useClinicStore } from '@/stores/clinicStore';
import { useProcedureStore } from '@/stores/procedureStore';
import { userService } from '@/services/userService';
import { uploadService } from '@/services/uploadService';
import { toast } from 'sonner';

interface ClinicDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    mode?: 'create' | 'edit';
    initialData?: Clinic;
}

const STEPS = ['ข้อมูลคลินิก', 'ผู้รับผิดชอบ', 'ขอบเขตงาน'];

const schema = z.object({
    logo: z.any().optional(),
    nameTh: z.string().min(1, 'กรุณากรอกชื่อคลินิก (ไทย)'),
    nameEn: z.string().min(1, 'กรุณากรอกชื่อคลินิก (English)'),
    status: z.enum(['active', 'inactive', 'pending'], { message: 'กรุณาเลือกสถานะ' }),
    contractType: z.enum(['yearly', 'monthly', 'project'], { message: 'กรุณาเลือกประเภทสัญญา' }),
    clinicLevel: z.enum(['easy', 'soso', 'hellonearth'], { message: 'กรุณาเลือกระดับคลินิก' }),
    startDate: z.date({ message: 'กรุณาเลือกวันที่เริ่มสัญญา' }),
    endDate: z.date({ message: 'กรุณาเลือกวันที่สิ้นสุดสัญญา' }),
    note: z.string().optional(),
    setupRequirement: z.boolean(),
    setupSocial: z.boolean(),
    setupAds: z.boolean(),
    ciDesign: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
    landingPage: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
    salePage: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
    graphicDesign: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
    videoProduction: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
    salesTraining: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
    mediaTraining: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
    adsTraining: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
    websiteTraining: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
    hrRecruitment: z.boolean(),
});

type ClinicFormData = z.infer<typeof schema>;

function FormError({ error, className = '' }: { error?: { message?: string }; className?: string }) {
    return error?.message ? <p className={`text-sm text-red-500 ${className}`}>{error.message}</p> : null;
}

export function ClinicDialog({ open, onOpenChange, onSuccess, mode = 'create', initialData }: ClinicDialogProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    const [users, setUsers] = useState<UserSummary[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
    const [employeeError, setEmployeeError] = useState<string | null>(null);

    const [procedureSearch, setProcedureSearch] = useState('');

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);

    const { createClinic, updateClinic } = useClinicStore();
    const { activeProcedures, fetchActiveProcedures } = useProcedureStore();

    const form = useForm<ClinicFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            nameTh: '',
            nameEn: '',
            status: 'active',
            contractType: 'yearly',
            clinicLevel: 'easy',
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            note: '',
            setupRequirement: false,
            setupSocial: false,
            setupAds: false,
            ciDesign: 0,
            landingPage: 0,
            salePage: 0,
            graphicDesign: 0,
            videoProduction: 0,
            salesTraining: 0,
            mediaTraining: 0,
            adsTraining: 0,
            websiteTraining: 0,
            hrRecruitment: false,
        },
        mode: 'onChange',
    });

    const { register, formState: { errors }, reset, watch, setValue, trigger } = form;

    useEffect(() => {
        if (open) {
            fetchActiveProcedures();
            setUsersLoading(true);
            userService.getActiveUsers()
                .then(response => {
                    if (response.success && response.data) {
                        setUsers(response.data.users);
                    }
                })
                .finally(() => setUsersLoading(false));
        }
    }, [open, fetchActiveProcedures]);

    useEffect(() => {
        if (!open) return;

        if (mode === 'edit' && initialData) {
            const procedureIds = Array.isArray(initialData.procedures)
                ? initialData.procedures.map(p => typeof p === 'string' ? p : p.id)
                : [];

            reset({
                nameTh: initialData.name.th,
                nameEn: initialData.name.en,
                status: initialData.status,
                contractType: initialData.contractType,
                clinicLevel: initialData.clinicLevel,
                startDate: new Date(initialData.contractDateStart),
                endDate: new Date(initialData.contractDateEnd),
                note: initialData.note || '',
                setupRequirement: initialData.service?.setup?.requirement || false,
                setupSocial: initialData.service?.setup?.socialMedia || false,
                setupAds: initialData.service?.setup?.adsManager || false,
                ciDesign: initialData.service?.coperateIdentity?.reduce((sum, item) => sum + item.amount, 0) || 0,
                landingPage: initialData.service?.website?.find(w => w.name === 'Landing Page')?.amount || 0,
                salePage: initialData.service?.website?.find(w => w.name === 'Sale Page')?.amount || 0,
                graphicDesign: initialData.service?.socialMedia?.find(s => s.name === 'Graphic')?.amount || 0,
                videoProduction: initialData.service?.socialMedia?.find(s => s.name === 'Video')?.amount || 0,
                salesTraining: initialData.service?.training?.find(t => t.name === 'Sales')?.amount || 0,
                mediaTraining: initialData.service?.training?.find(t => t.name === 'Media')?.amount || 0,
                adsTraining: initialData.service?.training?.find(t => t.name === 'Ads')?.amount || 0,
                websiteTraining: initialData.service?.training?.find(t => t.name === 'Website')?.amount || 0,
                hrRecruitment: false,
            });

            setSelectedEmployees(initialData.assignedTo?.map(u => u.id) || []);
            setSelectedProcedures(procedureIds);

            if (initialData.clinicProfile) {
                setLogoPreview(initialData.clinicProfile);
                setUploadedLogoUrl(initialData.clinicProfile);
            }
            setLogoFile(null);
        } else {
            reset({
                nameTh: '',
                nameEn: '',
                status: 'active',
                contractType: 'yearly',
                clinicLevel: 'easy',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                note: '',
                setupRequirement: false,
                setupSocial: false,
                setupAds: false,
                ciDesign: 0,
                landingPage: 0,
                salePage: 0,
                graphicDesign: 0,
                videoProduction: 0,
                salesTraining: 0,
                mediaTraining: 0,
                adsTraining: 0,
                websiteTraining: 0,
                hrRecruitment: false,
            });
            setSelectedEmployees([]);
            setSelectedProcedures([]);
            setLogoPreview(null);
            setLogoFile(null);
            setUploadedLogoUrl(null);
        }
        setEmployeeError(null);
        setCurrentStep(1);
    }, [mode, initialData, reset, open]);

    const toggleEmployee = (id: string) => {
        setSelectedEmployees(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
        setEmployeeError(null);
    };

    const toggleProcedure = (id: string) => {
        setSelectedProcedures(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const startDate = watch('startDate');
    const endDate = watch('endDate');
    const status = watch('status');
    const contractType = watch('contractType');
    const clinicLevel = watch('clinicLevel');

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.position?.toLowerCase().includes(userSearch.toLowerCase())
    );

    const filteredProcedures = activeProcedures.filter(p =>
        p.name.toLowerCase().includes(procedureSearch.toLowerCase())
    );

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('รองรับเฉพาะไฟล์ JPEG, PNG, WebP, GIF');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
            return;
        }

        setLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setLogoPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = async () => {
        if (uploadedLogoUrl) {
            try {
                await uploadService.deleteFileByUrl(uploadedLogoUrl);
            } catch (error) {
                console.warn('Failed to delete uploaded file:', error);
            }
        }
        setLogoFile(null);
        setLogoPreview(null);
        setUploadedLogoUrl(null);
        setValue('logo', null);
    };

    const handleClose = () => {
        reset();
        setCurrentStep(1);
        setLogoPreview(null);
        setLogoFile(null);
        setUploadedLogoUrl(null);
        setUserSearch('');
        setProcedureSearch('');
        setSelectedEmployees([]);
        setSelectedProcedures([]);
        setEmployeeError(null);
        onOpenChange(false);
    };

    const validateStep = async (step: number): Promise<boolean> => {
        if (step === 1) {
            const fieldsToValidate: (keyof ClinicFormData)[] = ['nameTh', 'nameEn', 'status', 'contractType', 'clinicLevel', 'startDate', 'endDate'];
            return await trigger(fieldsToValidate);
        }
        if (step === 2) {
            if (selectedEmployees.length === 0) {
                setEmployeeError('กรุณาเลือกผู้รับผิดชอบอย่างน้อย 1 คน');
                return false;
            }
            setEmployeeError(null);
            return true;
        }
        if (step === 3) {
            const fieldsToValidate: (keyof ClinicFormData)[] = ['ciDesign', 'landingPage', 'salePage', 'graphicDesign', 'videoProduction', 'salesTraining', 'mediaTraining', 'adsTraining', 'websiteTraining'];
            return await trigger(fieldsToValidate);
        }
        return true;
    };

    const handleNext = async () => {
        setIsValidating(true);
        const isValid = await validateStep(currentStep);
        setIsValidating(false);
        if (isValid && currentStep < 3) setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSave = async () => {
        if (selectedEmployees.length === 0) {
            setEmployeeError('กรุณาเลือกผู้รับผิดชอบอย่างน้อย 1 คน');
            setCurrentStep(2);
            return;
        }

        const isValid = await trigger();
        if (!isValid) return;

        setIsLoading(true);

        try {
            const data = form.getValues();
            let clinicProfileUrl = uploadedLogoUrl || initialData?.clinicProfile || '';

            if (logoFile) {
                setIsUploading(true);
                toast.info('กำลังอัปโหลดรูปภาพ...');
                const uploadResult = await uploadService.uploadImage(logoFile, 'clinics');
                if (uploadResult.success && uploadResult.data) {
                    clinicProfileUrl = uploadResult.data.url;
                    setUploadedLogoUrl(clinicProfileUrl);
                    toast.success('อัปโหลดรูปภาพสำเร็จ');
                } else {
                    toast.error(uploadResult.error || 'อัปโหลดรูปภาพล้มเหลว');
                    setIsLoading(false);
                    setIsUploading(false);
                    return;
                }
                setIsUploading(false);
            }

            const serviceData = {
                setup: {
                    requirement: data.setupRequirement,
                    socialMedia: data.setupSocial,
                    adsManager: data.setupAds,
                },
                coperateIdentity: data.ciDesign > 0 ? [{ name: 'CI Design', amount: data.ciDesign, weekStart: 1, weekEnd: 4 }] : [],
                website: [
                    ...(data.landingPage > 0 ? [{ name: 'Landing Page', amount: data.landingPage, weekStart: 1, weekEnd: 8 }] : []),
                    ...(data.salePage > 0 ? [{ name: 'Sale Page', amount: data.salePage, weekStart: 1, weekEnd: 8 }] : []),
                ],
                socialMedia: [
                    ...(data.graphicDesign > 0 ? [{ name: 'Graphic', amount: data.graphicDesign, weekStart: 1, weekEnd: 52 }] : []),
                    ...(data.videoProduction > 0 ? [{ name: 'Video', amount: data.videoProduction, weekStart: 1, weekEnd: 52 }] : []),
                ],
                training: [
                    ...(data.salesTraining > 0 ? [{ name: 'Sales', amount: data.salesTraining, weekStart: 1, weekEnd: 12 }] : []),
                    ...(data.mediaTraining > 0 ? [{ name: 'Media', amount: data.mediaTraining, weekStart: 1, weekEnd: 12 }] : []),
                    ...(data.adsTraining > 0 ? [{ name: 'Ads', amount: data.adsTraining, weekStart: 1, weekEnd: 12 }] : []),
                    ...(data.websiteTraining > 0 ? [{ name: 'Website', amount: data.websiteTraining, weekStart: 1, weekEnd: 12 }] : []),
                ],
            };

            if (mode === 'edit' && initialData) {
                if (logoFile && initialData.clinicProfile && initialData.clinicProfile !== clinicProfileUrl) {
                    try {
                        await uploadService.deleteFileByUrl(initialData.clinicProfile);
                    } catch (error) {
                        console.warn('Failed to delete old logo:', error);
                    }
                }

                const updateRequest: UpdateClinicRequest = {
                    name: { th: data.nameTh, en: data.nameEn },
                    clinicProfile: clinicProfileUrl,
                    clinicLevel: data.clinicLevel,
                    contractType: data.contractType,
                    contractDateStart: format(data.startDate, 'MM/dd/yyyy'),
                    contractDateEnd: format(data.endDate, 'MM/dd/yyyy'),
                    status: data.status,
                    assignedTo: selectedEmployees,
                    note: data.note || '',
                    service: serviceData,
                    procedures: selectedProcedures,
                };

                const result = await updateClinic(initialData.id, updateRequest);
                if (result.success) {
                    toast.success('แก้ไขข้อมูลคลินิกสำเร็จ');
                    onSuccess?.();
                    handleClose();
                } else {
                    toast.error(result.error || 'แก้ไขข้อมูลล้มเหลว');
                }
            } else {
                const createRequest: CreateClinicRequest = {
                    name: { th: data.nameTh, en: data.nameEn },
                    clinicProfile: clinicProfileUrl,
                    clinicLevel: data.clinicLevel,
                    contractType: data.contractType,
                    contractDateStart: format(data.startDate, 'MM/dd/yyyy'),
                    contractDateEnd: format(data.endDate, 'MM/dd/yyyy'),
                    status: data.status,
                    assignedTo: selectedEmployees,
                    note: data.note || '',
                    service: serviceData,
                    procedures: selectedProcedures,
                };

                const result = await createClinic(createRequest);
                if (result.success) {
                    toast.success('สร้างคลินิกสำเร็จ');
                    onSuccess?.();
                    handleClose();
                } else {
                    toast.error(result.error || 'สร้างคลินิกล้มเหลว');
                }
            }
        } catch (error) {
            console.error('Error saving clinic:', error);
            toast.error('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setIsLoading(false);
            setIsUploading(false);
        }
    };

    const renderCheckbox = (name: keyof ClinicFormData, label: string) => {
        const value = watch(name);
        return (
            <div className="flex items-center space-x-2">
                <Checkbox
                    id={name}
                    checked={value as boolean}
                    onCheckedChange={(checked) => setValue(name, checked as boolean)}
                />
                <Label htmlFor={name} className="text-sm font-normal cursor-pointer">
                    {label}
                </Label>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0 gap-0">
                {/* Fixed Header */}
                <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Building2 className="h-6 w-6 text-purple-600" />
                            {mode === 'edit' ? 'แก้ไขข้อมูลคลินิก' : 'เพิ่มคลินิกใหม่'}
                        </DialogTitle>
                        <DialogDescription>
                            {mode === 'edit'
                                ? 'แก้ไขข้อมูลและการตั้งค่าของคลินิก'
                                : 'กรอกข้อมูลเพื่อเพิ่มคลินิกใหม่ในระบบ'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Fixed Step Indicator */}
                <div className="flex-shrink-0 px-6 py-4 border-b">
                    <StepIndicator steps={STEPS} currentStep={currentStep} totalSteps={STEPS.length} />
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {/* Step 1: ข้อมูลคลินิก */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            {/* Logo + ชื่อคลินิก + สถานะ */}
                            <div className="flex gap-6">
                                {/* Logo - ด้านซ้าย (สี่เหลี่ยมจตุรัส) */}
                                <div className="flex-shrink-0">
                                    {/* <Label className="text-sm font-medium mb-2 block">โลโก้คลินิก</Label> */}
                                    {logoPreview ? (
                                        <div className="relative group">
                                            <img
                                                src={logoPreview}
                                                alt="Logo preview"
                                                className="w-36 h-36 object-cover rounded-xl border-2 border-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveLogo}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                                <label className="cursor-pointer p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                                    <Camera className="h-6 w-6 text-white" />
                                                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                                </label>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="w-36 h-36 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all">
                                            <Upload className="h-10 w-10 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-500">อัพโหลดรูป</span>
                                            <span className="text-xs text-gray-400 mt-1">PNG, JPG</span>
                                            <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                        </label>
                                    )}
                                </div>

                                {/* ข้อมูลหลัก - ด้านขวา */}
                                <div className="flex-1 space-y-4">
                                    {/* ชื่อคลินิก */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <Label htmlFor="nameTh">ชื่อคลินิก (ไทย) <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="nameTh"
                                                {...register('nameTh')}
                                                placeholder="กรอกชื่อคลินิกภาษาไทย"
                                                className="h-10"
                                            />
                                            <FormError error={errors.nameTh} />
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="nameEn">ชื่อคลินิก (English) <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="nameEn"
                                                {...register('nameEn')}
                                                placeholder="Enter clinic name in English"
                                                className="h-10"
                                            />
                                            <FormError error={errors.nameEn} />
                                        </div>
                                    </div>

                                    {/* สถานะ, ประเภทสัญญา, ระดับ */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-3">
                                            <Label>สถานะ <span className="text-red-500">*</span></Label>
                                            <Select value={status} onValueChange={(value: 'active' | 'inactive' | 'pending') => setValue('status', value)}>
                                                <SelectTrigger className="h-10 w-full">
                                                    <SelectValue placeholder="เลือกสถานะ" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">
                                                        <span className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-green-500" />
                                                            ใช้งาน
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="inactive">
                                                        <span className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                                                            ไม่ใช้งาน
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="pending">
                                                        <span className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                                            รอดำเนินการ
                                                        </span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormError error={errors.status} />
                                        </div>

                                        <div className="space-y-3">
                                            <Label>ประเภทสัญญา <span className="text-red-500">*</span></Label>
                                            <Select value={contractType} onValueChange={(value: 'yearly' | 'monthly' | 'project') => setValue('contractType', value)}>
                                                <SelectTrigger className="h-10 w-full">
                                                    <SelectValue placeholder="เลือกประเภท" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="yearly">รายปี</SelectItem>
                                                    <SelectItem value="monthly">รายเดือน</SelectItem>
                                                    <SelectItem value="project">โปรเจกต์</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormError error={errors.contractType} />
                                        </div>

                                        <div className="space-y-3">
                                            <Label>ระดับคลินิก <span className="text-red-500">*</span></Label>
                                            <Select value={clinicLevel} onValueChange={(value: 'easy' | 'soso' | 'hellonearth') => setValue('clinicLevel', value)}>
                                                <SelectTrigger className="h-10 w-full">
                                                    <SelectValue placeholder="เลือกระดับ" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="easy">Easy</SelectItem>
                                                    <SelectItem value="soso">So so</SelectItem>
                                                    <SelectItem value="hellonearth">Hell on earth</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormError error={errors.clinicLevel} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* วันที่สัญญา */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>วันที่เริ่มสัญญา <span className="text-red-500">*</span></Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full h-10 justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {startDate ? format(startDate, 'dd MMM yyyy', { locale: th }) : 'เลือกวันที่'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={startDate}
                                                onSelect={(date) => date && setValue('startDate', date)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormError error={errors.startDate} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>วันที่สิ้นสุดสัญญา <span className="text-red-500">*</span></Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full h-10 justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {endDate ? format(endDate, 'dd MMM yyyy', { locale: th }) : 'เลือกวันที่'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={endDate}
                                                onSelect={(date) => date && setValue('endDate', date)}
                                                initialFocus
                                                disabled={(date) => startDate ? date < startDate : false}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormError error={errors.endDate} />
                                </div>
                            </div>

                            {/* หมายเหตุ */}
                            <div className="space-y-1.5">
                                <Label htmlFor="note">หมายเหตุ</Label>
                                <textarea
                                    id="note"
                                    {...register('note')}
                                    className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
                                    placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                                />
                            </div>

                            {/* หัตถการ */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Stethoscope className="h-5 w-5 text-blue-600" />
                                    <Label className="text-base font-medium">หัตถการที่ให้บริการ</Label>
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="ค้นหาหัตถการ..."
                                        value={procedureSearch}
                                        onChange={(e) => setProcedureSearch(e.target.value)}
                                        className="pl-10 h-10"
                                    />
                                </div>

                                {selectedProcedures.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProcedures.map(id => {
                                            const proc = activeProcedures.find(p => p.id === id);
                                            if (!proc) return null;
                                            return (
                                                <Badge key={id} variant="secondary" className="gap-1 bg-blue-100 text-blue-700">
                                                    <Stethoscope className="h-3 w-3" />
                                                    {proc.name}
                                                    <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={() => toggleProcedure(id)} />
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                                    {filteredProcedures.length === 0 ? (
                                        <div className="col-span-full text-center py-4 text-gray-500 text-sm">
                                            {activeProcedures.length === 0 ? 'ยังไม่มีหัตถการในระบบ' : 'ไม่พบหัตถการที่ค้นหา'}
                                        </div>
                                    ) : (
                                        filteredProcedures.map(proc => (
                                            <div
                                                key={proc.id}
                                                className={cn(
                                                    "border rounded-lg p-3 cursor-pointer transition-all text-sm",
                                                    selectedProcedures.includes(proc.id)
                                                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                                                        : "hover:border-gray-400"
                                                )}
                                                onClick={() => toggleProcedure(proc.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Stethoscope className={cn("h-4 w-4", selectedProcedures.includes(proc.id) ? "text-blue-600" : "text-gray-400")} />
                                                        <span className={cn("font-medium", selectedProcedures.includes(proc.id) ? "text-blue-700" : "text-gray-700")}>{proc.name}</span>
                                                    </div>
                                                    {selectedProcedures.includes(proc.id) && <Check className="h-4 w-4 text-blue-600" />}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">เลือกแล้ว {selectedProcedures.length} รายการ</p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: ผู้รับผิดชอบ */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <p className="text-sm text-purple-700">
                                    เลือกผู้รับผิดชอบคลินิก (สามารถเลือกได้หลายคน)
                                </p>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="ค้นหาพนักงาน..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {selectedEmployees.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedEmployees.map(id => {
                                        const emp = users.find(u => u.id === id);
                                        if (!emp) return null;
                                        return (
                                            <Badge key={id} variant="secondary" className="gap-1 bg-purple-100 text-purple-700">
                                                {emp.name}
                                                <X className="h-3 w-3 cursor-pointer hover:text-purple-900" onClick={() => toggleEmployee(id)} />
                                            </Badge>
                                        );
                                    })}
                                </div>
                            )}

                            {usersLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                                    <span className="ml-2 text-gray-600">กำลังโหลด...</span>
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="w-12 px-4 py-3"></th>
                                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">ชื่อ</th>
                                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">ตำแหน่ง</th>
                                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">บทบาท</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-8 text-gray-500">ไม่พบพนักงาน</td>
                                                </tr>
                                            ) : (
                                                filteredUsers.map(u => (
                                                    <tr
                                                        key={u.id}
                                                        className={cn("cursor-pointer transition-colors", selectedEmployees.includes(u.id) ? "bg-purple-50" : "hover:bg-gray-50")}
                                                        onClick={() => toggleEmployee(u.id)}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <Checkbox checked={selectedEmployees.includes(u.id)} />
                                                        </td>
                                                        <td className="px-4 py-3 font-medium">{u.name}</td>
                                                        <td className="px-4 py-3 text-gray-600">{u.position || '-'}</td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline">{u.role}</Badge>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {employeeError && (
                                <p className="text-sm text-red-500">{employeeError}</p>
                            )}
                        </div>
                    )}

                    {/* Step 3: ขอบเขตงาน */}
                    {currentStep === 3 && (
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-purple-600" />
                                        Setup
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {renderCheckbox('setupRequirement', 'รวบรวม Requirement')}
                                    {renderCheckbox('setupSocial', 'Setup Social Media')}
                                    {renderCheckbox('setupAds', 'Setup Ads Manager')}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ImageIcon className="h-5 w-5 text-purple-600" />
                                        Corporate Identity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="ciDesign" className="w-32">CI Design</Label>
                                        <Input id="ciDesign" type="number" min="0" {...register('ciDesign', { valueAsNumber: true })} className="w-32" placeholder="0" />
                                        <span className="text-sm text-gray-500">ชิ้น</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-purple-600" />
                                        Website
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="landingPage" className="w-32">Landing Page</Label>
                                        <Input id="landingPage" type="number" min="0" {...register('landingPage', { valueAsNumber: true })} className="w-32" placeholder="0" />
                                        <span className="text-sm text-gray-500">หน้า</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="salePage" className="w-32">Sale Page</Label>
                                        <Input id="salePage" type="number" min="0" {...register('salePage', { valueAsNumber: true })} className="w-32" placeholder="0" />
                                        <span className="text-sm text-gray-500">หน้า</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ImageIcon className="h-5 w-5 text-purple-600" />
                                        Social Media
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="graphicDesign" className="w-32">จัดทำ Graphic</Label>
                                        <Input id="graphicDesign" type="number" min="0" {...register('graphicDesign', { valueAsNumber: true })} className="w-32" placeholder="0" />
                                        <span className="text-sm text-gray-500">ชิ้น</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="videoProduction" className="w-32">จัดทำ Video</Label>
                                        <Input id="videoProduction" type="number" min="0" {...register('videoProduction', { valueAsNumber: true })} className="w-32" placeholder="0" />
                                        <span className="text-sm text-gray-500">ชิ้น</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5 text-purple-600" />
                                        Training
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="salesTraining" className="w-40">Sales Training</Label>
                                        <Input id="salesTraining" type="number" min="0" {...register('salesTraining', { valueAsNumber: true })} className="w-32" placeholder="0" />
                                        <span className="text-sm text-gray-500">ครั้ง</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="mediaTraining" className="w-40">Media Training</Label>
                                        <Input id="mediaTraining" type="number" min="0" {...register('mediaTraining', { valueAsNumber: true })} className="w-32" placeholder="0" />
                                        <span className="text-sm text-gray-500">ครั้ง</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="adsTraining" className="w-40">Ads Training</Label>
                                        <Input id="adsTraining" type="number" min="0" {...register('adsTraining', { valueAsNumber: true })} className="w-32" placeholder="0" />
                                        <span className="text-sm text-gray-500">ครั้ง</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="websiteTraining" className="w-40">Website Training</Label>
                                        <Input id="websiteTraining" type="number" min="0" {...register('websiteTraining', { valueAsNumber: true })} className="w-32" placeholder="0" />
                                        <span className="text-sm text-gray-500">ครั้ง</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <UserPlus className="h-5 w-5 text-purple-600" />
                                        HR
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {renderCheckbox('hrRecruitment', 'จัดสรรหาบุคลากร')}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Fixed Footer */}
                <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-gray-50 gap-2">
                    <Button type="button" variant="outline" onClick={handleClose}>
                        ยกเลิก
                    </Button>
                    {currentStep > 1 && (
                        <Button type="button" variant="outline" onClick={handleBack}>
                            ย้อนกลับ
                        </Button>
                    )}
                    {currentStep < 3 ? (
                        <Button
                            type="button"
                            onClick={handleNext}
                            disabled={isValidating}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isValidating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังตรวจสอบ...
                                </>
                            ) : (
                                <>
                                    ถัดไป
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={isLoading || isUploading}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังอัปโหลดรูป...
                                </>
                            ) : isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                mode === 'edit' ? 'บันทึกการแก้ไข' : 'บันทึก'
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}