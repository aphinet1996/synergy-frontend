// import { useState, useCallback } from 'react';
// import { useForm, type FieldError } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
// } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';
// import { Calendar } from '@/components/ui/calendar';
// import {
//     Popover,
//     PopoverContent,
//     PopoverTrigger,
// } from '@/components/ui/popover';
// import { StepIndicator } from '../StepIndicator';
// import { EmployeeTable } from '../EmployeeTable';
// import {
//     Loader2,
//     Upload,
//     CalendarIcon,
//     X,
//     Building2,
//     FileText,
//     Calendar as CalendarCheck,
//     Users as UsersIcon,
//     Settings,
//     Globe,
//     Image as ImageIcon,
//     GraduationCap,
//     UserPlus,
//     ChevronRight,
//     Stethoscope,
//     Plus
// } from 'lucide-react';
// import { format } from 'date-fns';
// import { th } from 'date-fns/locale';
// import { cn } from '@/lib/utils';
// import type { Clinic } from '@/types/clinic';

// export interface ClinicData extends Omit<Clinic, 'logo'> {
//     logo?: File | string | null;
// }

// interface ClinicDialogProps {
//     open: boolean;
//     onOpenChange: (open: boolean) => void;
//     onSuccess?: () => void;
//     mode?: 'create' | 'edit';
//     initialData?: ClinicData;
// }

// const STEPS = ['ข้อมูลคลินิก', 'ผู้รับผิดชอบ', 'ขอบเขตงาน'];

// // Default procedures
// const DEFAULT_PROCEDURES = [
//     'จัดฟันเหล็ก',
//     'จัดฟันใส',
//     'รากฟันเทียม',
//     'วีเนียร์'
// ];

// // Zod Schema
// const schema = z.object({
//     // Step 1
//     logo: z.instanceof(File).nullable().optional(),
//     nameTh: z.string().min(1, 'กรุณากรอกชื่อคลินิก (ไทย)'),
//     nameEn: z.string().min(1, 'กรุณากรอกชื่อคลินิก (English)'),
//     status: z.enum(['active', 'inactive', 'pending'], { message: 'กรุณาเลือกสถานะ' }),
//     contractType: z.enum(['yearly', 'monthly', 'project'], { message: 'กรุณาเลือกประเภทสัญญา' }),
//     clinicLevel: z.enum(['premium', 'standard', 'basic'], { message: 'กรุณาเลือกระดับคลินิก' }),
//     startDate: z.date({ message: 'กรุณาเลือกวันที่เริ่มสัญญา' }),
//     endDate: z.date({ message: 'กรุณาเลือกวันที่สิ้นสุดสัญญา' }),
//     procedures: z.array(z.string()).min(1, 'กรุณาเลือกหัตถการอย่างน้อย 1 รายการ'),

//     // Step 2
//     employees: z.array(z.string()).min(1, 'กรุณาเลือกผู้รับผิดชอบอย่างน้อย 1 คน'),

//     // Step 3
//     setupRequirement: z.boolean(),
//     setupSocial: z.boolean(),
//     setupAds: z.boolean(),
//     ciDesign: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     landingPage: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     salePage: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     graphicDesign: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     videoProduction: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     salesTraining: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     mediaTraining: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     adsTraining: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     websiteTraining: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     hrRecruitment: z.boolean(),
// });

// type ClinicFormData = z.infer<typeof schema>;

// function FormError({ error, className = '' }: { error?: FieldError | { message?: string }; className?: string }) {
//     return error?.message ? <p className={`text-sm text-red-500 ${className}`}>{error.message}</p> : null;
// }

// export function ClinicDialog({ open, onOpenChange, onSuccess }: ClinicDialogProps) {
//     const [currentStep, setCurrentStep] = useState(1);
//     const [isLoading, setIsLoading] = useState(false);
//     const [logoPreview, setLogoPreview] = useState<string | null>(null);
//     const [isValidating, setIsValidating] = useState(false);
//     const [customProcedure, setCustomProcedure] = useState('');
//     const [availableProcedures, setAvailableProcedures] = useState<string[]>(DEFAULT_PROCEDURES);

//     const {
//         register,
//         handleSubmit,
//         formState: { errors },
//         reset,
//         watch,
//         setValue,
//         trigger,
//     } = useForm<ClinicFormData>({
//         resolver: zodResolver(schema),
//         defaultValues: {
//             nameTh: '',
//             nameEn: '',
//             status: 'active', // Set default value
//             contractType: 'yearly', // Set default value
//             clinicLevel: 'standard', // Set default value
//             startDate: new Date(),
//             endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
//             procedures: [],
//             employees: [],
//             setupRequirement: false,
//             setupSocial: false,
//             setupAds: false,
//             ciDesign: 0,
//             landingPage: 0,
//             salePage: 0,
//             graphicDesign: 0,
//             videoProduction: 0,
//             salesTraining: 0,
//             mediaTraining: 0,
//             adsTraining: 0,
//             websiteTraining: 0,
//             hrRecruitment: false,
//         },
//         mode: 'onChange',
//     });

//     const handleEmployeeSelection = useCallback((selected: string[]) => {
//         setValue('employees', selected, { shouldValidate: true });
//     }, [setValue]);

//     const startDate = watch('startDate');
//     const endDate = watch('endDate');
//     const employees = watch('employees');
//     const status = watch('status');
//     const contractType = watch('contractType');
//     const clinicLevel = watch('clinicLevel');
//     const procedures = watch('procedures');

//     const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (file) {
//             setValue('logo', file);
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 setLogoPreview(reader.result as string);
//             };
//             reader.readAsDataURL(file);
//         }
//     };

//     const handleRemoveLogo = () => {
//         setValue('logo', undefined);
//         setLogoPreview(null);
//     };

//     const handleProcedureToggle = (procedure: string) => {
//         const current = procedures || [];
//         const updated = current.includes(procedure)
//             ? current.filter((p) => p !== procedure)
//             : [...current, procedure];
//         setValue('procedures', updated, { shouldValidate: true });
//     };

//     const handleAddCustomProcedure = () => {
//         if (customProcedure.trim() && !availableProcedures.includes(customProcedure.trim())) {
//             setAvailableProcedures([...availableProcedures, customProcedure.trim()]);
//             handleProcedureToggle(customProcedure.trim());
//             setCustomProcedure('');
//         }
//     };

//     const renderCheckbox = (id: keyof ClinicFormData, label: string) => (
//         <div className="flex items-center space-x-2">
//             <Checkbox
//                 id={id as string}
//                 checked={watch(id as any)}
//                 onCheckedChange={(checked) => setValue(id, checked as boolean)}
//             />
//             <Label htmlFor={id as string} className="font-normal cursor-pointer">
//                 {label}
//             </Label>
//         </div>
//     );

//     const handleNext = async () => {
//         setIsValidating(true);
//         const fieldsToTrigger: (keyof ClinicFormData)[] = currentStep === 1
//             ? ['nameTh', 'nameEn', 'status', 'contractType', 'clinicLevel', 'startDate', 'endDate', 'procedures']
//             : ['employees'];

//         const isValid = await trigger(fieldsToTrigger);
//         setIsValidating(false);

//         if (isValid) {
//             setCurrentStep((prev) => Math.min(prev + 1, 3));
//         }
//     };

//     const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
//         if (e.key === 'Enter') {
//             const tag = (e.target as HTMLElement).tagName.toLowerCase();
//             if (tag !== 'textarea' && tag !== 'input') {
//                 e.preventDefault();
//                 if (currentStep < 3) handleNext();
//             }
//         }
//     };

//     const handleBack = () => {
//         setCurrentStep((prev) => Math.max(prev - 1, 1));
//     };

//     const handleClose = () => {
//         setCurrentStep(1);
//         setLogoPreview(null);
//         setCustomProcedure('');
//         setAvailableProcedures(DEFAULT_PROCEDURES);
//         reset();
//         onOpenChange(false);
//     };

//     const onSubmit = async (data: ClinicFormData) => {
//         if (currentStep !== 3) return;
//         try {
//             setIsLoading(true);
//             console.log('Form data:', data);
//             await new Promise((resolve) => setTimeout(resolve, 1000));

//             handleClose();
//             onSuccess?.();
//         } catch (error) {
//             console.error(error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleSaveClick = () => {
//         handleSubmit(onSubmit)();
//     };

