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
import { th } from 'date-fns/locale';

// Import stores and hooks
import { useTaskPageImproved } from '@/hooks/useTaskImproved';

const STATUS_COLUMNS = [
    { id: 'todo', title: 'รอดำเนินการ' },
    { id: 'in-progress', title: 'กำลังดำเนินการ' },
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
        clinics: allClinics,  // ใช้ clinics จาก useTaskPageImproved
        positions,
        currentUser,  // ใช้ currentUser จาก useTaskPageImproved
        loading,
        error,
        createTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        refetch,
    } = useTaskPageImproved();

    // ไม่ต้องใช้ hooks เหล่านี้อีก เพราะข้อมูลมาจาก useTaskPage แล้ว
    // const { user: currentUser } = useUser(); // ❌ ลบออก - ซ้ำซ้อน
    // const { clinics: allClinics, fetchClinics } = useClinicStore(); // ❌ ลบออก - ซ้ำซ้อน

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

    // ไม่ต้อง fetch clinics ซ้ำ - useTaskPage fetch ให้แล้ว
    // useEffect(() => {
    //     fetchClinics();
    // }, [fetchClinics]); // ❌ ลบออก - ซ้ำซ้อน

    const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

    // Reset viewMode และ states เมื่อ user เปลี่ยนหรือ role ไม่เข้ากัน
    useEffect(() => {
        // ถ้าเป็น employee แต่ viewMode เป็น assignee (สำหรับ manager เท่านั้น)
        if (!isManager && viewMode === 'assignee') {
            setViewMode('status'); // Reset to status view
            setSelectedAssignee('all');
        }

        // Reset selections when user changes
        setSelectedAssignee('all');
        setSelectedClinic('all');
        setCurrentPage(1);
    }, [currentUser?.id]); // Trigger เมื่อ user id เปลี่ยน

    // Monitor role changes separately
    useEffect(() => {
        if (!isManager && viewMode === 'assignee') {
            setViewMode('status');
        }
    }, [isManager, viewMode]);

    // Transform clinics data for UI - ensure name is always string
    const clinicsForUI: Array<{ id: string; name: string }> = allClinics.length > 0
        ? allClinics.map(clinic => {
            // Handle different name formats
            let clinicName: string;
            let clinicId: string;

            if (typeof clinic.name === 'string') {
                // Case 1: name is already a string
                clinicName = clinic.name;
                clinicId = clinic.name.toLowerCase().replace(/\s+/g, '-');
            } else if (clinic.name && typeof clinic.name === 'object' && 'th' in clinic.name && 'en' in clinic.name) {
                // Case 2: name is an object with th and en properties
                clinicName = clinic.name.th || clinic.name.en || 'ไม่ระบุชื่อ';
                clinicId = (clinic.name.th || clinic.name.en || 'unknown').toLowerCase().replace(/\s+/g, '-');
            } else {
                // Case 3: fallback
                clinicName = 'ไม่ระบุชื่อ';
                clinicId = 'unknown';
            }

            return {
                id: clinicId,
                name: clinicName
            };
        })
        : (() => {
            // ถ้าไม่มี clinics จาก API ให้ดึงจาก tasks
            const clinicMap = new Map<string, { id: string; name: string }>();
            tasks.forEach(task => {
                if (task.clinicId && !clinicMap.has(task.clinicId.id)) {
                    clinicMap.set(task.clinicId.id, {
                        id: task.clinicId.id,
                        name: task.clinicName || 'ไม่ระบุชื่อ'
                    });
                }
            });
            return Array.from(clinicMap.values());
        })();

    // Debug clinic matching
    useEffect(() => {
        if (viewMode === 'clinic') {
            // console.log('=== Clinic View Debug ===');
            // console.log('Clinics:', clinicsForUI);
            // console.log('Tasks with clinic info:', tasks.map(t => ({
            //     taskName: t.name,
            //     clinicId: t.clinicId?.id,
            //     clinicName: t.clinicName
            // })));

            // ตรวจสอบการ match
            clinicsForUI.forEach(clinic => {
                const matchingTasks = tasks.filter(t => t.clinicId?.id === clinic.id);
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

    // Helper function to check if user is assignee
    const isUserAssignee = (task: Task, userId: string, userName: string): boolean => {
        // Check assigneeNames (format ใหม่จาก backend)
        if (task.assigneeNames && task.assigneeNames.length > 0) {
            return task.assigneeNames.some(name =>
                name.toLowerCase() === userName.toLowerCase()
            );
        }

        // Check process assignees (ถ้ามี)
        if (task.process && task.process.length > 0) {
            return task.process.some(p =>
                p.assignee && p.assignee.some(a => {
                    if (typeof a === 'string') {
                        // ถ้าเป็นชื่อเต็ม
                        if (a.includes(' ')) {
                            return a.toLowerCase() === userName.toLowerCase();
                        }
                        // ถ้าเป็น ID
                        return a === userId;
                    } else if (a && typeof a === 'object' && 'id' in a) {
                        return (a as User).id === userId;
                    }
                    return false;
                })
            );
        }

        // ไม่ต้อง check assigneeId เพราะมันเป็น empty string เสมอ
        return false;
    };

    // Get current user's full name - handle different user object structures
    const currentUserName = currentUser ? (() => {
        // ถ้ามี firstname และ lastname
        if (currentUser.firstname && currentUser.lastname) {
            return `${currentUser.firstname} ${currentUser.lastname}`.trim();
        }
        // ถ้ามี name field โดยตรง
        if (currentUser.name) {
            return currentUser.name;
        }
        // fallback to username or id
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

        if (viewMode === 'clinic' && selectedClinic !== 'all') {
            filtered = filtered.filter((task) => task.clinicId?.id === selectedClinic);
        }

        return filtered;
    };

    const filteredTasks = getFilteredTasks();

    // Group tasks by status
    const getTasksByStatus = (status: TaskStatus) => {
        return filteredTasks.filter((task) => task.status === status);
    };

    // Group tasks by assignee
    const getTasksByAssignee = (assigneeId: string) => {
        // หา user name จาก ID
        const user = usersWithNames.find(u => u.id === assigneeId);
        const userName = user ? `${user.firstname} ${user.lastname}`.trim() : assigneeId;

        return filteredTasks.filter((task) =>
            isUserAssignee(task, assigneeId, userName)
        );
    };

    const getTasksByClinic = (clinicId: string) => {
        return filteredTasks.filter((task) => task.clinicId?.id === clinicId);
    };

    const getAvailableClinics = () => {
        const clinicIdsWithTasks = new Set(baseFilteredTasksForClinic.map((task) => task.clinicId?.id).filter(Boolean));
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
                    const tasksA = baseFilteredTasksForClinic.filter((task) => task.clinicId?.id === a.id).length;
                    const tasksB = baseFilteredTasksForClinic.filter((task) => task.clinicId?.id === b.id).length;
                    return tasksB - tasksA;
                });
            } else {
                // clinicsForUI already has name as string, so this is safe
                sortedClinics = sortedClinics.sort((a, b) => a.name.localeCompare(b.name, 'th'));
            }

            displayTotalPages = Math.ceil(sortedClinics.length / clinicsPerPage);
            const startIdx = (currentPage - 1) * clinicsPerPage;
            displayClinics = sortedClinics.slice(startIdx, startIdx + clinicsPerPage);
        }
    }

    // Transform task for UI
    const transformTaskForUI = (task: Task) => ({
        ...task,
        title: task.name,
        clinicName: task.clinicId?.name?.th || task.clinicId?.name?.en || '',
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

        if (taskToUpdate) {
            await updateTaskStatus(draggableId, newStatus);
        }
    };

    // Handle task operations
    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsDetailDialogOpen(true);
    };

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

        const { startDate, dueDate, clinicId, process, ...restUpdates } = updates;

        await updateTask(taskId, {
            ...restUpdates,
            ...(startDate && { startDate: formatDateToAPI(startDate) }),
            ...(dueDate && { dueDate: formatDateToAPI(dueDate) }),
            ...(clinicId && { clinicId: typeof clinicId === 'string' ? clinicId : clinicId.id }),
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

    const handleTaskCreate = async (data: CreateTaskForm) => {
        if (!currentUser) return;

        // Validate และ clean assignees - filter out null/undefined/empty values
        const processWithCleanAssignees = data.process.map(p => {
            // Filter และ validate assignees
            const cleanAssignees = (p.assignee || [])
                .filter(id => id && id !== null && id !== undefined && id !== '')
                .filter(id => typeof id === 'string' && id.length > 0);

            // ถ้าไม่มี assignee ที่ valid เลย ให้ใช้ currentUser เป็น default
            const finalAssignees = cleanAssignees.length > 0 ? cleanAssignees : [currentUser.id];

            return {
                name: p.name || 'ขั้นตอน',
                assignee: finalAssignees,
                attachments: p.attachments || [],
                status: (p.status || 'pending') as 'pending' | 'completed',
            };
        });

        // ถ้าไม่มี process เลย ให้สร้าง default process
        const finalProcesses = processWithCleanAssignees.length > 0 ? processWithCleanAssignees : [{
            name: 'ขั้นตอนเริ่มต้น',
            assignee: [currentUser.id],
            attachments: [],
            status: 'pending' as 'pending' | 'completed',
        }];

        // Validate clinicId
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
            status: 'pending',
            tag: [],
            startDate: format(data.startDate, 'MM/dd/yyyy'),
            dueDate: format(data.dueDate, 'MM/dd/yyyy'),
            clinicId: finalClinicId,
            process: finalProcesses,
            workload: data.workload || {
                video: [],
                website: [],
                image: [],
                shooting: [],
            },
            createdBy: currentUser.id,
        };

        // Debug log to check final data
        console.log('Creating task with data:', createRequest);
        console.log('Process assignees:', createRequest.process.map(p => ({ name: p.name, assignee: p.assignee })));

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

            {/* Filters */}
            <Card className="p-4 flex-shrink-0">
                <div className="flex flex-wrap items-center gap-4">
                    {/* View Mode Toggle */}
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

                            {/* Assignee View - Manager Only */}
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

                            {/* Clinic View - Available for Everyone */}
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

                    {/* Assignee Filter - Only in assignee view mode for managers */}
                    {isManager && viewMode === 'assignee' && (
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

                    {/* Clinic Filters - แสดงเฉพาะใน clinic view */}
                    {viewMode === 'clinic' && (
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                            {/* Searchable Clinic Select - Always show if available clinics exist */}
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

                            {/* Sort Select - Only show when not filtering to single clinic */}
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
                        // Assignee View (Manager only) - Horizontal scroll with mouse wheel
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

                                                        {/* Tasks grouped by status - vertical scroll ภายใน */}
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
                        // Clinic View (Available for Everyone) - Horizontal scroll with mouse wheel
                        <div className="flex-1 overflow-hidden">
                            <div className="h-full flex flex-col">
                                {/* Horizontal Flex สำหรับ clinics */}
                                <div ref={clinicScrollRef} className="flex flex-row overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent h-[calc(100%-60px)]">
                                    {displayClinics.map((clinic) => {
                                        const clinicTasks = getTasksByClinic(clinic.id);
                                        const tasksCount = clinicTasks.length;

                                        return (
                                            <div key={clinic.id} className="flex-shrink-0 w-80 min-w-[320px]">
                                                <Card className="flex flex-col overflow-hidden h-[500px]">
                                                    <div className="p-4 h-full flex flex-col">
                                                        {/* Clinic Header - เพิ่ม badge */}
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
                                                            {/* Badge สำหรับ tasks count */}
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getBadgeClass(tasksCount)}`}>
                                                                {tasksCount}
                                                            </span>
                                                        </div>

                                                        {/* Tasks Content - Fixed height container สำหรับ accordion, scroll ถ้า overflow */}
                                                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                                                            {isManager ? (
                                                                // Manager View: Collapsible by assignee - Expand within scrollable container
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
                                                                // Employee View: Simple list
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

                                    {/* Empty State ถ้าไม่มี clinics หลัง filter */}
                                    {displayClinics.length === 0 && (
                                        <div className="flex-shrink-0 w-full flex items-center justify-center h-64 text-gray-500">
                                            <p>ไม่พบคลินิก</p>
                                        </div>
                                    )}
                                </div>

                                {/* Pagination - Only show when viewing all clinics */}
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
