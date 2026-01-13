import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExcalidrawBoard } from '@/components/clinic/ExcalidrawBoard';
import { BoardList, type Board } from '@/components/clinic/BoardList';
import { GanttTimeline } from '@/components/clinic/GanttTimeline';
import { ClinicDialog } from '@/components/clinic/ClinicDialog';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Calendar,
    FileText,
    Image,
    Video,
    Briefcase,
    Plus,
    Presentation,
} from 'lucide-react';


interface Procedure {
    id: string;
    name: string;
}

interface TimelineItem {
    id: string;
    name: string;
    unit?: string;
    startWeek: number;
    endWeek: number;
    description?: string;
    category?: string;
    color?: string;
}

export default function ClinicDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('board');
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
    const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [selectedProcedureId, setSelectedProcedureId] = useState<string>('');

    // State สำหรับ Edit Clinic Dialog
    const [isEditClinicOpen, setIsEditClinicOpen] = useState(false);

    // Mock procedures data
    const procedures: Procedure[] = [
        { id: '1', name: 'จัดฟันเหล็ก' },
        { id: '2', name: 'จัดฟันใส' },
        { id: '3', name: 'รากฟันเทียม' },
        { id: '4', name: 'วีเนียร์' },
    ];

    const [boards, setBoards] = useState<Board[]>([
        {
            id: '1',
            name: 'Campaign Ideas Q4',
            procedureId: '1',
            createdBy: {
                id: '1',
                name: 'สมชาย ใจดี',
                avatar: undefined,
            },
            createdAt: new Date('2024-10-01'),
            updatedAt: new Date('2024-10-15'),
            collaborators: [
                { id: '2', name: 'สมหญิง รักสงบ', avatar: undefined },
                { id: '3', name: 'วิชัย มั่นคง', avatar: undefined },
            ],
            data: undefined,
        },
        {
            id: '2',
            name: 'Content Strategy',
            procedureId: '1',
            createdBy: {
                id: '2',
                name: 'สมหญิง รักสงบ',
                avatar: undefined,
            },
            createdAt: new Date('2024-10-10'),
            updatedAt: new Date('2024-10-18'),
            collaborators: [
                { id: '1', name: 'สมชาย ใจดี', avatar: undefined },
            ],
            data: undefined,
        },
        {
            id: '3',
            name: 'Promotion Plan',
            procedureId: '2',
            createdBy: {
                id: '1',
                name: 'สมชาย ใจดี',
                avatar: undefined,
            },
            createdAt: new Date('2024-10-05'),
            updatedAt: new Date('2024-10-20'),
            collaborators: [
                { id: '3', name: 'วิชัย มั่นคง', avatar: undefined },
            ],
            data: undefined,
        },
    ]);

    // Timeline Items State - เริ่มต้นไม่มี timeline bar
    const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([
        // Setup
        { id: 'setup-1', name: 'Requirement', unit: '---', startWeek: -1, endWeek: -1, category: 'Setup', color: '#6366f1' },
        { id: 'setup-2', name: 'เชื่อมบัญชี Social Media', unit: '---', startWeek: -1, endWeek: -1, category: 'Setup', color: '#6366f1' },
        { id: 'setup-3', name: 'เชื่อมบัญชี Ads Manager', unit: '---', startWeek: -1, endWeek: -1, category: 'Setup', color: '#6366f1' },

        // Coperate Identity
        { id: 'ci-1', name: 'ออกแบบ Ci', unit: '1 / 1', startWeek: -1, endWeek: -1, category: 'Coperate Identity', color: '#8b5cf6' },

        // Website
        { id: 'web-1', name: 'Landing Page', unit: '0 / 1', startWeek: -1, endWeek: -1, category: 'Website', color: '#10b981' },
        { id: 'web-2', name: 'Sale Page', unit: '0 / 2', startWeek: -1, endWeek: -1, category: 'Website', color: '#10b981' },

        // Social Media
        { id: 'social-1', name: 'จัดทำ Graphic', unit: '18 / 50', startWeek: -1, endWeek: -1, category: 'Social Media', color: '#ec4899' },
        { id: 'social-2', name: 'จัดทำ Video', unit: '2 / 40', startWeek: -1, endWeek: -1, category: 'Social Media', color: '#ec4899' },

        // Training
        { id: 'train-1', name: 'Sales Training', unit: '0 / 8', startWeek: -1, endWeek: -1, category: 'Training', color: '#f97316' },
        { id: 'train-2', name: 'Media Training', unit: '0 / 8', startWeek: -1, endWeek: -1, category: 'Training', color: '#f97316' },
        { id: 'train-3', name: 'Ads Training', unit: '0 / 8', startWeek: -1, endWeek: -1, category: 'Training', color: '#f97316' },
    ]);

    const handleCreateTimeline = (serviceId: string, weekIndex: number) => {
        setTimelineItems(items =>
            items.map(item =>
                item.id === serviceId
                    ? { ...item, startWeek: weekIndex, endWeek: weekIndex }
                    : item
            )
        );
    };

    const handleUpdateTimelineItem = (id: string, updates: Partial<TimelineItem>) => {
        setTimelineItems(items =>
            items.map(item => item.id === id ? { ...item, ...updates } : item)
        );
    };

    const handleDeleteTimelineItem = (id: string) => {
        setTimelineItems(items => items.filter(item => item.id !== id));
    };


    const handleCreateBoard = () => {
        if (!newBoardName.trim() || !selectedProcedureId) return;

        const newBoard: Board = {
            id: Date.now().toString(),
            name: newBoardName,
            procedureId: selectedProcedureId,
            createdBy: {
                id: '1',
                name: 'Current User', // TODO: Get from auth
                avatar: undefined,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            collaborators: [],
            data: undefined,
        };

        setBoards([newBoard, ...boards]);
        setNewBoardName('');
        setSelectedProcedureId('');
        setIsCreateBoardOpen(false);
    };

    const handleOpenCreateBoard = (procedureId: string) => {
        setSelectedProcedureId(procedureId);
        setIsCreateBoardOpen(true);
    };

    const handleSelectBoard = (board: Board) => {
        setSelectedBoard(board);
    };

    const handleCloseBoard = () => {
        setSelectedBoard(null);
    };

    const handleSaveBoard = (boardId: string, data: string) => {
        setBoards(boards.map(b =>
            b.id === boardId
                ? { ...b, data, updatedAt: new Date() }
                : b
        ));
    };

    const handleEditBoard = (board: Board) => {
        const newName = prompt('ชื่อ Board ใหม่:', board.name);
        if (newName && newName.trim()) {
            setBoards(boards.map(b =>
                b.id === board.id
                    ? { ...b, name: newName, updatedAt: new Date() }
                    : b
            ));
        }
    };

    const handleDeleteBoard = (boardId: string) => {
        if (confirm('คุณต้องการลบ Board นี้ใช่หรือไม่?')) {
            setBoards(boards.filter(b => b.id !== boardId));
            if (selectedBoard?.id === boardId) {
                setSelectedBoard(null);
            }
        }
    };

    // Function to get boards by procedure
    const getBoardsByProcedure = (procedureId: string) => {
        return boards.filter(board => board.procedureId === procedureId);
    };


    // Mock data (same as before)
    const clinic = {
        id: id || '1',
        nameTh: 'คลินิกทำฟัน ABC',
        nameEn: 'ABC Dental Clinic',
        logo: null,
        status: 'active' as const,
        level: 'premium' as const,
        contractType: 'yearly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        startDateDisplay: '1 มกราคม 2024',
        endDateDisplay: '31 ธันวาคม 2025',
        address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
        phone: '02-123-4567',
        email: 'contact@abcclinic.com',
    };

    // เตรียมข้อมูลเริ่มต้นสำหรับ Edit Dialog
    const getClinicEditData = () => {
        return {
            id: clinic.id,
            name: {
                en: clinic.nameEn,
                th: clinic.nameTh,
            },
            clinicProfile: '', // Add missing field (default empty)
            clinicLevel: clinic.level,
            contractType: clinic.contractType,
            contractDateStart: clinic.startDate, // Date object (match type)
            contractDateEnd: clinic.endDate,
            status: clinic.status,
            assignedTo: employeesData.map(emp => ({ // Map to UserSummary[] (assume minimal shape)
                id: emp.id,
                name: emp.name, // Add more fields if UserSummary requires (e.g., email, role)
                // email?: string; role?: string; // If needed, add here
            })),
            note: '', // Add missing field (default empty)
            service: { // Construct nested Service from flat values
                setup: {
                    requirement: true,
                    socialMedia: true,
                    adsManager: false,
                },
                coperateIdentity: [ // Array with 1 item (match ServiceSection)
                    { name: 'CI Design', amount: 1 }
                ],
                website: [ // Array with 2 items
                    { name: 'Landing Page', amount: 1 },
                    { name: 'Sale Page', amount: 2 }
                ],
                socialMedia: [ // Array with 2 items
                    { name: 'Graphic Design', amount: 50 },
                    { name: 'Video Production', amount: 40 }
                ],
                training: [ // Array with 4 items (in order to match form fields)
                    { name: 'Sales Training', amount: 8 },
                    { name: 'Media Training', amount: 8 },
                    { name: 'Ads Training', amount: 8 },
                    { name: 'Website Training', amount: 4 }
                ]
            },
            createdBy: 'current-user-id', // Add missing (use auth context in real app)
            updatedBy: null, // Add missing
            logo: clinic.logo, // Optional from ClinicData
            // Extra for form (not in Clinic type, but dialog uses them)
            procedures: ['จัดฟันเหล็ก', 'จัดฟันใส', 'รากฟันเทียม', 'วีเนียร์'],
            // employees: ['1', '2', '3'] // Remove this; use assignedTo instead (map in dialog if needed)
        };
    };

    // Handler สำหรับเปิด Edit Dialog
    const handleEditClinic = () => {
        setIsEditClinicOpen(true);
    };

    // Handler หลังจากแก้ไขสำเร็จ
    const handleEditClinicSuccess = () => {
        // TODO: Refresh clinic data from API
        console.log('Clinic updated successfully');
    };

    const requirementsData = [
        {
            category: 'Setup',
            items: [
                { name: 'Requirement', completed: true },
                { name: 'เชื่อมบัญชี Social', completed: true },
                { name: 'เชื่อมบัญชี Ads Manager', completed: false },
            ],
        },
        {
            category: 'Corporate Identity',
            items: [{ name: 'ออกแบบ CI', count: 3, completed: 2 }],
        },
        {
            category: 'Website',
            items: [
                { name: 'Landing Page', count: 5, completed: 5 },
                { name: 'Sale Page', count: 3, completed: 2 },
            ],
        },
        {
            category: 'Social Media',
            items: [
                { name: 'จัดทำ Graphic', count: 20, completed: 15 },
                { name: 'จัดทำ Video', count: 10, completed: 8 },
            ],
        },
        {
            category: 'Training',
            items: [
                { name: 'Sales Training', count: 4, completed: 4 },
                { name: 'Media Training', count: 2, completed: 1 },
                { name: 'Ads Training', count: 3, completed: 3 },
                { name: 'Website Training', count: 2, completed: 2 },
            ],
        },
        {
            category: 'HR',
            items: [{ name: 'จัดสรรหาบุคลากร', completed: true }],
        },
    ];

    const contentData = {
        graphics: [
            { id: 1, name: 'Banner โปรโมชั่นเดือนตุลาคม', date: '15 ต.ค. 2567', status: 'completed' },
            { id: 2, name: 'โพสต์ติดต่อ Social Media', date: '14 ต.ค. 2567', status: 'completed' },
            { id: 3, name: 'ภาพประกอบบทความ', date: '12 ต.ค. 2567', status: 'in-progress' },
            { id: 4, name: 'Cover Photo Facebook', date: '10 ต.ค. 2567', status: 'pending' },
        ],
        videos: [
            { id: 1, name: 'Review ผลิตภัณฑ์ใหม่', date: '15 ต.ค. 2567', status: 'pending' },
            { id: 2, name: 'Testimonial ผู้ใช้บริการ', date: '12 ต.ค. 2567', status: 'completed' },
        ],
    };

    const employeesData = [
        {
            id: '1',
            name: 'สมชาย ใจดี',
            position: 'Digital Marketing Manager',
            avatar: null,
        },
        {
            id: '2',
            name: 'สมหญิง รักสงบ',
            position: 'Content Creator',
            avatar: null,
        },
        {
            id: '3',
            name: 'วิชัย มั่นคง',
            position: 'Graphic Designer',
            avatar: null,
        },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        ใช้งาน
                    </Badge>
                );
            case 'inactive':
                return (
                    <Badge className="bg-red-50 text-red-700 border-red-200">
                        <XCircle className="h-3 w-3 mr-1" />
                        ไม่ใช้งาน
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        รอดำเนินการ
                    </Badge>
                );
            case 'completed':
                return (
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        เสร็จสิ้น
                    </Badge>
                );
            case 'in-progress':
                return (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                        <Clock className="h-3 w-3 mr-1" />
                        กำลังดำเนินการ
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-50 text-gray-700 border-gray-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {status}
                    </Badge>
                );
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate('/clinic')}
                className="mb-4 w-fit"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับ
            </Button>

            {/* Tabs Container */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                {/* Sticky Header */}
                <div className="sticky top-0 bg-gray-50 z-10 pb-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-start gap-4">
                            {/* Logo */}
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                {clinic.logo ? (
                                    <img src={clinic.logo} alt={clinic.nameTh} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    clinic.nameTh.charAt(0)
                                )}
                            </div>

                            {/* Info */}
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{clinic.nameTh}</h1>
                                <p className="text-lg text-gray-600 mt-1">{clinic.nameEn}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    {getStatusBadge(clinic.status)}
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                        {clinic.level === 'premium' ? 'Premium' : clinic.level === 'standard' ? 'Standard' : 'Basic'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                onClick={handleEditClinic}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                แก้ไข
                            </Button>
                            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4 mr-2" />
                                ลบ
                            </Button>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <TabsList className="w-full grid grid-cols-5 bg-transparent p-1">
                            <TabsTrigger
                                value="board"
                                className="gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
                            >
                                <Presentation className="h-4 w-4" />
                                <span className="hidden sm:inline">Board</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="timeline"
                                className="gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
                            >
                                <Calendar className="h-4 w-4" />
                                <span className="hidden sm:inline">Timeline</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="requirements"
                                className="gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Clinic Requirement</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="content"
                                className="gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
                            >
                                <FileText className="h-4 w-4" />
                                <span className="hidden sm:inline">Content</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="info"
                                className="gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
                            >
                                <Briefcase className="h-4 w-4" />
                                <span className="hidden sm:inline">Clinic Info</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    <TabsContent value="board" className="mt-0 p-1 h-full">
                        {selectedBoard ? (
                            // Board Editor View
                            <div className="space-y-4">
                                {/* Board Header */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleCloseBoard}
                                                >
                                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                                    กลับ
                                                </Button>
                                                <div>
                                                    <CardTitle className="text-xl">{selectedBoard.name}</CardTitle>
                                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarImage src={selectedBoard.createdBy.avatar || undefined} />
                                                            <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                                                                {selectedBoard.createdBy.name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span>สร้างโดย {selectedBoard.createdBy.name}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Collaborators */}
                                            <div className="flex items-center gap-2">
                                                {selectedBoard.collaborators.length > 0 && (
                                                    <div className="flex -space-x-2 mr-2">
                                                        {selectedBoard.collaborators.map((collab: any) => (
                                                            <Avatar key={collab.id} className="h-8 w-8 border-2 border-white">
                                                                <AvatarImage src={collab.avatar} />
                                                                <AvatarFallback className="text-xs bg-gray-100">
                                                                    {collab.name.charAt(0)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        ))}
                                                    </div>
                                                )}
                                                <Badge variant="outline" className="text-xs">
                                                    อัพเดตล่าสุด: {new Date(selectedBoard.updatedAt).toLocaleDateString('th-TH')}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>

                                {/* Excalidraw Board */}
                                <Card>
                                    <CardContent className="p-4">
                                        <ExcalidrawBoard
                                            boardId={selectedBoard.id}
                                            initialData={selectedBoard.data || undefined}
                                            onSave={(data) => handleSaveBoard(selectedBoard.id, data)}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            // Board List View with Accordion by Procedures
                            <div className="space-y-6">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        Brainstorm Boards
                                    </h2>
                                    <p className="text-gray-600 mt-1">
                                        จัดกลุ่ม boards ตามหัตถการของคลินิก
                                    </p>
                                </div>

                                <Accordion type="multiple" className="space-y-4">
                                    {procedures.map((procedure) => {
                                        const procedureBoards = getBoardsByProcedure(procedure.id);

                                        return (
                                            <AccordionItem
                                                key={procedure.id}
                                                value={procedure.id}
                                                className="border rounded-lg bg-white shadow-sm"
                                            >
                                                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                                                    <div className="flex items-center justify-between w-full pr-4">
                                                        <div className="flex items-center gap-3">
                                                            <Presentation className="text-2xl text-purple-600" />
                                                            <div className="text-left">
                                                                <h3 className="text-lg font-semibold text-gray-900">
                                                                    {procedure.name}
                                                                </h3>
                                                                <p className="text-sm text-gray-500">
                                                                    {procedureBoards.length} board{procedureBoards.length !== 1 ? 's' : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenCreateBoard(procedure.id);
                                                            }}
                                                            className="bg-purple-600 hover:bg-purple-700 gap-2"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            สร้าง Board
                                                        </Button>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="px-6 pb-6">
                                                    {procedureBoards.length === 0 ? (
                                                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                                                            <Presentation className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                                            <p className="text-gray-500 mb-4">
                                                                ยังไม่มี Board สำหรับหัตถการนี้
                                                            </p>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => handleOpenCreateBoard(procedure.id)}
                                                                className="gap-2"
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                                สร้าง Board แรก
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <BoardList
                                                            boards={procedureBoards}
                                                            onSelectBoard={handleSelectBoard}
                                                            onEditBoard={handleEditBoard}
                                                            onDeleteBoard={handleDeleteBoard}
                                                        />
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab: Timeline */}
                    <TabsContent value="timeline" className="mt-0 p-1">
                        <div className="p-6">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Calendar className="h-6 w-6 text-purple-600" />
                                    Timeline
                                </h2>
                                <p className="text-gray-600 mt-1">
                                    แสดงกำหนดการดำเนินงานตามหัวข้อบริการ - สามารถลาก, ดับเบิ้ลคลิกแก้ไข และคลิกขวาจัดการได้
                                </p>
                            </div>

                            <Card>
                                <CardContent className="p-0">
                                    <GanttTimeline
                                        startDate={clinic.startDate}
                                        endDate={clinic.endDate}
                                        items={timelineItems}
                                        onUpdateItem={handleUpdateTimelineItem}
                                        onDeleteItem={handleDeleteTimelineItem}
                                        onCreateTimeline={handleCreateTimeline}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Tab: Requirements */}
                    <TabsContent value="requirements" className="mt-0 p-1">
                        <div className="space-y-6">
                            {requirementsData.map((category, index) => (
                                <Card key={index}>
                                    <CardHeader>
                                        <CardTitle className="text-lg text-purple-700">
                                            {category.category}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {category.items.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {typeof item.completed === 'boolean' ? (
                                                            item.completed ? (
                                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                            ) : (
                                                                <XCircle className="h-5 w-5 text-gray-400" />
                                                            )
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                                                                <span className="text-xs font-semibold text-purple-700">
                                                                    {item.completed}/{item.count}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <span className="font-medium text-gray-900">{item.name}</span>
                                                    </div>

                                                    {typeof item.completed !== 'boolean' && item.count && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                                                                    style={{
                                                                        width: `${((item.completed || 0) / item.count) * 100}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-sm text-gray-600 min-w-[3rem]">
                                                                {Math.round(((item.completed || 0) / item.count) * 100)}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Tab: Content */}
                    <TabsContent value="content" className="mt-0 p-1">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Image className="h-5 w-5" />
                                            Graphic Design
                                        </CardTitle>
                                        <Badge>{contentData.graphics.length} รายการ</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {contentData.graphics.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.name}</p>
                                                    <p className="text-sm text-gray-500">{item.date}</p>
                                                </div>
                                                {getStatusBadge(item.status)}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Video className="h-5 w-5" />
                                            Video Production
                                        </CardTitle>
                                        <Badge>{contentData.videos.length} รายการ</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {contentData.videos.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.name}</p>
                                                    <p className="text-sm text-gray-500">{item.date}</p>
                                                </div>
                                                {getStatusBadge(item.status)}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Tab: Clinic Info */}
                    <TabsContent value="info" className="mt-0 p-1">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* ข้อมูลคลินิก และข้อมูลสัญญา */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                    <CardTitle>ข้อมูลคลินิก</CardTitle>
                                    {getStatusBadge(clinic.status)}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* ชื่อคลินิก */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">ชื่อคลินิก (ไทย)</label>
                                        <p className="text-base mt-1 font-medium text-gray-900">{clinic.nameTh}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">ชื่อคลินิก (English)</label>
                                        <p className="text-base mt-1 font-medium text-gray-900">{clinic.nameEn}</p>
                                    </div>

                                    {/* เส้นแบ่ง */}
                                    <div className="border-t pt-4 mt-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-4">ข้อมูลสัญญา</h4>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">ประเภทสัญญา</label>
                                                    <p className="text-base mt-1 font-medium text-gray-900">
                                                        {clinic.contractType === 'yearly'
                                                            ? 'รายปี'
                                                            : clinic.contractType === 'monthly'
                                                                ? 'รายเดือน'
                                                                : 'โครงการ'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">ระดับคลินิก</label>
                                                    <p className="text-base mt-1 font-medium text-gray-900">
                                                        {clinic.level === 'premium'
                                                            ? 'Premium'
                                                            : clinic.level === 'standard'
                                                                ? 'Standard'
                                                                : 'Basic'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">วันที่เริ่มสัญญา</label>
                                                    <p className="text-base mt-1 font-medium text-gray-900">{clinic.startDateDisplay}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">วันที่สิ้นสุดสัญญา</label>
                                                    <p className="text-base mt-1 font-medium text-gray-900">{clinic.endDateDisplay}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ทีมผู้รับผิดชอบ */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>ทีมผู้รับผิดชอบ</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {employeesData.map((employee) => (
                                            <div
                                                key={employee.id}
                                                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={employee.avatar || undefined} />
                                                    <AvatarFallback className="bg-purple-100 text-purple-700">
                                                        {employee.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">{employee.name}</p>
                                                    <p className="text-sm text-gray-500 truncate">{employee.position}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Create Board Dialog */}
            <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>สร้าง Board ใหม่</DialogTitle>
                        <DialogDescription>
                            สร้าง Board สำหรับ brainstorm ไอเดีย -{' '}
                            {procedures.find(p => p.id === selectedProcedureId)?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="boardName">ชื่อ Board</Label>
                            <Input
                                id="boardName"
                                placeholder="เช่น Campaign Ideas Q4"
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCreateBoard();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsCreateBoardOpen(false);
                                setNewBoardName('');
                                setSelectedProcedureId('');
                            }}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreateBoard}
                            className="bg-purple-600 hover:bg-purple-700"
                            disabled={!newBoardName.trim()}
                        >
                            สร้าง Board
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Clinic Dialog */}
            <ClinicDialog
                open={isEditClinicOpen}
                onOpenChange={setIsEditClinicOpen}
                onSuccess={handleEditClinicSuccess}
                mode="edit"
                initialData={getClinicEditData() as any}
            />
        </div>
    );
}