//     return (
//         <Dialog open={open} onOpenChange={handleClose}>
//             <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
//                 <DialogHeader>
//                     <DialogTitle className="text-2xl flex items-center gap-2">
//                         <Building2 className="h-6 w-6 text-purple-600" />
//                         เพิ่มคลินิกใหม่
//                     </DialogTitle>
//                     <DialogDescription>
//                         กรอกข้อมูลคลินิกและกำหนดขอบเขตงานที่จะให้บริการ
//                     </DialogDescription>
//                 </DialogHeader>

//                 <StepIndicator currentStep={currentStep} totalSteps={3} steps={STEPS} />

//                 <form onSubmit={(e) => e.preventDefault()} onKeyDown={handleKeyDown} className="flex-1 overflow-y-auto">
//                     <div className="space-y-6 px-1">
//                         {currentStep === 1 && (
//                             <div className="space-y-4">
//                                 {/* Logo Upload */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <ImageIcon className="h-5 w-5 text-purple-600" />
//                                             โลโก้คลินิก
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent>
//                                         <div className="flex items-center gap-6">
//                                             {logoPreview ? (
//                                                 <div className="relative">
//                                                     <div className="w-32 h-32 rounded-xl border-2 border-purple-200 overflow-hidden bg-white">
//                                                         <img
//                                                             src={logoPreview}
//                                                             alt="Logo preview"
//                                                             className="w-full h-full object-cover"
//                                                         />
//                                                     </div>
//                                                     <Button
//                                                         type="button"
//                                                         variant="destructive"
//                                                         size="icon"
//                                                         className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
//                                                         onClick={handleRemoveLogo}
//                                                     >
//                                                         <X className="h-4 w-4" />
//                                                     </Button>
//                                                 </div>
//                                             ) : (
//                                                 <label className="cursor-pointer">
//                                                     <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-400 bg-gray-50 hover:bg-purple-50 flex flex-col items-center justify-center transition-all">
//                                                         <Upload className="h-8 w-8 text-gray-400 mb-2" />
//                                                         <span className="text-sm text-gray-500">อัปโหลดโลโก้</span>
//                                                     </div>
//                                                     <input
//                                                         type="file"
//                                                         accept="image/*"
//                                                         className="hidden"
//                                                         onChange={handleLogoChange}
//                                                     />
//                                                 </label>
//                                             )}
//                                             <div className="flex-1 text-sm text-gray-600">
//                                                 <p className="font-medium mb-1">คำแนะนำ:</p>
//                                                 <ul className="list-disc list-inside space-y-1">
//                                                     <li>ขนาดแนะนำ 512x512 พิกเซล</li>
//                                                     <li>ไฟล์ JPG, PNG หรือ SVG</li>
//                                                     <li>ขนาดไฟล์ไม่เกิน 2MB</li>
//                                                 </ul>
//                                             </div>
//                                         </div>
//                                     </CardContent>
//                                 </Card>

//                                 {/* Basic Info */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <FileText className="h-5 w-5 text-purple-600" />
//                                             ข้อมูลพื้นฐาน
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="space-y-4">
//                                         <div className="grid grid-cols-2 gap-4">
//                                             <div className="space-y-2">
//                                                 <Label htmlFor="nameTh">
//                                                     ชื่อคลินิก (ไทย) <span className="text-red-500">*</span>
//                                                 </Label>
//                                                 <Input
//                                                     id="nameTh"
//                                                     {...register('nameTh')}
//                                                     placeholder="คลินิกทำฟัน ABC"
//                                                 />
//                                                 <FormError error={errors.nameTh} />
//                                             </div>

//                                             <div className="space-y-2">
//                                                 <Label htmlFor="nameEn">
//                                                     ชื่อคลินิก (English) <span className="text-red-500">*</span>
//                                                 </Label>
//                                                 <Input
//                                                     id="nameEn"
//                                                     {...register('nameEn')}
//                                                     placeholder="ABC Dental Clinic"
//                                                 />
//                                                 <FormError error={errors.nameEn} />
//                                             </div>
//                                         </div>

//                                         <div className="grid grid-cols-3 gap-4">
//                                             <div className="space-y-2">
//                                                 {/* <Label htmlFor="status"> */}
//                                                 <Label>
//                                                     สถานะ <span className="text-red-500">*</span>
//                                                 </Label>
//                                                 <Select
//                                                     value={status}
//                                                     onValueChange={(value) => setValue('status', value as any, { shouldValidate: true })}
//                                                 >
//                                                     <SelectTrigger>
//                                                         <SelectValue placeholder="เลือกสถานะ" />
//                                                     </SelectTrigger>
//                                                     <SelectContent>
//                                                         <SelectItem value="active">
//                                                             <Badge className="bg-green-100 text-green-700 border-0">ใช้งานอยู่</Badge>
//                                                         </SelectItem>
//                                                         <SelectItem value="inactive">
//                                                             <Badge className="bg-gray-100 text-gray-700 border-0">ไม่ใช้งาน</Badge>
//                                                         </SelectItem>
//                                                         <SelectItem value="pending">
//                                                             <Badge className="bg-yellow-100 text-yellow-700 border-0">รอดำเนินการ</Badge>
//                                                         </SelectItem>
//                                                     </SelectContent>
//                                                 </Select>
//                                                 <FormError error={errors.status} />
//                                             </div>

//                                             <div className="space-y-2">
//                                                 {/* <Label htmlFor="contractType"> */}
//                                                 <Label>
//                                                     ประเภทสัญญา <span className="text-red-500">*</span>
//                                                 </Label>
//                                                 <Select
//                                                     value={contractType}
//                                                     onValueChange={(value) => setValue('contractType', value as any, { shouldValidate: true })}
//                                                 >
//                                                     <SelectTrigger>
//                                                         <SelectValue placeholder="เลือกประเภท" />
//                                                     </SelectTrigger>
//                                                     <SelectContent>
//                                                         <SelectItem value="yearly">รายปี</SelectItem>
//                                                         <SelectItem value="monthly">รายเดือน</SelectItem>
//                                                         <SelectItem value="project">โครงการ</SelectItem>
//                                                     </SelectContent>
//                                                 </Select>
//                                                 <FormError error={errors.contractType} />
//                                             </div>

//                                             <div className="space-y-2">
//                                                 {/* <Label htmlFor="clinicLevel"> */}
//                                                 <Label>
//                                                     ระดับคลินิก <span className="text-red-500">*</span>
//                                                 </Label>
//                                                 <Select
//                                                     value={clinicLevel}
//                                                     onValueChange={(value) => setValue('clinicLevel', value as any, { shouldValidate: true })}
//                                                 >
//                                                     <SelectTrigger>
//                                                         <SelectValue placeholder="เลือกระดับ" />
//                                                     </SelectTrigger>
//                                                     <SelectContent>
//                                                         <SelectItem value="premium">
//                                                             <Badge className="bg-purple-100 text-purple-700 border-0">Premium</Badge>
//                                                         </SelectItem>
//                                                         <SelectItem value="standard">
//                                                             <Badge className="bg-blue-100 text-blue-700 border-0">Standard</Badge>
//                                                         </SelectItem>
//                                                         <SelectItem value="basic">
//                                                             <Badge className="bg-gray-100 text-gray-700 border-0">Basic</Badge>
//                                                         </SelectItem>
//                                                     </SelectContent>
//                                                 </Select>
//                                                 <FormError error={errors.clinicLevel} />
//                                             </div>
//                                         </div>
//                                     </CardContent>
//                                 </Card>

//                                 {/* Procedures */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <Stethoscope className="h-5 w-5 text-purple-600" />
//                                             หัตถการ
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="space-y-4">
//                                         <div className="grid grid-cols-2 gap-3">
//                                             {availableProcedures.map((procedure) => (
//                                                 <div key={procedure} className="flex items-center space-x-2">
//                                                     <Checkbox
//                                                         id={`procedure-${procedure}`}
//                                                         checked={procedures?.includes(procedure)}
//                                                         onCheckedChange={() => handleProcedureToggle(procedure)}
//                                                     />
//                                                     <Label
//                                                         htmlFor={`procedure-${procedure}`}
//                                                         className="font-normal cursor-pointer"
//                                                     >
//                                                         {procedure}
//                                                     </Label>
//                                                 </div>
//                                             ))}
//                                         </div>

