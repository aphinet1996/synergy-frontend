import { useState, useRef, useEffect } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TaskColumn } from '@/components/task/TaskColumn';
import { TaskCard } from '@/components/task/TaskCard';
import { TaskDetailDialog } from '@/components/task/TaskDetailDialog';
import { TaskDialog } from '@/components/task/TaskDialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateTaskForm, Task, TaskStatus, User, ViewMode, CreateTaskRequest } from '@/types/task';
import { Plus, LayoutGrid, Users, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Import stores and hooks
import { useTaskPageImproved } from '@/hooks/useTaskImproved';

// แก้ไข STATUS_COLUMNS ให้ตรงกับ backend
const STATUS_COLUMNS = [
    { id: 'pending', title: 'รอดำเนินการ' },
    { id: 'process', title: 'กำลังดำเนินการ' },
    { id: 'review', title: 'รอตรวจสอบ' },
    { id: 'done', title: 'เสร็จสิ้น' },
];

// Searchable Select Component สำหรับ Clinics
function SearchableClinicSelect({
    clinics,
    value,
    onValueChange,
}: {
    clinics: Array<{ id: string; name: string }>;
    value: string;
    onValueChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
    };

    const handleSelect = (selectedValue: string) => {
        onValueChange(selectedValue);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                >
                    {value === 'all'
                        ? 'ทั้งหมด'
                        : value
                            ? clinics.find((clinic) => clinic.id === value)?.name || 'ไม่พบคลินิก'
                            : 'เลือกคลินิก...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="ค้นหาคลินิก..." />
                    <CommandList>
                        <CommandEmpty>ไม่พบคลินิก</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                key="all"
                                value="ทั้งหมด"
                                onSelect={() => handleSelect('all')}
                                className="justify-between"
                            >
                                <span>ทั้งหมด</span>
                                <Check
                                    className={cn(
                                        'mr-2 h-4 w-4',
                                        value === 'all' ? 'opacity-100' : 'opacity-0'
                                    )}
                                />
                            </CommandItem>
                            {clinics.map((clinic) => (
                                <CommandItem
                                    key={clinic.id}
                                    value={clinic.name}
                                    onSelect={() => handleSelect(clinic.id)}
                                    className="justify-between"
                                >
                                    <span>{clinic.name}</span>
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === clinic.id ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// Horizontal scroll hook - เฉพาะ Desktop เท่านั้น
function useHorizontalScroll(ref: React.RefObject<HTMLDivElement | null>) {
    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // ตรวจสอบว่าเป็น touch device หรือไม่
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) return; // ไม่ใช้ horizontal scroll บน touch device

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                element.scrollBy({
                    left: e.deltaY > 0 ? 100 : -100,
                    behavior: 'smooth'
                });
            }
        };

        element.addEventListener('wheel', handleWheel, { passive: false });
        return () => element.removeEventListener('wheel', handleWheel);
    }, [ref]);
}

export default function Task() {
    // API Data from stores - useTaskPageImproved fetch ทุกอย่างแล้ว และป้องกัน fetch ซ้ำ
    const {
        tasks,
        users,
        clinics: allClinics,
        positions,
        currentUser,
        loading,
        error,
        createTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        updateProcessStatus,
        refetch,
    } = useTaskPageImproved();

    // State
    const [viewMode, setViewMode] = useState<ViewMode>('status');
    const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
    const [selectedClinic, setSelectedClinic] = useState<string>('all');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'tasks'>('tasks');
    const [currentPage, setCurrentPage] = useState(1);
    const clinicsPerPage = 6;

    // Refs for horizontal scroll
    const assigneeScrollRef = useRef<HTMLDivElement>(null);
    const clinicScrollRef = useRef<HTMLDivElement>(null);

    useHorizontalScroll(assigneeScrollRef);
    useHorizontalScroll(clinicScrollRef);

    const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

    // Helper: หา process ที่ user ถูก assign
    const findUserProcess = (task: Task, userId: string, userName: string) => {
        if (!task.process || task.process.length === 0) return null;

        for (const process of task.process) {
            if (!process.assignee || process.assignee.length === 0) continue;

            for (const assignee of process.assignee) {
                // Case 1: assignee เป็น string (ID หรือ name)
                if (typeof assignee === 'string') {
                    if (assignee === userId) return process;
                    if (assignee.includes(' ') && assignee.toLowerCase() === userName.toLowerCase()) {
                        return process;
                    }
                }

                // Case 2: assignee เป็น object
                if (typeof assignee === 'object' && assignee !== null) {
                    if ('id' in assignee && assignee.id === userId) {
                        return process;
                    }
                    if ('firstname' in assignee && 'lastname' in assignee) {
                        const fullName = `${(assignee as any).firstname} ${(assignee as any).lastname}`.trim();
                        if (fullName.toLowerCase() === userName.toLowerCase()) {
                            return process;
                        }
                    }
                }
            }
        }

        return null;
    };

    // Helper: คำนวณสถานะที่จะใช้จัดกลุ่ม task ตาม role
    const getDisplayStatus = (task: Task): TaskStatus => {
        // Manager/Admin: ใช้ task.status
        if (isManager) {
            return task.status;
        }

        // Employee: หา process ที่ตัวเองถูก assign แล้วใช้ process.status
        const userProcess = findUserProcess(task, currentUser?.id || '', currentUserName);

        if (userProcess && userProcess.status) {
            return userProcess.status as TaskStatus;
        }

        // Fallback: ถ้าหา process ไม่เจอ ให้ใช้ task.status
        return task.status;
    };

    // Reset viewMode และ states เมื่อ user เปลี่ยนหรือ role ไม่เข้ากัน
    useEffect(() => {
        if (!isManager && viewMode === 'assignee') {
            setViewMode('status');
            setSelectedAssignee('all');
        }
        setSelectedAssignee('all');
        setSelectedClinic('all');
        setCurrentPage(1);
    }, [currentUser?.id]);

    useEffect(() => {
        if (!isManager && viewMode === 'assignee') {
            setViewMode('status');
        }
    }, [isManager, viewMode]);

    // Transform clinics data for UI - ใช้ ObjectId ตรงๆ
    const clinicsForUI: Array<{ id: string; name: string }> = allClinics.length > 0
        ? allClinics.map(clinic => ({
            id: clinic.id,  // ใช้ ObjectId ตรงๆ
            name: typeof clinic.name === 'string'
                ? clinic.name
                : (clinic.name?.th || clinic.name?.en || 'ไม่ระบุชื่อ'),
        }))
        : (() => {
            // ถ้าไม่มี clinics จาก API ให้ดึงจาก tasks
            const clinicMap = new Map<string, { id: string; name: string }>();
            tasks.forEach(task => {
                // ใช้ task.clinic แทน task.clinicId
                if (task.clinic?.id && !clinicMap.has(task.clinic.id)) {
                    clinicMap.set(task.clinic.id, {
                        id: task.clinic.id,
                        name: task.clinic.name?.th || task.clinic.name?.en || 'ไม่ระบุชื่อ'
                    });
                }
            });
            return Array.from(clinicMap.values());
        })();

    // Debug clinic matching
    useEffect(() => {
        if (viewMode === 'clinic') {
            clinicsForUI.forEach(clinic => {
                // ใช้ task.clinic แทน task.clinicId
                const matchingTasks = tasks.filter(t => t.clinic?.id === clinic.id);
                console.log(`Clinic "${clinic.name}" (ID: ${clinic.id}):`, matchingTasks.length, 'tasks');
            });
        }
    }, [viewMode, clinicsForUI.length, tasks.length]);

    // Transform users to include full names
    const usersWithNames = users.map(user => ({
        ...user,
        name: user.firstname && user.lastname
            ? `${user.firstname} ${user.lastname}`
            : user.name || user.username || 'ไม่ระบุชื่อ',
    }));

    // Helper function to check if user is assignee - รองรับ response ใหม่
    const isUserAssignee = (task: Task, userId: string, userName: string): boolean => {
        // Check assignee array จาก response ใหม่
        if (task.assignee && task.assignee.length > 0) {
            return task.assignee.some(a =>
                a.id === userId ||
                `${a.firstname} ${a.lastname}`.toLowerCase() === userName.toLowerCase()
            );
        }

        // Fallback: Check process assignees
        if (task.process && task.process.length > 0) {
            return task.process.some(p =>
                p.assignee && p.assignee.some(a => {
                    if (typeof a === 'string') {
                        if (a.includes(' ')) {
                            return a.toLowerCase() === userName.toLowerCase();
                        }
                        return a === userId;
                    } else if (a && typeof a === 'object' && 'id' in a) {
                        return (a as User).id === userId;
                    }
                    return false;
                })
            );
        }

        return false;
    };

    // Get current user's full name
    const currentUserName = currentUser ? (() => {
        if (currentUser.firstname && currentUser.lastname) {
            return `${currentUser.firstname} ${currentUser.lastname}`.trim();
        }
        if (currentUser.name) {
            return currentUser.name;
        }
        return currentUser.username || currentUser.id || '';
    })() : '';

    // Filter tasks for clinic view
    const baseFilteredTasksForClinic = isManager
        ? tasks
        : tasks.filter((task) =>
            isUserAssignee(task, currentUser?.id || '', currentUserName) ||
            task.createdBy === currentUser?.id ||
            task.createdBy === currentUserName
        );

    // Filter tasks โดยใช้ getDisplayStatus สำหรับ employee
    const filteredTasks = isManager
        ? tasks
        : tasks.filter((task) =>
            isUserAssignee(task, currentUser?.id || '', currentUserName) ||
            task.createdBy === currentUser?.id ||
            task.createdBy === currentUserName
        );

    // ใช้ getDisplayStatus เพื่อจัดกลุ่ม tasks
    const getTasksByStatus = (status: TaskStatus): Task[] => {
        return filteredTasks.filter((task) => getDisplayStatus(task) === status);
    };

    // Get tasks by assignee
    const getTasksByAssignee = (userId: string): Task[] => {
        if (!isManager) return [];
        const user = usersWithNames.find(u => u.id === userId);
        const userName = user ? user.name : '';
        return tasks.filter((task) => isUserAssignee(task, userId, userName));
    };

    // Get tasks by clinic - ใช้ clinic.id
    const getTasksByClinic = (clinicId: string): Task[] => {
        return baseFilteredTasksForClinic.filter(task => task.clinic?.id === clinicId);
    };

    // Get available clinics (ที่มี tasks)
    const availableClinics = clinicsForUI.filter(clinic =>
        baseFilteredTasksForClinic.some(task => task.clinic?.id === clinic.id)
    );

    // Sorted and paginated clinics for clinic view
    const sortedClinics = [...availableClinics].sort((a, b) => {
        if (sortBy === 'tasks') {
            return getTasksByClinic(b.id).length - getTasksByClinic(a.id).length;
        }
        return a.name.localeCompare(b.name, 'th');
    });

    // Clinic display logic
    const displayClinics = selectedClinic === 'all'
        ? sortedClinics.slice((currentPage - 1) * clinicsPerPage, currentPage * clinicsPerPage)
        : sortedClinics.filter(c => c.id === selectedClinic);

    const displayTotalPages = Math.ceil(sortedClinics.length / clinicsPerPage);

    // Transform task for UI display -  FIXED: return Task พร้อม computed fields
    const transformTaskForUI = (task: Task): Task & { displayStatus: TaskStatus; clinicName: string } => {
        // ใช้ clinic object แทน clinicId
        const clinicName = task.clinic?.name?.th || task.clinic?.name?.en ||
            clinicsForUI.find(c => c.id === task.clinic?.id)?.name ||
            'ไม่ระบุคลินิก';

        // ใช้ displayStatus สำหรับ employee
        const displayStatus = getDisplayStatus(task);

        return {
            ...task, // return task เดิมทั้งหมด
            displayStatus, // เพิ่ม computed field
            clinicName, // เพิ่ม computed field
        };
    };

    // Handle task click
    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsDetailDialogOpen(true);
    };

    // Handle drag end
    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const newStatus = destination.droppableId as TaskStatus;
        const task = tasks.find(t => t.id === draggableId);

        if (!task) return;

        try {
            if (isManager) {
                // Manager: update task.status
                await updateTaskStatus(draggableId, newStatus);
            } else {
                // Employee: update process.status ของตัวเอง
                const userProcess = findUserProcess(task, currentUser?.id || '', currentUserName);

                if (userProcess && userProcess.name) {
                    await updateProcessStatus(draggableId, userProcess.name, newStatus);
                } else {
                    // Fallback: ถ้าไม่เจอ process ให้ update task status
                    await updateTaskStatus(draggableId, newStatus);
                }
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('ไม่สามารถอัพเดทสถานะได้');
        }
    };

    // Helper function to format date for API
    const formatDateToAPI = (date: Date | string): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return format(d, 'MM/dd/yyyy');
    };

    // Handle task update
    const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
        // ใช้ clinic แทน clinicId
        const { startDate, dueDate, clinic, process, ...restUpdates } = updates;

        await updateTask(taskId, {
            ...restUpdates,
            ...(startDate && { startDate: formatDateToAPI(startDate) }),
            ...(dueDate && { dueDate: formatDateToAPI(dueDate) }),
            // ส่ง clinic.id (ObjectId) ไปเป็น clinicId
            ...(clinic && { clinicId: clinic.id }),
            ...(process && {
                process: process.map(p => ({
                    ...p,
                    assignee: Array.isArray(p.assignee) && p.assignee.length > 0 && typeof p.assignee[0] === 'object'
                        ? (p.assignee as any[]).map(a => a.id || a)
                        : p.assignee
                }))
            }),
            updatedBy: currentUser?.id,
        } as any);
        setIsDetailDialogOpen(false);
    };

    const handleTaskDelete = async (taskId: string) => {
        await deleteTask(taskId);
        setIsDetailDialogOpen(false);
    };

    // handleTaskCreate - clinicId ตอนนี้คือ ObjectId แล้ว
    const handleTaskCreate = async (data: CreateTaskForm) => {
        if (!currentUser) return;

        const processWithCleanAssignees = data.process.map(p => {
            const cleanAssignees = (p.assignee || [])
                .filter(id => id && id !== null && id !== undefined && id !== '')
                .filter(id => typeof id === 'string' && id.length > 0);

            const finalAssignees = cleanAssignees.length > 0 ? cleanAssignees : [currentUser.id];

            return {
                name: p.name || 'ขั้นตอน',
                assignee: finalAssignees,
                attachments: p.attachments || [],
                status: (p.status || 'pending') as TaskStatus,
            };
        });

        const finalProcesses = processWithCleanAssignees.length > 0 ? processWithCleanAssignees : [{
            name: 'ขั้นตอนเริ่มต้น',
            assignee: [currentUser.id],
            attachments: [],
            status: 'pending' as TaskStatus,
        }];

        // clinicId ตอนนี้คือ ObjectId แล้ว (จาก clinicsForUI)
        const finalClinicId = data.clinicId && data.clinicId !== '' ?
            data.clinicId :
            (clinicsForUI[0]?.id || '');

        if (!finalClinicId) {
            console.error('No clinic ID available');
            return;
        }

        const createRequest: CreateTaskRequest = {
            name: data.name,
            description: data.description || '',
            attachments: data.attachments || [],  //  ใช้ attachments จาก form data
            priority: data.priority,
            status: 'pending',  //  ใช้ 'pending'
            tag: [],
            startDate: format(data.startDate, 'MM/dd/yyyy'),
            dueDate: format(data.dueDate, 'MM/dd/yyyy'),
            clinicId: finalClinicId,  //  ObjectId
            process: finalProcesses,
            workload: data.workload || {
                video: [],
                website: [],
                image: [],
                shooting: [],
            },
            createdBy: currentUser.id,
        };

        // console.log('Creating task with data:', createRequest);
        await createTask(createRequest);
        setIsCreateDialogOpen(false);
    };

    // Loading state
    if (loading && !tasks.length) {
        return (
            <div className="space-y-6 pb-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-[400px] w-full" />
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    {error}
                    <Button
                        variant="link"
                        className="ml-2 p-0 h-auto"
                        onClick={() => refetch()}
                    >
                        ลองอีกครั้ง
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    const getBadgeClass = (count: number) => {
        if (count === 0) return 'bg-gray-100 text-gray-600';
        if (count < 5) return 'bg-green-100 text-green-700';
        if (count < 10) return 'bg-yellow-100 text-yellow-700';
        return 'bg-red-100 text-red-700';
    };

    return (
        // FIXED: ใช้ min-h-0 และ pb-6 แทน h-full เพื่อให้ scroll ได้บนมือถือ
        <div className="space-y-6 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isManager ? 'งานทั้งหมด' : 'งานของฉัน'}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {isManager ? 'จัดการและติดตามงานของทีม' : 'งานที่ได้รับมอบหมาย'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refetch()}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    {isManager && (
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => setIsCreateDialogOpen(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            เพิ่มงานใหม่
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters Card */}
            <Card className="p-4 flex-shrink-0">
                <div className="flex flex-wrap items-center gap-4">
                    {/* View Mode Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">มุมมอง:</span>
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                            <Button
                                variant={viewMode === 'status' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('status')}
                                className={viewMode === 'status' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                            >
                                <LayoutGrid className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">ตามสถานะ</span>
                            </Button>
                            {isManager && (
                                <Button
                                    variant={viewMode === 'assignee' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('assignee')}
                                    className={viewMode === 'assignee' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">รายบุคคล</span>
                                </Button>
                            )}
                            <Button
                                variant={viewMode === 'clinic' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('clinic')}
                                className={viewMode === 'clinic' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                            >
                                <Building2 className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">รายคลินิก</span>
                            </Button>
                        </div>
                    </div>

                    {/* Assignee Filter - Manager only */}
                    {viewMode === 'assignee' && isManager && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">พนักงาน:</span>
                            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="เลือกพนักงาน" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทั้งหมด</SelectItem>
                                    {usersWithNames.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Clinic Filters */}
                    {viewMode === 'clinic' && (
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                            {availableClinics.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">คลินิก:</span>
                                    <SearchableClinicSelect
                                        clinics={availableClinics}
                                        value={selectedClinic}
                                        onValueChange={(value) => {
                                            setSelectedClinic(value);
                                            if (value !== 'all') {
                                                setCurrentPage(1);
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            {selectedClinic === 'all' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">เรียงตาม:</span>
                                    <Select value={sortBy} onValueChange={(value) => { setSortBy(value as 'name' | 'tasks'); setCurrentPage(1); }}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tasks">จำนวนงาน (มากสุด)</SelectItem>
                                            <SelectItem value="name">ชื่อ (A-Z)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Task Count */}
                    <div className="ml-auto text-sm text-gray-600">
                        งานทั้งหมด: <span className="font-semibold">{filteredTasks.length}</span> งาน
                    </div>
                </div>
            </Card>

            {/* Task Board - FIXED: ลบ overflow-hidden และใช้ auto height */}
            <div className="min-h-0">
                <DragDropContext onDragEnd={handleDragEnd}>
                    {viewMode === 'status' ? (
                        // Status View -  FIXED: ใช้ auto height บนมือถือ
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {STATUS_COLUMNS.map((column) => (
                                <Card key={column.id} className="flex flex-col h-auto md:h-[500px]">
                                    <div className="p-4 flex flex-col h-full">
                                        <TaskColumn
                                            columnId={column.id}
                                            title={column.title}
                                            tasks={getTasksByStatus(column.id as TaskStatus).map(transformTaskForUI)}
                                            users={usersWithNames}
                                            onTaskClick={handleTaskClick}
                                        />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : viewMode === 'assignee' ? (
                        // Assignee View - FIXED: ใช้ flex-wrap บนมือถือ
                        <div className="w-full">
                            <div
                                ref={assigneeScrollRef}
                                className="flex flex-col md:flex-row md:overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                            >
                                {usersWithNames.map((user) => {
                                    const userTasks = getTasksByAssignee(user.id);
                                    if (selectedAssignee !== 'all' && user.id !== selectedAssignee) return null;

                                    return (
                                        <div key={user.id} className="w-full md:flex-shrink-0 md:w-80 md:min-w-[320px]">
                                            <Card className="flex flex-col h-auto md:h-[500px]">
                                                <div className="p-4 flex flex-col h-full">
                                                    {/* User Header */}
                                                    <div className="flex items-center gap-3 mb-3 pb-3 border-b flex-shrink-0">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                                                            <p className="text-xs text-gray-500">{userTasks.length} งาน</p>
                                                        </div>
                                                    </div>

                                                    {/* Tasks grouped by status */}
                                                    <div className="flex-1 md:overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                                                        {STATUS_COLUMNS.map((column) => {
                                                            const statusTasks = userTasks.filter(
                                                                (task) => task.status === column.id
                                                            );
                                                            if (statusTasks.length === 0) return null;

                                                            return (
                                                                <div key={column.id}>
                                                                    <h4 className="text-xs font-medium text-gray-500 mb-2 sticky top-0 bg-white py-1 z-10">
                                                                        {column.title} ({statusTasks.length})
                                                                    </h4>
                                                                    <div className="space-y-2">
                                                                        {statusTasks.map((task) => (
                                                                            <TaskCard
                                                                                key={task.id}
                                                                                task={transformTaskForUI(task)}
                                                                                onClick={() => handleTaskClick(task)}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {userTasks.length === 0 && (
                                                            <div className="text-center py-8 text-gray-400 text-sm">
                                                                ไม่มีงาน
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        // Clinic View -  FIXED: ใช้ flex-wrap บนมือถือ
                        <div className="w-full">
                            <div
                                ref={clinicScrollRef}
                                className="flex flex-col md:flex-row md:overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                            >
                                {displayClinics.map((clinic) => {
                                    const clinicTasks = getTasksByClinic(clinic.id);
                                    const tasksCount = clinicTasks.length;

                                    return (
                                        <div key={clinic.id} className="w-full md:flex-shrink-0 md:w-80 md:min-w-[320px]">
                                            <Card className="flex flex-col h-auto md:h-[500px]">
                                                <div className="p-4 flex flex-col h-full">
                                                    {/* Clinic Header */}
                                                    <div className="flex items-center justify-between mb-3 pb-3 border-b flex-shrink-0">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                                                                {clinic.name.charAt(0)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-gray-900 truncate">{clinic.name}</h3>
                                                                <p className="text-xs text-gray-500">{tasksCount} งาน</p>
                                                            </div>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getBadgeClass(tasksCount)}`}>
                                                            {tasksCount}
                                                        </span>
                                                    </div>

                                                    {/* Tasks Content */}
                                                    <div className="flex-1 md:overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                                                        {isManager ? (
                                                            (() => {
                                                                const tasksByAssignee = usersWithNames.reduce((acc, user) => {
                                                                    const userName = `${user.firstname} ${user.lastname}`.trim();
                                                                    const userClinicTasks = clinicTasks.filter(
                                                                        (task) => isUserAssignee(task, user.id, userName)
                                                                    );
                                                                    if (userClinicTasks.length > 0) {
                                                                        acc[user.id] = {
                                                                            user,
                                                                            tasks: userClinicTasks,
                                                                        };
                                                                    }
                                                                    return acc;
                                                                }, {} as Record<string, { user: User; tasks: Task[] }>);

                                                                return Object.keys(tasksByAssignee).length === 0 ? (
                                                                    <div className="text-center py-8 text-gray-400 text-sm">
                                                                        ไม่มีงาน
                                                                    </div>
                                                                ) : (
                                                                    <Accordion type="multiple" className="w-full">
                                                                        {Object.entries(tasksByAssignee).map(([userId, { user, tasks: userTasks }]) => (
                                                                            <AccordionItem key={userId} value={userId}>
                                                                                <AccordionTrigger className="text-xs font-medium text-gray-700 hover:no-underline">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                                                                                            <span className="text-xs font-semibold text-purple-700">
                                                                                                {user.name.charAt(0)}
                                                                                            </span>
                                                                                        </div>
                                                                                        {user.name} ({userTasks.length})
                                                                                    </div>
                                                                                </AccordionTrigger>
                                                                                <AccordionContent className="space-y-2 mt-2">
                                                                                    {userTasks.map((task) => (
                                                                                        <TaskCard
                                                                                            key={task.id}
                                                                                            task={transformTaskForUI(task)}
                                                                                            onClick={() => handleTaskClick(task)}
                                                                                        />
                                                                                    ))}
                                                                                </AccordionContent>
                                                                            </AccordionItem>
                                                                        ))}
                                                                    </Accordion>
                                                                );
                                                            })()
                                                        ) : (
                                                            clinicTasks.length === 0 ? (
                                                                <div className="text-center py-8 text-gray-400 text-sm">
                                                                    ไม่มีงาน
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {clinicTasks.map((task) => (
                                                                        <TaskCard
                                                                            key={task.id}
                                                                            task={transformTaskForUI(task)}
                                                                            onClick={() => handleTaskClick(task)}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>
                                    );
                                })}

                                {/* Empty State */}
                                {displayClinics.length === 0 && (
                                    <div className="w-full flex items-center justify-center h-64 text-gray-500">
                                        <p>ไม่พบคลินิก</p>
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {viewMode === 'clinic' && selectedClinic === 'all' && displayTotalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        ก่อนหน้า
                                    </Button>
                                    <span className="text-sm text-gray-600">
                                        หน้า {currentPage} จาก {displayTotalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.min(p + 1, displayTotalPages))}
                                        disabled={currentPage === displayTotalPages}
                                    >
                                        ถัดไป
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DragDropContext>
            </div>

            {selectedTask && (
                <TaskDetailDialog
                    open={isDetailDialogOpen}
                    onOpenChange={setIsDetailDialogOpen}
                    task={selectedTask}
                    users={usersWithNames}
                    onUpdate={handleTaskUpdate}
                    onDelete={handleTaskDelete}
                />
            )}

            {currentUser && (
                <TaskDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                    clinics={clinicsForUI}
                    positions={positions}
                    currentUser={{
                        id: currentUser.id,
                        role: currentUser.role === 'manager' ? 'admin' : currentUser.role as 'admin' | 'manager',
                    }}
                    onSubmit={handleTaskCreate}
                />
            )}
        </div>
    );
}