import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StepIndicator } from '@/components/StepIndicator';
import type { CreateTaskForm, TaskPriority, Position, TaskStatus } from '@/types/task';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flag,
  Building2,
  Plus,
  X,
  Check,
  Video,
  Globe,
  Image,
  Camera,
  Edit2,
  Trash2,
  CheckCircle2,
  FileText,
  Users,
  ChevronsUpDown,
  Upload,
  Paperclip,
  Loader2,
  File,
  ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { uploadService } from '@/services/uploadService';
import { toast } from 'sonner';

interface ManagerTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinics: Array<{ id: string; name: string }>;
  positions: Position[];
  onSubmit: (data: CreateTaskForm) => void;
}

interface ContentFlow {
  id: string;
  title: string;
  assignees: string[];
}

// Interface สำหรับไฟล์ที่ upload
interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  url?: string;
  uploading?: boolean;
  error?: string;
}

// ประเภทไฟล์ที่รองรับ
const ACCEPTED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  all: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

const INITIAL_FORM: CreateTaskForm = {
  name: '',
  description: '',
  priority: 'medium',
  startDate: new Date(),
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  clinicId: '',
  process: [],
  workload: {
    video: [
      { section: 'Short', amount: 0 },
      { section: 'Medium', amount: 0 },
      { section: 'Long', amount: 0 }
    ],
    website: [
      { section: 'Landing Page', amount: 0 },
      { section: 'Sale Page', amount: 0 }
    ],
    image: [
      { section: 'CI', amount: 0 },
      { section: 'Artwork', amount: 0 },
      { section: 'โฆษณาโปรโมชั่น', amount: 0 },
      { section: 'Motion Graphic', amount: 0 },
      { section: 'รูปใส่กรอบแต่งรูป', amount: 0 },
      { section: 'อื่นๆ', amount: 0 }
    ],
    shooting: [
      { section: 'ถ่ายทำ', amount: 0 }
    ]
  },
  createdBy: '',
};

const STEP_LABELS = ['ข้อมูลทั่วไป', 'รายละเอียด', 'งาน'];