//                                         {/* Add Custom Procedure */}
//                                         <div className="pt-3 border-t">
//                                             <Label className="text-sm text-gray-600 mb-2 block">เพิ่มหัตถการอื่นๆ</Label>
//                                             <div className="flex gap-2">
//                                                 <Input
//                                                     placeholder="ระบุหัตถการ..."
//                                                     value={customProcedure}
//                                                     onChange={(e) => setCustomProcedure(e.target.value)}
//                                                     onKeyDown={(e) => {
//                                                         if (e.key === 'Enter') {
//                                                             e.preventDefault();
//                                                             handleAddCustomProcedure();
//                                                         }
//                                                     }}
//                                                 />
//                                                 <Button
//                                                     type="button"
//                                                     variant="outline"
//                                                     size="icon"
//                                                     onClick={handleAddCustomProcedure}
//                                                     disabled={!customProcedure.trim()}
//                                                 >
//                                                     <Plus className="h-4 w-4" />
//                                                 </Button>
//                                             </div>
//                                         </div>

//                                         <FormError error={errors.procedures} />

//                                         {/* Selected Procedures Preview */}
//                                         {procedures && procedures.length > 0 && (
//                                             <div className="pt-3 border-t">
//                                                 <Label className="text-sm text-gray-600 mb-2 block">
//                                                     หัตถการที่เลือก ({procedures.length})
//                                                 </Label>
//                                                 <div className="flex flex-wrap gap-2">
//                                                     {procedures.map((procedure) => (
//                                                         <Badge
//                                                             key={procedure}
//                                                             variant="secondary"
//                                                             className="bg-purple-100 text-purple-700"
//                                                         >
//                                                             {procedure}
//                                                         </Badge>
//                                                     ))}
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </CardContent>
//                                 </Card>

//                                 {/* Contract Period */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <CalendarCheck className="h-5 w-5 text-purple-600" />
//                                             ระยะเวลาสัญญา
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent>
//                                         <div className="grid grid-cols-2 gap-4">
//                                             <div className="space-y-2">
//                                                 <Label>
//                                                     วันที่เริ่มสัญญา <span className="text-red-500">*</span>
//                                                 </Label>
//                                                 <Popover>
//                                                     <PopoverTrigger asChild>
//                                                         <Button
//                                                             type="button"
//                                                             variant="outline"
//                                                             className={cn(
//                                                                 'w-full justify-start text-left font-normal',
//                                                                 !startDate && 'text-muted-foreground'
//                                                             )}
//                                                         >
//                                                             <CalendarIcon className="mr-2 h-4 w-4" />
//                                                             {startDate ? (
//                                                                 format(startDate, 'dd MMMM yyyy', { locale: th })
//                                                             ) : (
//                                                                 <span>เลือกวันที่</span>
//                                                             )}
//                                                         </Button>
//                                                     </PopoverTrigger>
//                                                     <PopoverContent className="w-auto p-0" align="start">
//                                                         <Calendar
//                                                             mode="single"
//                                                             selected={startDate}
//                                                             onSelect={(date) => setValue('startDate', date as Date, { shouldValidate: true })}
//                                                             initialFocus
//                                                         />
//                                                     </PopoverContent>
//                                                 </Popover>
//                                                 <FormError error={errors.startDate} />
//                                             </div>

//                                             <div className="space-y-2">
//                                                 <Label>
//                                                     วันที่สิ้นสุดสัญญา <span className="text-red-500">*</span>
//                                                 </Label>
//                                                 <Popover>
//                                                     <PopoverTrigger asChild>
//                                                         <Button
//                                                             type="button"
//                                                             variant="outline"
//                                                             className={cn(
//                                                                 'w-full justify-start text-left font-normal',
//                                                                 !endDate && 'text-muted-foreground'
//                                                             )}
//                                                         >
//                                                             <CalendarIcon className="mr-2 h-4 w-4" />
//                                                             {endDate ? (
//                                                                 format(endDate, 'dd MMMM yyyy', { locale: th })
//                                                             ) : (
//                                                                 <span>เลือกวันที่</span>
//                                                             )}
//                                                         </Button>
//                                                     </PopoverTrigger>
//                                                     <PopoverContent className="w-auto p-0" align="start">
//                                                         <Calendar
//                                                             mode="single"
//                                                             selected={endDate}
//                                                             onSelect={(date) => setValue('endDate', date as Date, { shouldValidate: true })}
//                                                             initialFocus
//                                                         />
//                                                     </PopoverContent>
//                                                 </Popover>
//                                                 <FormError error={errors.endDate} />
//                                             </div>
//                                         </div>
//                                     </CardContent>
//                                 </Card>
//                             </div>
//                         )}

//                         {/* Step 2: Employees */}
//                         {currentStep === 2 && (
//                             <Card>
//                                 <CardHeader>
//                                     <CardTitle className="flex items-center gap-2">
//                                         <UsersIcon className="h-5 w-5 text-purple-600" />
//                                         เลือกผู้รับผิดชอบคลินิก
//                                         <Badge variant="outline" className="ml-auto">
//                                             {employees.length} คน
//                                         </Badge>
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent>
//                                     <EmployeeTable
//                                         selectedEmployees={employees}
//                                         onSelectionChange={handleEmployeeSelection}
//                                     />
//                                     <FormError error={errors.employees} className="mt-2" />
//                                 </CardContent>
//                             </Card>
//                         )}

//                         {/* Step 3: Scope of Work */}
//                         {currentStep === 3 && (
//                             <div className="space-y-4">
//                                 {/* Setup */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <Settings className="h-5 w-5 text-purple-600" />
//                                             Setup
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="space-y-3">
//                                         {renderCheckbox('setupRequirement', 'Requirement')}
//                                         {renderCheckbox('setupSocial', 'เชื่อมบัญชี Social')}
//                                         {renderCheckbox('setupAds', 'เชื่อมบัญชี Ads Manager')}
//                                     </CardContent>
//                                 </Card>

//                                 {/* Corporate Identity */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <ImageIcon className="h-5 w-5 text-purple-600" />
//                                             Corporate Identity
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent>
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="ciDesign" className="w-32">ออกแบบ CI</Label>
//                                             <Input
//                                                 id="ciDesign"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('ciDesign', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">ชิ้น</span>
//                                         </div>
//                                     </CardContent>
//                                 </Card>

//                                 {/* Website */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <Globe className="h-5 w-5 text-purple-600" />
//                                             Website
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="space-y-3">
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="landingPage" className="w-32">Landing Page</Label>
//                                             <Input
//                                                 id="landingPage"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('landingPage', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">หน้า</span>
//                                         </div>
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="salePage" className="w-32">Sale Page</Label>
//                                             <Input
//                                                 id="salePage"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('salePage', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">หน้า</span>
//                                         </div>
//                                     </CardContent>
//                                 </Card>

//                                 {/* Social Media */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <ImageIcon className="h-5 w-5 text-purple-600" />
//                                             Social Media
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="space-y-3">
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="graphicDesign" className="w-32">จัดทำ Graphic</Label>
//                                             <Input
//                                                 id="graphicDesign"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('graphicDesign', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">ชิ้น</span>
//                                         </div>
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="videoProduction" className="w-32">จัดทำ Video</Label>
//                                             <Input
//                                                 id="videoProduction"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('videoProduction', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">ชิ้น</span>
//                                         </div>
//                                     </CardContent>
//                                 </Card>

//                                 {/* Training */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <GraduationCap className="h-5 w-5 text-purple-600" />
//                                             Training
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="space-y-3">
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="salesTraining" className="w-40">Sales Training</Label>
//                                             <Input
//                                                 id="salesTraining"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('salesTraining', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">ครั้ง</span>
//                                         </div>
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="mediaTraining" className="w-40">Media Training</Label>
//                                             <Input
//                                                 id="mediaTraining"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('mediaTraining', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">ครั้ง</span>
//                                         </div>
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="adsTraining" className="w-40">Ads Training</Label>
//                                             <Input
//                                                 id="adsTraining"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('adsTraining', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">ครั้ง</span>
//                                         </div>
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="websiteTraining" className="w-40">Website Training</Label>
//                                             <Input
//                                                 id="websiteTraining"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('websiteTraining', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">ครั้ง</span>
//                                         </div>
//                                     </CardContent>
//                                 </Card>

//                                 {/* HR */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <UserPlus className="h-5 w-5 text-purple-600" />
//                                             HR
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent>
//                                         {renderCheckbox('hrRecruitment', 'จัดสรรหาบุคลากร')}
//                                     </CardContent>
//                                 </Card>
//                             </div>
//                         )}
//                     </div>

