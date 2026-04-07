import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CalendarIcon,
  Users,
  CheckCircle2,
  Circle,
  RefreshCw,
  ClipboardList,
  Download,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTodoStore } from '@/stores/todoStore';
import { useClinicStore } from '@/stores/clinicStore';
import { userService } from '@/services/userService';
import type { TeamTodoParams, Todo, TodoPriority } from '@/types/todo';
import type { UserSummary } from '@/types/user';

const priorityConfig: Record<TodoPriority, { label: string; color: string }> = {
  urgent: { label: 'เร่งด่วน', color: 'bg-red-100 text-red-700' },
  high: { label: 'สูง', color: 'bg-orange-100 text-orange-700' },
  medium: { label: 'ปานกลาง', color: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'ต่ำ', color: 'bg-green-100 text-green-700' },
};

type ViewMode = 'card' | 'table';

export default function TeamTodoReport() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedClinicId, setSelectedClinicId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  const { teamTodos, teamLoading, fetchTeamTodos } = useTodoStore();
  const { clinics, fetchClinics } = useClinicStore();

  // Fetch users
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      const response = await userService.getActiveUsers();
      if (response.success && response.data) {
        setUsers(response.data.users);
      }
      setLoadingUsers(false);
    };
    loadUsers();
  }, []);

  // Fetch clinics
  useEffect(() => {
    if (clinics.length === 0) {
      fetchClinics({ limit: 100 });
    }
  }, [clinics.length, fetchClinics]);

  // Fetch team todos
  useEffect(() => {
    const params: TeamTodoParams = {
      date: format(date, 'yyyy-MM-dd'),
      limit: 100,
    };

    if (selectedUserId !== 'all') {
      params.userId = selectedUserId;
    }
    if (selectedClinicId !== 'all') {
      params.clinicId = selectedClinicId;
    }
    if (selectedStatus !== 'all') {
      params.status = selectedStatus as 'pending' | 'done';
    }

    fetchTeamTodos(params);
  }, [date, selectedUserId, selectedClinicId, selectedStatus, fetchTeamTodos]);

  // Group todos by user
  const todosByUser = teamTodos.reduce((acc, todo) => {
    const userName = todo.createdBy || 'Unknown';
    if (!acc[userName]) {
      acc[userName] = [];
    }
    acc[userName].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);

  const handleRefresh = () => {
    const params: TeamTodoParams = {
      date: format(date, 'yyyy-MM-dd'),
      limit: 100,
    };
    if (selectedUserId !== 'all') params.userId = selectedUserId;
    if (selectedClinicId !== 'all') params.clinicId = selectedClinicId;
    if (selectedStatus !== 'all') params.status = selectedStatus as 'pending' | 'done';
    fetchTeamTodos(params);
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['พนักงาน', 'งาน', 'คลินิก', 'ความสำคัญ', 'สถานะ', 'เวลาสร้าง'];
    const rows = teamTodos.map((todo) => [
      todo.createdBy || 'Unknown',
      todo.name,
      todo.clinic.name.th || todo.clinic.name.en,
      priorityConfig[todo.priority].label,
      todo.status === 'done' ? 'เสร็จแล้ว' : 'รอดำเนินการ',
      new Date(todo.createdAt).toLocaleString('th-TH'),
    ]);

    const csvContent =
      '\uFEFF' + // BOM for Thai characters
      [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `team-todo-report-${format(date, 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculate stats
  const totalTodos = teamTodos.length;
  const completedTodos = teamTodos.filter((t) => t.status === 'done').length;
  const pendingTodos = totalTodos - completedTodos;
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงานงานประจำวัน</h1>
          <p className="text-gray-500 mt-1">ติดตามการทำงานของทีมในแต่ละวัน</p>
        </div>
        <Button onClick={handleExport} variant="outline" disabled={teamTodos.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          ส่งออก CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, 'PPP', { locale: th })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* User Filter */}
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loadingUsers}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={loadingUsers ? 'กำลังโหลด...' : 'เลือกพนักงาน'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกคน</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clinic Filter */}
            <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="เลือกคลินิก" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกคลินิก</SelectItem>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name.th || clinic.name.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
                <SelectItem value="done">เสร็จแล้ว</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh */}
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={teamLoading}>
              <RefreshCw className={`h-4 w-4 ${teamLoading ? 'animate-spin' : ''}`} />
            </Button>

            {/* View Mode Toggle */}
            <div className="ml-auto flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalTodos}</p>
              <p className="text-sm text-gray-500">งานทั้งหมด</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedTodos}</p>
              <p className="text-sm text-gray-500">เสร็จแล้ว</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Circle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingTodos}</p>
              <p className="text-sm text-gray-500">รอดำเนินการ</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completionRate}%</p>
              <p className="text-sm text-gray-500">อัตราสำเร็จ</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Todos List */}
      {teamLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : teamTodos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีงานในวันที่เลือก</h3>
            <p className="text-gray-500">ลองเลือกวันที่อื่นหรือเปลี่ยนตัวกรอง</p>
          </CardContent>
        </Card>
      ) : viewMode === 'card' ? (
        /* Card View - Group by User */
        <div className="space-y-4">
          {Object.entries(todosByUser).map(([userName, userTodos]) => {
            const completed = userTodos.filter((t) => t.status === 'done').length;
            const total = userTodos.length;
            const userCompletionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <Card key={userName}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{userName}</CardTitle>
                        <p className="text-sm text-gray-500">{total} งาน</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={userCompletionRate === 100 ? 'default' : 'outline'}
                        className={userCompletionRate === 100 ? 'bg-green-600' : ''}
                      >
                        {completed}/{total} เสร็จ ({userCompletionRate}%)
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all',
                        userCompletionRate === 100 ? 'bg-green-500' : 'bg-purple-500'
                      )}
                      style={{ width: `${userCompletionRate}%` }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border',
                          todo.status === 'done'
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-white border-gray-200'
                        )}
                      >
                        {todo.status === 'done' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'font-medium truncate',
                              todo.status === 'done' && 'line-through text-gray-400'
                            )}
                          >
                            {todo.name}
                          </p>
                          {todo.description && (
                            <p className="text-sm text-gray-500 truncate">{todo.description}</p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', priorityConfig[todo.priority].color)}
                        >
                          {priorityConfig[todo.priority].label}
                        </Badge>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {todo.clinic.name.th || todo.clinic.name.en}
                        </span>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(todo.createdAt).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">สถานะ</TableHead>
                  <TableHead>พนักงาน</TableHead>
                  <TableHead>งาน</TableHead>
                  <TableHead>คลินิก</TableHead>
                  <TableHead>ความสำคัญ</TableHead>
                  <TableHead className="text-right">เวลา</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamTodos.map((todo) => (
                  <TableRow key={todo.id}>
                    <TableCell>
                      {todo.status === 'done' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{todo.createdBy || 'Unknown'}</TableCell>
                    <TableCell>
                      <div>
                        <p
                          className={cn(
                            todo.status === 'done' && 'line-through text-gray-400'
                          )}
                        >
                          {todo.name}
                        </p>
                        {todo.description && (
                          <p className="text-sm text-gray-500 truncate max-w-[300px]">
                            {todo.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{todo.clinic.name.th || todo.clinic.name.en}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', priorityConfig[todo.priority].color)}
                      >
                        {priorityConfig[todo.priority].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-gray-500">
                      {new Date(todo.createdAt).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}