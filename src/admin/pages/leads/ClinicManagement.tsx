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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Pencil,
  Trash2,
  Search,
  X,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Calendar,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useClinicUsersStore } from '@/stores/externalLeadsStore';
import { useUser } from '@/hooks/useUser';
import type {
  ClinicUser,
  ClinicUserListParams,
  CreateClinicUserDTO,
  UpdateClinicUserDTO,
} from '@/types/externalLeads';

// ==================== Helper Functions ====================

const formatDate = (date: string | undefined | null) => {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd MMM yyyy', { locale: th });
  } catch {
    return '-';
  }
};

const isExpired = (expired: string | undefined): boolean => {
  if (!expired) return false;
  return new Date(expired) < new Date();
};

// ==================== Form defaults ====================

const defaultForm = {
  username: '',
  password: '',
  clinicName: '',
  branch: '',
  expired: '',
};

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

// ==================== InfoCard Sub-Component ====================

function InfoCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon?: React.ComponentType<any>;
  label: string;
  value: string;
  highlight?: 'red';
}) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 space-y-1">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3 text-gray-400" />}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      </div>
      <p className={`text-sm font-semibold ${highlight === 'red' ? 'text-red-600' : 'text-gray-800'}`}>{value || '-'}</p>
    </div>
  );
}

// ==================== Component ====================