//                     <DialogFooter className="gap-2 mt-6 pt-4 border-t">
//                         <Button type="button" variant="outline" onClick={handleClose}>
//                             ยกเลิก
//                         </Button>
//                         {currentStep > 1 && (
//                             <Button type="button" variant="outline" onClick={handleBack}>
//                                 ย้อนกลับ
//                             </Button>
//                         )}
//                         {currentStep < 3 ? (
//                             <Button
//                                 type="button"
//                                 onClick={handleNext}
//                                 disabled={isValidating}
//                                 className="bg-purple-600 hover:bg-purple-700"
//                             >
//                                 {isValidating ? (
//                                     <>
//                                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                         กำลังตรวจสอบ...
//                                     </>
//                                 ) : (
//                                     <>
//                                         ถัดไป
//                                         <ChevronRight className="h-4 w-4 ml-2" />
//                                     </>
//                                 )}
//                             </Button>
//                         ) : (
//                             <Button
//                                 type="button"
//                                 onClick={handleSaveClick}
//                                 disabled={isLoading}
//                                 className="bg-purple-600 hover:bg-purple-700"
//                             >
//                                 {isLoading ? (
//                                     <>
//                                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                         กำลังบันทึก...
//                                     </>
//                                 ) : (
//                                     'บันทึก'
//                                 )}
//                             </Button>
//                         )}
//                     </DialogFooter>
//                 </form>
//             </DialogContent>
//         </Dialog>
//     );
// }

// 2

// import { useState, useCallback, useEffect } from 'react';
// import { useForm, type FieldError } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
// } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';
// import { Calendar } from '@/components/ui/calendar';
// import {
//     Popover,
//     PopoverContent,
//     PopoverTrigger,
// } from '@/components/ui/popover';
// import { StepIndicator } from '../StepIndicator';
// import { EmployeeTable } from '../EmployeeTable';
// import {
//     Loader2,
//     Upload,
//     CalendarIcon,
//     X,
//     Building2,
//     FileText,
//     Calendar as CalendarCheck,
//     Users as UsersIcon,
//     Settings,
//     Globe,
//     Image as ImageIcon,
//     GraduationCap,
//     UserPlus,
//     ChevronRight,
//     Stethoscope,
//     Plus
// } from 'lucide-react';
// import { format } from 'date-fns';
// import { th } from 'date-fns/locale';
// import { cn } from '@/lib/utils';
// import type { Clinic, CreateClinicRequest, UpdateClinicRequest } from '@/types/clinic';
// import { useClinicStore } from '@/stores/clinicStore';
// import { useAuthStore } from '@/stores/authStore'; // สำหรับ get current user

// interface ClinicDialogProps {
//     open: boolean;
//     onOpenChange: (open: boolean) => void;
//     onSuccess?: () => void;
//     mode?: 'create' | 'edit';
//     initialData?: Clinic;
// }

// const STEPS = ['ข้อมูลคลินิก', 'ผู้รับผิดชอบ', 'ขอบเขตงาน'];

// // Default procedures - สำหรับ UI เท่านั้น ไม่ได้ใช้ใน API
// const DEFAULT_PROCEDURES = [
//     'จัดฟันเหล็ก',
//     'จัดฟันใส',
//     'รากฟันเทียม',
//     'วีเนียร์'
// ];

// // Zod Schema
// const schema = z.object({
//     // Step 1
//     logo: z.any().optional(),
//     nameTh: z.string().min(1, 'กรุณากรอกชื่อคลินิก (ไทย)'),
//     nameEn: z.string().min(1, 'กรุณากรอกชื่อคลินิก (English)'),
//     status: z.enum(['active', 'inactive', 'pending'], { message: 'กรุณาเลือกสถานะ' }),
//     contractType: z.enum(['yearly', 'monthly', 'one-time'], { message: 'กรุณาเลือกประเภทสัญญา' }),
//     clinicLevel: z.enum(['premium', 'standard', 'basic'], { message: 'กรุณาเลือกระดับคลินิก' }),
//     startDate: z.date({ message: 'กรุณาเลือกวันที่เริ่มสัญญา' }),
//     endDate: z.date({ message: 'กรุณาเลือกวันที่สิ้นสุดสัญญา' }),
//     note: z.string().optional(),

//     // Step 2
//     employees: z.array(z.string()).min(1, 'กรุณาเลือกผู้รับผิดชอบอย่างน้อย 1 คน'),

//     // Step 3
//     setupRequirement: z.boolean(),
//     setupSocial: z.boolean(),
//     setupAds: z.boolean(),
//     ciDesign: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     landingPage: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     salePage: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     graphicDesign: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     videoProduction: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     salesTraining: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     mediaTraining: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     adsTraining: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     websiteTraining: z.number().min(0, 'ต้องไม่น้อยกว่า 0'),
//     hrRecruitment: z.boolean(),
// });

// type ClinicFormData = z.infer<typeof schema>;

// function FormError({ error, className = '' }: { error?: FieldError | { message?: string }; className?: string }) {
//     return error?.message ? <p className={`text-sm text-red-500 ${className}`}>{error.message}</p> : null;
// }

// export function ClinicDialog({ open, onOpenChange, onSuccess, mode = 'create', initialData }: ClinicDialogProps) {
//     const [currentStep, setCurrentStep] = useState(1);
//     const [isLoading, setIsLoading] = useState(false);
//     const [logoPreview, setLogoPreview] = useState<string | null>(null);
//     const [isValidating, setIsValidating] = useState(false);

//     const { createClinic, updateClinic } = useClinicStore();
//     const { user } = useAuthStore();

//     // Convert Clinic data to form data
//     const getDefaultValues = (): Partial<ClinicFormData> => {
//         if (mode === 'edit' && initialData) {
//             return {
//                 nameTh: initialData.name.th,
//                 nameEn: initialData.name.en,
//                 status: initialData.status,
//                 contractType: initialData.contractType,
//                 clinicLevel: initialData.clinicLevel,
//                 startDate: new Date(initialData.contractDateStart),
//                 endDate: new Date(initialData.contractDateEnd),
//                 note: initialData.note || '',
//                 employees: initialData.assignedTo?.map(u => u.id) || [],
//                 setupRequirement: initialData.service.setup.requirement,
//                 setupSocial: initialData.service.setup.socialMedia,
//                 setupAds: initialData.service.setup.adsManager,
//                 ciDesign: initialData.service.coperateIdentity?.reduce((sum, item) => sum + item.amount, 0) || 0,
//                 landingPage: initialData.service.website?.find(w => w.name === 'Landing Page')?.amount || 0,
//                 salePage: initialData.service.website?.find(w => w.name === 'Sale Page')?.amount || 0,
//                 graphicDesign: initialData.service.socialMedia?.find(s => s.name === 'Graphic')?.amount || 0,
//                 videoProduction: initialData.service.socialMedia?.find(s => s.name === 'Video')?.amount || 0,
//                 salesTraining: initialData.service.training?.find(t => t.name === 'Sales')?.amount || 0,
//                 mediaTraining: initialData.service.training?.find(t => t.name === 'Media')?.amount || 0,
//                 adsTraining: initialData.service.training?.find(t => t.name === 'Ads')?.amount || 0,
//                 websiteTraining: initialData.service.training?.find(t => t.name === 'Website')?.amount || 0,
//                 hrRecruitment: false, // ไม่มีใน data structure
//             };
//         }

//         return {
//             nameTh: '',
//             nameEn: '',
//             status: 'active',
//             contractType: 'yearly',
//             clinicLevel: 'standard',
//             startDate: new Date(),
//             endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
//             note: '',
//             employees: [],
//             setupRequirement: false,
//             setupSocial: false,
//             setupAds: false,
//             ciDesign: 0,
//             landingPage: 0,
//             salePage: 0,
//             graphicDesign: 0,
//             videoProduction: 0,
//             salesTraining: 0,
//             mediaTraining: 0,
//             adsTraining: 0,
//             websiteTraining: 0,
//             hrRecruitment: false,
//         };
//     };

//     const {
//         register,
//         handleSubmit,
//         formState: { errors },
//         reset,
//         watch,
//         setValue,
//         trigger,
//     } = useForm<ClinicFormData>({
//         resolver: zodResolver(schema),
//         defaultValues: getDefaultValues(),
//         mode: 'onChange',
//     });

//     // Reset form when mode or initialData changes
//     useEffect(() => {
//         reset(getDefaultValues());
//         if (mode === 'edit' && initialData?.clinicProfile) {
//             setLogoPreview(initialData.clinicProfile);
//         }
//     }, [mode, initialData, reset]);

//     const handleEmployeeSelection = useCallback((selected: string[]) => {
//         setValue('employees', selected, { shouldValidate: true });
//     }, [setValue]);

//     const startDate = watch('startDate');
//     const endDate = watch('endDate');
//     const employees = watch('employees');
//     const status = watch('status');
//     const contractType = watch('contractType');
//     const clinicLevel = watch('clinicLevel');

