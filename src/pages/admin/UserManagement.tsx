import { useEffect, useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Ban,
  CheckCircle,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { UserDialog } from '@/components/admin/UserDialog';
import { userService } from '@/services/userService';
import type { UserSummary, UserRole } from '@/types/user';

const roleConfig: Record<UserRole, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
  manager: { label: 'Manager', color: 'bg-purple-100 text-purple-700' },
  employee: { label: 'Employee', color: 'bg-blue-100 text-blue-700' },
  developer: { label: 'Developer', color: 'bg-gray-100 text-gray-700' },
};

interface UserFilters {
  search: string;
  role: string;
  status: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    const response = await userService.getAllUsers({ limit: 100 });
    if (response.success && response.data) {
      setUsers(response.data.users);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!user.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Role filter
      if (filters.role !== 'all' && user.role !== filters.role) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        const isActive = filters.status === 'active';
        if (user.isActive !== isActive) {
          return false;
        }
      }

      return true;
    });
  }, [users, filters]);

  const handleEdit = (user: UserSummary) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteUserId) {
      // Call delete API
      // await userService.deleteUser(deleteUserId);
      setUsers(users.filter((u) => u.id !== deleteUserId));
      setDeleteUserId(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    // Call API to toggle status
    // await userService.updateUser(userId, { isActive: !currentStatus });
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u))
    );
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  const handleSuccess = () => {
    fetchUsers();
    handleDialogClose();
  };

  // Stats
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const managers = users.filter((u) => u.role === 'manager').length;
    return { total, active, admins, managers };
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ผู้ใช้ทั้งหมด</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ใช้งานอยู่</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Admin</p>
            <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Manager</p>
            <p className="text-2xl font-bold text-purple-600">{stats.managers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="ค้นหาชื่อผู้ใช้..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Role Filter */}
        <Select
          value={filters.role}
          onValueChange={(value) => setFilters({ ...filters, role: value })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="บทบาท" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกบทบาท</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="active">ใช้งานอยู่</SelectItem>
            <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
          </SelectContent>
        </Select>

        {/* Refresh */}
        <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>

        {/* Add User */}
        <Button onClick={() => setIsDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          เพิ่มผู้ใช้
        </Button>
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-500">
        แสดง {filteredUsers.length} จาก {users.length} ผู้ใช้
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">ไม่พบผู้ใช้</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>บทบาท</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">ID: {user.id.slice(-6)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={roleConfig[user.role]?.color || ''}
                      >
                        {roleConfig[user.role]?.label || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.position || '-'}</TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="outline" className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          ใช้งานอยู่
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-700">
                          <Ban className="h-3 w-3 mr-1" />
                          ปิดใช้งาน
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>จัดการ</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            แก้ไข
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(user.id, user.isActive || false)}
                          >
                            {user.isActive ? (
                              <>
                                <Ban className="h-4 w-4 mr-2" />
                                ปิดใช้งาน
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                เปิดใช้งาน
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteUserId(user.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            ลบ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Dialog */}
      <UserDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        editUser={editingUser}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบผู้ใช้นี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}