export default function ClinicUsersManagement() {
  const { user: currentUser } = useUser();

  // Store
  const users = useClinicUsersStore((s) => s.users);
  const pagination = useClinicUsersStore((s) => s.pagination);
  const isLoading = useClinicUsersStore((s) => s.isLoading);
  const isSubmitting = useClinicUsersStore((s) => s.isSubmitting);
  const error = useClinicUsersStore((s) => s.error);
  const fetchUsers = useClinicUsersStore((s) => s.fetchUsers);
  const createUser = useClinicUsersStore((s) => s.createUser);
  const updateUser = useClinicUsersStore((s) => s.updateUser);
  const deleteUser = useClinicUsersStore((s) => s.deleteUser);
  const clearError = useClinicUsersStore((s) => s.clearError);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ClinicUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ClinicUser | null>(null);
  const [detailUser, setDetailUser] = useState<ClinicUser | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [showPassword, setShowPassword] = useState(false);

  // Refs
  const isInitialMount = useRef(true);
  const isFirstSearch = useRef(true);

  // ==================== Fetch Users ====================
  useEffect(() => {
    const params: ClinicUserListParams = {
      page: currentPage,
      limit: 20,
    };
    if (searchQuery.trim()) params.search = searchQuery.trim();

    fetchUsers(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery]);

  // Reset page on filter change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchQuery]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
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
    setForm({ ...defaultForm });
    setShowPassword(false);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (user: ClinicUser) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      password: '', // Don't show existing password
      clinicName: user.clinicName,
      branch: user.branch,
      expired: user.expired ? user.expired.split('T')[0] : '',
    });
    setShowPassword(false);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: ClinicUser) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const openDetailDialog = (user: ClinicUser) => {
    setDetailUser(user);
    setIsDetailDialogOpen(true);
  };

  // ==================== CRUD Handlers ====================

  const handleCreate = async () => {
    if (!form.username || !form.password || !form.clinicName || !form.branch) return;

    const dto: CreateClinicUserDTO = {
      username: form.username.trim(),
      password: form.password,
      clinicName: form.clinicName.trim(),
      branch: form.branch.trim(),
      expired: form.expired || undefined,
    };

    const success = await createUser(dto);
    if (success) {
      setIsCreateDialogOpen(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    const dto: UpdateClinicUserDTO = {
      username: form.username.trim(),
      clinicName: form.clinicName.trim(),
      branch: form.branch.trim(),
      expired: form.expired || undefined,
    };

    // Only include password if provided
    if (form.password) {
      dto.password = form.password;
    }

    const success = await updateUser(editingUser._id, dto);
    if (success) {
      setIsEditDialogOpen(false);
      setEditingUser(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    const success = await deleteUser(deletingUser._id);
    if (success) {
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
    }
  };

  const updateForm = (updates: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  // ==================== Permission Check ====================
  const isAdmin = currentUser?.role === 'admin';
  const canManage = isAdmin;

  const totalPages = pagination?.totalPages || 1;

  // ==================== Render ====================
  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">กำลังโหลดข้อมูลผู้ใช้คลินิก...</span>
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
          <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ใช้คลินิก</h1>
          <p className="text-gray-500 mt-1">จัดการบัญชีผู้ใช้งานของแต่ละคลินิก (ระบบ Leads)</p>
        </div>
        {canManage && (
          <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700 w-fit">
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มผู้ใช้คลินิก
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="mt-4 flex-shrink-0">
        <div className="bg-white rounded-xl border p-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <Label className="text-sm text-gray-600 mb-1.5 block">ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="ค้นหา Username, ชื่อคลินิก, สาขา..."
                  className="pl-9 h-10"
                />
                {searchInput && (
                  <Button
                    variant="ghost" size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchInput('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 mt-4 overflow-hidden">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-green-600" />
              รายชื่อผู้ใช้คลินิก
              {pagination && (
                <span className="text-sm font-normal text-gray-500">({pagination.total} รายการ)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Clinic ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>คลินิก</TableHead>
                  <TableHead>สาขา</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                  <TableHead>หมดอายุ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user._id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500 text-sm">
                      {(currentPage - 1) * 20 + index + 1}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-100">
                        {user.clinicId}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.clinicName}</TableCell>
                    <TableCell className="text-gray-600">{user.branch}</TableCell>
                    <TableCell className="text-center">
                      {isExpired(user.expired) ? (
                        <Badge className="bg-red-100 text-red-700 border-red-200">หมดอายุ</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border-green-200">ใช้งานได้</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {user.expired ? (
                        <span className={isExpired(user.expired) ? 'text-red-600' : ''}>
                          {formatDate(user.expired)}
                        </span>
                      ) : (
                        <span className="text-gray-400">ไม่จำกัด</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDetailDialog(user)} title="ดูรายละเอียด">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManage && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)} title="แก้ไข">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openDeleteDialog(user)}
                              title="ลบ"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {users.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium text-gray-900">ไม่พบผู้ใช้คลินิก</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {searchQuery ? 'ลองเปลี่ยนเงื่อนไขการค้นหา' : 'ยังไม่มีข้อมูลผู้ใช้คลินิก'}
                      </p>
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
                แสดง {(currentPage - 1) * 20 + 1}-{Math.min(currentPage * 20, pagination.total)} จาก{' '}
                {pagination.total} รายการ
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

      {/* ==================== Create/Edit Dialog ==================== */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingUser(null);
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          {/* Header */}
          <div className="relative px-6 pt-6 pb-5 shrink-0 overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600">
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-black/10 blur-2xl pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-lg shrink-0">
                {isEditDialogOpen
                  ? <Pencil className="h-5 w-5 text-white" />
                  : <Plus className="h-5 w-5 text-white" />}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white leading-tight">
                  {isEditDialogOpen ? 'แก้ไขผู้ใช้คลินิก' : 'เพิ่มผู้ใช้คลินิกใหม่'}
                </DialogTitle>
                <DialogDescription className="text-[11px] text-white/70 mt-0.5">
                  {isEditDialogOpen
                    ? 'แก้ไขข้อมูล — เว้นรหัสผ่านว่างถ้าไม่ต้องการเปลี่ยน'
                    : 'กรอกข้อมูลเพื่อสร้างผู้ใช้คลินิกใหม่'}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <FieldGroup icon={Building2} label="Username" required>
              <Input
                value={form.username}
                onChange={(e) => updateForm({ username: e.target.value })}
                placeholder="clinic_username"
                className="h-10"
              />
            </FieldGroup>

            <FieldGroup label={isEditDialogOpen ? 'รหัสผ่านใหม่' : 'รหัสผ่าน'} required={!isEditDialogOpen}>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateForm({ password: e.target.value })}
                  placeholder={isEditDialogOpen ? 'เว้นว่างถ้าไม่เปลี่ยน' : 'รหัสผ่าน'}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup icon={Building2} label="ชื่อคลินิก" required>
                <Input
                  value={form.clinicName}
                  onChange={(e) => updateForm({ clinicName: e.target.value })}
                  placeholder="ชื่อคลินิก"
                  className="h-10"
                />
              </FieldGroup>
              <FieldGroup label="สาขา" required>
                <Input
                  value={form.branch}
                  onChange={(e) => updateForm({ branch: e.target.value })}
                  placeholder="สาขา"
                  className="h-10"
                />
              </FieldGroup>
            </div>

            <FieldGroup icon={Calendar} label="วันหมดอายุ">
              <Input
                type="date"
                value={form.expired}
                onChange={(e) => updateForm({ expired: e.target.value })}
                className="h-10"
              />
              <p className="text-xs text-gray-400 mt-1">เว้นว่างถ้าไม่ต้องการกำหนดวันหมดอายุ</p>
            </FieldGroup>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50/60 flex items-center justify-between shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setIsCreateDialogOpen(false); setIsEditDialogOpen(false); setEditingUser(null); }}
              disabled={isSubmitting}
              className="text-gray-500 hover:text-gray-700"
            >
              ยกเลิก
            </Button>
            <Button
              className="h-9 px-5 bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200"
              onClick={isEditDialogOpen ? handleUpdate : handleCreate}
              disabled={isSubmitting || !form.username || !form.clinicName || !form.branch || (!isEditDialogOpen && !form.password)}
            >
              {isSubmitting
                ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />กำลังบันทึก...</>
                : <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />{isEditDialogOpen ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== Delete Dialog ==================== */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              ยืนยันการลบผู้ใช้คลินิก
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              ต้องการลบผู้ใช้ <span className="font-semibold">{deletingUser?.username}</span> หรือไม่?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              คลินิก: {deletingUser?.clinicName} ({deletingUser?.branch})
            </p>
            <p className="text-sm text-red-600 mt-2">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              ยืนยันลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Detail Dialog ==================== */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-md overflow-hidden flex flex-col p-0 gap-0">
          {/* Header — clean white */}
          <div className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-gray-900 leading-tight">
                    {detailUser?.username || 'รายละเอียด'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-400 mt-0.5">
                    Clinic ID: {detailUser?.clinicId}
                  </DialogDescription>
                </div>
              </div>
              {detailUser && (
                isExpired(detailUser.expired)
                  ? <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-full px-3 py-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />หมดอายุ
                  </span>
                  : <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-600 border border-green-200 rounded-full px-3 py-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />ใช้งานได้
                  </span>
              )}
            </div>
          </div>

          {/* Body */}
          {detailUser && (
            <div className="px-6 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="ชื่อคลินิก" value={detailUser.clinicName} icon={Building2} />
                <InfoCard label="สาขา" value={detailUser.branch} />
                <InfoCard
                  label="วันหมดอายุ"
                  value={detailUser.expired ? formatDate(detailUser.expired) : 'ไม่จำกัด'}
                  icon={Calendar}
                  highlight={isExpired(detailUser.expired) ? 'red' : undefined}
                />
                <InfoCard label="สร้างเมื่อ" value={formatDate(detailUser.createdAt)} icon={Calendar} />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50/60 flex items-center justify-between shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setIsDetailDialogOpen(false)} className="text-gray-500 hover:text-gray-700">
              ปิด
            </Button>
            {canManage && detailUser && (
              <Button
                className="h-9 px-5 bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200"
                onClick={() => { setIsDetailDialogOpen(false); openEditDialog(detailUser); }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                แก้ไข
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}