//     const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (file) {
//             setValue('logo', file);
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 setLogoPreview(reader.result as string);
//             };
//             reader.readAsDataURL(file);
//         }
//     };

//     const handleRemoveLogo = () => {
//         setValue('logo', null);
//         setLogoPreview(null);
//     };

//     const handleClose = () => {
//         reset();
//         setCurrentStep(1);
//         setLogoPreview(null);
//         onOpenChange(false);
//     };

//     const validateStep = async (step: number): Promise<boolean> => {
//         let fieldsToValidate: (keyof ClinicFormData)[] = [];

//         switch (step) {
//             case 1:
//                 fieldsToValidate = ['nameTh', 'nameEn', 'status', 'contractType', 'clinicLevel', 'startDate', 'endDate'];
//                 break;
//             case 2:
//                 fieldsToValidate = ['employees'];
//                 break;
//             case 3:
//                 fieldsToValidate = ['ciDesign', 'landingPage', 'salePage', 'graphicDesign', 'videoProduction', 'salesTraining', 'mediaTraining', 'adsTraining', 'websiteTraining'];
//                 break;
//         }

//         const result = await trigger(fieldsToValidate);
//         return result;
//     };

//     const handleNext = async () => {
//         setIsValidating(true);
//         const isValid = await validateStep(currentStep);
//         setIsValidating(false);

//         if (isValid && currentStep < 3) {
//             setCurrentStep(currentStep + 1);
//         }
//     };

//     const handleBack = () => {
//         if (currentStep > 1) {
//             setCurrentStep(currentStep - 1);
//         }
//     };

//     const handleSaveClick = () => {
//         handleSubmit(onSubmit)();
//     };

//     const onSubmit = async (data: ClinicFormData) => {
//         setIsLoading(true);

//         try {
//             if (mode === 'edit' && initialData) {
//                 // Prepare update request
//                 const updateRequest: UpdateClinicRequest = {
//                     name: {
//                         th: data.nameTh,
//                         en: data.nameEn,
//                     },
//                     clinicProfile: logoPreview || '',
//                     clinicLevel: data.clinicLevel,
//                     contractType: data.contractType,
//                     contractDateStart: format(data.startDate, 'MM/dd/yyyy'),
//                     contractDateEnd: format(data.endDate, 'MM/dd/yyyy'),
//                     status: data.status,
//                     assignedTo: data.employees,
//                     note: data.note || '',
//                     service: {
//                         setup: {
//                             requirement: data.setupRequirement,
//                             socialMedia: data.setupSocial,
//                             adsManager: data.setupAds,
//                         },
//                         coperateIdentity: data.ciDesign > 0 ? [{ name: 'CI Design', amount: data.ciDesign }] : [],
//                         website: [
//                             ...(data.landingPage > 0 ? [{ name: 'Landing Page', amount: data.landingPage }] : []),
//                             ...(data.salePage > 0 ? [{ name: 'Sale Page', amount: data.salePage }] : []),
//                         ],
//                         socialMedia: [
//                             ...(data.graphicDesign > 0 ? [{ name: 'Graphic', amount: data.graphicDesign }] : []),
//                             ...(data.videoProduction > 0 ? [{ name: 'Video', amount: data.videoProduction }] : []),
//                         ],
//                         training: [
//                             ...(data.salesTraining > 0 ? [{ name: 'Sales', amount: data.salesTraining }] : []),
//                             ...(data.mediaTraining > 0 ? [{ name: 'Media', amount: data.mediaTraining }] : []),
//                             ...(data.adsTraining > 0 ? [{ name: 'Ads', amount: data.adsTraining }] : []),
//                             ...(data.websiteTraining > 0 ? [{ name: 'Website', amount: data.websiteTraining }] : []),
//                         ],
//                     },
//                     // updatedBy: user?.id || '',
//                     updatedBy: '',
//                 };

//                 const result = await updateClinic(initialData.id, updateRequest);
//                 if (result.success) {
//                     onSuccess?.();
//                     handleClose();
//                 }
//             } else {
//                 // Prepare create request  
//                 const createRequest: CreateClinicRequest = {
//                     name: {
//                         th: data.nameTh,
//                         en: data.nameEn,
//                     },
//                     clinicProfile: logoPreview || '',
//                     clinicLevel: data.clinicLevel,
//                     contractType: data.contractType,
//                     contractDateStart: format(data.startDate, 'MM/dd/yyyy'),
//                     contractDateEnd: format(data.endDate, 'MM/dd/yyyy'),
//                     status: data.status,
//                     assignedTo: data.employees,
//                     note: data.note || '',
//                     service: {
//                         setup: {
//                             requirement: data.setupRequirement,
//                             socialMedia: data.setupSocial,
//                             adsManager: data.setupAds,
//                         },
//                         coperateIdentity: data.ciDesign > 0 ? [{ name: 'CI Design', amount: data.ciDesign }] : [],
//                         website: [
//                             ...(data.landingPage > 0 ? [{ name: 'Landing Page', amount: data.landingPage }] : []),
//                             ...(data.salePage > 0 ? [{ name: 'Sale Page', amount: data.salePage }] : []),
//                         ],
//                         socialMedia: [
//                             ...(data.graphicDesign > 0 ? [{ name: 'Graphic', amount: data.graphicDesign }] : []),
//                             ...(data.videoProduction > 0 ? [{ name: 'Video', amount: data.videoProduction }] : []),
//                         ],
//                         training: [
//                             ...(data.salesTraining > 0 ? [{ name: 'Sales', amount: data.salesTraining }] : []),
//                             ...(data.mediaTraining > 0 ? [{ name: 'Media', amount: data.mediaTraining }] : []),
//                             ...(data.adsTraining > 0 ? [{ name: 'Ads', amount: data.adsTraining }] : []),
//                             ...(data.websiteTraining > 0 ? [{ name: 'Website', amount: data.websiteTraining }] : []),
//                         ],
//                     },
//                     // createdBy: user?.id || '',
//                     createdBy: '',
//                 };

//                 const result = await createClinic(createRequest);
//                 if (result.success) {
//                     onSuccess?.();
//                     handleClose();
//                 }
//             }
//         } catch (error) {
//             console.error('Error saving clinic:', error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const renderCheckbox = (name: keyof ClinicFormData, label: string) => {
//         const value = watch(name as any);
//         return (
//             <div className="flex items-center space-x-2">
//                 <Checkbox
//                     id={name}
//                     checked={value as boolean}
//                     onCheckedChange={(checked) => setValue(name as any, checked)}
//                 />
//                 <Label htmlFor={name} className="text-sm font-normal cursor-pointer">
//                     {label}
//                 </Label>
//             </div>
//         );
//     };

//     return (
//         <Dialog open={open} onOpenChange={handleClose}>
//             <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
//                 <DialogHeader>
//                     <DialogTitle className="text-2xl font-bold">
//                         {mode === 'edit' ? 'แก้ไขข้อมูลคลินิก' : 'เพิ่มคลินิกใหม่'}
//                     </DialogTitle>
//                     <DialogDescription>
//                         {mode === 'edit' 
//                             ? 'แก้ไขข้อมูลและการตั้งค่าของคลินิก' 
//                             : 'กรอกข้อมูลเพื่อเพิ่มคลินิกใหม่ในระบบ'}
//                     </DialogDescription>
//                 </DialogHeader>

//                 <form onSubmit={handleSubmit(onSubmit)}>
//                     <div>
//                         {/* Step Indicator */}
//                         <div className="mb-6">
//                             <StepIndicator steps={STEPS} currentStep={currentStep} totalSteps={STEPS.length} />
//                         </div>

//                         {/* Step 1: ข้อมูลคลินิก */}
//                         {currentStep === 1 && (
//                             <div className="space-y-6">
//                                 {/* Logo Upload */}
//                                 <div className="space-y-2">
//                                     <Label>โลโก้คลินิก</Label>
//                                     <div className="flex items-center gap-4">
//                                         {logoPreview ? (
//                                             <div className="relative">
//                                                 <img
//                                                     src={logoPreview}
//                                                     alt="Logo preview"
//                                                     className="w-24 h-24 object-cover rounded-lg border"
//                                                 />
//                                                 <button
//                                                     type="button"
//                                                     onClick={handleRemoveLogo}
//                                                     className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
//                                                 >
//                                                     <X className="h-4 w-4" />
//                                                 </button>
//                                             </div>
//                                         ) : (
//                                             <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
//                                                 <Upload className="h-8 w-8 text-gray-400" />
//                                                 <span className="text-xs text-gray-500 mt-1">อัพโหลด</span>
//                                                 <input
//                                                     type="file"
//                                                     accept="image/*"
//                                                     onChange={handleLogoChange}
//                                                     className="hidden"
//                                                 />
//                                             </label>
//                                         )}
//                                     </div>
//                                 </div>

