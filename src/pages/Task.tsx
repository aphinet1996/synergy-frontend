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
import type { Position, CreateTaskForm, Task, TaskStatus, User, ViewMode, CreateTaskRequest } from '@/types/task';
import { Plus, LayoutGrid, Users, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Import stores and hooks
import { useTaskPageImproved } from '@/hooks/useTaskImproved';

// ✅ แก้ไข STATUS_COLUMNS ให้ตรงกับ backend
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

// Horizontal scroll hook
function useHorizontalScroll(ref: React.RefObject<HTMLDivElement | null>) {
    useEffect(() => {
        const element = ref.current;
        if (!element) return;

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

    // ✅ Helper: หา process ที่ user ถูก assign
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

    // ✅ Helper: คำนวณสถานะที่จะใช้จัดกลุ่ม task ตาม role
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

    // ✅ Transform clinics data for UI - ใช้ ObjectId ตรงๆ
    const clinicsForUI: Array<{ id: string; name: string }> = allClinics.length > 0
        ? allClinics.map(clinic => ({
            id: clinic.id,  // ✅ ใช้ ObjectId ตรงๆ
            name: typeof clinic.name === 'string'
                ? clinic.name
                : (clinic.name?.th || clinic.name?.en || 'ไม่ระบุชื่อ'),
        }))
        : (() => {
            // ถ้าไม่มี clinics จาก API ให้ดึงจาก tasks
            const clinicMap = new Map<string, { id: string; name: string }>();
            tasks.forEach(task => {
                // ✅ ใช้ task.clinic แทน task.clinicId
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
                // ✅ ใช้ task.clinic แทน task.clinicId
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

    // ✅ Helper function to check if user is assignee - รองรับ response ใหม่
    const isUserAssignee = (task: Task, userId: string, userName: string): boolean => {
        // ✅ Check assignee array จาก response ใหม่
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

    // Filter tasks based on view mode
    const getFilteredTasks = () => {
        let filtered = tasks;

        if (!isManager) {
            filtered = filtered.filter((task) =>
                isUserAssignee(task, currentUser?.id || '', currentUserName) ||
                task.createdBy === currentUser?.id ||
                task.createdBy === currentUserName
            );
        }

        if (viewMode === 'assignee' && selectedAssignee !== 'all') {
            filtered = filtered.filter((task) =>
                isUserAssignee(task, selectedAssignee, selectedAssignee)
            );
        }

        // ✅ ใช้ task.clinic แทน task.clinicId
        if (viewMode === 'clinic' && selectedClinic !== 'all') {
            filtered = filtered.filter((task) => task.clinic?.id === selectedClinic);
        }

        return filtered;
    };

    const filteredTasks = getFilteredTasks();

    // Group tasks by status
    const getTasksByStatus = (status: TaskStatus) => {
        return filteredTasks.filter((task) => getDisplayStatus(task) === status);
    };

    // Group tasks by assignee
    const getTasksByAssignee = (assigneeId: string) => {
        const user = usersWithNames.find(u => u.id === assigneeId);
        const userName = user ? `${user.firstname} ${user.lastname}`.trim() : assigneeId;
        return filteredTasks.filter((task) => isUserAssignee(task, assigneeId, userName));
    };

    // ✅ ใช้ task.clinic แทน task.clinicId
    const getTasksByClinic = (clinicId: string) => {
        return filteredTasks.filter((task) => task.clinic?.id === clinicId);
    };

    // ✅ ใช้ task.clinic แทน task.clinicId
    const getAvailableClinics = () => {
        const clinicIdsWithTasks = new Set(baseFilteredTasksForClinic.map((task) => task.clinic?.id).filter(Boolean));
        return clinicsForUI.filter((clinic) => clinicIdsWithTasks.has(clinic.id));
    };

    const availableClinics = getAvailableClinics();

    // Clinic display logic
    let displayClinics: typeof clinicsForUI = [];
    let displayTotalPages = 1;

    if (viewMode === 'clinic') {
        if (selectedClinic !== 'all') {
            const selectedClinicObj = availableClinics.find((c) => c.id === selectedClinic);
            displayClinics = selectedClinicObj ? [selectedClinicObj] : [];
            displayTotalPages = 1;
        } else {
            let sortedClinics = [...availableClinics];

            if (sortBy === 'tasks') {
                sortedClinics = sortedClinics.sort((a, b) => {
                    // ✅ ใช้ task.clinic แทน task.clinicId
                    const tasksA = baseFilteredTasksForClinic.filter((task) => task.clinic?.id === a.id).length;
                    const tasksB = baseFilteredTasksForClinic.filter((task) => task.clinic?.id === b.id).length;
                    return tasksB - tasksA;
                });
            } else {
                sortedClinics = sortedClinics.sort((a, b) => a.name.localeCompare(b.name, 'th'));
            }

            displayTotalPages = Math.ceil(sortedClinics.length / clinicsPerPage);
            const startIdx = (currentPage - 1) * clinicsPerPage;
            displayClinics = sortedClinics.slice(startIdx, startIdx + clinicsPerPage);
        }
    }

    // ✅ Transform task for UI - ใช้ task.clinic
    const transformTaskForUI = (task: Task) => ({
        ...task,
        title: task.name,
        clinicName: task.clinic?.name?.th || task.clinic?.name?.en || '',
    });

    // Handle drag and drop
    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        const newStatus = destination.droppableId as TaskStatus;
        const taskToUpdate = tasks.find(t => t.id === draggableId);

        if (!taskToUpdate) return;

        try {
            if (isManager) {
                // ✅ Manager/Admin: อัปเดต task.status
                await updateTaskStatus(draggableId, newStatus);
                toast.success('อัปเดตสถานะงานสำเร็จ');
            } else {
                // ✅ Employee: อัปเดต process.status ของ process ที่ตัวเองถูก assign
                const userProcess = findUserProcess(taskToUpdate, currentUser?.id || '', currentUserName);

                if (userProcess) {
                    const result = await updateProcessStatus(draggableId, userProcess.id, newStatus);
                    if (result.success) {
                        toast.success('อัปเดตสถานะขั้นตอนสำเร็จ');
                    } else {
                        toast.error(result.error || 'ไม่สามารถอัปเดตสถานะได้');
                    }
                } else {
                    toast.error('คุณไม่ได้ถูก assign ในงานนี้');
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        }
    };

    // Handle task operations
    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsDetailDialogOpen(true);
    };

    // ✅ แก้ไข handleTaskUpdate - ใช้ clinic แทน clinicId
    const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
        const formatDateToAPI = (date: Date | string | undefined): string | undefined => {
            if (!date) return undefined;
            const d = typeof date === 'string' ? new Date(date) : date;
            return d.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
            });
        };

        // ✅ ใช้ clinic แทน clinicId
        const { startDate, dueDate, clinic, process, ...restUpdates } = updates;

        await updateTask(taskId, {
            ...restUpdates,
            ...(startDate && { startDate: formatDateToAPI(startDate) }),
            ...(dueDate && { dueDate: formatDateToAPI(dueDate) }),
            // ✅ ส่ง clinic.id (ObjectId) ไปเป็น clinicId
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

    // ✅ handleTaskCreate - clinicId ตอนนี้คือ ObjectId แล้ว
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

        // ✅ clinicId ตอนนี้คือ ObjectId แล้ว (จาก clinicsForUI)
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
            attachments: [],
            priority: data.priority,
            status: 'pending',  // ✅ ใช้ 'pending'
            tag: [],
            startDate: format(data.startDate, 'MM/dd/yyyy'),
            dueDate: format(data.dueDate, 'MM/dd/yyyy'),
            clinicId: finalClinicId,  // ✅ ObjectId
            process: finalProcesses,
            workload: data.workload || {
                video: [],
                website: [],
                image: [],
                shooting: [],
            },
            createdBy: currentUser.id,
        };

        console.log('Creating task with data:', createRequest);
        await createTask(createRequest);
        setIsCreateDialogOpen(false);
    };

    // Loading state
    if (loading && !tasks.length) {
        return (
            <div className="space-y-6 h-full flex flex-col">
                <div className="flex items-center justify-between flex-shrink-0">
                    <div className="space-y-1">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-[500px] w-full" />
                        ))}
                    </div>
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
        <div className="space-y-6 h-full flex flex-col">
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
                    <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        สร้างงานใหม่
                    </Button>
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

            {/* Task Board */}
            <div className="flex-1 overflow-hidden">
                <DragDropContext onDragEnd={handleDragEnd}>
                    {viewMode === 'status' ? (
                        // Status View
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
                            {STATUS_COLUMNS.map((column) => (
                                <Card key={column.id} className="flex flex-col overflow-hidden h-[500px]">
                                    <div className="p-4 h-full flex flex-col">
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
                        // Assignee View
                        <div className="flex-1 overflow-hidden">
                            <div className="h-full flex flex-col">
                                <div ref={assigneeScrollRef} className="flex flex-row overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent h-[calc(100%-60px)]">
                                    {usersWithNames.map((user) => {
                                        const userTasks = getTasksByAssignee(user.id);
                                        if (selectedAssignee !== 'all' && user.id !== selectedAssignee) return null;

                                        return (
                                            <div key={user.id} className="flex-shrink-0 w-80 min-w-[320px]">
                                                <Card className="flex flex-col overflow-hidden h-[500px]">
                                                    <div className="p-4 h-full flex flex-col">
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
                                                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
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
                        </div>
                    ) : (
                        // Clinic View
                        <div className="flex-1 overflow-hidden">
                            <div className="h-full flex flex-col">
                                <div ref={clinicScrollRef} className="flex flex-row overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent h-[calc(100%-60px)]">
                                    {displayClinics.map((clinic) => {
                                        const clinicTasks = getTasksByClinic(clinic.id);
                                        const tasksCount = clinicTasks.length;

                                        return (
                                            <div key={clinic.id} className="flex-shrink-0 w-80 min-w-[320px]">
                                                <Card className="flex flex-col overflow-hidden h-[500px]">
                                                    <div className="p-4 h-full flex flex-col">
                                                        {/* Clinic Header */}
                                                        <div className="flex items-center justify-between mb-3 pb-3 border-b flex-shrink-0 h-20">
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
                                                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
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
                                        <div className="flex-shrink-0 w-full flex items-center justify-center h-64 text-gray-500">
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
                        role: currentUser.role === 'manager' ? 'employee' : currentUser.role as 'admin' | 'manager' | 'employee',
                    }}
                    onSubmit={handleTaskCreate}
                />
            )}
        </div>
    );
}