export function ManagerTaskDialog({
  open,
  onOpenChange,
  clinics,
  positions,
  onSubmit,
}: ManagerTaskDialogProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CreateTaskForm>(INITIAL_FORM);
  const [contentFlows, setContentFlows] = useState<ContentFlow[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [clinicComboOpen, setClinicComboOpen] = useState(false);

  // File upload state
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper functions for workload
  const getWorkloadValue = (category: string, section: string): number => {
    const categoryData = formData.workload[category as keyof typeof formData.workload] as Array<{ section: string, amount: number }>;
    const item = categoryData?.find(item => item.section === section);
    return item?.amount || 0;
  };

  const setWorkloadValue = (category: string, section: string, value: number) => {
    const categoryData = formData.workload[category as keyof typeof formData.workload] as Array<{ section: string, amount: number }>;
    const updatedCategory = categoryData.map(item =>
      item.section === section ? { ...item, amount: value } : item
    );
    setFormData({
      ...formData,
      workload: {
        ...formData.workload,
        [category]: updatedCategory
      }
    });
  };

  const totalSteps = 3;
  const allUsers = positions.flatMap((pos) => pos.members);
  const selectedFlow = contentFlows.find(f => f.id === selectedFlowId);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    // Upload files first
    let uploadedAttachments: any[] = [];

    if (files.length > 0) {
      setIsUploading(true);
      toast.info('กำลังอัปโหลดไฟล์...');

      try {
        for (const fileItem of files) {
          if (fileItem.url) {
            // Already uploaded
            uploadedAttachments.push({
              url: fileItem.url,
              filename: fileItem.file.name,
              size: fileItem.file.size,
              mimetype: fileItem.file.type,
            });
          } else {
            // Upload new file
            const result = await uploadService.uploadFile(fileItem.file, 'tasks', 'any');
            if (result.success && result.data) {
              uploadedAttachments.push({
                url: result.data.url,
                filename: result.data.filename,
                originalName: result.data.originalName,
                size: result.data.size,
                mimetype: result.data.mimetype,
              });
            } else {
              toast.error(`อัปโหลดไฟล์ ${fileItem.file.name} ล้มเหลว`);
            }
          }
        }
        toast.success('อัปโหลดไฟล์สำเร็จ');
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
      } finally {
        setIsUploading(false);
      }
    }

    // Convert content flows to process array
    const processes = contentFlows.map(flow => ({
      name: flow.title,
      assignee: flow.assignees,
      attachments: [] as any[],
      status: 'pending' as TaskStatus,
    }));

    // ถ้าไม่มี process ให้สร้าง default process
    const finalProcesses = processes.length > 0 ? processes : [{
      name: 'ขั้นตอนเริ่มต้น',
      assignee: [], // จะถูก handle ใน parent component
      attachments: [] as any[],
      status: 'pending' as TaskStatus,
    }];

    const submissionData: CreateTaskForm = {
      ...formData,
      process: finalProcesses,
      createdBy: '', // Will be set in parent component
      attachments: uploadedAttachments, // เพิ่ม attachments
    };

    console.log('uploadedAttachments:', uploadedAttachments);
    console.log('submissionData:', submissionData);

    onSubmit(submissionData);
    handleClose();
  };

  // File handling functions
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.all.includes(file.type)) {
      return `ประเภทไฟล์ ${file.type} ไม่รองรับ`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    return null;
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      if (files.length + newFiles.length >= MAX_FILES) {
        errors.push(`สามารถอัปโหลดได้สูงสุด ${MAX_FILES} ไฟล์`);
        return;
      }

      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        return;
      }

      // Check duplicate
      if (files.some(f => f.file.name === file.name && f.file.size === file.size)) {
        errors.push(`${file.name}: ไฟล์ซ้ำ`);
        return;
      }

      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      };

      newFiles.push(uploadedFile);
    });

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-purple-600" />;
    }
    if (file.type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-600" />;
    }
    return <File className="h-5 w-5 text-blue-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleClose = () => {
    setStep(1);
    setFormData(INITIAL_FORM);
    setContentFlows([]);
    setSelectedFlowId(null);
    setEditingFlowId(null);
    setClinicComboOpen(false);
    // Reset files and revoke object URLs
    files.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
    setIsDragging(false);
    setIsUploading(false);
    onOpenChange(false);
  };

  // Content Flow Functions
  const addContentFlow = () => {
    const newFlow: ContentFlow = {
      id: Date.now().toString(),
      title: 'รายละเอียด',
      assignees: [],
    };
    setContentFlows([...contentFlows, newFlow]);
    setSelectedFlowId(newFlow.id);
  };

  const removeContentFlow = (id: string) => {
    setContentFlows(contentFlows.filter(flow => flow.id !== id));
    if (selectedFlowId === id) {
      setSelectedFlowId(null);
    }
  };

  const startEditingTitle = (flow: ContentFlow) => {
    setEditingFlowId(flow.id);
    setEditingTitle(flow.title);
  };

  const cancelEditingTitle = () => {
    setEditingFlowId(null);
    setEditingTitle('');
  };

  const saveTitle = (id: string) => {
    if (editingTitle.trim()) {
      setContentFlows(contentFlows.map(flow =>
        flow.id === id ? { ...flow, title: editingTitle } : flow
      ));
    }
    setEditingFlowId(null);
    setEditingTitle('');
  };

  const toggleAssignee = (flowId: string, userId: string) => {
    setContentFlows(contentFlows.map(flow => {
      if (flow.id === flowId) {
        const hasAssignee = flow.assignees.includes(userId);
        return {
          ...flow,
          assignees: hasAssignee
            ? flow.assignees.filter(id => id !== userId)
            : [...flow.assignees, userId]
        };
      }
      return flow;
    }));
  };

  const removeAssignee = (flowId: string, userId: string) => {
    setContentFlows(contentFlows.map(flow => {
      if (flow.id === flowId) {
        return {
          ...flow,
          assignees: flow.assignees.filter(id => id !== userId)
        };
      }
      return flow;
    }));
  };

  const getPriorityColor = (priority: TaskPriority) => {
    const baseColors = {
      low: 'bg-gray-100 text-gray-700 border-gray-300',
      medium: 'bg-blue-100 text-blue-700 border-blue-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      urgent: 'bg-red-100 text-red-700 border-red-300',
    };
    const hoverColors = {
      low: 'hover:bg-gray-200 hover:text-gray-800 hover:border-gray-400',
      medium: 'hover:bg-blue-200 hover:text-blue-800 hover:border-blue-400',
      high: 'hover:bg-orange-200 hover:text-orange-800 hover:border-orange-400',
      urgent: 'hover:bg-red-200 hover:text-red-800 hover:border-red-400',
    };
    return `${baseColors[priority]} ${hoverColors[priority]}`;
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    const labels = {
      low: 'ต่ำ',
      medium: 'ปานกลาง',
      high: 'สูง',
      urgent: 'ด่วนมาก',
    };
    return labels[priority];
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.trim() !== '' && formData.dueDate;
      case 2:
        return formData.clinicId !== '';
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">สร้างงานใหม่</DialogTitle>
          <DialogDescription>
            จัดการงานและมอบหมายให้ทีม
          </DialogDescription>
        </DialogHeader>

        <StepIndicator
          currentStep={step}
          totalSteps={totalSteps}
          steps={STEP_LABELS}
        />

        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 1: Basic Info (without Clinic) */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  หัวข้อเรื่อง <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ระบุชื่องาน..."
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">รายละเอียด</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="อธิบายรายละเอียดงาน..."
                />
              </div>

              {/* File Attachments */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  ไฟล์แนบ
                  <span className="text-sm text-gray-500 font-normal">
                    (สูงสุด {MAX_FILES} ไฟล์, ไม่เกิน {MAX_FILE_SIZE / 1024 / 1024}MB ต่อไฟล์)
                  </span>
                </Label>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_FILE_TYPES.all.join(',')}
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />

                {/* Drop zone */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all',
                    isDragging
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                  )}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Upload className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        รองรับ: รูปภาพ (JPEG, PNG, GIF, WebP), PDF, Word
                      </p>
                    </div>
                  </div>
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {files.map((fileItem) => (
                      <div
                        key={fileItem.id}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border"
                      >
                        {/* Preview or icon */}
                        {fileItem.preview ? (
                          <img
                            src={fileItem.preview}
                            alt={fileItem.file.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded">
                            {getFileIcon(fileItem.file)}
                          </div>
                        )}

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {fileItem.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(fileItem.file.size)}
                          </p>
                        </div>

                        {/* Remove button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(fileItem.id);
                          }}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>ระดับความสำคัญ</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((priority) => (
                    <Button
                      key={priority}
                      type="button"
                      variant="outline"
                      className={cn(
                        'justify-start',
                        formData.priority === priority && getPriorityColor(priority)
                      )}
                      onClick={() => setFormData({ ...formData, priority: priority })}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      {getPriorityLabel(priority)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>วันที่เริ่มงาน</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? (
                          format(formData.startDate, 'dd MMMM yyyy', { locale: th })
                        ) : (
                          <span>เลือกวันที่</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => setFormData({ ...formData, startDate: date || new Date() })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>
                    กำหนดส่ง <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.dueDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dueDate ? (
                          format(formData.dueDate, 'dd MMMM yyyy', { locale: th })
                        ) : (
                          <span>เลือกวันที่</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate}
                        onSelect={(date) => setFormData({ ...formData, dueDate: date || new Date() })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Clinic + Content Flow with Split View */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Clinic Selection */}
              <div className="space-y-2">
                <Label>
                  คลินิก <span className="text-red-500">*</span>
                </Label>
                <Popover open={clinicComboOpen} onOpenChange={setClinicComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clinicComboOpen}
                      className="w-full justify-between"
                    >
                      {formData.clinicId ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {clinics.find((clinic) => clinic.id === formData.clinicId)?.name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">เลือกคลินิก...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full sm:w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="ค้นหาคลินิก..." />
                      <CommandList>
                        <CommandEmpty>ไม่พบคลินิก</CommandEmpty>
                        <CommandGroup>
                          {clinics.map((clinic) => (
                            <CommandItem
                              key={clinic.id}
                              value={clinic.name}
                              onSelect={() => {
                                setFormData({ ...formData, clinicId: clinic.id });
                                setClinicComboOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  formData.clinicId === clinic.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <Building2 className="mr-1 h-4 w-4 text-purple-600" />
                              {clinic.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Content Flow Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      ขั้นตอนและผู้รับผิดชอบ
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      กำหนดขั้นตอนการทำงานและผู้รับผิดชอบ
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={addContentFlow}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มขั้นตอน
                  </Button>
                </div>

                {contentFlows.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 h-[450px]">
                    {/* Left Side: Flow List (Vertical) */}
                    <div className="border-2 border-purple-200 rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-3 text-purple-700">รายการขั้นตอน</h4>
                      <ScrollArea className="h-[390px]">
                        <div className="space-y-2 pr-3">
                          {contentFlows.map((flow, index) => (
                            <Card
                              key={flow.id}
                              className={cn(
                                "cursor-pointer transition-all border-2",
                                selectedFlowId === flow.id
                                  ? "border-purple-500 bg-purple-50 shadow-md"
                                  : "border-purple-200 hover:border-purple-400"
                              )}
                              onClick={() => setSelectedFlowId(flow.id)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <Badge variant="outline" className="bg-purple-100 text-purple-700">
                                      {index + 1}
                                    </Badge>
                                    <span className="font-medium text-sm">{flow.title}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeContentFlow(flow.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                {flow.assignees.length > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Users className="h-3 w-3" />
                                    <span>{flow.assignees.length} คน</span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Right Side: Edit Details */}
                    <div className="border-2 border-purple-200 rounded-lg p-4">
                      {selectedFlow ? (
                        <div className="space-y-4">
                          {/* Title Editor */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">ชื่อขั้นตอน</Label>
                            {editingFlowId === selectedFlow.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  className="flex-1"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveTitle(selectedFlow.id);
                                    if (e.key === 'Escape') cancelEditingTitle();
                                  }}
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => saveTitle(selectedFlow.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={cancelEditingTitle}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 p-2 border rounded-md bg-gray-50">
                                  {selectedFlow.title}
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditingTitle(selectedFlow)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Assignees Section */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">ผู้รับผิดชอบ</Label>

                            {/* Selected Assignees */}
                            {selectedFlow.assignees.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50">
                                {selectedFlow.assignees.map(userId => {
                                  const user = allUsers.find(u => u.id === userId);
                                  if (!user) return null;
                                  return (
                                    <Badge
                                      key={userId}
                                      variant="secondary"
                                      className="bg-purple-100 text-purple-700 pl-1 pr-2 py-1"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5">
                                          <AvatarFallback className="text-xs bg-purple-200">
                                            {user.name.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs">{user.name}</span>
                                        <button
                                          type="button"
                                          onClick={() => removeAssignee(selectedFlow.id, userId)}
                                          className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}

                            {/* Accordion: Select by Position */}
                            <ScrollArea className="h-[260px] border rounded-md">
                              <Accordion type="single" collapsible className="w-full">
                                {positions.map((position) => (
                                  <AccordionItem key={position.id} value={position.id}>
                                    <AccordionTrigger className="px-4 hover:bg-purple-50">
                                      <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-purple-600" />
                                        <span className="font-medium">{position.name}</span>
                                        <Badge variant="outline" className="ml-2">
                                          {position.members.length}
                                        </Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                      <div className="space-y-2">
                                        {position.members.length === 0 ? (
                                          <div className="text-center py-3 text-gray-400 text-sm">
                                            ไม่มีสมาชิกในตำแหน่งนี้
                                          </div>
                                        ) : (
                                          position.members.map((user) => (
                                            <div
                                              key={user.id}
                                              className={cn(
                                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                                                selectedFlow.assignees.includes(user.id)
                                                  ? "bg-purple-200"
                                                  : "hover:bg-purple-100"
                                              )}
                                              onClick={() => toggleAssignee(selectedFlow.id, user.id)}
                                            >
                                              <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-purple-300 text-purple-700">
                                                  {user.name.charAt(0)}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                  {user.name}
                                                </p>
                                                {user.role && (
                                                  <p className="text-xs text-gray-500 truncate">
                                                    {user.role}
                                                  </p>
                                                )}
                                              </div>
                                              {selectedFlow.assignees.includes(user.id) && (
                                                <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0" />
                                              )}
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            </ScrollArea>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <FileText className="h-16 w-16 mb-4" />
                          <p className="text-sm">เลือกขั้นตอนเพื่อแก้ไข</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Card className="border-2 border-dashed border-purple-300">
                    <CardContent className="p-8">
                      <div className="flex flex-col items-center justify-center text-center">
                        <FileText className="h-12 w-12 text-purple-300 mb-3" />
                        <p className="text-gray-500 mb-4">ยังไม่มีขั้นตอนการทำงาน</p>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-purple-500 text-purple-600 hover:bg-purple-50"
                          onClick={addContentFlow}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          เพิ่มขั้นตอนแรก
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Workload */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">รายละเอียดงาน (Workload)</h3>

              {/* Video */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Video className="h-5 w-5 text-purple-600" />
                    วิดีโอ
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="videoShort">Short</Label>
                      <Input
                        id="videoShort"
                        type="number"
                        min="0"
                        value={getWorkloadValue('video', 'Short')}
                        onChange={(e) => setWorkloadValue('video', 'Short', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="videoMedium">Medium</Label>
                      <Input
                        id="videoMedium"
                        type="number"
                        min="0"
                        value={getWorkloadValue('video', 'Medium')}
                        onChange={(e) => setWorkloadValue('video', 'Medium', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="videoLong">Long</Label>
                      <Input
                        id="videoLong"
                        type="number"
                        min="0"
                        value={getWorkloadValue('video', 'Long')}
                        onChange={(e) => setWorkloadValue('video', 'Long', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Website */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-purple-600" />
                    เว็บไซต์
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="landingPage">Landing Page</Label>
                      <Input
                        id="landingPage"
                        type="number"
                        min="0"
                        value={getWorkloadValue('website', 'Landing Page')}
                        onChange={(e) => setWorkloadValue('website', 'Landing Page', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salePage">Sale Page</Label>
                      <Input
                        id="salePage"
                        type="number"
                        min="0"
                        value={getWorkloadValue('website', 'Sale Page')}
                        onChange={(e) => setWorkloadValue('website', 'Sale Page', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Graphics */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Image className="h-5 w-5 text-purple-600" />
                    ภาพนิ่ง
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { section: 'CI', label: 'CI' },
                      { section: 'Artwork', label: 'Artwork' },
                      { section: 'โฆษณาโปรโมชั่น', label: 'โฆษณาโปรโมชั่น' },
                      { section: 'Motion Graphic', label: 'Motion Graphic' },
                      { section: 'รูปใส่กรอบแต่งรูป', label: 'รูปใส่กรอบแต่งรูป' },
                      { section: 'อื่นๆ', label: 'อื่นๆ' },
                    ].map(({ section, label }) => (
                      <div key={section} className="space-y-2">
                        <Label htmlFor={section}>{label}</Label>
                        <Input
                          id={section}
                          type="number"
                          min="0"
                          value={getWorkloadValue('image', section)}
                          onChange={(e) => setWorkloadValue('image', section, parseInt(e.target.value) || 0)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Photography */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-purple-600" />
                    ถ่ายทำ
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="photoshoot">จำนวนครั้ง</Label>
                    <Input
                      id="photoshoot"
                      type="number"
                      min="0"
                      value={getWorkloadValue('shooting', 'ถ่ายทำ')}
                      onChange={(e) => setWorkloadValue('shooting', 'ถ่ายทำ', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div>
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                ย้อนกลับ
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              ยกเลิก
            </Button>
            {step < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                ถัดไป
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isUploading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังอัปโหลด...
                  </>
                ) : (
                  'สร้างงาน'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}