//                                 {/* Clinic Names */}
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <div className="space-y-2">
//                                         <Label htmlFor="nameTh">ชื่อคลินิก (ไทย) *</Label>
//                                         <Input
//                                             id="nameTh"
//                                             {...register('nameTh')}
//                                             placeholder="กรอกชื่อคลินิกภาษาไทย"
//                                         />
//                                         <FormError error={errors.nameTh} />
//                                     </div>
//                                     <div className="space-y-2">
//                                         <Label htmlFor="nameEn">ชื่อคลินิก (English) *</Label>
//                                         <Input
//                                             id="nameEn"
//                                             {...register('nameEn')}
//                                             placeholder="Enter clinic name in English"
//                                         />
//                                         <FormError error={errors.nameEn} />
//                                     </div>
//                                 </div>

//                                 {/* Status, Type, Level */}
//                                 <div className="grid grid-cols-3 gap-4">
//                                     <div className="space-y-2">
//                                         <Label>สถานะ *</Label>
//                                         <Select value={status} onValueChange={(value) => setValue('status', value as any)}>
//                                             <SelectTrigger>
//                                                 <SelectValue placeholder="เลือกสถานะ" />
//                                             </SelectTrigger>
//                                             <SelectContent>
//                                                 <SelectItem value="active">ใช้งาน</SelectItem>
//                                                 <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
//                                                 <SelectItem value="pending">รอดำเนินการ</SelectItem>
//                                             </SelectContent>
//                                         </Select>
//                                         <FormError error={errors.status} />
//                                     </div>

//                                     <div className="space-y-2">
//                                         <Label>ประเภทสัญญา *</Label>
//                                         <Select value={contractType} onValueChange={(value) => setValue('contractType', value as any)}>
//                                             <SelectTrigger>
//                                                 <SelectValue placeholder="เลือกประเภท" />
//                                             </SelectTrigger>
//                                             <SelectContent>
//                                                 <SelectItem value="yearly">รายปี</SelectItem>
//                                                 <SelectItem value="monthly">รายเดือน</SelectItem>
//                                                 <SelectItem value="one-time">ครั้งเดียว</SelectItem>
//                                             </SelectContent>
//                                         </Select>
//                                         <FormError error={errors.contractType} />
//                                     </div>

//                                     <div className="space-y-2">
//                                         <Label>ระดับคลินิก *</Label>
//                                         <Select value={clinicLevel} onValueChange={(value) => setValue('clinicLevel', value as any)}>
//                                             <SelectTrigger>
//                                                 <SelectValue placeholder="เลือกระดับ" />
//                                             </SelectTrigger>
//                                             <SelectContent>
//                                                 <SelectItem value="premium">Premium</SelectItem>
//                                                 <SelectItem value="standard">Standard</SelectItem>
//                                                 <SelectItem value="basic">Basic</SelectItem>
//                                             </SelectContent>
//                                         </Select>
//                                         <FormError error={errors.clinicLevel} />
//                                     </div>
//                                 </div>

//                                 {/* Contract Dates */}
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <div className="space-y-2">
//                                         <Label>วันที่เริ่มสัญญา *</Label>
//                                         <Popover>
//                                             <PopoverTrigger asChild>
//                                                 <Button variant="outline" className="w-full justify-start text-left font-normal">
//                                                     <CalendarIcon className="mr-2 h-4 w-4" />
//                                                     {startDate ? format(startDate, 'dd MMM yyyy', { locale: th }) : 'เลือกวันที่'}
//                                                 </Button>
//                                             </PopoverTrigger>
//                                             <PopoverContent className="w-auto p-0" align="start">
//                                                 <Calendar
//                                                     mode="single"
//                                                     selected={startDate}
//                                                     onSelect={(date) => setValue('startDate', date as Date)}
//                                                     initialFocus
//                                                 />
//                                             </PopoverContent>
//                                         </Popover>
//                                         <FormError error={errors.startDate} />
//                                     </div>

//                                     <div className="space-y-2">
//                                         <Label>วันที่สิ้นสุดสัญญา *</Label>
//                                         <Popover>
//                                             <PopoverTrigger asChild>
//                                                 <Button variant="outline" className="w-full justify-start text-left font-normal">
//                                                     <CalendarIcon className="mr-2 h-4 w-4" />
//                                                     {endDate ? format(endDate, 'dd MMM yyyy', { locale: th }) : 'เลือกวันที่'}
//                                                 </Button>
//                                             </PopoverTrigger>
//                                             <PopoverContent className="w-auto p-0" align="start">
//                                                 <Calendar
//                                                     mode="single"
//                                                     selected={endDate}
//                                                     onSelect={(date) => setValue('endDate', date as Date)}
//                                                     initialFocus
//                                                     disabled={(date) => date < startDate}
//                                                 />
//                                             </PopoverContent>
//                                         </Popover>
//                                         <FormError error={errors.endDate} />
//                                     </div>
//                                 </div>

//                                 {/* Note */}
//                                 <div className="space-y-2">
//                                     <Label htmlFor="note">หมายเหตุ</Label>
//                                     <textarea
//                                         id="note"
//                                         {...register('note')}
//                                         className="w-full min-h-[100px] px-3 py-2 border rounded-md"
//                                         placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
//                                     />
//                                 </div>
//                             </div>
//                         )}

//                         {/* Step 2: ผู้รับผิดชอบ */}
//                         {currentStep === 2 && (
//                             <div className="space-y-4">
//                                 <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
//                                     <p className="text-sm text-purple-700">
//                                         เลือกผู้รับผิดชอบคลินิก (สามารถเลือกได้หลายคน)
//                                     </p>
//                                 </div>
//                                 <EmployeeTable selectedEmployees={employees} onSelectionChange={handleEmployeeSelection} />
//                                 <FormError error={errors.employees} className="mt-2" />
//                             </div>
//                         )}

//                         {/* Step 3: ขอบเขตงาน */}
//                         {currentStep === 3 && (
//                             <div className="space-y-4">
//                                 {/* Setup */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <Settings className="h-5 w-5 text-purple-600" />
//                                             Setup
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="space-y-3">
//                                         {renderCheckbox('setupRequirement', 'รวบรวม Requirement')}
//                                         {renderCheckbox('setupSocial', 'Setup Social Media')}
//                                         {renderCheckbox('setupAds', 'Setup Ads Manager')}
//                                     </CardContent>
//                                 </Card>

//                                 {/* CI */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <Building2 className="h-5 w-5 text-purple-600" />
//                                             Corporate Identity
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent>
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="ciDesign" className="w-32">CI Design</Label>
//                                             <Input
//                                                 id="ciDesign"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('ciDesign', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">บาท</span>
//                                         </div>
//                                     </CardContent>
//                                 </Card>

//                                 {/* Website */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <Globe className="h-5 w-5 text-purple-600" />
//                                             Website
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="space-y-3">
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="landingPage" className="w-32">Landing Page</Label>
//                                             <Input
//                                                 id="landingPage"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('landingPage', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">หน้า</span>
//                                         </div>
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="salePage" className="w-32">Sale Page</Label>
//                                             <Input
//                                                 id="salePage"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('salePage', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">หน้า</span>
//                                         </div>
//                                     </CardContent>
//                                 </Card>

//                                 {/* Social Media */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <ImageIcon className="h-5 w-5 text-purple-600" />
//                                             Social Media
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="space-y-3">
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="graphicDesign" className="w-32">จัดทำ Graphic</Label>
//                                             <Input
//                                                 id="graphicDesign"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('graphicDesign', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">ชิ้น</span>
//                                         </div>
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="videoProduction" className="w-32">จัดทำ Video</Label>
//                                             <Input
//                                                 id="videoProduction"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('videoProduction', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">ชิ้น</span>
//                                         </div>
//                                     </CardContent>
//                                 </Card>

