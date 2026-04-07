import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
    Users,
    Pencil,
    Trash2,
    Calendar as CalendarIcon,
    Search,
    X,
    Loader2,
    Shield,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Eye,
    UserPlus,
    Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUserManagementStore } from '@/stores/userStore';
import { useUser } from '@/hooks/useUser';
import type {
    UserListItem,
    UserListParams,
    UserRole,
    UserType,
    CreateUserDTO,
    UpdateUserDTO,
    User,
} from '@/types/user';

// ==================== Helper Functions ====================

const getRoleBadge = (role: UserRole) => {
    const config: Record<UserRole, { color: string; label: string }> = {
        admin: { color: 'bg-red-100 text-red-700 border-red-200', label: 'ผู้ดูแลระบบ' },
        manager: { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'ผู้จัดการ' },
        employee: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'พนักงาน' },
    };
    const c = config[role] || config.employee;
    return (
        <Badge variant="outline" className={c.color}>
            <Shield className="h-3 w-3 mr-1" />
            {c.label}
        </Badge>
    );
};

const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            ใช้งาน
        </Badge>
    ) : (
        <Badge className="bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100">
            <XCircle className="h-3 w-3 mr-1" />
            ปิดใช้งาน
        </Badge>
    );
};

const getEmployeeTypeLabel = (type: UserType | string) => {
    const types: Record<string, string> = {
        permanent: 'พนักงานประจำ',
        probation: 'ทดลองงาน',
        freelance: 'ฟรีแลนซ์',
    };
    return types[type] || type;
};

const getInitials = (firstname: string, lastname: string) => {
    return `${firstname?.charAt(0) || ''}${lastname?.charAt(0) || ''}`.toUpperCase() || 'U';
};

const formatDate = (date: string | Date | undefined | null) => {
    if (!date) return '-';
    try {
        return format(new Date(date), 'dd MMM yyyy', { locale: th });
    } catch {
        return '-';
    }
};

// ==================== Form defaults ====================

const defaultForm = {
    firstname: '',
    lastname: '',
    nickname: '',
    tel: '',
    address: '',
    birthDate: undefined as Date | undefined,
    positionId: '',
    salary: '',
    contract: '',
    contractDateStart: undefined as Date | undefined,
    contractDateEnd: undefined as Date | undefined,
    employeeType: 'permanent' as UserType,
    employeeDateStart: undefined as Date | undefined,
    employeeStatus: '',
    role: 'employee' as UserRole,
};

// ==================== Component ====================