//                                 {/* Training */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <GraduationCap className="h-5 w-5 text-purple-600" />
//                                             Training
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="space-y-3">
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="salesTraining" className="w-40">Sales Training</Label>
//                                             <Input
//                                                 id="salesTraining"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('salesTraining', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">ครั้ง</span>
//                                         </div>
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="mediaTraining" className="w-40">Media Training</Label>
//                                             <Input
//                                                 id="mediaTraining"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('mediaTraining', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">ครั้ง</span>
//                                         </div>
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="adsTraining" className="w-40">Ads Training</Label>
//                                             <Input
//                                                 id="adsTraining"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('adsTraining', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">ครั้ง</span>
//                                         </div>
//                                         <div className="flex items-center gap-4">
//                                             <Label htmlFor="websiteTraining" className="w-40">Website Training</Label>
//                                             <Input
//                                                 id="websiteTraining"
//                                                 type="number"
//                                                 min="0"
//                                                 {...register('websiteTraining', { valueAsNumber: true })}
//                                                 className="w-32"
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-sm text-gray-500">ครั้ง</span>
//                                         </div>
//                                     </CardContent>
//                                 </Card>

//                                 {/* HR */}
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="text-lg flex items-center gap-2">
//                                             <UserPlus className="h-5 w-5 text-purple-600" />
//                                             HR
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent>
//                                         {renderCheckbox('hrRecruitment', 'จัดสรรหาบุคลากร')}
//                                     </CardContent>
//                                 </Card>
//                             </div>
//                         )}
//                     </div>

//                     <DialogFooter className="gap-2 mt-6 pt-4 border-t">
//                         <Button type="button" variant="outline" onClick={handleClose}>
//                             ยกเลิก
//                         </Button>
//                         {currentStep > 1 && (
//                             <Button type="button" variant="outline" onClick={handleBack}>
//                                 ย้อนกลับ
//                             </Button>
//                         )}
//                         {currentStep < 3 ? (
//                             <Button
//                                 type="button"
//                                 onClick={handleNext}
//                                 disabled={isValidating}
//                                 className="bg-purple-600 hover:bg-purple-700"
//                             >
//                                 {isValidating ? (
//                                     <>
//                                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                         กำลังตรวจสอบ...
//                                     </>
//                                 ) : (
//                                     <>
//                                         ถัดไป
//                                         <ChevronRight className="h-4 w-4 ml-2" />
//                                     </>
//                                 )}
//                             </Button>
//                         ) : (
//                             <Button
//                                 type="button"
//                                 onClick={handleSaveClick}
//                                 disabled={isLoading}
//                                 className="bg-purple-600 hover:bg-purple-700"
//                             >
//                                 {isLoading ? (
//                                     <>
//                                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                         กำลังบันทึก...
//                                     </>
//                                 ) : (
//                                     mode === 'edit' ? 'บันทึกการแก้ไข' : 'บันทึก'
//                                 )}
//                             </Button>
//                         )}
//                     </DialogFooter>
//                 </form>
//             </DialogContent>
//         </Dialog>
//     );
// }

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
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Clinic, CreateClinicRequest, UpdateClinicRequest } from '@/types/clinic';
import type { UserSummary } from '@/types/user';
import { useClinicStore } from '@/stores/clinicStore';
// import { useAuthStore } from '@/stores/authStore';
import { useProcedureStore } from '@/stores/procedureStore';
import { userService } from '@/services/userService';

interface ClinicDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    mode?: 'create' | 'edit';
    initialData?: Clinic;
}

const STEPS = ['ข้อมูลคลินิก', 'ผู้รับผิดชอบ', 'ขอบเขตงาน'];

// Zod Schema
const schema = z.object({
    // Step 1
    logo: z.any().optional(),
    nameTh: z.string().min(1, 'กรุณากรอกชื่อคลินิก (ไทย)'),
    nameEn: z.string().min(1, 'กรุณากรอกชื่อคลินิก (English)'),
    status: z.enum(['active', 'inactive', 'pending'], { message: 'กรุณาเลือกสถานะ' }),
    contractType: z.enum(['yearly', 'monthly', 'project'], { message: 'กรุณาเลือกประเภทสัญญา' }),
    clinicLevel: z.enum(['premium', 'standard', 'basic'], { message: 'กรุณาเลือกระดับคลินิก' }),
    startDate: z.date({ message: 'กรุณาเลือกวันที่เริ่มสัญญา' }),
    endDate: z.date({ message: 'กรุณาเลือกวันที่สิ้นสุดสัญญา' }),
    note: z.string().optional(),

    // Step 3 - Services
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
    
    // Users state
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    
    // Selection state - ใช้ state แยกแทน form
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
    const [employeeError, setEmployeeError] = useState<string | null>(null);
    
    // Procedures state
    const [procedureSearch, setProcedureSearch] = useState('');
    
    const { createClinic, updateClinic } = useClinicStore();
    // const { user } = useAuthStore();
    const { activeProcedures, fetchActiveProcedures } = useProcedureStore();

    // Form setup
    const form = useForm<ClinicFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            nameTh: '',
            nameEn: '',
            status: 'active',
            contractType: 'yearly',
            clinicLevel: 'standard',
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
    
    // Load users and procedures when dialog opens
    useEffect(() => {
        if (open) {
            // Load active procedures
            fetchActiveProcedures();
            
            // Load users
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

    // Reset form when mode or initialData changes
    useEffect(() => {
        if (!open) return;
        
        if (mode === 'edit' && initialData) {
            // Extract procedure IDs
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
            }
        } else {
            reset({
                nameTh: '',
                nameEn: '',
                status: 'active',
                contractType: 'yearly',
                clinicLevel: 'standard',
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
        }
        setEmployeeError(null);
        setCurrentStep(1);
    }, [mode, initialData, reset, open]);

    // Toggle employee selection
    const toggleEmployee = (id: string) => {
        setSelectedEmployees(prev => {
            if (prev.includes(id)) {
                return prev.filter(e => e !== id);
            } else {
                return [...prev, id];
            }
        });
        setEmployeeError(null);
    };

    // Toggle procedure selection
    const toggleProcedure = (id: string) => {
        setSelectedProcedures(prev => {
            if (prev.includes(id)) {
                return prev.filter(p => p !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const startDate = watch('startDate');
    const endDate = watch('endDate');
    const status = watch('status');
    const contractType = watch('contractType');
    const clinicLevel = watch('clinicLevel');

    // Filter users by search
    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.position?.toLowerCase().includes(userSearch.toLowerCase())
    );

    // Filter procedures by search
    const filteredProcedures = activeProcedures.filter(p => 
        p.name.toLowerCase().includes(procedureSearch.toLowerCase())
    );

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue('logo', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setValue('logo', null);
        setLogoPreview(null);
    };

    const handleClose = () => {
        reset();
        setCurrentStep(1);
        setLogoPreview(null);
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

        if (isValid && currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSave = async () => {
        // Validate step 2 (employees)
        if (selectedEmployees.length === 0) {
            setEmployeeError('กรุณาเลือกผู้รับผิดชอบอย่างน้อย 1 คน');
            setCurrentStep(2);
            return;
        }

        // Validate form data
        const isValid = await trigger();
        if (!isValid) return;

        setIsLoading(true);
        
        try {
            const data = form.getValues();
            
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
                const updateRequest: UpdateClinicRequest = {
                    name: {
                        th: data.nameTh,
                        en: data.nameEn,
                    },
                    clinicProfile: logoPreview || '',
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
                    onSuccess?.();
                    handleClose();
                }
            } else {
                const createRequest: CreateClinicRequest = {
                    name: {
                        th: data.nameTh,
                        en: data.nameEn,
                    },
                    clinicProfile: logoPreview || '',
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
                    onSuccess?.();
                    handleClose();
                }
            }
        } catch (error) {
            console.error('Error saving clinic:', error);
        } finally {
            setIsLoading(false);
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
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {mode === 'edit' ? 'แก้ไขข้อมูลคลินิก' : 'เพิ่มคลินิกใหม่'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'edit' 
                            ? 'แก้ไขข้อมูลและการตั้งค่าของคลินิก' 
                            : 'กรอกข้อมูลเพื่อเพิ่มคลินิกใหม่ในระบบ'}
                    </DialogDescription>
                </DialogHeader>

                <div>
                    {/* Step Indicator */}
                    <div className="mb-6">
                        <StepIndicator steps={STEPS} currentStep={currentStep} totalSteps={STEPS.length} />
                    </div>

                    {/* Step 1: ข้อมูลคลินิก */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            {/* Logo Upload */}
                            <div className="space-y-2">
                                <Label>โลโก้คลินิก</Label>
                                <div className="flex items-center gap-4">
                                    {logoPreview ? (
                                        <div className="relative">
                                            <img
                                                src={logoPreview}
                                                alt="Logo preview"
                                                className="w-24 h-24 object-cover rounded-lg border"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveLogo}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                                            <Upload className="h-8 w-8 text-gray-400" />
                                            <span className="text-xs text-gray-500 mt-1">อัพโหลด</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Clinic Names */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nameTh">ชื่อคลินิก (ไทย) *</Label>
                                    <Input
                                        id="nameTh"
                                        {...register('nameTh')}
                                        placeholder="กรอกชื่อคลินิกภาษาไทย"
                                    />
                                    <FormError error={errors.nameTh} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nameEn">ชื่อคลินิก (English) *</Label>
                                    <Input
                                        id="nameEn"
                                        {...register('nameEn')}
                                        placeholder="Enter clinic name in English"
                                    />
                                    <FormError error={errors.nameEn} />
                                </div>
                            </div>

                            {/* Status, Type, Level */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>สถานะ *</Label>
                                    <Select value={status} onValueChange={(value: 'active' | 'inactive' | 'pending') => setValue('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกสถานะ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">ใช้งาน</SelectItem>
                                            <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                                            <SelectItem value="pending">รอดำเนินการ</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormError error={errors.status} />
                                </div>

                                <div className="space-y-2">
                                    <Label>ประเภทสัญญา *</Label>
                                    <Select value={contractType} onValueChange={(value: 'yearly' | 'monthly' | 'project') => setValue('contractType', value)}>
                                        <SelectTrigger>
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

                                <div className="space-y-2">
                                    <Label>ระดับคลินิก *</Label>
                                    <Select value={clinicLevel} onValueChange={(value: 'premium' | 'standard' | 'basic') => setValue('clinicLevel', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกระดับ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="premium">Premium</SelectItem>
                                            <SelectItem value="standard">Standard</SelectItem>
                                            <SelectItem value="basic">Basic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormError error={errors.clinicLevel} />
                                </div>
                            </div>

                            {/* Contract Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>วันที่เริ่มสัญญา *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
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

                                <div className="space-y-2">
                                    <Label>วันที่สิ้นสุดสัญญา *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
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

                            {/* Note */}
                            <div className="space-y-2">
                                <Label htmlFor="note">หมายเหตุ</Label>
                                <textarea
                                    id="note"
                                    {...register('note')}
                                    className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                                    placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                                />
                            </div>

                            {/* Procedures Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Stethoscope className="h-5 w-5 text-blue-600" />
                                    <Label className="text-base font-medium">หัตถการที่ให้บริการ</Label>
                                </div>
                                
                                {/* Search procedures */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="ค้นหาหัตถการ..."
                                        value={procedureSearch}
                                        onChange={(e) => setProcedureSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                {/* Selected procedures badges */}
                                {selectedProcedures.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProcedures.map(id => {
                                            const proc = activeProcedures.find(p => p.id === id);
                                            if (!proc) return null;
                                            return (
                                                <Badge key={id} variant="secondary" className="gap-1 bg-blue-100 text-blue-700">
                                                    <Stethoscope className="h-3 w-3" />
                                                    {proc.name}
                                                    <X 
                                                        className="h-3 w-3 cursor-pointer hover:text-blue-900" 
                                                        onClick={() => toggleProcedure(id)}
                                                    />
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Procedures grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                                    {filteredProcedures.length === 0 ? (
                                        <div className="col-span-full text-center py-4 text-gray-500 text-sm">
                                            {activeProcedures.length === 0 
                                                ? 'ยังไม่มีหัตถการในระบบ' 
                                                : 'ไม่พบหัตถการที่ค้นหา'}
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
                                                        <Stethoscope className={cn(
                                                            "h-4 w-4",
                                                            selectedProcedures.includes(proc.id) ? "text-blue-600" : "text-gray-400"
                                                        )} />
                                                        <span className={cn(
                                                            "font-medium",
                                                            selectedProcedures.includes(proc.id) ? "text-blue-700" : "text-gray-700"
                                                        )}>
                                                            {proc.name}
                                                        </span>
                                                    </div>
                                                    {selectedProcedures.includes(proc.id) && (
                                                        <Check className="h-4 w-4 text-blue-600" />
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    เลือกแล้ว {selectedProcedures.length} รายการ
                                </p>
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

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="ค้นหาพนักงาน..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Selected employees */}
                            {selectedEmployees.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedEmployees.map(id => {
                                        const emp = users.find(u => u.id === id);
                                        if (!emp) return null;
                                        return (
                                            <Badge key={id} variant="secondary" className="gap-1">
                                                {emp.name}
                                                <X 
                                                    className="h-3 w-3 cursor-pointer" 
                                                    onClick={() => toggleEmployee(id)}
                                                />
                                            </Badge>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Users list */}
                            {usersLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                                    <span className="ml-2">กำลังโหลด...</span>
                                </div>
                            ) : (
                                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-12"></th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ชื่อ</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ตำแหน่ง</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">บทบาท</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                        ไม่พบพนักงาน
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredUsers.map(u => (
                                                    <tr 
                                                        key={u.id}
                                                        className={cn(
                                                            "cursor-pointer hover:bg-gray-50 border-b",
                                                            selectedEmployees.includes(u.id) && "bg-purple-50"
                                                        )}
                                                        onClick={() => toggleEmployee(u.id)}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <Checkbox 
                                                                checked={selectedEmployees.includes(u.id)}
                                                                onCheckedChange={() => toggleEmployee(u.id)}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
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
                        <div className="space-y-4">
                            {/* Setup */}
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

                            {/* CI */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-purple-600" />
                                        Corporate Identity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="ciDesign" className="w-32">CI Design</Label>
                                        <Input
                                            id="ciDesign"
                                            type="number"
                                            min="0"
                                            {...register('ciDesign', { valueAsNumber: true })}
                                            className="w-32"
                                            placeholder="0"
                                        />
                                        <span className="text-sm text-gray-500">บาท</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Website */}
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
                                        <Input
                                            id="landingPage"
                                            type="number"
                                            min="0"
                                            {...register('landingPage', { valueAsNumber: true })}
                                            className="w-32"
                                            placeholder="0"
                                        />
                                        <span className="text-sm text-gray-500">หน้า</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="salePage" className="w-32">Sale Page</Label>
                                        <Input
                                            id="salePage"
                                            type="number"
                                            min="0"
                                            {...register('salePage', { valueAsNumber: true })}
                                            className="w-32"
                                            placeholder="0"
                                        />
                                        <span className="text-sm text-gray-500">หน้า</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Social Media */}
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
                                        <Input
                                            id="graphicDesign"
                                            type="number"
                                            min="0"
                                            {...register('graphicDesign', { valueAsNumber: true })}
                                            className="w-32"
                                            placeholder="0"
                                        />
                                        <span className="text-sm text-gray-500">ชิ้น</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="videoProduction" className="w-32">จัดทำ Video</Label>
                                        <Input
                                            id="videoProduction"
                                            type="number"
                                            min="0"
                                            {...register('videoProduction', { valueAsNumber: true })}
                                            className="w-32"
                                            placeholder="0"
                                        />
                                        <span className="text-sm text-gray-500">ชิ้น</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Training */}
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
                                        <Input
                                            id="salesTraining"
                                            type="number"
                                            min="0"
                                            {...register('salesTraining', { valueAsNumber: true })}
                                            className="w-32"
                                            placeholder="0"
                                        />
                                        <span className="text-sm text-gray-500">ครั้ง</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="mediaTraining" className="w-40">Media Training</Label>
                                        <Input
                                            id="mediaTraining"
                                            type="number"
                                            min="0"
                                            {...register('mediaTraining', { valueAsNumber: true })}
                                            className="w-32"
                                            placeholder="0"
                                        />
                                        <span className="text-sm text-gray-500">ครั้ง</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="adsTraining" className="w-40">Ads Training</Label>
                                        <Input
                                            id="adsTraining"
                                            type="number"
                                            min="0"
                                            {...register('adsTraining', { valueAsNumber: true })}
                                            className="w-32"
                                            placeholder="0"
                                        />
                                        <span className="text-sm text-gray-500">ครั้ง</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="websiteTraining" className="w-40">Website Training</Label>
                                        <Input
                                            id="websiteTraining"
                                            type="number"
                                            min="0"
                                            {...register('websiteTraining', { valueAsNumber: true })}
                                            className="w-32"
                                            placeholder="0"
                                        />
                                        <span className="text-sm text-gray-500">ครั้ง</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* HR */}
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

                <DialogFooter className="gap-2 mt-6 pt-4 border-t">
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
                            disabled={isLoading}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isLoading ? (
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