export default function UserManagement() {
    const { user: currentUser } = useUser();

    // ใช้ individual selector เพื่อลด re-render — re-render เฉพาะเมื่อค่านั้นเปลี่ยนจริงๆ
    const users = useUserManagementStore((s) => s.users);
    const pagination = useUserManagementStore((s) => s.pagination);
    const isLoading = useUserManagementStore((s) => s.isLoading);
    const isSubmitting = useUserManagementStore((s) => s.isSubmitting);
    const error = useUserManagementStore((s) => s.error);
    const fetchUsers = useUserManagementStore((s) => s.fetchUsers);
    const fetchUserDetail = useUserManagementStore((s) => s.fetchUserDetail);
    const createUser = useUserManagementStore((s) => s.createUser);
    const updateUser = useUserManagementStore((s) => s.updateUser);
    const deleteUser = useUserManagementStore((s) => s.deleteUser);
    const clearError = useUserManagementStore((s) => s.clearError);

    // ==================== Filter State ====================
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    // ==================== Dialog State ====================
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null);
    const [detailUser, setDetailUser] = useState<User | null>(null);
    const [form, setForm] = useState(defaultForm);

    // ==================== Fetch Users ====================
    // Refs ป้องกัน effects ยิงซ้ำตอน mount / StrictMode
    const isInitialMount = useRef(true);
    const isFirstSearch = useRef(true);

    useEffect(() => {
        const params: UserListParams = {
            page: currentPage,
            limit: 10,
        };
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (filterRole !== 'all') params.role = filterRole as UserRole;
        if (filterStatus !== 'all') params.isActive = filterStatus === 'active';

        fetchUsers(params);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchQuery, filterRole, filterStatus]);

    // Reset page on filter change — skip ตอน mount (currentPage = 1 อยู่แล้ว)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        setCurrentPage(1);
    }, [searchQuery, filterRole, filterStatus]);

    // ==================== Search with debounce ====================
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        // Skip ตอน mount — searchQuery = '' อยู่แล้ว ไม่ต้อง set ซ้ำ
        if (isFirstSearch.current) {
            isFirstSearch.current = false;
            return;
        }
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // ==================== Dialog Handlers ====================

    const openCreateDialog = () => {
        setForm({
            ...defaultForm,
            employeeDateStart: new Date(),
        });
        setIsCreateDialogOpen(true);
    };

    const openEditDialog = async (user: UserListItem) => {
        setEditingUser(user);
        // Fetch full detail to populate form
        const detail = await fetchUserDetail(user.id);
        if (detail) {
            setForm({
                firstname: detail.firstname,
                lastname: detail.lastname,
                nickname: detail.nickname,
                tel: detail.tel || '',
                address: detail.address || '',
                birthDate: detail.birthDate ? new Date(detail.birthDate) : undefined,
                positionId: detail.position?.id || '',
                salary: detail.salary || '',
                contract: detail.contract || '',
                contractDateStart: detail.contractDateStart ? new Date(detail.contractDateStart) : undefined,
                contractDateEnd: detail.contractDateEnd ? new Date(detail.contractDateEnd) : undefined,
                employeeType: detail.employeeType,
                employeeDateStart: detail.employeeDateStart ? new Date(detail.employeeDateStart) : undefined,
                employeeStatus: detail.employeeStatus || '',
                role: detail.role,
            });
        }
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (user: UserListItem) => {
        setDeletingUser(user);
        setIsDeleteDialogOpen(true);
    };

    const openDetailDialog = async (user: UserListItem) => {
        const detail = await fetchUserDetail(user.id);
        if (detail) {
            setDetailUser(detail);
            setIsDetailDialogOpen(true);
        }
    };

    // ==================== CRUD Handlers ====================

    const handleCreate = async () => {
        if (!form.firstname || !form.lastname || !form.nickname) return;

        const dto: CreateUserDTO = {
            firstname: form.firstname.trim(),
            lastname: form.lastname.trim(),
            nickname: form.nickname.trim(),
            tel: form.tel || undefined,
            address: form.address || undefined,
            birthDate: form.birthDate?.toISOString(),
            positionId: form.positionId || undefined,
            salary: form.salary || undefined,
            contract: form.contract || undefined,
            contractDateStart: form.contractDateStart?.toISOString(),
            contractDateEnd: form.contractDateEnd?.toISOString(),
            employeeType: form.employeeType,
            employeeDateStart: form.employeeDateStart?.toISOString() || new Date().toISOString(),
            employeeStatus: form.employeeStatus || undefined,
            role: form.role,
        };

        const success = await createUser(dto);
        if (success) {
            setIsCreateDialogOpen(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingUser) return;

        const dto: UpdateUserDTO = {
            firstname: form.firstname.trim(),
            lastname: form.lastname.trim(),
            nickname: form.nickname.trim(),
            tel: form.tel || undefined,
            address: form.address || undefined,
            birthDate: form.birthDate?.toISOString(),
            positionId: form.positionId || undefined,
            salary: form.salary || undefined,
            contract: form.contract || undefined,
            contractDateStart: form.contractDateStart?.toISOString(),
            contractDateEnd: form.contractDateEnd?.toISOString(),
            employeeType: form.employeeType,
            employeeDateStart: form.employeeDateStart?.toISOString(),
            employeeStatus: form.employeeStatus || undefined,
            role: form.role,
        };

        const success = await updateUser(editingUser.id, dto);
        if (success) {
            setIsEditDialogOpen(false);
            setEditingUser(null);
        }
    };

    const handleDelete = async () => {
        if (!deletingUser) return;

        const success = await deleteUser(deletingUser.id);
        if (success) {
            setIsDeleteDialogOpen(false);
            setDeletingUser(null);
        }
    };

    // ==================== Update form helper ====================
    const updateForm = (updates: Partial<typeof form>) => {
        setForm((prev) => ({ ...prev, ...updates }));
    };

    // ==================== Pagination ====================
    const totalPages = pagination?.totalPages || 1;

    // ==================== Check admin access ====================
    const isAdmin = currentUser?.role === 'admin';
    const isManager = currentUser?.role === 'manager';
    const canManageUsers = isAdmin || isManager;

    // ==================== Render ====================
    if (isLoading && users.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            {/* Error Alert */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <span className="text-red-700 flex-1">{error}</span>
                    <Button variant="ghost" size="sm" onClick={clearError}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
                    <p className="text-gray-500 mt-1">
                        เพิ่ม แก้ไข และจัดการข้อมูลพนักงานในระบบ
                    </p>
                </div>
                {canManageUsers && (
                    <Button
                        onClick={openCreateDialog}
                        className="bg-purple-600 hover:bg-purple-700 w-fit"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        เพิ่มผู้ใช้งาน
                    </Button>
                )}
            </div>

            {/* Search & Filters */}
            <div className="mt-4 flex-shrink-0 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="ค้นหาชื่อ, นามสกุล, ชื่อผู้ใช้..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9"
                        />
                        {searchInput && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                onClick={() => setSearchInput('')}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>

                    {/* Filter toggle */}
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={showFilters ? 'border-purple-300 text-purple-700' : ''}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        ตัวกรอง
                        {(filterRole !== 'all' || filterStatus !== 'all') && (
                            <Badge className="ml-2 bg-purple-100 text-purple-700 hover:bg-purple-100">
                                {[filterRole !== 'all', filterStatus !== 'all'].filter(Boolean).length}
                            </Badge>
                        )}
                    </Button>
                </div>

                {/* Expanded filters */}
                {showFilters && (
                    <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500">สิทธิ์</Label>
                            <Select value={filterRole} onValueChange={setFilterRole}>
                                <SelectTrigger className="w-[140px] h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทั้งหมด</SelectItem>
                                    <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                                    <SelectItem value="manager">ผู้จัดการ</SelectItem>
                                    <SelectItem value="employee">พนักงาน</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500">สถานะ</Label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[140px] h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทั้งหมด</SelectItem>
                                    <SelectItem value="active">ใช้งาน</SelectItem>
                                    <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {(filterRole !== 'all' || filterStatus !== 'all') && (
                            <div className="flex items-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setFilterRole('all');
                                        setFilterStatus('all');
                                    }}
                                    className="text-gray-500"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    ล้างตัวกรอง
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Users Table */}
            <div className="flex-1 mt-4 overflow-hidden">
                <Card className="h-full flex flex-col">
                    <CardHeader className="flex-shrink-0 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users className="h-5 w-5 text-purple-600" />
                            รายชื่อผู้ใช้งาน
                            {pagination && (
                                <span className="text-sm font-normal text-gray-500">
                                    ({pagination.total} คน)
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>ผู้ใช้</TableHead>
                                    <TableHead>ชื่อผู้ใช้</TableHead>
                                    <TableHead>ตำแหน่ง</TableHead>
                                    <TableHead className="text-center">สิทธิ์</TableHead>
                                    <TableHead className="text-center">สถานะ</TableHead>
                                    <TableHead className="text-right">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user, index) => (
                                    <TableRow key={user.id} className="hover:bg-gray-50">
                                        <TableCell className="text-gray-500 text-sm">
                                            {((currentPage - 1) * 10) + index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={user.profile || undefined} />
                                                    <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-semibold">
                                                        {getInitials(user.firstname, user.lastname)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {user.firstname} {user.lastname}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {user.nickname}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            @{user.username}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {user.position?.name || (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getRoleBadge(user.role)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getStatusBadge(user.isActive)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openDetailDialog(user)}
                                                    title="ดูรายละเอียด"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {canManageUsers && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(user)}
                                                            title="แก้ไข"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        {isAdmin && user.id !== currentUser?.id && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => openDeleteDialog(user)}
                                                                title="ลบ"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {/* Empty state */}
                                {users.length === 0 && !isLoading && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-16">
                                            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                            <p className="text-lg font-medium text-gray-900">
                                                ไม่พบผู้ใช้งาน
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {searchQuery || filterRole !== 'all' || filterStatus !== 'all'
                                                    ? 'ลองเปลี่ยนเงื่อนไขการค้นหา'
                                                    : 'กดปุ่ม "เพิ่มผู้ใช้งาน" เพื่อเริ่มต้น'}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {/* Loading rows */}
                                {isLoading && users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-600" />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 border-t flex-shrink-0">
                            <p className="text-sm text-gray-500">
                                แสดง {((currentPage - 1) * 10) + 1}-{Math.min(currentPage * 10, pagination.total)} จาก {pagination.total} รายการ
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-gray-600">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* ==================== Create User Dialog ==================== */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                    {/* Header */}
                    <div className="relative px-6 pt-6 pb-5 shrink-0 overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600">
                        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-black/10 blur-2xl pointer-events-none" />
                        <div className="relative flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-lg shrink-0">
                                <UserPlus className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-white leading-tight">
                                    เพิ่มผู้ใช้งานใหม่
                                </DialogTitle>
                                <DialogDescription className="text-[11px] text-white/70 mt-0.5">
                                    ระบบจะสร้าง Username อัตโนมัติจากชื่อ-นามสกุล และรหัสผ่านเริ่มต้น
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <UserForm form={form} updateForm={updateForm} />
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t bg-gray-50/60 flex items-center justify-between shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting} className="text-gray-500 hover:text-gray-700">
                            ยกเลิก
                        </Button>
                        <Button
                            className="h-9 px-5 bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200"
                            onClick={handleCreate}
                            disabled={isSubmitting || !form.firstname || !form.lastname || !form.nickname}
                        >
                            {isSubmitting
                                ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />กำลังบันทึก...</>
                                : <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />เพิ่มผู้ใช้งาน</>}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ==================== Edit User Dialog ==================== */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                    {/* Header */}
                    <div className="relative px-6 pt-6 pb-5 shrink-0 overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600">
                        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-black/10 blur-2xl pointer-events-none" />
                        <div className="relative flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-lg shrink-0">
                                <Pencil className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-white leading-tight">
                                    แก้ไขข้อมูลผู้ใช้
                                </DialogTitle>
                                <DialogDescription className="text-[11px] text-white/70 mt-0.5">
                                    {editingUser?.firstname} {editingUser?.lastname}
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <UserForm form={form} updateForm={updateForm} isEdit />
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t bg-gray-50/60 flex items-center justify-between shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => { setIsEditDialogOpen(false); setEditingUser(null); }} disabled={isSubmitting} className="text-gray-500 hover:text-gray-700">
                            ยกเลิก
                        </Button>
                        <Button
                            className="h-9 px-5 bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200"
                            onClick={handleUpdate}
                            disabled={isSubmitting || !form.firstname || !form.lastname || !form.nickname}
                        >
                            {isSubmitting
                                ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />กำลังบันทึก...</>
                                : <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />บันทึกการแก้ไข</>}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ==================== Delete Confirmation Dialog ==================== */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            ยืนยันการปิดใช้งาน
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-700">
                            ต้องการปิดใช้งานผู้ใช้{' '}
                            <span className="font-semibold">
                                {deletingUser?.firstname} {deletingUser?.lastname}
                            </span>{' '}
                            หรือไม่?
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            การดำเนินการนี้จะปิดใช้งานบัญชีผู้ใช้ (Soft Delete)
                            ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteDialogOpen(false);
                                setDeletingUser(null);
                            }}
                            disabled={isSubmitting}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            ยืนยันปิดใช้งาน
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ==================== User Detail Dialog ==================== */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-purple-600" />
                            รายละเอียดผู้ใช้
                        </DialogTitle>
                    </DialogHeader>

                    {detailUser && (
                        <div className="space-y-6">
                            {/* Profile header */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={detailUser.profile || undefined} />
                                    <AvatarFallback className="bg-purple-100 text-purple-700 text-lg font-bold">
                                        {getInitials(detailUser.firstname, detailUser.lastname)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {detailUser.firstname} {detailUser.lastname}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        @{detailUser.username} • {detailUser.nickname}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {getRoleBadge(detailUser.role)}
                                        {getStatusBadge(detailUser.isActive)}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Detail grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <DetailRow label="ตำแหน่ง" value={detailUser.position?.name || '-'} />
                                <DetailRow label="ประเภทพนักงาน" value={getEmployeeTypeLabel(detailUser.employeeType)} />
                                <DetailRow label="เบอร์โทร" value={detailUser.tel || '-'} />
                                <DetailRow label="Line User ID" value={detailUser.lineUserId || '-'} />
                                <DetailRow label="วันเกิด" value={formatDate(detailUser.birthDate)} />
                                <DetailRow label="วันเริ่มงาน" value={formatDate(detailUser.employeeDateStart)} />
                                <DetailRow label="สัญญา" value={detailUser.contract || '-'} />
                                <DetailRow label="เริ่ม-สิ้นสุดสัญญา" value={
                                    detailUser.contractDateStart
                                        ? `${formatDate(detailUser.contractDateStart)} - ${formatDate(detailUser.contractDateEnd)}`
                                        : '-'
                                } />
                                <DetailRow label="เข้าสู่ระบบล่าสุด" value={formatDate(detailUser.lastLogin)} />
                                <DetailRow label="สร้างเมื่อ" value={formatDate(detailUser.createdAt)} />
                            </div>

                            {detailUser.address && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">ที่อยู่</p>
                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                            {detailUser.address}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDetailDialogOpen(false)}
                        >
                            ปิด
                        </Button>
                        {canManageUsers && detailUser && (
                            <Button
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={() => {
                                    setIsDetailDialogOpen(false);
                                    // Find the user in list to open edit
                                    const listUser = users.find(u => u.id === detailUser.id);
                                    if (listUser) openEditDialog(listUser);
                                }}
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                แก้ไข
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ==================== User Form Sub-Component ====================

// ==================== FieldGroup Sub-Component ====================

function FieldGroup({
    icon: Icon,
    label,
    required,
    children,
}: {
    icon?: React.ComponentType<any>;
    label: string;
    required?: boolean;
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
        </div>
    );
}

// ==================== SectionDivider Sub-Component ====================

function SectionDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2 pt-1">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-1">{label}</span>
            <div className="h-px flex-1 bg-gray-100" />
        </div>
    );
}

// ==================== UserForm Sub-Component ====================

interface UserFormProps {
    form: typeof defaultForm;
    updateForm: (updates: Partial<typeof defaultForm>) => void;
    isEdit?: boolean;
}

function UserForm({ form, updateForm }: UserFormProps) {
    return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* ── Left: ข้อมูลส่วนตัว ── */}
            <div className="space-y-4">
                <SectionDivider label="ข้อมูลส่วนตัว" />

                <div className="grid grid-cols-2 gap-3">
                    <FieldGroup label="ชื่อ" required>
                        <Input value={form.firstname} onChange={(e) => updateForm({ firstname: e.target.value })} placeholder="ชื่อจริง" className="h-10" />
                    </FieldGroup>
                    <FieldGroup label="นามสกุล" required>
                        <Input value={form.lastname} onChange={(e) => updateForm({ lastname: e.target.value })} placeholder="นามสกุล" className="h-10" />
                    </FieldGroup>
                </div>

                <FieldGroup label="ชื่อเล่น" required>
                    <Input value={form.nickname} onChange={(e) => updateForm({ nickname: e.target.value })} placeholder="ชื่อเล่น" className="h-10" />
                </FieldGroup>

                <FieldGroup label="เบอร์โทรศัพท์">
                    <Input value={form.tel} onChange={(e) => updateForm({ tel: e.target.value })} placeholder="0812345678" maxLength={10} className="h-10" />
                </FieldGroup>

                <FieldGroup label="วันเกิด">
                    <DatePickerField value={form.birthDate} onChange={(date) => updateForm({ birthDate: date })} placeholder="เลือกวันเกิด" />
                </FieldGroup>

                <FieldGroup label="ที่อยู่">
                    <Input value={form.address} onChange={(e) => updateForm({ address: e.target.value })} placeholder="ที่อยู่" className="h-10" />
                </FieldGroup>
            </div>

            {/* ── Right: ข้อมูลการทำงาน ── */}
            <div className="space-y-4">
                <SectionDivider label="ข้อมูลการทำงาน" />

                <div className="grid grid-cols-2 gap-3">
                    <FieldGroup label="สิทธิ์" required>
                        <Select value={form.role} onValueChange={(v) => updateForm({ role: v as UserRole })}>
                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="employee">พนักงาน</SelectItem>
                                <SelectItem value="manager">ผู้จัดการ</SelectItem>
                                <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                            </SelectContent>
                        </Select>
                    </FieldGroup>
                    <FieldGroup label="ประเภทพนักงาน" required>
                        <Select value={form.employeeType} onValueChange={(v) => updateForm({ employeeType: v as UserType })}>
                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="permanent">พนักงานประจำ</SelectItem>
                                <SelectItem value="probation">ทดลองงาน</SelectItem>
                                <SelectItem value="freelance">ฟรีแลนซ์</SelectItem>
                            </SelectContent>
                        </Select>
                    </FieldGroup>
                </div>

                <FieldGroup label="วันที่เริ่มงาน" required>
                    <DatePickerField value={form.employeeDateStart} onChange={(date) => updateForm({ employeeDateStart: date })} placeholder="เลือกวันที่เริ่มงาน" />
                </FieldGroup>

                <FieldGroup label="สถานะพนักงาน">
                    <Input value={form.employeeStatus} onChange={(e) => updateForm({ employeeStatus: e.target.value })} placeholder="เช่น ทดลองงาน, ผ่านทดลอง" className="h-10" />
                </FieldGroup>

                <SectionDivider label="ข้อมูลสัญญา" />

                <FieldGroup label="ประเภทสัญญา">
                    <Input value={form.contract} onChange={(e) => updateForm({ contract: e.target.value })} placeholder="เช่น สัญญาจ้างรายปี" className="h-10" />
                </FieldGroup>

                <div className="grid grid-cols-2 gap-3">
                    <FieldGroup label="เริ่มสัญญา">
                        <DatePickerField value={form.contractDateStart} onChange={(date) => updateForm({ contractDateStart: date })} placeholder="เลือกวันที่" />
                    </FieldGroup>
                    <FieldGroup label="สิ้นสุดสัญญา">
                        <DatePickerField value={form.contractDateEnd} onChange={(date) => updateForm({ contractDateEnd: date })} placeholder="เลือกวันที่" />
                    </FieldGroup>
                </div>

                <FieldGroup label="เงินเดือน">
                    <Input value={form.salary} onChange={(e) => updateForm({ salary: e.target.value })} placeholder="เงินเดือน" className="h-10" />
                </FieldGroup>
            </div>
        </div>
    );
}

// ==================== DatePicker Sub-Component ====================

interface DatePickerFieldProps {
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
}

function DatePickerField({ value, onChange, placeholder }: DatePickerFieldProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !value && 'text-muted-foreground'
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? format(value, 'dd MMM yyyy', { locale: th }) : placeholder || 'เลือกวันที่'}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(date) => onChange(date || undefined)}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

// ==================== Detail Row Sub-Component ====================

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-gray-500 text-xs">{label}</p>
            <p className="font-medium text-gray-900 mt-0.5">{value}</p>
        </div>
    );
}